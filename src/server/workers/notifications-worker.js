/**
 * @fileoverview Worker integrato per processare notifiche push in coda
 * @description Worker in-process che gira nel server principale.
 * Processa notifiche pending dal database con retry, backoff esponenziale,
 * cleanup automatico e gestione errori avanzata.
 */

'use strict';

const db = require('../../core/config/database');
const pushService = require('../../shared/services/webpush');

// Configurazione
const CONFIG = {
    POLL_INTERVAL_MS: 1000,         // Controlla ogni 1 secondo
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
let pollInterval = null;
let cleanupInterval = null;
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
        console.log(`[WORKER] 📋 Processando notifica ${id} (tipo: ${type}, attempt: ${attempts + 1})`);
        
        // Valida payload
        let payloadObj;
        try {
            payloadObj = typeof payload === 'string' ? JSON.parse(payload) : payload;
            if (!payloadObj.title || !payloadObj.body) {
                throw new Error('Payload deve avere title e body');
            }
        } catch (parseError) {
            throw new Error(`Payload non valido: ${parseError.message}`);
        }
        
        let result;
        
        // Crea promise con timeout
        const sendPromise = (async () => {
            switch (type) {
                case 'admin':
                    return await pushService.sendNotificationToAdmins(payloadObj, subscriptionsCache);
                case 'user':
                    if (!user_ids || user_ids.length === 0) {
                        throw new Error('No user_ids specified for user notification');
                    }
                    return await pushService.sendNotificationToUsers(user_ids, payloadObj, subscriptionsCache);
                case 'all':
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
        console.log(`[WORKER] ✅ Notifica ${id} inviata (sent: ${result?.sent || 0}, failed: ${result?.failed || 0})`);
        
        return { success: true, result };
        
    } catch (error) {
        console.error(`[WORKER] ❌ Errore processando notifica ${id}:`, error.message);
        
        // Classifica l'errore per miglior handling
        let errorType = 'generic';
        let shouldRetry = true;
        
        if (error.message.includes('VAPID') || error.message.includes('403')) {
            errorType = 'vapid';
        } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
            errorType = 'auth';
        } else if (error.message.includes('Timeout')) {
            errorType = 'timeout';
        } else if (error.message.includes('Payload non valido')) {
            errorType = 'validation';
            shouldRetry = false;
        }
        
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
            console.log(`[WORKER] 💀 Notifica ${id} marcata FAILED (${errorType})`);
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
            
            console.log(`[WORKER] 🔄 Notifica ${id} -> PENDING (retry ${newAttempts}/${maxAttempts} tra ${Math.round(retryDelay/1000)}s)`);
        }
        
        return { success: false, error: error.message, errorType };
    }
}

/**
 * Recupera notifiche da processare usando FOR UPDATE SKIP LOCKED
 */
async function fetchPendingNotifications() {
    try {
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
            return;
        }

        // Load subscriptions once per batch
        subscriptionsCache = await pushService.loadSubscriptions();
        console.log(`[WORKER] 📦 Batch: ${notifications.length} notifiche, ${subscriptionsCache.length} subscriptions caricate`);

        // Processa con concorrenza limitata
        const chunks = [];
        for (let i = 0; i < notifications.length; i += CONFIG.CONCURRENCY) {
            chunks.push(notifications.slice(i, i + CONFIG.CONCURRENCY));
        }

        for (const chunk of chunks) {
            if (shouldStop) break;
            await Promise.allSettled(chunk.map(n => processNotification(n)));
        }

        subscriptionsCache = null;

    } catch (error) {
        console.error('[WORKER] Errore nel ciclo di processamento:', error);
    } finally {
        isProcessing = false;
    }
}

/**
 * Reset notifiche stuck in "sending"
 */
