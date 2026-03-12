/**
 * Servizio centralizzato per gestione notifiche push
 * Accoda le notifiche in Redis per essere processate dal worker
 */

const pushService = require("./webpush");
const { redisQueueClient } = require("../../core/config/redis");

const QUEUE_NAME = "notifications:queue";

/**
 * Accoda una notifica per gli admin
 * @param {Object} payload - Dati della notifica
 * @param {Object} options - Opzioni aggiuntive
 * @returns {Promise<Object>} Risultato dell'operazione
 */
async function queueNotificationForAdmins(payload, options = {}) {
  const { priority = 0, maxAttempts = 3 } = options;

  try {
    const notification = {
      id: `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: "admin",
      payload,
      priority,
      maxAttempts,
      attempts: 0,
      createdAt: new Date().toISOString(),
    };

    await redisQueueClient.rpush(QUEUE_NAME, JSON.stringify(notification));

    console.log(
      `[NOTIFICATIONS] Notifica admin accodata con ID ${notification.id}`
    );
    return { success: true, id: notification.id, queued: true };
  } catch (error) {
    console.error("[NOTIFICATIONS] Errore accodamento notifica admin:", error);

    // Fallback: invio diretto se Redis fallisce
    console.log("[NOTIFICATIONS] Fallback: invio diretto notifica admin");
    try {
      await pushService.sendNotificationToAdmins(payload);
      return { success: true, queued: false, fallback: true };
    } catch (fallbackError) {
      console.error(
        "[NOTIFICATIONS] Errore anche nel fallback:",
        fallbackError
      );
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
    console.warn("[NOTIFICATIONS] Nessun utente specificato per la notifica");
    return { success: false, error: "No users specified" };
  }

  const { priority = 0, maxAttempts = 3 } = options;

  try {
    const notification = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: "user",
      user_ids: userIds,
      payload,
      priority,
      maxAttempts,
      attempts: 0,
      createdAt: new Date().toISOString(),
    };

    await redisQueueClient.rpush(QUEUE_NAME, JSON.stringify(notification));

    console.log(
      `[NOTIFICATIONS] Notifica utenti accodata con ID ${notification.id} per ${userIds.length} utenti`
    );
    return { success: true, id: notification.id, queued: true };
  } catch (error) {
    console.error("[NOTIFICATIONS] Errore accodamento notifica utenti:", error);

    // Fallback: invio diretto se Redis fallisce
    console.log("[NOTIFICATIONS] Fallback: invio diretto notifica utenti");
    try {
      await pushService.sendNotificationToUsers(userIds, payload);
      return { success: true, queued: false, fallback: true };
    } catch (fallbackError) {
      console.error(
        "[NOTIFICATIONS] Errore anche nel fallback:",
        fallbackError
      );
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
  const { priority = 0, maxAttempts = 3 } = options;

  try {
    const notification = {
      id: `all_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: "all",
      payload,
      priority,
      maxAttempts,
      attempts: 0,
      createdAt: new Date().toISOString(),
    };

    await redisQueueClient.rpush(QUEUE_NAME, JSON.stringify(notification));

    console.log(
      `[NOTIFICATIONS] Notifica broadcast accodata con ID ${notification.id}`
    );
    return { success: true, id: notification.id, queued: true };
  } catch (error) {
    console.error(
      "[NOTIFICATIONS] Errore accodamento notifica broadcast:",
      error
    );

    // Fallback: invio diretto se Redis fallisce
    console.log("[NOTIFICATIONS] Fallback: invio diretto notifica broadcast");
    try {
      await pushService.sendNotificationToAll(payload);
      return { success: true, queued: false, fallback: true };
    } catch (fallbackError) {
      console.error(
        "[NOTIFICATIONS] Errore anche nel fallback:",
        fallbackError
      );
      return { success: false, error: fallbackError.message };
    }
  }
}

/**
 * Ottiene statistiche sulla coda Redis
 * @returns {Promise<Object>} Statistiche
 */
async function getQueueStats() {
  try {
    const queueLength = await redisQueueClient.llen(QUEUE_NAME);

    return {
      pending: queueLength,
      sending: 0,
      sent: 0,
      failed: 0,
      total: queueLength,
    };
  } catch (error) {
    console.error("[NOTIFICATIONS] Errore recupero statistiche:", error);
    return null;
  }
}

module.exports = {
  queueNotificationForAdmins,
  queueNotificationForUsers,
  queueNotificationForAll,
  getQueueStats,
};
