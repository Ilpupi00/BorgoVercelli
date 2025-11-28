/**
 * Servizio centralizzato per gestione notifiche push
 * Accoda le notifiche nel database per essere processate dal worker
 */

const db = require('../../core/config/database');
const pushService = require('./webpush');

/**
 * Accoda una notifica per gli admin
 * @param {Object} payload - Dati della notifica (title, body, icon, url, tag, requireInteraction)
 * @param {Object} options - Opzioni aggiuntive
 * @param {number} options.priority - Priorità (0=normale, 1=alta, 2=critica)
 * @param {Date} options.sendAfter - Quando inviare (default: subito)
 * @param {number} options.maxAttempts - Tentativi massimi (default: 3)
 * @returns {Promise<Object>} Risultato dell'operazione
 */
async function queueNotificationForAdmins(payload, options = {}) {
    const {
        priority = 0,
        sendAfter = new Date(),
        maxAttempts = 3
    } = options;

    try {
        const result = await db.query(
            `INSERT INTO notifications (type, payload, status, priority, send_after, max_attempts)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id`,
            ['admin', JSON.stringify(payload), 'pending', priority, sendAfter, maxAttempts]
        );

        console.log(`[NOTIFICATIONS] Notifica admin accodata con ID ${result.rows[0].id}`);
        return { success: true, id: result.rows[0].id, queued: true };
    } catch (error) {
        console.error('[NOTIFICATIONS] Errore accodamento notifica admin:', error);
        
        // Fallback: invio diretto se il DB fallisce
        console.log('[NOTIFICATIONS] Fallback: invio diretto notifica admin');
        try {
            await pushService.sendNotificationToAdmins(payload);
            return { success: true, queued: false, fallback: true };
        } catch (fallbackError) {
            console.error('[NOTIFICATIONS] Errore anche nel fallback:', fallbackError);
            return { success: false, error: fallbackError.message };
        }
    }
}

/**
 * Accoda una notifica per utenti specifici
 * @param {number[]} userIds - Array di ID utenti destinatari
 * @param {Object} payload - Dati della notifica
 * @param {Object} options - Opzioni aggiuntive
 * @returns {Promise<Object>} Risultato dell'operazione
 */
async function queueNotificationForUsers(userIds, payload, options = {}) {
    if (!userIds || userIds.length === 0) {
        console.warn('[NOTIFICATIONS] Nessun utente specificato per la notifica');
        return { success: false, error: 'No users specified' };
    }

    const {
        priority = 0,
        sendAfter = new Date(),
        maxAttempts = 3
    } = options;

    try {
        const result = await db.query(
            `INSERT INTO notifications (type, user_ids, payload, status, priority, send_after, max_attempts)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id`,
            ['user', userIds, JSON.stringify(payload), 'pending', priority, sendAfter, maxAttempts]
        );

        console.log(`[NOTIFICATIONS] Notifica utenti accodata con ID ${result.rows[0].id} per ${userIds.length} utenti`);
        return { success: true, id: result.rows[0].id, queued: true };
    } catch (error) {
        console.error('[NOTIFICATIONS] Errore accodamento notifica utenti:', error);
        
        // Fallback: invio diretto se il DB fallisce
        console.log('[NOTIFICATIONS] Fallback: invio diretto notifica utenti');
        try {
            await pushService.sendNotificationToUsers(userIds, payload);
            return { success: true, queued: false, fallback: true };
        } catch (fallbackError) {
            console.error('[NOTIFICATIONS] Errore anche nel fallback:', fallbackError);
            return { success: false, error: fallbackError.message };
        }
    }
}

/**
 * Accoda una notifica per tutti gli utenti
 * @param {Object} payload - Dati della notifica
 * @param {Object} options - Opzioni aggiuntive
 * @returns {Promise<Object>} Risultato dell'operazione
 */
async function queueNotificationForAll(payload, options = {}) {
    const {
        priority = 0,
        sendAfter = new Date(),
        maxAttempts = 3
    } = options;

    try {
        const result = await db.query(
            `INSERT INTO notifications (type, payload, status, priority, send_after, max_attempts)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id`,
            ['all', JSON.stringify(payload), 'pending', priority, sendAfter, maxAttempts]
        );

        console.log(`[NOTIFICATIONS] Notifica broadcast accodata con ID ${result.rows[0].id}`);
        return { success: true, id: result.rows[0].id, queued: true };
    } catch (error) {
        console.error('[NOTIFICATIONS] Errore accodamento notifica broadcast:', error);
        
        // Fallback: invio diretto se il DB fallisce
        console.log('[NOTIFICATIONS] Fallback: invio diretto notifica broadcast');
        try {
            await pushService.sendNotificationToAll(payload);
            return { success: true, queued: false, fallback: true };
        } catch (fallbackError) {
            console.error('[NOTIFICATIONS] Errore anche nel fallback:', fallbackError);
            return { success: false, error: fallbackError.message };
        }
    }
}

/**
 * Ottiene statistiche sulle notifiche in coda
 * @returns {Promise<Object>} Statistiche
 */
async function getQueueStats() {
    try {
        const result = await db.query(`
            SELECT 
                status,
                COUNT(*) as count
            FROM notifications
            GROUP BY status
        `);

        const stats = {
            pending: 0,
            sending: 0,
            sent: 0,
            failed: 0
        };

        result.rows.forEach(row => {
            stats[row.status] = parseInt(row.count);
        });

        return stats;
    } catch (error) {
        console.error('[NOTIFICATIONS] Errore recupero statistiche:', error);
        return null;
    }
}

module.exports = {
    queueNotificationForAdmins,
    queueNotificationForUsers,
    queueNotificationForAll,
    getQueueStats
};
