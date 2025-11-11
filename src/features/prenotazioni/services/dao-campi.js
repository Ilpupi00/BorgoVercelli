/**
 * @fileoverview DAO per la gestione dei campi e dei relativi orari
 * Fornisce funzioni per recupero campi, orari, creazione/aggiornamento e ricerca
 * @module features/prenotazioni/services/dao-campi
 */

'use strict';

const sqlite = require('../../../core/config/database');
const Campo = require('../../../core/models/campo.js');


/**
 * Funzione di mapping da riga SQL a oggetto Campo
 * @param {*} row riga SQL
 * @returns {Object} oggetto Campo come plain object
 */
const makeCampo = (row) => {
    return new Campo(
        row.id,
        String(row.nome || ''),
        String(row.indirizzo || ''),
        String(row.tipo_superficie || ''),
        row.dimensioni || '',
        row.illuminazione,
        row.coperto,
        row.spogliatoi,
        row.capienza_pubblico,
        row.attivo,
        row.created_at ? require('moment')(row.created_at).format('YYYY-MM-DD HH:mm:ss') : null,
        row.updated_at ? require('moment')(row.updated_at).format('YYYY-MM-DD HH:mm:ss') : null,
        row.descrizione,
        row.Docce,
        row.immagine_url || '/assets/images/Campo.png'
    );
}

/**
 * Recupera tutti i campi attivi (con immagine principale se presente)
 * @async
 * @returns {Promise<Array<Campo>>}
 */
