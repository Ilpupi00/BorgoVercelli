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
    POLL_INTERVAL_MS: 1000,         // Controlla ogni 1 secondo (più reattivo)
    BATCH_SIZE: 30,                  // Processa max 30 notifiche per volta
    CONCURRENCY: 12,                 // Numero massimo di invii web-push concorrenti
    RETRY_DELAY_BASE_MS: 2000,       // Base per backoff esponenziale (2s, 4s, 8s, 16s...)
    MAX_RETRY_DELAY_MS: 120000,      // Max 2 minuti di delay
    CLEANUP_INTERVAL_MS: 3600000,    // Cleanup ogni ora
    CLEANUP_AFTER_DAYS: 7,           // Rimuovi notifiche vecchie di 7 giorni
    PROCESSING_TIMEOUT_MS: 30000,    // Timeout per processamento singola notifica (30s)
    MAX_STUCK_MINUTES: 10            // Notifiche in "sending" da più di 10 min = stuck
};

let isProcessing = false;
let shouldStop = false;
let processedCount = 0;
let failedCount = 0;
// Cached subscriptions for the current batch - loaded once per fetch cycle to reduce DB hits
let subscriptionsCache = null;

/**
 * Calcola il delay di retry con backoff esponenziale
 */
function calculateRetryDelay(attempts) {
    const delay = CONFIG.RETRY_DELAY_BASE_MS * Math.pow(2, attempts);
    return Math.min(delay, CONFIG.MAX_RETRY_DELAY_MS);
}

/**
 * Processa una singola notifica con timeout e validazione
 */
