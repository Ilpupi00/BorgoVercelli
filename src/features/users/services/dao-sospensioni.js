/**
 * @fileoverview DAO per la gestione delle sospensioni e ban utenti
 * @module features/users/services/dao-sospensioni
 * @description Operazioni CRUD sulla tabella UTENTI_SOSPENSIONI.
 * Il campo `stato` resta in UTENTI e viene aggiornato in parallelo.
 */

"use strict";

const db = require("../../../core/config/database");
const moment = require("moment");

// ==================== LETTURA ====================

/**
 * Recupera i dettagli della sospensione/ban attiva per un utente
 * @param {number} utenteId - ID dell'utente
 * @returns {Promise<Object|null>} Dettagli sospensione o null se non presente
 */
exports.getByUtenteId = function (utenteId) {
  return new Promise((resolve, reject) => {
    const sql = `SELECT * FROM UTENTI_SOSPENSIONI WHERE utente_id = ?`;
    db.get(sql, [utenteId], (err, row) => {
      if (err) return reject({ error: "Errore recupero sospensione: " + err.message });
      resolve(row || null);
    });
  });
};

/**
 * Recupera lo stato completo di un utente (stato + dettagli sospensione)
 * @param {number} utenteId - ID dell'utente
 * @returns {Promise<Object>} Oggetto con stato, motivo, date, admin_id
 */
