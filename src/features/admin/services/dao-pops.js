"use strict";

/**
 * @fileoverview DAO per la gestione dei POPS (popup periodici gestiti dall'admin)
 * @module features/admin/services/dao-pops
 */

const db = require("../../../core/config/database");

// ─────────────────────────────────────────────────────────────
// Helper: costruisce un oggetto POP da una riga DB
// ─────────────────────────────────────────────────────────────
function makePopObj(row) {
  return {
    id: row.id,
    titolo: row.titolo,
    messaggio: row.messaggio,
    icona: row.icona || "📢",
    colore_primario: row.colore_primario || "#3b82f6",
    colore_secondario: row.colore_secondario || "#1e40af",
    tipo: row.tipo || "custom",
    // Default fields
    giorno_inizio: row.giorno_inizio,
    mese_inizio: row.mese_inizio,
    giorno_fine: row.giorno_fine,
    mese_fine: row.mese_fine,
    // Custom fields
    data_inizio: row.data_inizio,
    data_fine: row.data_fine,
    attivo: row.attivo,
    is_system: row.is_system || false,
    autore_id: row.autore_id,
    autore_nome: row.autore_nome
      ? `${row.autore_nome} ${row.autore_cognome || ""}`.trim()
      : null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

// ─────────────────────────────────────────────────────────────
// getAllPops — tutti i POPS (per l'admin)
// ─────────────────────────────────────────────────────────────
exports.getAllPops = async function () {
  const sql = `
    SELECT P.*, U.nome AS autore_nome, U.cognome AS autore_cognome
    FROM POPS P
    LEFT JOIN UTENTI U ON P.autore_id = U.id
    ORDER BY P.is_system DESC, P.created_at DESC
  `;
  return new Promise((resolve, reject) => {
    db.all(sql, (err, rows) => {
      if (err) return reject({ error: "Errore nel recupero dei POPS: " + err.message });
      resolve((rows || []).map(makePopObj));
    });
  });
};

// ─────────────────────────────────────────────────────────────
// getPopsAttivi — POPS attivi oggi (per la homepage)
// ─────────────────────────────────────────────────────────────
exports.getPopsAttivi = async function () {
  // Recupera tutti i pops attivi e filtra lato applicazione
  // (più semplice e portabile rispetto a SQL con logica di data mista)
  const sql = `
    SELECT * FROM POPS WHERE attivo = TRUE ORDER BY id ASC
  `;
  return new Promise((resolve, reject) => {
    db.all(sql, (err, rows) => {
      if (err) return reject({ error: "Errore nel recupero POPS attivi: " + err.message });

      const oggi = new Date();
      const anno = oggi.getFullYear();
      const meseOggi = oggi.getMonth() + 1; // 1-12
      const giornoOggi = oggi.getDate();     // 1-31

      const attivi = (rows || []).filter((row) => {
        if (row.tipo === "default") {
          // Calcola range per l'anno corrente
          if (!row.mese_inizio || !row.giorno_inizio || !row.mese_fine || !row.giorno_fine)
            return false;

          const inizio = new Date(anno, row.mese_inizio - 1, row.giorno_inizio);
          const fine   = new Date(anno, row.mese_fine   - 1, row.giorno_fine);
          fine.setHours(23, 59, 59);

          // Gestisce il caso in cui il range attraversa fine anno (es. 28/12 → 6/1)
          if (inizio <= fine) {
            return oggi >= inizio && oggi <= fine;
          } else {
            // Range cross-year
            const inizioAnnoPrec = new Date(anno - 1, row.mese_inizio - 1, row.giorno_inizio);
            const fineAnnoPrec   = new Date(anno - 1, row.mese_fine   - 1, row.giorno_fine);
            fineAnnoPrec.setHours(23, 59, 59);
            const inizioAnnoSucc = new Date(anno + 1, row.mese_inizio - 1, row.giorno_inizio);
            const fineAnnoSucc   = new Date(anno    , row.mese_fine   - 1, row.giorno_fine);
            fineAnnoSucc.setHours(23, 59, 59);
            return (oggi >= inizioAnnoPrec && oggi <= fineAnnoPrec) ||
                   (oggi >= inizio         && oggi <= fineAnnoSucc);
          }
        }

        if (row.tipo === "custom") {
          if (!row.data_inizio || !row.data_fine) return false;
          const inizio = new Date(row.data_inizio);
          const fine   = new Date(row.data_fine);
          fine.setHours(23, 59, 59);
          return oggi >= inizio && oggi <= fine;
        }

        return false;
      });

      resolve(attivi.map(makePopObj));
    });
  });
};

// ─────────────────────────────────────────────────────────────
// createPop
// ─────────────────────────────────────────────────────────────
exports.createPop = async function (data) {
  const sql = `
    INSERT INTO POPS (
      titolo, messaggio, icona, colore_primario, colore_secondario,
      tipo,
      giorno_inizio, mese_inizio, giorno_fine, mese_fine,
      data_inizio, data_fine,
      attivo, autore_id, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    RETURNING id
  `;
  return new Promise((resolve, reject) => {
    db.run(
      sql,
      [
        data.titolo,
        data.messaggio,
        data.icona || "📢",
        data.colore_primario || "#3b82f6",
        data.colore_secondario || "#1e40af",
        data.tipo || "custom",
        data.giorno_inizio || null,
        data.mese_inizio   || null,
        data.giorno_fine   || null,
        data.mese_fine     || null,
        data.data_inizio   || null,
        data.data_fine     || null,
        data.attivo !== undefined ? data.attivo : true,
        data.autore_id,
      ],
      function (err, result) {
        if (err) return reject({ error: "Errore nella creazione del POP: " + err.message });
        const id = result && result.rows && result.rows[0] ? result.rows[0].id : null;
        resolve({ success: true, id });
      }
    );
  });
};

// ─────────────────────────────────────────────────────────────
// updatePop
// ─────────────────────────────────────────────────────────────
exports.updatePop = async function (id, data) {
  // Protezione: i POPS di sistema non sono modificabili
  const checkSql = "SELECT is_system FROM POPS WHERE id = ?";
  const existing = await new Promise((resolve, reject) => {
    db.get(checkSql, [id], (err, row) => {
      if (err) return reject({ error: "Errore verifica POP: " + err.message });
      resolve(row);
    });
  });
  if (!existing) return Promise.reject({ error: "POP non trovato" });
  if (existing.is_system) return Promise.reject({ error: "I POPS di sistema non sono modificabili" });

  const sql = `
    UPDATE POPS SET
      titolo = ?, messaggio = ?, icona = ?,
      colore_primario = ?, colore_secondario = ?,
      tipo = ?,
      giorno_inizio = ?, mese_inizio = ?, giorno_fine = ?, mese_fine = ?,
      data_inizio = ?, data_fine = ?,
      attivo = ?, updated_at = NOW()
    WHERE id = ?
  `;
  return new Promise((resolve, reject) => {
    db.run(
      sql,
      [
        data.titolo,
        data.messaggio,
        data.icona || "📢",
        data.colore_primario || "#3b82f6",
        data.colore_secondario || "#1e40af",
        data.tipo || "custom",
        data.giorno_inizio || null,
        data.mese_inizio   || null,
        data.giorno_fine   || null,
        data.mese_fine     || null,
        data.data_inizio   || null,
        data.data_fine     || null,
        data.attivo !== undefined ? data.attivo : true,
        id,
      ],
      function (err, result) {
        if (err) return reject({ error: "Errore nell'aggiornamento del POP: " + err.message });
        resolve({ success: true, changes: result ? result.rowCount : 0 });
      }
    );
  });
};

// ─────────────────────────────────────────────────────────────
// deletePop
// ─────────────────────────────────────────────────────────────
exports.deletePop = async function (id) {
  // Protezione: i POPS di sistema non sono eliminabili
  const checkSql = "SELECT is_system FROM POPS WHERE id = ?";
  const existing = await new Promise((resolve, reject) => {
    db.get(checkSql, [id], (err, row) => {
      if (err) return reject({ error: "Errore verifica POP: " + err.message });
      resolve(row);
    });
  });
  if (!existing) return Promise.reject({ error: "POP non trovato" });
  if (existing.is_system) return Promise.reject({ error: "I POPS di sistema non possono essere eliminati" });

  const sql = "DELETE FROM POPS WHERE id = ?";
  return new Promise((resolve, reject) => {
    db.run(sql, [id], function (err, result) {
      if (err) return reject({ error: "Errore nell'eliminazione del POP: " + err.message });
      resolve({ success: true, deleted: result ? result.rowCount : 0 });
    });
  });
};

// ─────────────────────────────────────────────────────────────
// togglePop — attiva / disattiva
// ─────────────────────────────────────────────────────────────
exports.togglePop = async function (id) {
  // Nota: il toggle e' consentito anche sui POPS di sistema (solo attivo/inattivo)
  const sql = `
    UPDATE POPS
    SET attivo = NOT attivo, updated_at = NOW()
    WHERE id = ?
    RETURNING attivo
  `;
  return new Promise((resolve, reject) => {
    db.run(sql, [id], function (err, result) {
      if (err) return reject({ error: "Errore nel toggle del POP: " + err.message });
      const attivo = result && result.rows && result.rows[0]
        ? result.rows[0].attivo
        : null;
      resolve({ success: true, attivo });
    });
  });
};