async function processNotification(notification) {
    const { id, type, user_ids, payload, attempts } = notification;
    
    try {
        const timestamp = new Date().toISOString();
        console.log(`[WORKER ${timestamp}] 📋 Processando notifica ${id}`);
        console.log(`[WORKER] Dettagli: tipo=${type}, attempt=${attempts + 1}/${notification.max_attempts}`);
        
        // Valida payload
        let payloadObj;
        try {
            payloadObj = typeof payload === 'string' ? JSON.parse(payload) : payload;
            if (!payloadObj.title || !payloadObj.body) {
                throw new Error('Payload deve avere title e body');
            }
            console.log(`[WORKER] Payload validato: "${payloadObj.title}" - ${payloadObj.body.substring(0, 50)}...`);
        } catch (parseError) {
            throw new Error(`Payload non valido: ${parseError.message}`);
        }
        
        // Marca come "sending"
        await db.query(
            'UPDATE notifications SET status = $1, updated_at = NOW() WHERE id = $2',
            ['sending', id]
        );
        
        let result;
        
        // Crea promise con timeout
        const sendPromise = (async () => {
            switch (type) {
                case 'admin':
                    console.log(`[WORKER] Invio a tutti gli admin...`);
                    return await pushService.sendNotificationToAdmins(payloadObj, subscriptionsCache);
                case 'user':
                    if (!user_ids || user_ids.length === 0) {
                        throw new Error('No user_ids specified for user notification');
                    }
                    console.log(`[WORKER] Invio a ${user_ids.length} utent${user_ids.length === 1 ? 'e' : 'i'}: [${user_ids.join(', ')}]`);
                    return await pushService.sendNotificationToUsers(user_ids, payloadObj, subscriptionsCache);
                case 'all':
                    console.log(`[WORKER] Broadcast a tutti gli utenti...`);
                    return await pushService.sendNotificationToAll(payloadObj, subscriptionsCache);
                default:
                    throw new Error(`Unknown notification type: ${type}`);
            }
        })();
        
        // Applica timeout
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout processamento notifica')), CONFIG.PROCESSING_TIMEOUT_MS)
        );
        
        result = await Promise.race([sendPromise, timeoutPromise]);
        
        // Marca come inviata
        await db.query(
            `UPDATE notifications 
             SET status = $1, sent_at = NOW(), updated_at = NOW(), attempts = $2
             WHERE id = $3`,
            ['sent', attempts + 1, id]
        );
        
        processedCount++;
        console.log(`[WORKER] ✅ Notifica ${id} inviata con successo (sent: ${result?.sent || 0}, failed: ${result?.failed || 0})`);
        
        return { success: true, result };
        
    } catch (error) {
        console.error(`[WORKER] ❌ Errore processando notifica ${id}:`, error.message);
        
        // Classifica l'errore per miglior handling
        let errorType = 'generic';
        let shouldRetry = true;
        
        if (error.message.includes('VAPID') || error.message.includes('403')) {
            errorType = 'vapid';
            console.error(`[WORKER] ⚠️ Errore VAPID - verificare configurazione chiavi`);
        } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
            errorType = 'auth';
            console.error(`[WORKER] ⚠️ Errore autenticazione push service`);
        } else if (error.message.includes('Timeout')) {
            errorType = 'timeout';
            console.error(`[WORKER] ⏱️ Timeout - operazione troppo lenta`);
        } else if (error.message.includes('Payload non valido')) {
            errorType = 'validation';
            shouldRetry = false; // Payload sbagliato non si risolve con retry
            console.error(`[WORKER] 🚫 Payload non valido - notifica verrà marcata come failed`);
        }
        
        console.error(`[WORKER] Tipo errore: ${errorType}, Retry: ${shouldRetry}`);
        
        const newAttempts = attempts + 1;
        const notification_row = await db.query('SELECT max_attempts FROM notifications WHERE id = $1', [id]);
        const maxAttempts = notification_row.rows[0]?.max_attempts || 3;
        
        // Se non retry-able o superato max attempts, marca come failed
        if (!shouldRetry || newAttempts >= maxAttempts) {
            const errorMsg = `[${errorType}] ${error.message}`;
            await db.query(
                `UPDATE notifications 
                 SET status = $1, last_error = $2, attempts = $3, updated_at = NOW()
                 WHERE id = $4`,
                ['failed', errorMsg.substring(0, 500), newAttempts, id]
            );
            failedCount++;
            console.log(`[WORKER] 💀 Notifica ${id} marcata FAILED`);
            console.log(`[WORKER]    Motivo: ${!shouldRetry ? 'errore non recuperabile' : `${newAttempts}/${maxAttempts} tentativi esauriti`}`);
        } else {
            // Riprogramma per retry con backoff esponenziale
            const retryDelay = calculateRetryDelay(newAttempts);
            const sendAfter = new Date(Date.now() + retryDelay);
            const errorMsg = `[${errorType}] ${error.message}`;
            
            await db.query(
                `UPDATE notifications 
                 SET status = $1, last_error = $2, attempts = $3, send_after = $4, updated_at = NOW()
                 WHERE id = $5`,
                ['pending', errorMsg.substring(0, 500), newAttempts, sendAfter, id]
            );
            
            const nextRetryIn = Math.round(retryDelay/1000);
            console.log(`[WORKER] 🔄 Notifica ${id} -> PENDING (retry ${newAttempts}/${maxAttempts} tra ${nextRetryIn}s)`);
        }
        
        return { success: false, error: error.message, errorType };
    }
}

/**
 * Recupera notifiche da processare usando FOR UPDATE SKIP LOCKED
 */
