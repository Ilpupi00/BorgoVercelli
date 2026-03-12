/**
 * @fileoverview DAO per la gestione delle preferenze utente
 * @module features/users/services/dao-preferenze
 * @description Operazioni CRUD sulla tabella UTENTI_PREFERENZE.
 * Gestisce ruolo_preferito e piede_preferito.
 */

"use strict";

const db = require("../../../core/config/database");

/**
 * Recupera le preferenze di un utente
 * @param {number} utenteId - ID dell'utente
 * @returns {Promise<Object|null>} { ruolo_preferito, piede_preferito } o null
 */
exports.getByUtenteId = function (utenteId) {
  return new Promise((resolve, reject) => {
    const sql = `SELECT ruolo_preferito, piede_preferito FROM UTENTI_PREFERENZE WHERE utente_id = ?`;
    db.get(sql, [utenteId], (err, row) => {
      if (err) return reject({ error: "Errore recupero preferenze: " + err.message });
      resolve(row || null);
    });
  });
};

/**
 * Aggiorna o crea le preferenze di un utente (upsert)
 * @param {number} utenteId - ID dell'utente
 * @param {Object} preferenze - Campi da aggiornare
 * @param {string} [preferenze.ruolo_preferito] - Ruolo preferito
 * @param {string} [preferenze.piede_preferito] - Piede preferito
 * @returns {Promise<boolean>} true se aggiornato correttamente
 */
exports.upsert = function (utenteId, preferenze) {
  return new Promise((resolve, reject) => {
    const ruolo = preferenze.ruolo_preferito !== undefined ? preferenze.ruolo_preferito : null;
    const piede = preferenze.piede_preferito !== undefined ? preferenze.piede_preferito : null;

    const sql = `
      INSERT INTO UTENTI_PREFERENZE (utente_id, ruolo_preferito, piede_preferito)
      VALUES (?, ?, ?)
      ON CONFLICT (utente_id)
      DO UPDATE SET ruolo_preferito = EXCLUDED.ruolo_preferito,
                    piede_preferito = EXCLUDED.piede_preferito
    `;
    db.run(sql, [utenteId, ruolo, piede], (err) => {
      if (err) return reject({ error: "Errore aggiornamento preferenze: " + err.message });
      resolve(true);
    });
  });
};

/**
 * Elimina le preferenze di un utente
 * @param {number} utenteId - ID dell'utente
 * @returns {Promise<boolean>} true se eliminato
 */
exports.deleteByUtenteId = function (utenteId) {
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM UTENTI_PREFERENZE WHERE utente_id = ?`, [utenteId], (err) => {
      if (err) return reject({ error: "Errore eliminazione preferenze: " + err.message });
      resolve(true);
    });
  });
};

module.exports = exports;
