'use strict';

const sqlite = require('../db.js');
const Campo = require('../model/campo.js');

const makeCampo = (row) => {
    return new Campo(
        row.id,
        row.nome,
        row.indirizzo,
        row.tipo_superficie,
        row.dimensioni,
        row.illuminazione,
        row.coperto,
        row.spogliatoi,
        row.capienza_pubblico,
        row.attivo,
        row.created_at,
        row.updated_at,
        row.descrizione,
        row.Docce
    );
}

exports.getCampi = function(){
    const sql = 'SELECT * FROM CAMPI WHERE attivo = 1';
    return new Promise((resolve, reject) => {
        sqlite.all(sql, (err, campi) => {
            if (err) {
                console.error('Errore SQL get campi:', err);
                return reject({ error: 'Error retrieving fields: ' + err.message });
            }
            resolve(campi.map(makeCampo) || []);
        });
    });
}

exports.getCampoById = function(id) {
    const sql = 'SELECT * FROM CAMPI WHERE id = ?';
    return new Promise((resolve, reject) => {
        sqlite.get(sql, [id], (err, campo) => {
            if (err) {
                console.error('Errore SQL get campo by id:', err);
                return reject({ error: 'Error retrieving field: ' + err.message });
            }
            if (!campo) {
                return reject({ error: 'Field not found' });
            }
            resolve(makeCampo(campo));
        });
    });
}

exports.getOrariCampo = function(campoId, giornoSettimana = null) {
    let sql;
    const params = [campoId];
    if (giornoSettimana !== null) {
        // Prima cerca orari specifici per il giorno, se non ci sono usa default
        sql = `
            SELECT * FROM ORARI_CAMPI 
            WHERE campo_id = ? AND attivo = 1 
            AND (giorno_settimana = ? OR (giorno_settimana IS NULL AND NOT EXISTS (
                SELECT 1 FROM ORARI_CAMPI 
                WHERE campo_id = ? AND giorno_settimana = ? AND attivo = 1
            )))
            ORDER BY ora_inizio
        `;
        params.push(giornoSettimana, campoId, giornoSettimana);
    } else {
        sql = 'SELECT * FROM ORARI_CAMPI WHERE campo_id = ? AND giorno_settimana IS NULL AND attivo = 1 ORDER BY ora_inizio';
    }
    return new Promise((resolve, reject) => {
        sqlite.all(sql, params, (err, orari) => {
            if (err) {
                console.error('Errore SQL get orari campo:', err);
                return reject({ error: 'Error retrieving orari: ' + err.message });
            }
            resolve(orari || []);
        });
    });
}

exports.addOrarioCampo = function(campoId, giornoSettimana, oraInizio, oraFine) {
    const sql = 'INSERT INTO ORARI_CAMPI (campo_id, giorno_settimana, ora_inizio, ora_fine, attivo, created_at, updated_at) VALUES (?, ?, ?, ?, 1, datetime("now"), datetime("now"))';
    return new Promise((resolve, reject) => {
        sqlite.run(sql, [campoId, giornoSettimana, oraInizio, oraFine], function(err) {
            if (err) {
                console.error('Errore SQL add orario campo:', err);
                return reject({ error: 'Error adding orario: ' + err.message });
            }
            resolve({ success: true, id: this.lastID });
        });
    });
}

exports.updateOrarioCampo = function(id, oraInizio, oraFine, attivo) {
    const sql = 'UPDATE ORARI_CAMPI SET ora_inizio = ?, ora_fine = ?, attivo = ?, updated_at = datetime("now") WHERE id = ?';
    return new Promise((resolve, reject) => {
        sqlite.run(sql, [oraInizio, oraFine, attivo, id], function(err) {
            if (err) {
                console.error('Errore SQL update orario campo:', err);
                return reject({ error: 'Error updating orario: ' + err.message });
            }
            resolve({ success: true, changes: this.changes });
        });
    });
}

exports.deleteOrarioCampo = function(id) {
    const sql = 'DELETE FROM ORARI_CAMPI WHERE id = ?';
    return new Promise((resolve, reject) => {
        sqlite.run(sql, [id], function(err) {
            if (err) {
                console.error('Errore SQL delete orario campo:', err);
                return reject({ error: 'Error deleting orario: ' + err.message });
            }
            resolve({ success: true, changes: this.changes });
        });
    });
}

exports.createCampo = function(campoData) {
    const sql = `INSERT INTO CAMPI (
        nome, indirizzo, tipo_superficie, dimensioni, illuminazione, coperto, 
        spogliatoi, capienza_pubblico, attivo, created_at, updated_at, descrizione, Docce
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'), ?, ?)`;
    return new Promise((resolve, reject) => {
        sqlite.run(sql, [
            campoData.nome,
            campoData.indirizzo,
            campoData.tipo_superficie,
            campoData.dimensioni,
            campoData.illuminazione ? 1 : 0,
            campoData.coperto ? 1 : 0,
            campoData.spogliatoi ? 1 : 0,
            campoData.capienza_pubblico,
            campoData.attivo ? 1 : 0,
            campoData.descrizione,
            campoData.Docce ? 1 : 0
        ], function(err) {
            if (err) {
                console.error('Errore SQL create campo:', err);
                return reject({ error: 'Error creating campo: ' + err.message });
            }
            resolve({ success: true, id: this.lastID });
        });
    });
}