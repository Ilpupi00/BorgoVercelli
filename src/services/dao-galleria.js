'use strict';

const db= require('../config/database');
const Immagine = require('../models/immagine.js');

const makeImmagine=(row)=>{
    return new Immagine(
        row.id,
        row.descrizione,
        row.url,
        row.tipo,
        row.entita_riferimento,
        row.entita_id,
        row.ordine,
        row.created_at,
        row.updated_at
    );
}

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

exports.insertImmagine = function( url, created_at, updated_at, descrizione = '') {
    const sql = 'INSERT INTO IMMAGINI (url, tipo, descrizione, created_at, updated_at) VALUES (?, ?, ?, ?, ?);';
    return new Promise((resolve, reject) => {
        db.run(sql, [url, 'upload della Galleria', descrizione, created_at, updated_at], function(err) {
            if (err) {
                console.error('Errore SQL insert:', err);
                return reject({ error: 'Errore nell\'inserimento dell\'immagine: ' + err.message });
            }
            resolve({ id: this.lastID });
        });
    });
}

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
            const filePath = path.join(__dirname, '../public', row.url);
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

exports.uploadImmagine = function(file, tipo) {
    return new Promise((resolve, reject) => {
        const fs = require('fs');
        const path = require('path');
        const url = '/src/public/uploads/' + file.filename;
        const now = new Date().toISOString();
        const sql = 'INSERT INTO IMMAGINI (url, tipo, descrizione, created_at, updated_at) VALUES (?, ?, ?, ?, ?);';
        db.run(sql, [url, tipo, '', now, now], function(err) {
            if (err) {
                console.error('Errore SQL insert immagine:', err);
                return reject({ error: 'Errore nell\'inserimento dell\'immagine: ' + err.message });
            }
            resolve(this.lastID);
        });
    });
}

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

exports.insertImmagineNotizia = function(url, entita_id, ordine) {
    const sql = 'INSERT INTO IMMAGINI (url, tipo, entita_riferimento, entita_id, ordine, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?);';
    return new Promise((resolve, reject) => {
        const now = new Date().toISOString();
        db.run(sql, [url, 'notizia', 'notizia', entita_id, ordine, now, now], function(err) {
            if (err) {
                console.error('Errore SQL insert immagine notizia:', err);
                return reject({ error: 'Errore nell\'inserimento dell\'immagine notizia: ' + err.message });
            }
            resolve({ id: this.lastID });
        });
    });
}