'use strict';

const sqlite = require('../db.js');
const DirigenteSquadra = require('../model/dirigenteSquadra.js');
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

// Ottieni tutti i dirigenti per una squadra
exports.getDirigentiBySquadra = function(squadraId) {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT ds.*, u.nome, u.cognome, u.email
            FROM DIRIGENTI_SQUADRE ds
            JOIN UTENTI u ON ds.utente_id = u.id
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

// Ottieni tutti i dirigenti societari (squadra_id NULL)
exports.getDirigentiSocietari = function() {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT ds.*, u.nome, u.cognome, u.email
            FROM DIRIGENTI_SQUADRE ds
            JOIN UTENTI u ON ds.utente_id = u.id
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

// Aggiungi un dirigente a una squadra
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

// Rimuovi un dirigente (imposta attivo = 0)
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

// Ottieni le informazioni del dirigente associato all'utente
exports.getDirigenteByUserId = function (userId) {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT ds.*, s.nome AS squadra_nome
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