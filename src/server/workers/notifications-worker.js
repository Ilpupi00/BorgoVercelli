/**
 * @fileoverview Worker integrato per processare notifiche push in coda Redis
 * @description Worker in-process che gira nel server principale.
 * Processa notifiche dalla coda Redis con retry, backoff esponenziale,
 * cleanup automatico e gestione errori avanzata.
 */

"use strict";

const pushService = require("../../shared/services/webpush");
const {
  redisQueueClient,
  redisClient,
  getQueueLength,
} = require("../../core/config/redis");

// Configurazione
const CONFIG = {
  POLL_INTERVAL_MS: 1000, // Controlla ogni 1 secondo
  BATCH_SIZE: 30, // Processa max 30 notifiche per volta
  CONCURRENCY: 12, // Numero massimo di invii web-push concorrenti
  RETRY_DELAY_BASE_MS: 2000, // Base per backoff esponenziale (2s, 4s, 8s, 16s...)
  MAX_RETRY_DELAY_MS: 120000, // Max 2 minuti di delay
  CLEANUP_INTERVAL_MS: 3600000, // Cleanup ogni ora
  CLEANUP_AFTER_DAYS: 7, // Rimuovi notifiche vecchie di 7 giorni
  PROCESSING_TIMEOUT_MS: 30000, // Timeout per processamento singola notifica (30s)
  MAX_RETRY_ATTEMPTS: 3, // Max tentativi di invio
  QUEUE_NAME: "notifications:queue", // Nome della coda Redis
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
    console.log(
      `[WORKER] 📋 Processando notifica ${id} (tipo: ${type}, attempt: ${
        attempts + 1
      })`
    );

    // Valida payload
    let payloadObj;
    try {
      payloadObj = typeof payload === "string" ? JSON.parse(payload) : payload;
      if (!payloadObj.title || !payloadObj.body) {
        throw new Error("Payload deve avere title e body");
      }
    } catch (parseError) {
      throw new Error(`Payload non valido: ${parseError.message}`);
    }

    let result;

    // Crea promise con timeout
    const sendPromise = (async () => {
      switch (type) {
        case "admin":
          return await pushService.sendNotificationToAdmins(
            payloadObj,
            subscriptionsCache
          );
        case "user":
          if (!user_ids || user_ids.length === 0) {
            throw new Error("No user_ids specified for user notification");
          }
          return await pushService.sendNotificationToUsers(
            user_ids,
            payloadObj,
            subscriptionsCache
          );
        case "all":
          return await pushService.sendNotificationToAll(
            payloadObj,
            subscriptionsCache
          );
        default:
          throw new Error(`Unknown notification type: ${type}`);
      }
    })();

    // Applica timeout
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error("Timeout processamento notifica")),
        CONFIG.PROCESSING_TIMEOUT_MS
      )
    );

    result = await Promise.race([sendPromise, timeoutPromise]);

    // Log successo (no database update needed)
    processedCount++;
    console.log(
      `[WORKER] ✅ Notifica ${id} inviata (sent: ${
        result?.sent || 0
      }, failed: ${result?.failed || 0})`
    );

    return { success: true, result };
  } catch (error) {
    console.error(
      `[WORKER] ❌ Errore processando notifica ${id}:`,
      error.message
    );

    // Classifica l'errore per miglior handling
    let errorType = "generic";
    let shouldRetry = true;

    if (error.message.includes("VAPID") || error.message.includes("403")) {
      errorType = "vapid";
    } else if (
      error.message.includes("401") ||
      error.message.includes("Unauthorized")
    ) {
      errorType = "auth";
    } else if (error.message.includes("Timeout")) {
      errorType = "timeout";
    } else if (error.message.includes("Payload non valido")) {
      errorType = "validation";
      shouldRetry = false;
    }

    const newAttempts = attempts + 1;
    const maxAttempts = CONFIG.MAX_RETRY_ATTEMPTS;

    // Se superato max attempts, scarta
    if (newAttempts >= maxAttempts) {
      failedCount++;
      console.log(
        `[WORKER] 💀 Notifica ${id} marcata FAILED (max retry: ${maxAttempts})`
      );
    } else {
      // Rimetti in coda per retry con backoff
      const retryDelay = calculateRetryDelay(newAttempts);

      // Crea una copia della notifica con attempts incrementato
      const retryNotification = {
        ...notification,
        attempts: newAttempts,
        lastError: error.message,
      };

      // Attendi del tempo che equivale al backoff, poi rimetti in coda
      setTimeout(async () => {
        try {
          await redisQueueClient.rpush(
            CONFIG.QUEUE_NAME,
            JSON.stringify(retryNotification)
          );
          console.log(
            `[WORKER] 🔄 Notifica ${id} -> rimessa in coda (retry ${newAttempts}/${maxAttempts})`
          );
        } catch (requeueErr) {
          console.error(
            "[WORKER] ❌ Errore rimessa in coda:",
            requeueErr.message
          );
        }
      }, retryDelay);
    }

    return { success: false, error: error.message };
  }
}

