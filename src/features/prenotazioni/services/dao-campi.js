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
        row.immagine_url || '/images/campo-default.jpg'
    );
}

/**
 * Funzione per recuperare tutti i campi attivi
 * @returns {Promise} Risolve con un array di oggetti Campo o rifiuta con un errore
 */
exports.getCampi = function(){
    const sql = `
        SELECT C.id, C.nome, C.indirizzo, C.tipo_superficie, C.dimensioni, C.illuminazione, C.coperto, C.spogliatoi, C.capienza_pubblico, C.attivo, C.created_at, C.updated_at, C.descrizione, C.Docce, I.url as immagine_url, I.id as immagine_id
        FROM CAMPI C
        LEFT JOIN IMMAGINI I ON I.entita_riferimento = 'Campo' AND I.entita_id = C.id AND I.ordine = 1
        WHERE C.attivo = 1
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
 * azione per recuperare un campo tramite id
 * @param {*} id id del campo 
 * @returns {Promise} Risolve con un oggetto Campo o rifiuta con un errore
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
 * Funzione per recuperare gli orari di un campo
 * @param {*} campoId id del campo
 * @param {*} giornoSettimana giorno della settimana
 * @returns {Promise} Risolve con un array di orari o rifiuta con un errore
 */
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

/**
 * Funzione per aggiungere un orario a un campo
 * @param {*} campoId campo a cui aggiungere l'orario
 * @param {*} giornoSettimana giorno della settimana
 * @param {*} oraInizio ora di inizio
 * @param {*} oraFine ora di fine
 * @returns {Promise} Risolve con un oggetto di successo o rifiuta con un errore
 */
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


/**
 * Funzione per aggiornare un orario di un campo
 * @param {*} id id dell'orario del campo da aggiornare
 * @param {*} oraInizio nuova ora di inizio
 * @param {*} oraFine nuova ora di fine
 * @param {*} attivo stato attivo/inattivo
 * @returns {Promise} Risolve con un oggetto di successo o rifiuta con un errore
 */
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

/**
 * Funzione per eliminare un orario di un campo
 * @param {*} id id dell'orario del campo da eliminare
 * @returns {Promise} Risolve con un oggetto di successo o rifiuta con un errore
 */
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

/**
 * Funzione per creare un nuovo campo
 * @param {*} campoData dati del campo da creare
 * @returns {Promise} Risolve con un oggetto di successo o rifiuta con un errore
 */
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

/**
 * funzione per aggiornare un campo
 * @param {*} id id del campo da aggiornare
 * @param {*} campoData Informazioni aggiornate del campo (solo i campi da aggiornare)
 * @returns {Promise} Risolve con un oggetto di successo o rifiuta con un errore
 */
exports.updateCampo = function(id, campoData) {
    const fields = Object.keys(campoData);
    if (fields.length === 0) {
        return Promise.resolve({ success: true, changes: 0 });
    }
    
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => {
        if (typeof campoData[field] === 'boolean') {
            return campoData[field] ? 1 : 0;
        }
        return campoData[field];
    });
    values.push(id);
    
    const sql = `UPDATE CAMPI SET ${setClause}, updated_at = datetime('now') WHERE id = ?`;
    return new Promise((resolve, reject) => {
        sqlite.run(sql, values, function(err) {
            if (err) {
                console.error('Errore SQL update campo:', err);
                return reject({ error: 'Error updating campo: ' + err.message });
            }
            resolve({ success: true, changes: this.changes });
        });
    });
}

/**
 * Funzione per eliminare un campo
 * @param {*} id id del campo da eliminare
 * @returns {Promise} Risolve con un oggetto di successo o rifiuta con un errore
 */
exports.deleteCampo=function(id){
    const sql='DELETE FROM CAMPI WHERE id=?';
    return new Promise((resolve,reject)=>{
        sqlite.run(sql,[id],function(err){
            if(err){
                console.error('Errore SQL delete campo:',err);
                return reject({error:'Error deleting campo: '+err.message});
            }
            resolve({success:true,changes:this.changes});
        });
    });
}

/**
 * Funzione per cercare campi
 * @param {*} searchTerm termine di ricerca
 * @returns {Promise} Risolve con un array di oggetti Campo o rifiuta con un errore
 */
exports.searchCampi = async function(searchTerm) {
    const sql = `
        SELECT C.id, C.nome, C.indirizzo, C.tipo_superficie, C.dimensioni, C.illuminazione, C.coperto, C.spogliatoi, C.capienza_pubblico, C.attivo, C.created_at, C.updated_at, C.descrizione, C.Docce, I.url as immagine_url, I.id as immagine_id
        FROM CAMPI C
        LEFT JOIN IMMAGINI I ON I.entita_riferimento = 'Campo' AND I.entita_id = C.id AND I.ordine = 1
        WHERE C.attivo = 1 AND (C.nome LIKE ? OR C.indirizzo LIKE ? OR C.descrizione LIKE ?)
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