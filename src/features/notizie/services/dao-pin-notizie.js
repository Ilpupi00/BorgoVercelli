"use strict";

/**
 * @fileoverview Servizio per il sistema di pin delle notizie
 * @description Gestisce i pin delle notizie in modo globale aggiornando la colonna is_pinned
 * @module features/notizie/services/dao-pin-notizie
 */

const sqlite = require("../../../core/config/database");

/**
 * Aggiunge un pin: imposta is_pinned a true
 * @param {number|string} userId - ID utente (ignorato per pin globale)
 * @param {number|string} notiziaId - ID notizia
 * @returns {Promise<{success: boolean, added: boolean}>}
 */
exports.addPin = async function (userId, notiziaId) {
  try {
    return new Promise((resolve, reject) => {
      sqlite.run("UPDATE NOTIZIE SET is_pinned = true WHERE id = ?", [notiziaId], function (err, result) {
        if (err) return reject(err);
        resolve({ success: true, added: true });
      });
    });
  } catch (err) {
    console.error("[DAO-PIN-NOTIZIE] Errore addPin:", err);
    throw err;
  }
};

/**
 * Rimuove un pin: imposta is_pinned a false
 * @param {number|string} userId - ID utente (ignorato per pin globale)
 * @param {number|string} notiziaId - ID notizia
 * @returns {Promise<{success: boolean, removed: boolean}>}
 */
exports.removePin = async function (userId, notiziaId) {
  try {
    return new Promise((resolve, reject) => {
      sqlite.run("UPDATE NOTIZIE SET is_pinned = false WHERE id = ?", [notiziaId], function (err, result) {
        if (err) return reject(err);
        resolve({ success: true, removed: true });
      });
    });
  } catch (err) {
    console.error("[DAO-PIN-NOTIZIE] Errore removePin:", err);
    throw err;
  }
};

/**
 * Verifica se una notizia è pinnata
 * @param {number|string} userId - ID utente (ignorato)
 * @param {number|string} notiziaId
 * @returns {Promise<boolean>}
 */
exports.isPinned = async function (userId, notiziaId) {
  try {
    return new Promise((resolve, reject) => {
      sqlite.get("SELECT is_pinned FROM NOTIZIE WHERE id = ?", [notiziaId], (err, row) => {
        if (err) {
          console.error("[DAO-PIN-NOTIZIE] Errore isPinned:", err);
          return resolve(false);
        }
        resolve(row && row.is_pinned === true);
      });
    });
  } catch (err) {
    console.error("[DAO-PIN-NOTIZIE] Errore isPinned:", err);
    return false;
  }
};

/**
 * Toggle pin: aggiunge o rimuove il pin
 * @param {number|string} userId
 * @param {number|string} notiziaId
 * @returns {Promise<{success: boolean, pinned: boolean}>}
 */
exports.togglePin = async function (userId, notiziaId) {
  try {
    const currentlyPinned = await exports.isPinned(userId, notiziaId);
    if (currentlyPinned) {
      await exports.removePin(userId, notiziaId);
      return { success: true, pinned: false };
    } else {
      await exports.addPin(userId, notiziaId);
      return { success: true, pinned: true };
    }
  } catch (err) {
    console.error("[DAO-PIN-NOTIZIE] Errore togglePin:", err);
    throw err;
  }
};

/**
 * Recupera tutti gli ID delle notizie pinnate globalmente
 * @param {number|string} userId - ID utente (ignorato per pin globale)
 * @returns {Promise<string[]>} Array di ID notizie (come stringhe)
 */
exports.getPinnedIds = async function (userId) {
  try {
    return new Promise((resolve, reject) => {
      sqlite.all("SELECT id FROM NOTIZIE WHERE is_pinned = true", [], (err, rows) => {
        if (err) {
          console.error("[DAO-PIN-NOTIZIE] Errore getPinnedIds:", err);
          return resolve([]);
        }
        resolve((rows || []).map(r => String(r.id)));
      });
    });
  } catch (err) {
    console.error("[DAO-PIN-NOTIZIE] Errore getPinnedIds:", err);
    return [];
  }
};

/**
 * Conta quante notizie sono pinnate globalmente
 * @param {number|string} userId
 * @returns {Promise<number>}
 */
exports.getPinCount = async function (userId) {
  try {
    const ids = await exports.getPinnedIds(userId);
    return ids.length;
  } catch (err) {
    console.error("[DAO-PIN-NOTIZIE] Errore getPinCount:", err);
    return 0;
  }
};

/**
 * Recupera il numero di pin globali per una notizia (sostanzialmente 1 se pinnata, 0 se no)
 * @param {number|string} notiziaId
 * @returns {Promise<number>}
 */
exports.getNotiziaGlobalPins = async function (notiziaId) {
  try {
    const pinned = await exports.isPinned(null, notiziaId);
    return pinned ? 1 : 0;
  } catch (err) {
    console.error("[DAO-PIN-NOTIZIE] Errore getNotiziaGlobalPins:", err);
    return 0;
  }
};

/**
 * Rimuove il contatore globale di pin per una notizia
 * @param {number|string} notiziaId
 * @returns {Promise<void>}
 */
exports.removeAllPinsForNotizia = async function (notiziaId) {
  try {
    await exports.removePin(null, notiziaId);
  } catch (err) {
    console.error("[DAO-PIN-NOTIZIE] Errore removeAllPinsForNotizia:", err);
  }
};
