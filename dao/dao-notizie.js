'use strict';

const sqlite = require('../db.js');

exports.getNotizie = function(){
    const sql = `
        SELECT N.*, U.nome AS autore_nome, U.cognome AS autore_cognome
        FROM NOTIZIE N
        LEFT JOIN UTENTI U ON N.autore_id = U.id
        ORDER BY N.data_pubblicazione DESC
    `;
    return new Promise((resolve, reject) => {
        sqlite.all(sql, (err, notizie) => {
            if (err) {
                return reject({ error: 'Error retrieving news: ' + err.message });
            }
            resolve(notizie);
        });
    });
}

exports.getNotiziaById = function(id) {
    const sql = 'SELECT * FROM NOTIZIE WHERE id = ?';
    return new Promise((resolve, reject) => {
        sqlite.get(sql, [id], (err, notizia) => {
            if (err) {
                return reject({ error: 'Error retrieving news: ' + err.message });
            }
            if (!notizia) {
                return reject({ error: 'News not found' });
            }
            resolve(notizia);
        });
    });
}