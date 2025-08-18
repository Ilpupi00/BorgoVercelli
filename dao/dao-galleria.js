'use strict';

const db= require('../db.js');

exports.getImmagini = function() {
    const sql = "SELECT id, url, descrizione FROM IMMAGINI WHERE tipo = 'upload della Galleria';";
    return new Promise((resolve, reject) => {
        db.all(sql, (err, immagini) => {
            if (err) {
                console.error('Errore SQL:', err);
                return reject({ error: 'Errore nel recupero delle immagini: ' + err.message });
            }
            resolve(immagini || []);
        });
    });
}

exports.insertImmagine = function( url, created_at, updated_at) {
    const sql = 'INSERT INTO IMMAGINI (url, tipo, created_at, updated_at) VALUES (?, ?, ?, ?);';
    return new Promise((resolve, reject) => {
        db.run(sql, [url, 'upload della Galleria', created_at, updated_at], function(err) {
            if (err) {
                console.error('Errore SQL insert:', err);
                return reject({ error: 'Errore nell\'inserimento dell\'immagine: ' + err.message });
            }
            resolve({ id: this.lastID });
        });
    });
}