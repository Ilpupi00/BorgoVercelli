/**
 * @fileoverview Configurazione centralizzata Redis
 * @description Gestisce client Redis per sessioni e notifiche push
 * Supporta sia ambienti locali che production (Railway)
 *
 * NOTA: Usa il pacchetto ufficiale 'redis' per connect-redis (sessioni)
 *       e 'ioredis' per le funzionalità avanzate (code, pub/sub)
 */

"use strict";

const { createClient } = require("redis");
const IORedis = require("ioredis");

// Configurazione Redis base
// Priorità: REDIS_URL (Railway) > variabili singole > default localhost
const REDIS_HOST = process.env.REDIS_HOST || "127.0.0.1";
const REDIS_PORT = Number(process.env.REDIS_PORT) || 6379;
const REDIS_DB = Number(process.env.REDIS_DB) || 0;
const REDIS_PASSWORD =
  process.env.REDIS_PASSWORD && process.env.REDIS_PASSWORD.trim() !== ""
    ? process.env.REDIS_PASSWORD
    : undefined;

// URL per il client ufficiale redis - usa REDIS_URL da Railway se disponibile
const REDIS_URL = process.env.REDIS_URL
  ? process.env.REDIS_URL
  : REDIS_PASSWORD
    ? `redis://:${REDIS_PASSWORD}@${REDIS_HOST}:${REDIS_PORT}/${REDIS_DB}`
    : `redis://${REDIS_HOST}:${REDIS_PORT}/${REDIS_DB}`;

console.log(`[Redis] Usando URL: ${process.env.REDIS_URL ? 'REDIS_URL (Railway)' : `costruito da host/port (${REDIS_HOST}:${REDIS_PORT})`}`);

/**
 * Client Redis per sessioni (pacchetto ufficiale 'redis' v5)
 * Richiesto da connect-redis 9.x
 */
const redisClient = createClient({
  url: REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => {
      const delay = Math.min(retries * 50, 2000);
      return delay;
    },
  },
});

// Event handlers per il client sessioni
redisClient.on("connect", () => {
  console.log(
    `✅ Redis sessioni connesso (${REDIS_HOST}:${REDIS_PORT}, db: ${REDIS_DB})`
  );
});

redisClient.on("error", (err) => {
  console.error("❌ Errore Redis sessioni:", err.message);
});

redisClient.on("reconnecting", () => {
  console.log("🔄 Redis sessioni riconnessione in corso...");
});

// Configurazione IORedis per funzionalità avanzate
// Se REDIS_URL è disponibile (Railway), ioredis lo parsa automaticamente
const IOREDIS_CONFIG = process.env.REDIS_URL
  ? {
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true,
    }
  : {
      host: REDIS_HOST,
      port: REDIS_PORT,
      db: REDIS_DB,
      password: REDIS_PASSWORD,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true,
    };

/**
 * Client IORedis per Pub/Sub notifiche push
 * Separato dal client principale per evitare conflitti
 */
const redisPubSubClient = process.env.REDIS_URL
  ? new IORedis(process.env.REDIS_URL, IOREDIS_CONFIG)
  : new IORedis(IOREDIS_CONFIG);

/**
 * Client IORedis per code di notifiche
 */
const redisQueueClient = process.env.REDIS_URL
  ? new IORedis(process.env.REDIS_URL, IOREDIS_CONFIG)
  : new IORedis(IOREDIS_CONFIG);

redisPubSubClient.on("connect", () => {
  console.log("✅ Redis Pub/Sub connesso");
});

redisPubSubClient.on("error", (err) => {
  console.error("❌ Errore Redis Pub/Sub:", err.message);
});

// ==================== HELPER FUNCTIONS ====================

/**
 * Inizializza le connessioni Redis
 * @returns {Promise<boolean>}
 */
async function initRedis() {
  try {
    // Connetti il client sessioni (redis ufficiale)
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }

    // Connetti i client IORedis
    if (
      redisPubSubClient.status === "wait" ||
      redisPubSubClient.status === "close"
    ) {
      await redisPubSubClient.connect();
    }
    if (
      redisQueueClient.status === "wait" ||
      redisQueueClient.status === "close"
    ) {
      await redisQueueClient.connect();
    }

    // Test connessione
    const pong = await redisClient.ping();
    if (pong !== "PONG") {
      throw new Error("Redis PING fallito");
    }

    console.log("🚀 Redis inizializzato correttamente");
    return true;
  } catch (err) {
    console.error("❌ Errore inizializzazione Redis:", err.message);
    return false;
  }
}

/**
 * Chiude tutte le connessioni Redis
 * @returns {Promise<void>}
 */
async function closeRedis() {
  try {
    await Promise.all([
      redisClient.quit(),
      redisPubSubClient.quit(),
      redisQueueClient.quit(),
    ]);
    console.log("✅ Connessioni Redis chiuse");
  } catch (err) {
    console.error("❌ Errore chiusura Redis:", err.message);
  }
}

