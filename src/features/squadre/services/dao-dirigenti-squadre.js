"use strict";

const db = require('../../../core/config/database');
const DirigenteSquadra = require('../../../core/models/dirigenteSquadra.js');
const moment = require('moment');

function makeDirigenteSquadra(row) {
  return new DirigenteSquadra(
    row.id,
    row.utente_id,
    row.squadra_id,
    row.ruolo,
    row.data_nomina,
    row.data_scadenza,
    row.attivo,
    row.created_at,
    row.updated_at,
    // assegna nome, cognome e immagine se presenti nella row
    row.nome || row.utente_nome || null,
    row.cognome || row.utente_cognome || null,
    row.immagine || row.immagine_profilo || null
  );
}

exports.getDirigentiBySquadra = function (squadraId) {
  return new Promise((resolve, reject) => {
    console.log('[dao-dirigenti] getDirigentiBySquadra chiamata con squadraId:', squadraId);
    
    // Prima query di debug: mostra TUTTI i dirigenti nella tabella
    const debugSql = `SELECT id, utente_id, squadra_id, ruolo, attivo FROM DIRIGENTI_SQUADRE LIMIT 10`;
    db.all(debugSql, [], (debugErr, debugRows) => {
      if (!debugErr) {
        console.log('[dao-dirigenti] DEBUG - Tutti i dirigenti in tabella:', JSON.stringify(debugRows, null, 2));
      }
    });
    
    const sql = `
      SELECT ds.*, u.nome, u.cognome, u.email, i.url as immagine
      FROM DIRIGENTI_SQUADRE ds
      JOIN UTENTI u ON ds.utente_id = u.id
      LEFT JOIN IMMAGINI i ON i.entita_riferimento = 'utente' AND i.entita_id = u.id AND (i.ordine = 1 OR i.ordine IS NULL)
      WHERE ds.squadra_id = ? AND ds.attivo = true
    `;
    db.all(sql, [squadraId], (err, rows) => {
      if (err) {
        console.error('[dao-dirigenti] Errore query getDirigentiBySquadra:', err);
        return reject({ error: 'Error retrieving dirigenti: ' + err.message });
      }
      console.log('[dao-dirigenti] Dirigenti trovati per squadra', squadraId, ':', rows ? rows.length : 0);
      if (rows && rows.length > 0) {
        console.log('[dao-dirigenti] Primo dirigente:', JSON.stringify(rows[0], null, 2));
      }
      resolve((rows || []).map(makeDirigenteSquadra));
    });
  });
};

// Restituisce tutti i dirigenti per una squadra, inclusi quelli inattivi (utilizzato da interfacce admin)
exports.getDirigentiBySquadraAll = function (squadraId) {
  return new Promise((resolve, reject) => {
    console.log('[dao-dirigenti] getDirigentiBySquadraAll chiamata con squadraId:', squadraId);
    const sql = `
      SELECT ds.*, u.nome, u.cognome, u.email, i.url as immagine
      FROM DIRIGENTI_SQUADRE ds
      JOIN UTENTI u ON ds.utente_id = u.id
      LEFT JOIN IMMAGINI i ON i.entita_riferimento = 'utente' AND i.entita_id = u.id AND (i.ordine = 1 OR i.ordine IS NULL)
      WHERE ds.squadra_id = ?
    `;
    db.all(sql, [squadraId], (err, rows) => {
      if (err) {
        console.error('[dao-dirigenti] Errore query getDirigentiBySquadraAll:', err);
        return reject({ error: 'Error retrieving dirigenti: ' + err.message });
      }
      console.log('[dao-dirigenti] (ALL) Dirigenti trovati per squadra', squadraId, ':', rows ? rows.length : 0);
      resolve((rows || []).map(makeDirigenteSquadra));
    });
  });
};