async function resetStuckNotifications() {
    try {
        const result = await db.query(
            `UPDATE notifications
             SET status = 'pending', updated_at = NOW()
             WHERE status = 'sending'
               AND updated_at < NOW() - INTERVAL '${CONFIG.MAX_STUCK_MINUTES} minutes'
             RETURNING id`
        );
        
        if (result.rows.length > 0) {
            console.log(`[WORKER] 🔧 Reset ${result.rows.length} notifiche stuck`);
        }
    } catch (error) {
        console.error('[WORKER] Errore reset stuck:', error);
    }
}

/**
 * Cleanup notifiche vecchie
 */
async function cleanupOldNotifications() {
    try {
        const result = await db.query(
            `DELETE FROM notifications
             WHERE (status = 'sent' OR status = 'failed')
               AND created_at < NOW() - INTERVAL '${CONFIG.CLEANUP_AFTER_DAYS} days'
             RETURNING id`
        );
        
        if (result.rows.length > 0) {
            console.log(`[WORKER] 🧹 Cleanup: ${result.rows.length} notifiche vecchie rimosse`);
        }
    } catch (error) {
        console.error('[WORKER] Errore cleanup:', error);
    }
}

/**
 * Avvia il worker
 */
async function startWorker() {
    if (pollInterval) {
        console.log('[WORKER] ⚠️ Worker già avviato');
        return;
    }

    console.log('[WORKER] 🚀 Avvio worker notifiche push integrato');
    console.log('[WORKER] Config:', {
        pollInterval: `${CONFIG.POLL_INTERVAL_MS}ms`,
        batchSize: CONFIG.BATCH_SIZE,
        concurrency: CONFIG.CONCURRENCY
    });

    shouldStop = false;
    processedCount = 0;
    failedCount = 0;

    // Verifica database
    try {
        await db.query('SELECT 1 FROM notifications LIMIT 1');
        console.log('[WORKER] ✅ Connessione database OK');
    } catch (error) {
        console.error('[WORKER] ❌ Errore connessione database:', error.message);
        throw new Error('Worker cannot start: database not ready');
    }

    // Reset stuck notifications all'avvio
    await resetStuckNotifications();

    // Avvia polling
    pollInterval = setInterval(processLoop, CONFIG.POLL_INTERVAL_MS);

    // Avvia cleanup periodico
    cleanupInterval = setInterval(async () => {
        await cleanupOldNotifications();
        await resetStuckNotifications();
    }, CONFIG.CLEANUP_INTERVAL_MS);

    console.log('[WORKER] ✅ Worker avviato e in esecuzione');
}

/**
 * Ferma il worker
 */
async function stopWorker() {
    console.log('[WORKER] 🛑 Arresto worker...');
    shouldStop = true;

    if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
    }

    if (cleanupInterval) {
        clearInterval(cleanupInterval);
        cleanupInterval = null;
    }

    // Attendi che il processamento corrente finisca
    let waitCount = 0;
    while (isProcessing && waitCount < 30) {
        await new Promise(resolve => setTimeout(resolve, 100));
        waitCount++;
    }

    console.log('[WORKER] 📊 Statistiche finali:');
    console.log(`[WORKER]   - Processate: ${processedCount}`);
    console.log(`[WORKER]   - Fallite: ${failedCount}`);
    console.log('[WORKER] ✅ Worker arrestato');
}

/**
 * Gestione segnali di terminazione
 */
function setupSignalHandlers() {
    const signals = ['SIGINT', 'SIGTERM', 'SIGQUIT'];
    
    signals.forEach(signal => {
        process.on(signal, async () => {
            console.log(`[WORKER] Ricevuto ${signal}, shutdown in corso...`);
            await stopWorker();
            // Non chiamare process.exit qui - lascia che il server principale gestisca la terminazione
        });
    });
}

// Setup handlers solo se questo modulo è eseguito direttamente (non quando importato)
if (require.main === module) {
    setupSignalHandlers();
    startWorker().catch(err => {
        console.error('[WORKER] Errore fatale:', err);
        process.exit(1);
    });
}

module.exports = {
    startWorker,
    stopWorker,
    getStats: () => ({ processed: processedCount, failed: failedCount })
};
