/**
 * @fileoverview DAO per la gestione dei token di reset password
 * @module features/users/services/dao-reset-token
 * @description Operazioni CRUD sulla tabella UTENTI_RESET_TOKEN.
 */

"use strict";

const db = require("../../../core/config/database");

/**
 * Salva un token di reset password (upsert)
 * @param {number} utenteId - ID dell'utente
 * @param {string} token - Token generato
 * @param {Date} expiresAt - Data di scadenza
 * @returns {Promise<Object>} Messaggio di successo
 */
exports.saveResetToken = function (utenteId, token, expiresAt) {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO UTENTI_RESET_TOKEN (utente_id, token, expires, created_at)
      VALUES (?, ?, ?, NOW())
      ON CONFLICT (utente_id)
      DO UPDATE SET token = EXCLUDED.token,
                    expires = EXCLUDED.expires,
                    created_at = NOW()
    `;
    db.run(sql, [utenteId, token, expiresAt.toISOString()], (err) => {
      if (err) return reject({ error: "Error saving reset token: " + err.message });
      resolve({ message: "Reset token saved successfully" });
    });
  });
};

/**
 * Recupera un utente tramite token di reset valido (non scaduto)
 * @param {string} token - Token di reset
 * @returns {Promise<Object|null>} Dati utente o null se token invalido/scaduto
 */
exports.getUserByResetToken = function (token) {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT u.*, t.nome AS tipo_utente_nome
      FROM UTENTI_RESET_TOKEN rt
      JOIN UTENTI u ON u.id = rt.utente_id
      LEFT JOIN TIPI_UTENTE t ON u.tipo_utente_id = t.id
      WHERE rt.token = ? AND rt.expires > ?
    `;
    const User = require("../../../core/models/user");
    db.get(sql, [token, new Date().toISOString()], (err, user) => {
      if (err) return reject({ error: "Error retrieving user by reset token: " + err.message });
      resolve(user ? User.from(user) : null);
    });
  });
};

/**
 * Invalida (elimina) il token di reset per un utente
 * @param {number} utenteId - ID dell'utente
 * @returns {Promise<Object>} Messaggio di successo
 */
exports.invalidateResetToken = function (utenteId) {
  return new Promise((resolve, reject) => {
    const sql = `DELETE FROM UTENTI_RESET_TOKEN WHERE utente_id = ?`;
    db.run(sql, [utenteId], (err) => {
      if (err) return reject({ error: "Error invalidating reset token: " + err.message });
      resolve({ message: "Reset token invalidated successfully" });
    });
  });
};

module.exports = exports;
