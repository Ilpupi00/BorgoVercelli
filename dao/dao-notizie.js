'use strict';

const sqlite = require('../db.js');
const Notizie= require('../model/notizia.js');

const makeNotizie = (row) => {
    return new Notizie(
        row.N_id,
        row.N_titolo || row.titolo,
        row.N_sottotitolo || row.sottotitolo,
        row.N_immagine || row.img || row.immagine,
        row.N_contenuto || row.contenuto,
        row.N_autore_id || row.autore_id,
        row.N_pubblicata || row.pubblicata,
        (row.N_data_pubblicazione || row.data_pubblicazione || row.N_pubblicata || row.pubblicata),
        row.N_visualizzazioni || row.visualizzazioni,
        row.N_created_at || row.created_at,
        row.N_updated_at || row.updated_at
    );
}
exports.getNotizie = async function(){
    const sql = `
        SELECT N.id as N_id, N.titolo as N_titolo, N.sottotitolo as N_sottotitolo, N.immagine_principale_id as N_immagine, N.contenuto as N_contenuto, N.autore_id as N_autore_id, N.pubblicata as N_pubblicata, N.data_pubblicazione as N_data_pubblicazione, N.visualizzazioni as N_visualizzazioni, N.created_at as N_created_at, N.updated_at as N_updated_at, U.nome as autore_nome, U.cognome as autore_cognome
        FROM NOTIZIE N
        LEFT JOIN UTENTI U ON N.autore_id = U.id
        ORDER BY N.data_pubblicazione DESC
    `;
    return new Promise((resolve, reject) => {
        sqlite.all(sql, (err, notizie) => {
            if (err) {
                console.error('Errore SQL:', err);
                return reject({ error: 'Error retrieving news: ' + err.message });
            }

            try {
                const result = notizie.map(makeNotizie)|| [];
                resolve(result);
            } catch (e) {
                return reject({ error: 'Error mapping news: ' + e.message });
            }
        });
    });
}

exports.getNotiziaById = async function(id) {
    const sql = 'SELECT * FROM NOTIZIE WHERE id = ?';
    return new Promise((resolve, reject) => {
        sqlite.get(sql, [id], (err, notizia) => {
            if (err) {
                return reject({ error: 'Error retrieving news: ' + err.message });
            }
            if (!notizia) {
                return reject({ error: 'News not found' });
            }
            resolve(makeNotizie(notizia));
        });
    });
}

exports.deleteNotiziaById = async function(id) {
    const sql = 'DELETE FROM NOTIZIE WHERE id = ?';
    return new Promise((resolve, reject) => {
        sqlite.run(sql, [id], function(err) {
            if (err) {
                return reject({ error: 'Error deleting news: ' + err.message });
            }   
            resolve({ success: true });
        });
    });
}