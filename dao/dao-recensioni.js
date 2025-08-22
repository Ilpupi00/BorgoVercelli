'use strict';

const sqlite = require('../db.js');

exports.getRecensioni = async () => {
    const sql = `SELECT
    RECENSIONI.id,
    RECENSIONI.valutazione,
    RECENSIONI.titolo,
    RECENSIONI.contenuto,
    RECENSIONI.data_recensione,
    RECENSIONI.visibile,
    UTENTI.nome AS nome_utente,
    UTENTI.cognome AS cognome_utente,
    IMMAGINI.url AS immagine_utente
    FROM
        RECENSIONI
    JOIN
        UTENTI ON RECENSIONI.utente_id = UTENTI.id
    LEFT JOIN
        IMMAGINI ON IMMAGINI.entita_riferimento = 'utente'
            AND IMMAGINI.entita_id = UTENTI.id
            AND (IMMAGINI.ordine = 1 OR IMMAGINI.ordine IS NULL)
    WHERE
        RECENSIONI.visibile = 1
    ORDER BY
        RECENSIONI.data_recensione DESC`;
        
    return new Promise((resolve, reject) => {
        sqlite.all(sql, (err, reviews) => {
            if (err) {
                return reject({ error: 'Error retrieving reviews: ' + err.message });
            }
            resolve(reviews);
        });
    });
}

exports.getValutaMediaRecensioni = async () => {
    const sql = 'SELECT AVG(valutazione) AS media FROM RECENSIONI WHERE visibile = 1';
    
    return new Promise((resolve, reject) => {
        sqlite.get(sql, (err, media) => {
            if (err) {
                return reject({ error: 'Error retrieving average rating: ' + err.message });
            }
            resolve(media.media);
        });
    });
}

exports.inserisciRecensione=async(recensione)=>{
    // Estraggo i dati
    const { valutazione, titolo, contenuto, entita_tipo, entita_id, utente_id } = recensione;
    const sql = `INSERT INTO RECENSIONI (utente_id, entita_tipo, entita_id, valutazione, titolo, contenuto, data_recensione, visibile) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), 1)`;
    return new Promise((resolve, reject) => {
        sqlite.run(sql, [utente_id, entita_tipo, entita_id, valutazione, titolo, contenuto], function(err) {
            if (err) {
                return resolve({ success: false, error: err.message });
            }
            resolve({ success: true, id: this.lastID });
        });
    });
}