exports.getCampi = function(){
    const sql = `
        SELECT C.id, C.nome, C.indirizzo, C.tipo_superficie, C.dimensioni, C.illuminazione, C.coperto, C.spogliatoi, C.capienza_pubblico, C.attivo, C.created_at, C.updated_at, C.descrizione, C.Docce, I.url as immagine_url, I.id as immagine_id
        FROM CAMPI C
        LEFT JOIN IMMAGINI I ON I.entita_riferimento = 'Campo' AND I.entita_id = C.id AND I.ordine = 1
        WHERE C.attivo = true
    `;
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

/**
 * Recupera un campo per ID
 * @async
 * @param {number} id
 * @returns {Promise<Campo>} Istanza Campo
 */
exports.getCampoById = function(id) {
    const sql = `
        SELECT C.id, C.nome, C.indirizzo, C.tipo_superficie, C.dimensioni, C.illuminazione, C.coperto, C.spogliatoi, C.capienza_pubblico, C.attivo, C.created_at, C.updated_at, C.descrizione, C.Docce, I.url as immagine_url, I.id as immagine_id
        FROM CAMPI C
        LEFT JOIN IMMAGINI I ON I.entita_riferimento = 'Campo' AND I.entita_id = C.id AND I.ordine = 1
        WHERE C.id = ?
    `;
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

/**
 * Recupera gli orari di un campo. Se `giornoSettimana` è fornito cerca orari specifici,
 * altrimenti restituisce la schedule default (giorno_settimana IS NULL)
 * @async
 * @param {number} campoId
 * @param {number|null} [giornoSettimana]
 * @returns {Promise<Array<Object>>} Array di righe ORARI_CAMPI
 */
exports.getOrariCampo = function(campoId, giornoSettimana = null) {
    let sql;
    const params = [campoId];
    if (giornoSettimana !== null) {
        // Prima cerca orari specifici per il giorno, se non ci sono usa default
        sql = `
            SELECT * FROM ORARI_CAMPI 
            WHERE campo_id = ? AND attivo = true 
            AND (giorno_settimana = ? OR (giorno_settimana IS NULL AND NOT EXISTS (
                SELECT 1 FROM ORARI_CAMPI 
                WHERE campo_id = ? AND giorno_settimana = ? AND attivo = true
            )))
            ORDER BY ora_inizio
        `;
        params.push(giornoSettimana, campoId, giornoSettimana);
    } else {
        sql = 'SELECT * FROM ORARI_CAMPI WHERE campo_id = ? AND giorno_settimana IS NULL AND attivo = true ORDER BY ora_inizio';
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

/**
 * Aggiunge un orario per un campo
 * @async
 * @param {number} campoId
 * @param {number|null} giornoSettimana
 * @param {string} oraInizio - HH:mm
 * @param {string} oraFine - HH:mm
 * @returns {Promise<Object>} { success: true, id }
 */
exports.addOrarioCampo = function(campoId, giornoSettimana, oraInizio, oraFine) {
    const sql = 'INSERT INTO ORARI_CAMPI (campo_id, giorno_settimana, ora_inizio, ora_fine, attivo, created_at, updated_at) VALUES (?, ?, ?, ?, true, NOW(), NOW()) RETURNING id';
    return new Promise((resolve, reject) => {
        sqlite.run(sql, [campoId, giornoSettimana, oraInizio, oraFine], function(err, result) {
            if (err) {
                console.error('Errore SQL add orario campo:', err);
                return reject(new Error('Error adding orario: ' + err.message));
            }
            resolve({ success: true, id: result.rows[0].id });
        });
    });
}


/**
 * Aggiorna un orario campo
 * @async
 * @param {number} id
 * @param {string} oraInizio
 * @param {string} oraFine
 * @param {number|boolean} attivo
 * @returns {Promise<Object>} { success: true, changes }
 */
exports.updateOrarioCampo = function(id, oraInizio, oraFine, attivo) {
    const sql = 'UPDATE ORARI_CAMPI SET ora_inizio = ?, ora_fine = ?, attivo = ?, updated_at = NOW() WHERE id = ?';
    return new Promise((resolve, reject) => {
        sqlite.run(sql, [oraInizio, oraFine, attivo ? true : false, id], function(err, result) {
            if (err) {
                console.error('Errore SQL update orario campo:', err);
                return reject({ error: 'Error updating orario: ' + err.message });
            }
            // result.rowCount contains number of affected rows for Postgres wrapper
            const changes = (result && typeof result.rowCount === 'number') ? result.rowCount : 0;
            resolve({ success: true, changes });
        });
    });
}

/**
 * Elimina un orario di campo per ID
 * @async
 * @param {number} id
 * @returns {Promise<Object>} { success: true, changes }
 */
exports.deleteOrarioCampo = function(id) {
    const sql = 'DELETE FROM ORARI_CAMPI WHERE id = ?';
    return new Promise((resolve, reject) => {
        sqlite.run(sql, [id], function(err, result) {
            if (err) {
                console.error('Errore SQL delete orario campo:', err);
                return reject({ error: 'Error deleting orario: ' + err.message });
            }
            const changes = (result && typeof result.rowCount === 'number') ? result.rowCount : 0;
            resolve({ success: true, changes });
        });
    });
}

/**
 * Crea un nuovo campo
 * @async
 * @param {Object} campoData
 * @returns {Promise<Object>} { success: true, id }
 */
exports.createCampo = function(campoData) {
    const sql = `INSERT INTO CAMPI (
        nome, indirizzo, tipo_superficie, dimensioni, illuminazione, coperto, 
        spogliatoi, capienza_pubblico, attivo, created_at, updated_at, descrizione, Docce
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), ?, ?)
    RETURNING id`;
    return new Promise((resolve, reject) => {
        sqlite.run(sql, [
            campoData.nome,
            campoData.indirizzo,
            campoData.tipo_superficie,
            campoData.dimensioni,
            campoData.illuminazione ? true : false,
            campoData.coperto ? true : false,
            campoData.spogliatoi ? true : false,
            campoData.capienza_pubblico,
            campoData.attivo ? true : false,
            campoData.descrizione,
            campoData.Docce ? true : false
        ], function(err, result) {
            if (err) {
                console.error('Errore SQL create campo:', err);
                return reject({ error: 'Error creating campo: ' + err.message });
            }
            resolve({ success: true, id: result.rows[0].id });
        });
    });
}

/**
 * Aggiorna i campi forniti di un campo (patch-like)
 * @async
 * @param {number} id
 * @param {Object} campoData
 * @returns {Promise<Object>} { success: true, changes }
 */
exports.updateCampo = function(id, campoData) {
    const fields = Object.keys(campoData);
    if (fields.length === 0) {
        return Promise.resolve({ success: true, changes: 0 });
    }
    
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => {
        if (typeof campoData[field] === 'boolean') {
            return campoData[field] ? true : false;
        }
        return campoData[field];
    });
    values.push(id);
    
    const sql = `UPDATE CAMPI SET ${setClause}, updated_at = NOW() WHERE id = ?`;
    return new Promise((resolve, reject) => {
        sqlite.run(sql, values, function(err, result) {
            if (err) {
                console.error('Errore SQL update campo:', err);
                return reject({ error: 'Error updating campo: ' + err.message });
            }
            const changes = (result && typeof result.rowCount === 'number') ? result.rowCount : 0;
            resolve({ success: true, changes });
        });
    });
}

/**
 * Elimina un campo per ID
 * @async
 * @param {number} id
 * @returns {Promise<Object>} { success: true, changes }
 */
exports.deleteCampo=function(id){
    const sql='DELETE FROM CAMPI WHERE id=?';
    return new Promise((resolve,reject)=>{
        sqlite.run(sql,[id],function(err, result){
            if(err){
                console.error('Errore SQL delete campo:',err);
                return reject({error:'Error deleting campo: '+err.message});
            }
            const changes = (result && typeof result.rowCount === 'number') ? result.rowCount : 0;
            resolve({success:true,changes});
        });
    });
}

/**
 * Cerca campi attivi per nome/indirizzo/descrizione (autocomplete)
 * @async
 * @param {string} searchTerm - Term con % per LIKE
 * @returns {Promise<Array<Campo>>}
 */
exports.searchCampi = async function(searchTerm) {
    const sql = `
        SELECT C.id, C.nome, C.indirizzo, C.tipo_superficie, C.dimensioni, C.illuminazione, C.coperto, C.spogliatoi, C.capienza_pubblico, C.attivo, C.created_at, C.updated_at, C.descrizione, C.Docce, I.url as immagine_url, I.id as immagine_id
        FROM CAMPI C
        LEFT JOIN IMMAGINI I ON I.entita_riferimento = 'Campo' AND I.entita_id = C.id AND I.ordine = 1
        WHERE C.attivo = true AND (C.nome LIKE ? OR C.indirizzo LIKE ? OR C.descrizione LIKE ?)
        ORDER BY C.nome ASC
        LIMIT 10
    `;
    return new Promise((resolve, reject) => {
        sqlite.all(sql, [searchTerm, searchTerm, searchTerm], (err, campi) => {
            if (err) {
                console.error('Errore SQL search campi:', err);
                return reject({ error: 'Error searching fields: ' + err.message });
            }
            resolve(campi.map(makeCampo) || []);
        });
    });
}