'use strict';

/**
 * @fileoverview DAO per la gestione dei dirigenti di squadra e societari
 * Espone metodi per CRUD e restore dei dirigenti
 * @module features/squadre/services/dao-dirigenti-squadre
 */

const sqlite = require('../../../core/config/database');
const DirigenteSquadra = require('../../../core/models/dirigenteSquadra.js');
const moment = require('moment');

const makeDirigenteSquadra = (row) => {
    return new DirigenteSquadra(
        row.id,
        row.utente_id,
        row.squadra_id,
        row.ruolo,
        row.data_nomina,
        row.data_scadenza,
        row.attivo,
        row.created_at,
        row.updated_at
    );
};

/**
 * Ottiene tutti i dirigenti per una squadra
 * @async
 * @param {number} squadraId
 * @returns {Promise<Array<DirigenteSquadra>>}
 */
exports.getDirigentiBySquadra = function(squadraId) {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT ds.*, u.nome, u.cognome, u.email, i.url as immagine
            FROM DIRIGENTI_SQUADRE ds
            JOIN UTENTI u ON ds.utente_id = u.id
            LEFT JOIN IMMAGINI i ON i.entita_riferimento = 'utente' AND i.entita_id = u.id AND (i.ordine = 1 OR i.ordine IS NULL)
            WHERE ds.squadra_id = ? AND ds.attivo = 1
        `;
        sqlite.all(sql, [squadraId], (err, rows) => {
            if (err) {
                return reject({ error: 'Error retrieving dirigenti: ' + err.message });
            }
            resolve(rows.map(makeDirigenteSquadra) || []);
        });
    });
};

/**
 * Ottieni tutti i dirigenti societari (squadra_id NULL)
 * @async
 * @returns {Promise<Array<DirigenteSquadra>>}
 */
exports.getDirigentiSocietari = function() {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT ds.*, u.nome, u.cognome, u.email, i.url as immagine
            FROM DIRIGENTI_SQUADRE ds
            JOIN UTENTI u ON ds.utente_id = u.id
            LEFT JOIN IMMAGINI i ON i.entita_riferimento = 'utente' AND i.entita_id = u.id AND (i.ordine = 1 OR i.ordine IS NULL)
            WHERE ds.squadra_id IS NULL AND ds.attivo = 1
        `;
        sqlite.all(sql, [], (err, rows) => {
            if (err) {
                return reject({ error: 'Error retrieving dirigenti societari: ' + err.message });
            }
            resolve(rows.map(makeDirigenteSquadra) || []);
        });
    });
};

/**
 * Aggiunge un dirigente (associa utente a squadra o societa')
 * @async
 * @param {Object} dirigente - { utente_id, squadra_id, ruolo, data_nomina, data_scadenza, attivo }
 * @returns {Promise<Object>} { id, message }
 */
exports.addDirigente = function(dirigente) {
    return new Promise((resolve, reject) => {
        const sql = `INSERT INTO DIRIGENTI_SQUADRE
            (utente_id, squadra_id, ruolo, data_nomina, data_scadenza, attivo, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
        const now = moment().format('YYYY-MM-DD HH:mm:ss');
        sqlite.run(sql, [
            dirigente.utente_id,
            dirigente.squadra_id || null,
            dirigente.ruolo,
            dirigente.data_nomina || now,
            dirigente.data_scadenza,
            dirigente.attivo || 1,
            now,
            now
        ], function(err) {
            if (err) {
                reject({ error: 'Error adding dirigente: ' + err.message });
            } else {
                resolve({ id: this.lastID, message: 'Dirigente added successfully' });
            }
        });
    });
};

/**
 * Rimuove (soft-delete) un dirigente impostando attivo = 0
 * @async
 * @param {number} id
 * @returns {Promise<Object>} { message }
 */
exports.removeDirigente = function(id) {
    return new Promise((resolve, reject) => {
        const sql = `UPDATE DIRIGENTI_SQUADRE SET attivo = 0, updated_at = ? WHERE id = ?`;
        const now = moment().format('YYYY-MM-DD HH:mm:ss');
        sqlite.run(sql, [now, id], function(err) {
            if (err) {
                reject({ error: 'Error removing dirigente: ' + err.message });
            } else {
                resolve({ message: 'Dirigente removed successfully' });
            }
        });
    });
};

/**
 * Ottieni le informazioni del dirigente associato ad un utente
 * @async
 * @param {number} userId
 * @returns {Promise<Object|null>} Oggetto dirigente o null
 */
exports.getDirigenteByUserId = function (userId) {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT ds.*, s.nome AS squadra_nome, s.id AS squadra_id
            FROM DIRIGENTI_SQUADRE ds
            LEFT JOIN SQUADRE s ON ds.squadra_id = s.id
            WHERE ds.utente_id = ? AND ds.attivo = 1
        `;
        sqlite.get(sql, [userId], (err, dirigente) => {
            if (err) {
                return reject({ error: 'Errore nel recupero del dirigente: ' + err.message });
            }
            resolve(dirigente || null);
        });
    });
};