/**
 * Recupera notifiche da processare dalla coda Redis
 * Legge max BATCH_SIZE notifiche dalla coda
 */
async function fetchPendingNotifications() {
  try {
    const notifications = [];

    // Leggi fino a BATCH_SIZE notifiche dalla coda
    for (let i = 0; i < CONFIG.BATCH_SIZE; i++) {
      // BLPOP con timeout 0 per non bloccare
      const result = await redisQueueClient.lpop(CONFIG.QUEUE_NAME);

      if (!result) break; // Coda vuota

      try {
        const notification = JSON.parse(result);
        // Assicurati che il tentativo sia registrato
        notification.attempts = notification.attempts || 0;
        notifications.push(notification);
      } catch (parseErr) {
        console.error(
          "[WORKER] ❌ Errore parsing notifica Redis:",
          parseErr.message
        );
      }
    }

    if (notifications.length > 0) {
      console.log(
        `[WORKER] 📥 Lette ${notifications.length} notifiche dalla coda`
      );
    }

    return notifications;
  } catch (error) {
    console.error("[WORKER] ❌ Errore lettura coda Redis:", error.message);
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
    console.log(
      `[WORKER] 📦 Batch: ${notifications.length} notifiche, ${subscriptionsCache.length} subscriptions caricate`
    );

    // Processa con concorrenza limitata
    const chunks = [];
    for (let i = 0; i < notifications.length; i += CONFIG.CONCURRENCY) {
      chunks.push(notifications.slice(i, i + CONFIG.CONCURRENCY));
    }

    for (const chunk of chunks) {
      if (shouldStop) break;
      await Promise.allSettled(chunk.map((n) => processNotification(n)));
    }

    subscriptionsCache = null;
  } catch (error) {
    console.error("[WORKER] Errore nel ciclo di processamento:", error);
  } finally {
    isProcessing = false;
  }
}

/**
 * Avvia il worker
 */
async function startWorker() {
  if (pollInterval) {
    console.log("[WORKER] ⚠️ Worker già avviato");
    return;
  }

  console.log("[WORKER] 🚀 Avvio worker notifiche push integrato");
  console.log("[WORKER] Config:", {
    pollInterval: `${CONFIG.POLL_INTERVAL_MS}ms`,
    batchSize: CONFIG.BATCH_SIZE,
    concurrency: CONFIG.CONCURRENCY,
  });

  shouldStop = false;
  processedCount = 0;
  failedCount = 0;

  // Avvia polling dalla coda Redis
  pollInterval = setInterval(processLoop, CONFIG.POLL_INTERVAL_MS);

  console.log("[WORKER] ✅ Worker notifiche avviato - coda Redis pronta");

  // Avvia cleanup periodico (opzionale per Redis)
  cleanupInterval = setInterval(async () => {
    const queueLen = await getQueueLength(CONFIG.QUEUE_NAME);
    console.log(`[WORKER] 📊 State: ${queueLen} notifiche in coda`);
  }, CONFIG.CLEANUP_INTERVAL_MS);

  console.log("[WORKER] ✅ Worker avviato e in esecuzione");
}

/**
 * Ferma il worker
 */
async function stopWorker() {
  console.log("[WORKER] 🛑 Arresto worker...");
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
    await new Promise((resolve) => setTimeout(resolve, 100));
    waitCount++;
  }

  console.log("[WORKER] 📊 Statistiche finali:");
  console.log(`[WORKER]   - Processate: ${processedCount}`);
  console.log(`[WORKER]   - Fallite: ${failedCount}`);
  console.log("[WORKER] ✅ Worker arrestato");
}

/**
 * Gestione segnali di terminazione
 */
function setupSignalHandlers() {
  const signals = ["SIGINT", "SIGTERM", "SIGQUIT"];

  signals.forEach((signal) => {
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
  startWorker().catch((err) => {
    console.error("[WORKER] Errore fatale:", err);
    process.exit(1);
  });
}

module.exports = {
  startWorker,
  stopWorker,
  getStats: () => ({ processed: processedCount, failed: failedCount }),
};