async function fetchPendingNotifications() {
    try {
        // Use a transaction to lock and mark rows as 'sending' to avoid races
        const client = await db.pool.connect();
        try {
            await client.query('BEGIN');

            const selectSql = `
                SELECT id
                FROM notifications
                WHERE status = 'pending'
                  AND send_after <= NOW()
                ORDER BY priority DESC, created_at ASC
                LIMIT $1
                FOR UPDATE SKIP LOCKED
            `;

            const sel = await client.query(selectSql, [CONFIG.BATCH_SIZE]);
            if (!sel.rows || sel.rows.length === 0) {
                await client.query('COMMIT');
                return [];
            }

            const ids = sel.rows.map(r => r.id);

            // Mark selected rows as 'sending' within the same transaction
            const updateSql = `
                UPDATE notifications
                SET status = 'sending', updated_at = NOW()
                WHERE id = ANY($1::int[])
                RETURNING id, type, user_ids, payload, attempts, max_attempts
            `;

            const updated = await client.query(updateSql, [ids]);
            await client.query('COMMIT');

            return updated.rows;
        } catch (txErr) {
            try { await client.query('ROLLBACK'); } catch (e) {}
            console.error('[WORKER] Errore transazione fetchPendingNotifications:', txErr);
            return [];
        } finally {
            client.release();
        }
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

        if (notifications.length === 0) {
            // nothing to do
            return;
        }

        // Load subscriptions once per batch to reduce DB load (cache for this processing cycle)
        try {
            subscriptionsCache = await pushService.loadSubscriptions();
            console.log(`[WORKER] Subscriptions cache caricata: ${subscriptionsCache.length}`);
        } catch (e) {
            console.error('[WORKER] Errore caricamento subscriptions cache:', e && e.message);
            subscriptionsCache = null;
        }

        console.log(`[WORKER] Trovate ${notifications.length} notifiche da processare`);

        // Process with concurrency limit
        const concurrency = CONFIG.CONCURRENCY || 4;
        let idx = 0;
        const workers = [];

        const runNext = async () => {
            if (idx >= notifications.length) return;
            const n = notifications[idx++];
            try {
                await processNotification(n);
            } catch (e) {
                console.error('[WORKER] Errore durante processNotification:', e && e.message);
            }
            return runNext();
        };

        for (let i = 0; i < Math.min(concurrency, notifications.length); i++) {
            workers.push(runNext());
        }

        await Promise.allSettled(workers);
    } catch (error) {
        console.error('[WORKER] Errore nel ciclo principale:', error);
    } finally {
        isProcessing = false;
    }
}

/**
 * Cleanup notifiche vecchie, stuck e subscriptions fallite
 */
async function cleanupOldNotifications() {
    try {
        console.log('[WORKER] 🧹 Avvio pulizia...');
        
        // 1. Reset notifiche stuck in "sending" troppo a lungo
        const stuckResult = await db.query(
            `UPDATE notifications
             SET status = 'pending', 
                 last_error = 'Reset da cleanup - stuck in sending',
                 updated_at = NOW()
             WHERE status = 'sending'
               AND updated_at < NOW() - INTERVAL '${CONFIG.MAX_STUCK_MINUTES} minutes'
             RETURNING id`
        );
        
        const resetCount = stuckResult.rowCount || 0;
        if (resetCount > 0) {
            console.log(`[WORKER] 🔓 Reset ${resetCount} notifiche stuck in 'sending'`);
            stuckResult.rows.forEach(row => {
                console.log(`[WORKER]    - Notifica ${row.id} resettata a pending`);
            });
        }
        
        // 2. Rimuovi notifiche sent/failed vecchie di X giorni
        const deleteResult = await db.query(
            `DELETE FROM notifications
             WHERE status IN ('sent', 'failed')
               AND updated_at < NOW() - INTERVAL '${CONFIG.CLEANUP_AFTER_DAYS} days'
             RETURNING id`
        );
        
        const deleted = deleteResult.rowCount || 0;
        if (deleted > 0) {
            console.log(`[WORKER] 🗑️  Rimosse ${deleted} notifiche vecchie (>${CONFIG.CLEANUP_AFTER_DAYS} giorni)`);
        }
        
        // 3. Cleanup subscriptions fallite
        await pushService.cleanupFailedSubscriptions(10);
        
        if (resetCount === 0 && deleted === 0) {
            console.log('[WORKER] ✨ Cleanup completato - nessuna notifica da pulire');
        }
        
    } catch (error) {
        console.error('[WORKER] ❌ Errore durante cleanup:', error);
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
