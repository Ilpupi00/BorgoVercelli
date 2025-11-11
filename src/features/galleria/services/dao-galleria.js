'use strict';

/**
 * @fileoverview DAO per la galleria immagini
 * Fornisce funzioni per upload, recupero, update e cancellazione immagini
 * @module features/galleria/services/dao-galleria
 */

const db= require('../../../core/config/database');
const Immagine = require('../../../core/models/immagine.js');

const makeImmagine=(row)=>{
    // Normalize URL: ensure it is an absolute public path that starts with '/'
    let url = row.url || '';
    // Trim whitespace
    url = url.trim();
    // If url stored like 'src/public/uploads/...' or 'uploads/...' make it absolute '/uploads/...'
    if (url.startsWith('src/public/uploads/')) {
        url = '/' + url.slice('src/public/'.length);
    } else if (!url.startsWith('/') && url.length > 0) {
        // If it's e.g. 'uploads/..' or other relative path, prefix '/'
        url = '/' + url;
    }

    return new Immagine(
        row.id,
        row.descrizione,
        url,
        row.tipo,
        row.entita_riferimento,
        row.entita_id,
        row.ordine,
        row.created_at,
        row.updated_at
    );
}

/**
 * Recupera le immagini di tipo 'upload della Galleria'
 * @async
 * @returns {Promise<Array<Immagine>>}
 */
exports.getImmagini = function() {
    const sql = "SELECT * FROM IMMAGINI WHERE tipo = 'upload della Galleria';";
    return new Promise((resolve, reject) => {
        db.all(sql, (err, immagini) => {
            if (err) {
                console.error('Errore SQL:', err);
                return reject({ error: 'Errore nel recupero delle immagini: ' + err.message });
            }
            resolve(immagini.map(makeImmagine) || []);
        });
    });
}

/**
 * Recupera un'immagine per ID
 * @async
 * @param {number} id
 * @returns {Promise<Immagine|null>}
 */
exports.getImmagineById = function(id) {
    const sql = 'SELECT * FROM IMMAGINI WHERE id = ? LIMIT 1;';
    return new Promise((resolve, reject) => {
        db.get(sql, [parseInt(id)], (err, row) => {
            if (err) {
                console.error('Errore SQL getImmagineById:', err);
                return reject({ error: 'Errore nel recupero dell\'immagine: ' + err.message });
            }
            if (!row) return resolve(null);
            resolve(makeImmagine(row));
        });
    });
}

/**
 * Inserisce un record immagine (usato per upload esterni)
 * @async
 * @param {string} url
 * @param {string} created_at
 * @param {string} updated_at
 * @param {string} [descrizione]
 * @returns {Promise<Object>} { id }
 */
exports.insertImmagine = function( url, created_at, updated_at, descrizione = '') {
    const sql = 'INSERT INTO IMMAGINI (url, tipo, descrizione, created_at, updated_at) VALUES (?, ?, ?, ?, ?) RETURNING id;';
    return new Promise((resolve, reject) => {
        db.run(sql, [url, 'upload della Galleria', descrizione, created_at, updated_at], function(err, result) {
            if (err) {
                console.error('Errore SQL insert:', err);
                return reject({ error: 'Errore nell\'inserimento dell\'immagine: ' + err.message });
            }
            // In Postgres con RETURNING, il risultato è in result.rows[0]
            const insertId = result && result.rows && result.rows[0] ? result.rows[0].id : null;
            resolve({ id: insertId });
        });
    });
}

/**
 * Aggiorna la descrizione di un'immagine
 * @async
 * @param {number} id
 * @param {string} descrizione
 * @returns {Promise<Object>} { message }
 */
exports.updateImmagine = function(id, descrizione) {
    const sql = 'UPDATE IMMAGINI SET descrizione = ?, updated_at = ? WHERE id = ?;';
    return new Promise((resolve, reject) => {
        const now = new Date().toISOString();
        db.run(sql, [descrizione, now, parseInt(id)], function(err) {
            if (err) {
                console.error('Errore SQL update:', err);
                return reject({ error: 'Errore nell\'aggiornamento dell\'immagine: ' + err.message });
            }
            if (this.changes === 0) {
                return reject({ error: 'Immagine non trovata' });
            }
            resolve({ message: 'Immagine aggiornata con successo' });
        });
    });
}

/**
 * Elimina un'immagine: rimuove file fisico (se presente) e cancella record DB
 * @async
 * @param {number} id
 * @returns {Promise<Object>} { message }
 */