exports.getStatoUtente = function (utenteId) {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT u.stato, s.motivo, s.data_inizio, s.data_fine, s.admin_id
      FROM UTENTI u
      LEFT JOIN UTENTI_SOSPENSIONI s ON s.utente_id = u.id
      WHERE u.id = ?
    `;
    db.get(sql, [utenteId], (err, row) => {
      if (err) return reject({ error: "Errore nel recupero stato utente: " + err.message });
      if (!row) return reject({ error: "Utente non trovato" });
      resolve({
        stato: row.stato,
        motivo_sospensione: row.motivo || null,
        data_inizio_sospensione: row.data_inizio || null,
        data_fine_sospensione: row.data_fine || null,
        admin_sospensione_id: row.admin_id || null,
      });
    });
  });
};

// ==================== SCRITTURA ====================

/**
 * Sospende temporaneamente un utente
 * Aggiorna stato in UTENTI e inserisce/aggiorna riga in UTENTI_SOSPENSIONI
 * @param {number} utenteId - ID dell'utente da sospendere
 * @param {number} adminId - ID dell'admin che sospende
 * @param {string} motivo - Motivo della sospensione
 * @param {string|null} dataFine - Data fine sospensione (ISO string) o null
 * @returns {Promise<Object>} Messaggio di successo
 */
exports.sospendiUtente = function (utenteId, adminId, motivo, dataFine) {
  return new Promise(async (resolve, reject) => {
    const now = moment().format("YYYY-MM-DD HH:mm:ss");

    try {
      // 1. Aggiorna stato in UTENTI
      await new Promise((res, rej) => {
        db.run(
          `UPDATE UTENTI SET stato = 'sospeso', updated_at = ? WHERE id = ?`,
          [now, utenteId],
          (err, result) => {
            if (err) return rej(err);
            const changes = result && typeof result.rowCount === "number" ? result.rowCount : 0;
            if (changes === 0) return rej({ error: "Utente non trovato" });
            res();
          }
        );
      });

      // 2. Upsert dettagli in UTENTI_SOSPENSIONI
      await new Promise((res, rej) => {
        const sql = `
          INSERT INTO UTENTI_SOSPENSIONI (utente_id, motivo, data_inizio, data_fine, admin_id, created_at)
          VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT (utente_id)
          DO UPDATE SET motivo = EXCLUDED.motivo,
                        data_inizio = EXCLUDED.data_inizio,
                        data_fine = EXCLUDED.data_fine,
                        admin_id = EXCLUDED.admin_id
        `;
        db.run(sql, [utenteId, motivo, now, dataFine, adminId, now], (err) => {
          if (err) return rej(err);
          res();
        });
      });

      console.log("[DAO-SOSPENSIONI] sospendiUtente - Successo userId:", utenteId);
      resolve({
        message: "Utente sospeso con successo",
        userId: utenteId,
        dataFine: dataFine,
      });
    } catch (err) {
      console.error("[DAO-SOSPENSIONI] sospendiUtente - Errore:", err);
      reject({ error: err.error || "Errore nella sospensione dell'utente: " + (err.message || err) });
    }
  });
};

/**
 * Banna permanentemente un utente
 * @param {number} utenteId - ID dell'utente da bannare
 * @param {number} adminId - ID dell'admin che banna
 * @param {string} motivo - Motivo del ban
 * @returns {Promise<Object>} Messaggio di successo
 */
exports.bannaUtente = function (utenteId, adminId, motivo) {
  return new Promise(async (resolve, reject) => {
    const now = moment().format("YYYY-MM-DD HH:mm:ss");

    try {
      // 1. Aggiorna stato in UTENTI
      await new Promise((res, rej) => {
        db.run(
          `UPDATE UTENTI SET stato = 'bannato', updated_at = ? WHERE id = ?`,
          [now, utenteId],
          (err, result) => {
            if (err) return rej(err);
            const changes = result && typeof result.rowCount === "number" ? result.rowCount : 0;
            if (changes === 0) return rej({ error: "Utente non trovato" });
            res();
          }
        );
      });

      // 2. Upsert dettagli in UTENTI_SOSPENSIONI
      await new Promise((res, rej) => {
        const sql = `
          INSERT INTO UTENTI_SOSPENSIONI (utente_id, motivo, data_inizio, data_fine, admin_id, created_at)
          VALUES (?, ?, ?, NULL, ?, ?)
          ON CONFLICT (utente_id)
          DO UPDATE SET motivo = EXCLUDED.motivo,
                        data_inizio = EXCLUDED.data_inizio,
                        data_fine = NULL,
                        admin_id = EXCLUDED.admin_id
        `;
        db.run(sql, [utenteId, motivo, now, adminId, now], (err) => {
          if (err) return rej(err);
          res();
        });
      });

      console.log("[DAO-SOSPENSIONI] bannaUtente - Successo userId:", utenteId);
      resolve({
        message: "Utente bannato con successo",
        userId: utenteId,
      });
    } catch (err) {
      console.error("[DAO-SOSPENSIONI] bannaUtente - Errore:", err);
      reject({ error: err.error || "Errore nel ban dell'utente: " + (err.message || err) });
    }
  });
};

/**
 * Revoca sospensione o ban, riportando utente ad 'attivo'
 * @param {number} utenteId - ID dell'utente
 * @returns {Promise<Object>} Messaggio di successo
 */
exports.revocaSospensioneBan = function (utenteId) {
  return new Promise(async (resolve, reject) => {
    const now = moment().format("YYYY-MM-DD HH:mm:ss");

    try {
      // 1. Riporta stato ad 'attivo'
      await new Promise((res, rej) => {
        db.run(
          `UPDATE UTENTI SET stato = 'attivo', updated_at = ? WHERE id = ?`,
          [now, utenteId],
          (err, result) => {
            if (err) return rej(err);
            const changes = result && typeof result.rowCount === "number" ? result.rowCount : 0;
            if (changes === 0) return rej({ error: "Utente non trovato" });
            res();
          }
        );
      });

      // 2. Elimina riga dalla tabella sospensioni
      await new Promise((res, rej) => {
        db.run(
          `DELETE FROM UTENTI_SOSPENSIONI WHERE utente_id = ?`,
          [utenteId],
          (err) => {
            if (err) return rej(err);
            res();
          }
        );
      });

      console.log("[DAO-SOSPENSIONI] revocaSospensioneBan - Successo userId:", utenteId);
      resolve({
        message: "Sospensione/Ban revocato con successo",
        userId: utenteId,
      });
    } catch (err) {
      console.error("[DAO-SOSPENSIONI] revocaSospensioneBan - Errore:", err);
      reject({ error: err.error || "Errore nella revoca: " + (err.message || err) });
    }
  });
};

/**
 * Verifica e riattiva automaticamente le sospensioni scadute
 * @returns {Promise<Object>} Numero di record aggiornati
 */
exports.verificaSospensioniScadute = function () {
  return new Promise(async (resolve, reject) => {
    const now = moment().format("YYYY-MM-DD HH:mm:ss");

    try {
      // 1. Trova utenti con sospensione scaduta
      const scaduti = await new Promise((res, rej) => {
        db.all(
          `SELECT utente_id FROM UTENTI_SOSPENSIONI WHERE data_fine IS NOT NULL AND data_fine < ?`,
          [now],
          (err, rows) => {
            if (err) return rej(err);
            res(rows || []);
          }
        );
      });

      if (scaduti.length === 0) {
        return resolve({ message: "Verifica completata", aggiornati: 0 });
      }

      const ids = scaduti.map((r) => r.utente_id);

      // 2. Aggiorna stato in UTENTI a 'attivo'
      // Costruisci placeholders per IN clause
      const placeholders = ids.map(() => "?").join(", ");
      await new Promise((res, rej) => {
        db.run(
          `UPDATE UTENTI SET stato = 'attivo' WHERE id IN (${placeholders}) AND stato = 'sospeso'`,
          ids,
          (err, result) => {
            if (err) return rej(err);
            res(result);
          }
        );
      });

      // 3. Elimina le righe scadute
      await new Promise((res, rej) => {
        db.run(
          `DELETE FROM UTENTI_SOSPENSIONI WHERE utente_id IN (${placeholders})`,
          ids,
          (err) => {
            if (err) return rej(err);
            res();
          }
        );
      });

      resolve({ message: "Verifica completata", aggiornati: ids.length });
    } catch (err) {
      reject({ error: "Errore nella verifica sospensioni: " + (err.message || err) });
    }
  });
};

module.exports = exports;