exports.getDirigentiSocietari = function () {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT ds.*, u.nome, u.cognome, u.email, i.url as immagine
      FROM DIRIGENTI_SQUADRE ds
      JOIN UTENTI u ON ds.utente_id = u.id
      LEFT JOIN IMMAGINI i ON i.entita_riferimento = 'utente' AND i.entita_id = u.id AND (i.ordine = 1 OR i.ordine IS NULL)
      WHERE ds.squadra_id IS NULL AND ds.attivo = true
    `;
    db.all(sql, [], (err, rows) => {
      if (err) return reject({ error: 'Error retrieving dirigenti societari: ' + err.message });
      resolve((rows || []).map(makeDirigenteSquadra));
    });
  });
};

exports.addDirigente = function (dirigente) {
  return new Promise((resolve, reject) => {
    const utente_id = dirigente.utente_id ? parseInt(dirigente.utente_id, 10) : null;
    const squadra_id = dirigente.squadra_id ? parseInt(dirigente.squadra_id, 10) : null;
    const ruolo = dirigente.ruolo || 'Dirigente';
    const now = moment().format('YYYY-MM-DD HH:mm:ss');

    if (!utente_id || !Number.isInteger(utente_id)) return reject({ error: 'utente_id non valido' });

    // Prima controlla se esiste già un record (attivo o inattivo)
    const checkSql = `
      SELECT id, attivo 
      FROM DIRIGENTI_SQUADRE 
      WHERE utente_id = ? AND squadra_id = ? AND ruolo = ?
    `;
    
    db.get(checkSql, [utente_id, squadra_id || null, ruolo], (checkErr, existing) => {
      if (checkErr) {
        return reject({ error: 'Errore controllo dirigente esistente: ' + checkErr.message });
      }

      // Se esiste già ed è attivo → errore
      if (existing && existing.attivo) {
        return reject({ error: 'Questo utente è già dirigente attivo per questa squadra con lo stesso ruolo' });
      }

      // Se esiste ma è inattivo → riattiva
      if (existing && !existing.attivo) {
        const reactivateSql = `
          UPDATE DIRIGENTI_SQUADRE 
          SET attivo = true, 
              data_nomina = ?,
              data_scadenza = ?,
              updated_at = NOW()
          WHERE id = ?
          RETURNING id
        `;
        return db.run(reactivateSql, [
          dirigente.data_nomina || now,
          dirigente.data_scadenza || null,
          existing.id
        ], function(reactivateErr, reactivateResult) {
          if (reactivateErr) {
            return reject({ error: 'Errore riattivazione dirigente: ' + reactivateErr.message });
          }
          console.log('[dao-dirigenti] Dirigente riattivato:', existing.id);
          resolve({ id: existing.id, message: 'Dirigente riattivato con successo' });
        });
      }

      // Se non esiste → crea nuovo
      const insertSql = `
        INSERT INTO DIRIGENTI_SQUADRE (utente_id, squadra_id, ruolo, data_nomina, data_scadenza, attivo, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id
      `;

      db.run(insertSql, [
          utente_id,
          squadra_id || null,
          ruolo,
          dirigente.data_nomina || now,
          dirigente.data_scadenza || null,
          true,
          now,
          now
        ], function (insertErr, insertResult) {
          if (insertErr) {
            const msg = insertErr && insertErr.message ? insertErr.message : String(insertErr);
            if (msg.includes('duplicate key') || msg.includes('UNIQUE') || (insertErr.code && insertErr.code === '23505')) {
              return reject({ error: 'Questo utente è già dirigente per questa squadra con lo stesso ruolo' });
            }
            return reject({ error: 'Error adding dirigente: ' + msg });
          }
          const insertedId = insertResult && insertResult.rows && insertResult.rows[0] && insertResult.rows[0].id ? insertResult.rows[0].id : null;
          console.log('[dao-dirigenti] Nuovo dirigente creato:', insertedId);
          resolve({ id: insertedId, message: 'Dirigente added successfully' });
        }
      );
    });
  });
};

exports.removeDirigente = function (id) {
  return new Promise((resolve, reject) => {
    const sql = `UPDATE DIRIGENTI_SQUADRE SET attivo = false, updated_at = NOW() WHERE id = ?`;
    db.run(sql, [id], function (err, result) {
      if (err) return reject({ error: 'Error removing dirigente: ' + err.message });
      const changes = (result && typeof result.rowCount === 'number') ? result.rowCount : (this && typeof this.changes === 'number' ? this.changes : 0);
      if (changes === 0) return reject({ error: 'Dirigente non trovato' });
      resolve({ message: 'Dirigente removed successfully' });
    });
  });
};

exports.getDirigenteByUserId = function (userId) {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT ds.*, s.nome AS squadra_nome, s.id AS squadra_id
      FROM DIRIGENTI_SQUADRE ds
      LEFT JOIN SQUADRE s ON ds.squadra_id = s.id
      WHERE ds.utente_id = ? AND ds.attivo = true
    `;
    db.all(sql, [userId], (err, dirigenti) => {
      if (err) return reject({ error: 'Errore nel recupero del dirigente: ' + err.message });
      resolve(dirigenti || []);
    });
  });
};