exports.deleteImmagine = function(id) {
    return new Promise((resolve, reject) => {
        // Prima recupero l'URL dell'immagine
        const selectSql = 'SELECT url FROM IMMAGINI WHERE id = ?;';
        db.get(selectSql, [parseInt(id)], (err, row) => {
            if (err) {
                console.error('Errore SQL select:', err);
                return reject({ error: 'Errore nel recupero dell\'immagine: ' + err.message });
            }
            if (!row) {
                return reject({ error: 'Immagine non trovata' });
            }

            // Elimino il file fisico se esiste
            const fs = require('fs');
            const path = require('path');
            // row.url may be stored with or without a leading slash. Normalize to a relative path
            const relativeUrl = row.url && row.url.startsWith('/') ? row.url.slice(1) : row.url;
            const filePath = path.join(__dirname, '../public', relativeUrl);
            if (fs.existsSync(filePath)) {
                try {
                    fs.unlinkSync(filePath);
                    console.log('File eliminato:', filePath);
                } catch (fileErr) {
                    console.error('Errore nell\'eliminazione del file:', fileErr);
                    // Non blocco l'eliminazione dal DB se fallisce l'eliminazione del file
                }
            }

            // Poi elimino dal database
            const deleteSql = 'DELETE FROM IMMAGINI WHERE id = ?;';
            db.run(deleteSql, [parseInt(id)], function(err) {
                if (err) {
                    console.error('Errore SQL delete:', err);
                    return reject({ error: 'Errore nella cancellazione dell\'immagine: ' + err.message });
                }
                if (this.changes === 0) {
                    return reject({ error: 'Immagine non trovata' });
                }
                resolve({ message: 'Immagine cancellata con successo' });
            });
        });
    });
}

/**
 * Inserisce un'immagine a seguito di upload (riceve oggetto file di multer)
 * Restituisce il nuovo ID immagine
 * @async
 * @param {Object} file - Oggetto file (es. multer) con proprietà filename
 * @param {string} tipo - Tipo di immagine
 * @returns {Promise<number>} ID nuovo record
 */
exports.uploadImmagine = function(file, tipo) {

// Compatibilità: alcuni punti del codice chiamavano il vecchio nome getAllImmagini
exports.getAllImmagini = function() {
    return exports.getImmagini();
};
    return new Promise((resolve, reject) => {
        const fs = require('fs');
        const path = require('path');
    // Use the public-facing uploads path. Store URLs as '/uploads/<filename>' so views
    // can reference them with an absolute path and the filesystem path can be derived
    // by stripping the leading '/'.
    const url = '/uploads/' + file.filename;
        const now = new Date().toISOString();
        const sql = 'INSERT INTO IMMAGINI (url, tipo, descrizione, created_at, updated_at) VALUES (?, ?, ?, ?, ?) RETURNING id';
        db.run(sql, [url, tipo, '', now, now], function(err, result) {
            if (err) {
                console.error('Errore SQL insert immagine:', err);
                return reject({ error: 'Errore nell\'inserimento dell\'immagine: ' + err.message });
            }
            resolve(result.rows[0].id);
        });
    });
}

/**
 * Aggiorna il campo entita_id di un'immagine (collegamento a notizia/evento/utente)
 * @async
 * @param {number} id - ID immagine
 * @param {number} entita_id - ID entità di riferimento
 * @returns {Promise<Object>} { success: true }
 */
exports.updateImmagineEntitaId = function(id, entita_id) {
    const sql = 'UPDATE IMMAGINI SET entita_id = ? WHERE id = ?;';
    return new Promise((resolve, reject) => {
        db.run(sql, [entita_id, id], function(err) {
            if (err) {
                console.error('Errore SQL update entita_id:', err);
                return reject({ error: 'Errore nell\'aggiornamento dell\'immagine: ' + err.message });
            }
            resolve({ success: true });
        });
    });
}

/**
 * Inserisce un'immagine associata a una notizia
 * @async
 * @param {string} url
 * @param {number} entita_id - ID notizia
 * @param {number} ordine - Ordine immagine nella notizia
 * @returns {Promise<Object>} { id }
 */
exports.insertImmagineNotizia = function(url, entita_id, ordine) {
    const sql = 'INSERT INTO IMMAGINI (url, tipo, entita_riferimento, entita_id, ordine, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id';
    return new Promise((resolve, reject) => {
        const now = new Date().toISOString();
        db.run(sql, [url, 'notizia', 'notizia', entita_id, ordine, now, now], function(err, result) {
            if (err) {
                console.error('Errore SQL insert immagine notizia:', err);
                return reject({ error: 'Errore nell\'inserimento dell\'immagine notizia: ' + err.message });
            }
            resolve({ id: result.rows[0].id });
        });
    });
}