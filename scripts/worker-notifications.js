#!/usr/bin/env node
/**
 * Worker per processare le notifiche push in coda
 * 
 * Funzionalità:
 * - Processa notifiche pending dal database
 * - Gestisce retry con backoff esponenziale
 * - Rimuove subscription scadute (410/404)
 * - Marca subscription con VAPID mismatch (403)
 * - Cleanup notifiche vecchie
 * 
 * Uso:
 *   node scripts/worker-notifications.js
 *   npm run worker:notifications
 */

require('dotenv').config();
const db = require('../src/core/config/database');
const pushService = require('../src/shared/services/webpush');

// Configurazione
const CONFIG = {
    POLL_INTERVAL_MS: 5000,        // Controlla ogni 5 secondi
    BATCH_SIZE: 10,                 // Processa max 10 notifiche per volta
    RETRY_DELAY_BASE_MS: 1000,     // Base per backoff esponenziale (1s, 2s, 4s, 8s...)
    MAX_RETRY_DELAY_MS: 60000,     // Max 1 minuto di delay
    CLEANUP_INTERVAL_MS: 3600000,  // Cleanup ogni ora
    CLEANUP_AFTER_DAYS: 7          // Rimuovi notifiche vecchie di 7 giorni
};

let isProcessing = false;
let shouldStop = false;
let processedCount = 0;
let failedCount = 0;

/**
 * Calcola il delay di retry con backoff esponenziale
 */
function calculateRetryDelay(attempts) {
    const delay = CONFIG.RETRY_DELAY_BASE_MS * Math.pow(2, attempts);
    return Math.min(delay, CONFIG.MAX_RETRY_DELAY_MS);
}

/**
 * Processa una singola notifica
 */
async function processNotification(notification) {
    const { id, type, user_ids, payload, attempts } = notification;
    
    try {
        console.log(`[WORKER] Processando notifica ${id} (tipo: ${type}, attempt: ${attempts + 1})`);
        
        // Marca come "sending"
        await db.query(
            'UPDATE notifications SET status = $1, updated_at = NOW() WHERE id = $2',
            ['sending', id]
        );
        
        const payloadObj = typeof payload === 'string' ? JSON.parse(payload) : payload;
        let result;
        
        // Invia in base al tipo
        switch (type) {
            case 'admin':
                result = await pushService.sendNotificationToAdmins(payloadObj);
                break;
            case 'user':
                if (!user_ids || user_ids.length === 0) {
                    throw new Error('No user_ids specified for user notification');
                }
                result = await pushService.sendNotificationToUsers(user_ids, payloadObj);
                break;
            case 'all':
                result = await pushService.sendNotificationToAll(payloadObj);
                break;
            default:
                throw new Error(`Unknown notification type: ${type}`);
        }
        
        // Marca come inviata
        await db.query(
            `UPDATE notifications 
             SET status = $1, sent_at = NOW(), updated_at = NOW(), attempts = $2
             WHERE id = $3`,
            ['sent', attempts + 1, id]
        );
        
        processedCount++;
        console.log(`[WORKER] ✅ Notifica ${id} inviata con successo`);
        
        return { success: true, result };
        
    } catch (error) {
        console.error(`[WORKER] ❌ Errore processando notifica ${id}:`, error.message);
        
        const newAttempts = attempts + 1;
        const notification_row = await db.query('SELECT max_attempts FROM notifications WHERE id = $1', [id]);
        const maxAttempts = notification_row.rows[0]?.max_attempts || 3;
        
        if (newAttempts >= maxAttempts) {
            // Raggiunto il massimo dei tentativi, marca come failed
            await db.query(
                `UPDATE notifications 
                 SET status = $1, last_error = $2, attempts = $3, updated_at = NOW()
                 WHERE id = $4`,
                ['failed', error.message, newAttempts, id]
            );
            failedCount++;
            console.log(`[WORKER] 💀 Notifica ${id} fallita dopo ${newAttempts} tentativi`);
        } else {
            // Riprogramma per retry con backoff
            const retryDelay = calculateRetryDelay(newAttempts);
            const sendAfter = new Date(Date.now() + retryDelay);
            
            await db.query(
                `UPDATE notifications 
                 SET status = $1, last_error = $2, attempts = $3, send_after = $4, updated_at = NOW()
                 WHERE id = $5`,
                ['pending', error.message, newAttempts, sendAfter, id]
            );
            
            console.log(`[WORKER] 🔄 Notifica ${id} riprogrammata per retry tra ${Math.round(retryDelay/1000)}s`);
        }
        
        return { success: false, error: error.message };
    }
}

/**
 * Recupera notifiche da processare usando FOR UPDATE SKIP LOCKED
 */
async function fetchPendingNotifications() {
    try {
        const result = await db.query(
            `SELECT id, type, user_ids, payload, attempts, max_attempts
             FROM notifications
             WHERE status = 'pending' 
               AND send_after <= NOW()
             ORDER BY priority DESC, created_at ASC
             LIMIT $1
             FOR UPDATE SKIP LOCKED`,
            [CONFIG.BATCH_SIZE]
        );
        
        return result.rows;
    } catch (error) {
        console.error('[WORKER] Errore recupero notifiche:', error);
        return [];
    }
}