exports.createDirigente = async (dirigenteData) => {
  const sql = `INSERT INTO DIRIGENTI_SQUADRE (utente_id, squadra_id, ruolo, data_nomina, data_scadenza, attivo, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, true, NOW(), NOW())
                 RETURNING id`;
  return new Promise((resolve, reject) => {
    db.run(sql, [
        dirigenteData.utente_id,
        dirigenteData.squadra_id,
        dirigenteData.ruolo,
        dirigenteData.data_nomina,
        dirigenteData.data_scadenza
      ], function (err, result) {
        if (err) return reject({ error: 'Errore creazione dirigente: ' + err.message });
        resolve({ id: result.rows[0].id, ...dirigenteData });
      }
    );
  });
};

exports.updateDirigente = async (id, dirigenteData) => {
  let sql = `UPDATE DIRIGENTI_SQUADRE SET ruolo = ?, data_nomina = ?, data_scadenza = ?, updated_at = NOW()`;
  const params = [dirigenteData.ruolo, dirigenteData.data_nomina, dirigenteData.data_scadenza];
  if (dirigenteData.utente_id) {
    sql += `, utente_id = ?`;
    params.push(dirigenteData.utente_id);
  }
  sql += ` WHERE id = ?`;
  params.push(id);
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err, result) {
      if (err) return reject({ error: 'Errore aggiornamento dirigente: ' + err.message });
      const changes = (result && typeof result.rowCount === 'number') ? result.rowCount : (this && typeof this.changes === 'number' ? this.changes : 0);
      if (changes === 0) return reject({ error: 'Dirigente non trovato' });
      resolve({ message: 'Dirigente aggiornato' });
    });
  });
};

exports.restoreDirigente = function (id) {
  return new Promise((resolve, reject) => {
    const sql = `UPDATE DIRIGENTI_SQUADRE SET attivo = true, updated_at = NOW() WHERE id = ?`;
    db.run(sql, [id], function (err, result) {
      if (err) return reject({ error: 'Errore ripristino dirigente: ' + err.message });
      const changes = (result && typeof result.rowCount === 'number') ? result.rowCount : (this && typeof this.changes === 'number' ? this.changes : 0);
      if (changes === 0) return reject({ error: 'Dirigente non trovato' });
      resolve({ message: 'Dirigente ripristinato' });
    });
  });
};

exports.restoreAllDirigenti = function () {
  return new Promise((resolve, reject) => {
    const sql = `UPDATE DIRIGENTI_SQUADRE SET attivo = true, updated_at = NOW() WHERE attivo = false`;
    db.run(sql, [], function (err, result) {
      if (err) return reject({ error: 'Errore ripristino massivo dirigenti: ' + err.message });
      const changes = (result && typeof result.rowCount === 'number') ? result.rowCount : (this && typeof this.changes === 'number' ? this.changes : 0);
      resolve({ message: 'Ripristino massivo completato', changes });
    });
  });
};

module.exports = exports;