/**
 * Crea un nuovo record dirigente
 * @async
 * @param {Object} dirigenteData
 * @returns {Promise<Object>} { id, ...dirigenteData }
 */
exports.createDirigente = async (dirigenteData) => {
    const sql = `INSERT INTO DIRIGENTI_SQUADRE (utente_id, squadra_id, ruolo, data_nomina, data_scadenza, attivo, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))`;
    return new Promise((resolve, reject) => {
        sqlite.run(sql, [
            dirigenteData.utente_id,
            dirigenteData.squadra_id,
            dirigenteData.ruolo,
            dirigenteData.data_nomina,
            dirigenteData.data_scadenza
        ], function(err) {
            if (err) {
                return reject({ error: 'Errore creazione dirigente: ' + err.message });
            }
            resolve({ id: this.lastID, ...dirigenteData });
        });
    });
}

/**
 * Aggiorna un dirigente
 * @async
 * @param {number} id
 * @param {Object} dirigenteData
 * @returns {Promise<Object>} { message }
 */
exports.updateDirigente = async (id, dirigenteData) => {
    let sql = `UPDATE DIRIGENTI_SQUADRE SET ruolo = ?, data_nomina = ?, data_scadenza = ?, updated_at = datetime('now')`;
    const params = [dirigenteData.ruolo, dirigenteData.data_nomina, dirigenteData.data_scadenza];
    if (dirigenteData.utente_id) {
        sql += `, utente_id = ?`;
        params.push(dirigenteData.utente_id);
    }
    sql += ` WHERE id = ?`;
    params.push(id);
    return new Promise((resolve, reject) => {
        sqlite.run(sql, params, function(err) {
            if (err) {
                return reject({ error: 'Errore aggiornamento dirigente: ' + err.message });
            }
            if (this.changes === 0) {
                return reject({ error: 'Dirigente non trovato' });
            }
            resolve({ message: 'Dirigente aggiornato' });
        });
    });
}

/**
 * Disattiva un dirigente (soft-delete)
 * @async
 * @param {number} id
 * @returns {Promise<Object>} { message }
 */
exports.deleteDirigente = async (id) => {
    const sql = 'UPDATE DIRIGENTI_SQUADRE SET attivo = 0 WHERE id = ?';
    return new Promise((resolve, reject) => {
        sqlite.run(sql, [id], function(err) {
            if (err) {
                return reject({ error: 'Errore eliminazione dirigente: ' + err.message });
            }
            if (this.changes === 0) {
                return reject({ error: 'Dirigente non trovato' });
            }
            resolve({ message: 'Dirigente eliminato' });
        });
    });
}

/**
 * Ripristina un dirigente (setta attivo = 1)
 * @async
 * @param {number} id
 * @returns {Promise<Object>} { message }
 */
exports.restoreDirigente = function(id) {
    return new Promise((resolve, reject) => {
        const sql = `UPDATE DIRIGENTI_SQUADRE SET attivo = 1, updated_at = ? WHERE id = ?`;
        const now = moment().format('YYYY-MM-DD HH:mm:ss');
        sqlite.run(sql, [now, id], function(err) {
            if (err) {
                return reject({ error: 'Errore ripristino dirigente: ' + err.message });
            }
            if (this.changes === 0) {
                return reject({ error: 'Dirigente non trovato' });
            }
            resolve({ message: 'Dirigente ripristinato' });
        });
    });
}

/**
 * Ripristina tutti i dirigenti (setta attivo = 1 per tutte le righe con attivo = 0)
 * @async
 * @returns {Promise<Object>} { message, changes }
 */
exports.restoreAllDirigenti = function() {
    return new Promise((resolve, reject) => {
        const sql = `UPDATE DIRIGENTI_SQUADRE SET attivo = 1, updated_at = ? WHERE attivo = 0`;
        const now = moment().format('YYYY-MM-DD HH:mm:ss');
        sqlite.run(sql, [now], function(err) {
            if (err) {
                return reject({ error: 'Errore ripristino massivo dirigenti: ' + err.message });
            }
            // this.changes contiene il numero di righe aggiornate
            resolve({ message: 'Ripristino massivo completato', changes: this.changes });
        });
    });
}