/**
 * Pubblica un evento notifica push
 * @param {string} channel - Canale pub/sub
 * @param {object} data - Dati da pubblicare
 * @returns {Promise<number>} Numero di subscriber che hanno ricevuto il messaggio
 */
async function publishNotification(channel, data) {
  try {
    const message = JSON.stringify(data);
    const subscribers = await redisPubSubClient.publish(channel, message);
    console.log(
      `📤 Notifica pubblicata su "${channel}" a ${subscribers} subscriber`
    );
    return subscribers;
  } catch (err) {
    console.error(`❌ Errore publish notifica: ${err.message}`);
    throw err;
  }
}

/**
 * Si sottoscrive a un canale di notifiche push
 * @param {string} channel - Canale pub/sub
 * @param {Function} callback - Callback(message) quando arriva un messaggio
 * @returns {Promise<void>}
 */
async function subscribeNotification(channel, callback) {
  try {
    await redisPubSubClient.subscribe(channel);

    redisPubSubClient.on("message", (ch, message) => {
      if (ch === channel) {
        try {
          const data = JSON.parse(message);
          callback(data);
        } catch (parseErr) {
          console.error(`❌ Errore parsing messaggio: ${parseErr.message}`);
        }
      }
    });

    console.log(`📥 Sottoscritto al canale "${channel}"`);
  } catch (err) {
    console.error(`❌ Errore subscribe: ${err.message}`);
    throw err;
  }
}

/**
 * Aggiunge notifica alla coda Redis
 * @param {string} queueName - Nome della coda
 * @param {object} notification - Dati notifica
 * @returns {Promise<number>} Lunghezza della coda
 */
async function pushNotificationToQueue(queueName, notification) {
  try {
    const value = JSON.stringify(notification);
    const length = await redisQueueClient.rpush(queueName, value);
    return length;
  } catch (err) {
    console.error(`❌ Errore push notifica in coda: ${err.message}`);
    throw err;
  }
}

/**
 * Estrae notifica dalla coda Redis
 * @param {string} queueName - Nome della coda
 * @returns {Promise<object|null>} Notifica o null se coda vuota
 */
async function popNotificationFromQueue(queueName) {
  try {
    const value = await redisQueueClient.lpop(queueName);
    if (!value) return null;
    return JSON.parse(value);
  } catch (err) {
    console.error(`❌ Errore pop notifica da coda: ${err.message}`);
    throw err;
  }
}

/**
 * Conta notifiche in coda
 * @param {string} queueName - Nome della coda
 * @returns {Promise<number>} Lunghezza della coda
 */
async function getQueueLength(queueName) {
  try {
    return await redisQueueClient.llen(queueName);
  } catch (err) {
    console.error(`❌ Errore lettura lunghezza coda: ${err.message}`);
    throw err;
  }
}

/**
 * Salva dato generico in Redis (usa client ufficiale)
 * @param {string} key - Chiave
 * @param {any} value - Valore (sarà serializzato)
 * @param {number} expirySeconds - TTL opzionale in secondi
 * @returns {Promise<string>} Risposta Redis
 */
async function set(key, value, expirySeconds = null) {
  try {
    const serialized =
      typeof value === "string" ? value : JSON.stringify(value);

    if (expirySeconds) {
      return await redisClient.setEx(key, expirySeconds, serialized);
    }
    return await redisClient.set(key, serialized);
  } catch (err) {
    console.error(`❌ Errore SET Redis: ${err.message}`);
    throw err;
  }
}

/**
 * Legge dato generico da Redis
 * @param {string} key - Chiave
 * @returns {Promise<any>} Valore deserializzato o null
 */
async function get(key) {
  try {
    const value = await redisClient.get(key);
    if (!value) return null;

    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  } catch (err) {
    console.error(`❌ Errore GET Redis: ${err.message}`);
    throw err;
  }
}

/**
 * Elimina chiave da Redis
 * @param {string} key - Chiave
 * @returns {Promise<number>} 1 se eliminata, 0 altrimenti
 */
async function del(key) {
  try {
    return await redisClient.del(key);
  } catch (err) {
    console.error(`❌ Errore DEL Redis: ${err.message}`);
    throw err;
  }
}

/**
 * Verifica esistenza chiave
 * @param {string} key - Chiave
 * @returns {Promise<number>} 1 se esiste, 0 altrimenti
 */
async function exists(key) {
  try {
    return await redisClient.exists(key);
  } catch (err) {
    console.error(`❌ Errore EXISTS Redis: ${err.message}`);
    throw err;
  }
}

module.exports = {
  redisClient,
  redisPubSubClient,
  redisQueueClient,
  initRedis,
  closeRedis,
  publishNotification,
  subscribeNotification,
  pushNotificationToQueue,
  popNotificationFromQueue,
  getQueueLength,
  set,
  get,
  del,
  exists,
};
