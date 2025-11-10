'use strict';

const sqlite = require('../../../core/config/database');

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
    UTENTI.immagine_profilo AS immagine_utente
    FROM
        RECENSIONI
    JOIN
        UTENTI ON RECENSIONI.utente_id = UTENTI.id
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

exports.getRecensioniByUserId = async (userId) => {
    const sql = `SELECT
    RECENSIONI.id,
    RECENSIONI.valutazione,
    RECENSIONI.titolo,
    RECENSIONI.contenuto,
    RECENSIONI.data_recensione,
    RECENSIONI.visibile,
    RECENSIONI.entita_tipo,
    RECENSIONI.entita_id
    FROM
        RECENSIONI
    WHERE
        RECENSIONI.utente_id = ? AND RECENSIONI.visibile = 1
    ORDER BY
        RECENSIONI.data_recensione DESC`;
        
    return new Promise((resolve, reject) => {
        sqlite.all(sql, [userId], (err, reviews) => {
            if (err) {
                return reject({ error: 'Error retrieving user reviews: ' + err.message });
            }
            resolve(reviews);
        });
    });
}

exports.updateRecensione = async (recensioneId, userId, dati) => {
    const { valutazione, titolo, contenuto } = dati;
    const sql = `UPDATE RECENSIONI SET valutazione = ?, titolo = ?, contenuto = ?, data_recensione = datetime('now') 
                 WHERE id = ? AND utente_id = ? AND visibile = 1`;
    
    return new Promise((resolve, reject) => {
        sqlite.run(sql, [valutazione, titolo, contenuto, recensioneId, userId], function(err) {
            if (err) {
                return reject({ error: 'Error updating review: ' + err.message });
            }
            resolve({ success: true, changes: this.changes });
        });
    });
}

exports.deleteRecensione = async (recensioneId, userId) => {
    const sql = `UPDATE RECENSIONI SET visibile = 0 WHERE id = ? AND utente_id = ?`;
    
    return new Promise((resolve, reject) => {
        sqlite.run(sql, [recensioneId, userId], function(err) {
            if (err) {
                return reject({ error: 'Error deleting review: ' + err.message });
            }
            resolve({ success: true, changes: this.changes });
        });
    });
}

exports.getAllRecensioni = async () => {
    const sql = `SELECT
    RECENSIONI.id,
    RECENSIONI.valutazione,
    RECENSIONI.titolo,
    RECENSIONI.contenuto,
    RECENSIONI.data_recensione,
    RECENSIONI.visibile,
    UTENTI.nome AS utente_nome,
    UTENTI.cognome AS utente_cognome,
    IMMAGINI.url AS immagine_utente
    FROM
        RECENSIONI
    JOIN
        UTENTI ON RECENSIONI.utente_id = UTENTI.id
    LEFT JOIN
        IMMAGINI ON IMMAGINI.entita_riferimento = 'utente'
            AND IMMAGINI.entita_id = UTENTI.id
            AND (IMMAGINI.ordine = 1 OR IMMAGINI.ordine IS NULL)
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

exports.getRecensioneById = async (id) => {
    const sql = `SELECT
    RECENSIONI.id,
    RECENSIONI.valutazione,
    RECENSIONI.titolo,
    RECENSIONI.contenuto,
    RECENSIONI.data_recensione,
    RECENSIONI.visibile,
    UTENTI.nome AS utente_nome,
    UTENTI.cognome AS utente_cognome
    FROM
        RECENSIONI
    JOIN
        UTENTI ON RECENSIONI.utente_id = UTENTI.id
    WHERE
        RECENSIONI.id = ?`;
        
    return new Promise((resolve, reject) => {
        sqlite.get(sql, [id], (err, review) => {
            if (err) {
                return reject({ error: 'Error retrieving review: ' + err.message });
            }
            resolve(review);
        });
    });
}

exports.updateRecensioneVisibile = async (id, visibile) => {
    const sql = `UPDATE RECENSIONI SET visibile = ? WHERE id = ?`;
    
    return new Promise((resolve, reject) => {
        sqlite.run(sql, [visibile ? 1 : 0, id], function(err) {
            if (err) {
                return reject({ error: 'Error updating review visibility: ' + err.message });
            }
            resolve({ success: true, changes: this.changes });
        });
    });
}

exports.deleteRecensioneAdmin = async (id) => {
    const sql = `DELETE FROM RECENSIONI WHERE id = ?`;
    
    return new Promise((resolve, reject) => {
        sqlite.run(sql, [id], function(err) {
            if (err) {
                return reject({ error: 'Error deleting review: ' + err.message });
            }
            resolve({ success: true, changes: this.changes });
        });
    });
}