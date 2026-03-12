/**
 * @fileoverview DAO per la gestione dei dati personali utente
 * @module features/users/services/dao-dati-personali
 * @description Operazioni CRUD sulla tabella UTENTI_DATI_PERSONALI.
 * Gestisce data_nascita e codice_fiscale.
 */

"use strict";

const db = require("../../../core/config/database");

/**
 * Recupera i dati personali di un utente
 * @param {number} utenteId - ID dell'utente
 * @returns {Promise<Object|null>} { data_nascita, codice_fiscale } o null
 */
exports.getByUtenteId = function (utenteId) {
  return new Promise((resolve, reject) => {
    const sql = `SELECT data_nascita, codice_fiscale FROM UTENTI_DATI_PERSONALI WHERE utente_id = ?`;
    db.get(sql, [utenteId], (err, row) => {
      if (err) return reject({ error: "Errore recupero dati personali: " + err.message });
      resolve(row || null);
    });
  });
};

/**
 * Aggiorna o crea i dati personali di un utente (upsert)
 * @param {number} utenteId - ID dell'utente
 * @param {Object} dati - Campi da aggiornare
 * @param {string} [dati.data_nascita] - Data di nascita (YYYY-MM-DD)
 * @param {string} [dati.codice_fiscale] - Codice fiscale
 * @returns {Promise<boolean>} true se aggiornato correttamente
 */
exports.upsert = function (utenteId, dati) {
  return new Promise((resolve, reject) => {
    const dataNascita = dati.data_nascita !== undefined ? dati.data_nascita : null;
    const codiceFiscale = dati.codice_fiscale !== undefined ? dati.codice_fiscale : null;

    // CASE WHEN preserva il valore esistente se il nuovo è NULL
    const sql = `
      INSERT INTO UTENTI_DATI_PERSONALI (utente_id, data_nascita, codice_fiscale)
      VALUES (?, ?, ?)
      ON CONFLICT (utente_id)
      DO UPDATE SET
        data_nascita = CASE WHEN EXCLUDED.data_nascita IS NOT NULL THEN EXCLUDED.data_nascita ELSE utenti_dati_personali.data_nascita END,
        codice_fiscale = CASE WHEN EXCLUDED.codice_fiscale IS NOT NULL THEN EXCLUDED.codice_fiscale ELSE utenti_dati_personali.codice_fiscale END
    `;
    db.run(sql, [utenteId, dataNascita, codiceFiscale], (err) => {
      if (err) return reject({ error: "Errore aggiornamento dati personali: " + err.message });
      resolve(true);
    });
  });
};

/**
 * Elimina i dati personali di un utente
 * @param {number} utenteId - ID dell'utente
 * @returns {Promise<boolean>} true se eliminato
 */
exports.deleteByUtenteId = function (utenteId) {
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM UTENTI_DATI_PERSONALI WHERE utente_id = ?`, [utenteId], (err) => {
      if (err) return reject({ error: "Errore eliminazione dati personali: " + err.message });
      resolve(true);
    });
  });
};

module.exports = exports;