/**
 * Ciclo principale del worker
 */
async function processLoop() {
    if (isProcessing || shouldStop) return;
    
    isProcessing = true;
    
    try {
        const notifications = await fetchPendingNotifications();
        
        if (notifications.length > 0) {
            console.log(`[WORKER] Trovate ${notifications.length} notifiche da processare`);
            
            // Processa in parallelo con limite di concorrenza
            const promises = notifications.map(n => processNotification(n));
            await Promise.allSettled(promises);
        }
    } catch (error) {
        console.error('[WORKER] Errore nel ciclo principale:', error);
    } finally {
        isProcessing = false;
    }
}

/**
 * Cleanup notifiche vecchie e subscriptions fallite
 */
async function cleanupOldNotifications() {
    try {
        console.log('[WORKER] Pulizia notifiche vecchie...');
        
        // Rimuovi notifiche sent/failed vecchie di X giorni
        const result = await db.query(
            `DELETE FROM notifications
             WHERE status IN ('sent', 'failed')
               AND updated_at < NOW() - INTERVAL '${CONFIG.CLEANUP_AFTER_DAYS} days'`
        );
        
        const deleted = result.rowCount || 0;
        if (deleted > 0) {
            console.log(`[WORKER] 🗑️  Rimosse ${deleted} notifiche vecchie`);
        }
        
        // Cleanup subscriptions fallite
        await pushService.cleanupFailedSubscriptions(10);
        
    } catch (error) {
        console.error('[WORKER] Errore durante cleanup:', error);
    }
}

/**
 * Stampa statistiche
 */
async function printStats() {
    try {
        const result = await db.query(`
            SELECT 
                status,
                COUNT(*) as count,
                MIN(created_at) as oldest
            FROM notifications
            GROUP BY status
        `);
        
        console.log('\n[WORKER] 📊 Statistiche:');
        console.log(`  Processate: ${processedCount}`);
        console.log(`  Fallite: ${failedCount}`);
        result.rows.forEach(row => {
            console.log(`  ${row.status}: ${row.count} (oldest: ${row.oldest?.toISOString() || 'N/A'})`);
        });
        console.log('');
    } catch (error) {
        console.error('[WORKER] Errore stampa statistiche:', error);
    }
}

/**
 * Gestione shutdown graceful
 */
function setupGracefulShutdown() {
    const shutdown = async (signal) => {
        console.log(`\n[WORKER] Ricevuto ${signal}, shutdown in corso...`);
        shouldStop = true;
        
        // Attendi che il processing corrente finisca
        let attempts = 0;
        while (isProcessing && attempts < 30) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            attempts++;
        }
        
        await printStats();
        
        console.log('[WORKER] Worker terminato');
        process.exit(0);
    };
    
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
}

/**
 * Main
 */
async function main() {
    console.log('🚀 [WORKER] Avvio worker notifiche push');
    console.log(`[WORKER] Configurazione:`);
    console.log(`  - Poll interval: ${CONFIG.POLL_INTERVAL_MS}ms`);
    console.log(`  - Batch size: ${CONFIG.BATCH_SIZE}`);
    console.log(`  - Cleanup interval: ${CONFIG.CLEANUP_INTERVAL_MS}ms`);
    
    setupGracefulShutdown();
    
    // Verifica connessione DB
    try {
        await db.query('SELECT 1');
        console.log('[WORKER] ✅ Connessione database OK');
    } catch (error) {
        console.error('[WORKER] ❌ Errore connessione database:', error);
        process.exit(1);
    }
    
    // Verifica tabella notifications
    try {
        await db.query('SELECT COUNT(*) FROM notifications');
        console.log('[WORKER] ✅ Tabella notifications OK');
    } catch (error) {
        console.error('[WORKER] ❌ Tabella notifications non trovata. Esegui la migration prima!');
        process.exit(1);
    }
    
    // Cleanup iniziale
    await cleanupOldNotifications();
    
    // Ciclo principale
    const pollInterval = setInterval(() => {
        if (!shouldStop) {
            processLoop();
        }
    }, CONFIG.POLL_INTERVAL_MS);
    
    // Cleanup periodico
    const cleanupInterval = setInterval(() => {
        if (!shouldStop) {
            cleanupOldNotifications();
            printStats();
        }
    }, CONFIG.CLEANUP_INTERVAL_MS);
    
    // Prima esecuzione immediata
    processLoop();
    
    console.log('[WORKER] ✅ Worker in esecuzione, in attesa di notifiche...\n');
}

// Avvia il worker
if (require.main === module) {
    main().catch(error => {
        console.error('[WORKER] Errore fatale:', error);
        process.exit(1);
    });
}

module.exports = { processNotification, fetchPendingNotifications };
