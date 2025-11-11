/**
 * @fileoverview DAO per le recensioni
 * Fornisce metodi per creare, leggere, aggiornare e rimuovere recensioni.
 * Espone anche funzioni utili per statistiche e moderazione.
 * @module features/recensioni/services/dao-recensioni
 */

'use strict';

const sqlite = require('../../../core/config/database');

/**
 * Recupera le recensioni visibili più recenti
 * @async
 * @returns {Promise<Array<Object>>} Array di recensioni con informazioni utente
 */
exports.getRecensioni = async () => {
    const sql = `SELECT
    RECENSIONI.id,
    RECENSIONI.valutazione,
    RECENSIONI.titolo,
    RECENSIONI.contenuto,
    RECENSIONI.data_recensione,
    RECENSIONI.visibile,
    UTENTI.nome AS nome_utente,
    UTENTI.cognome AS cognome_utente
    FROM
        RECENSIONI
    JOIN
        UTENTI ON RECENSIONI.utente_id = UTENTI.id
    WHERE
        RECENSIONI.visibile = true
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

/**
 * Calcola la valutazione media delle recensioni visibili
 * @async
 * @returns {Promise<number|null>} Valore medio (float) o null se non esistono recensioni
 */
exports.getValutaMediaRecensioni = async () => {
    const sql = 'SELECT AVG(valutazione) AS media FROM RECENSIONI WHERE visibile = true';
    
    return new Promise((resolve, reject) => {
        sqlite.get(sql, (err, media) => {
            if (err) {
                return reject({ error: 'Error retrieving average rating: ' + err.message });
            }
            resolve(media.media);
        });
    });
}

/**
 * Inserisce una nuova recensione collegata ad una entità (es. evento)
 * @async
 * @param {Object} recensione - Dati della recensione
 * @param {number} recensione.utente_id - ID utente autore
 * @param {string} recensione.entita_tipo - Tipo entità recensita (es: 'evento')
 * @param {number} recensione.entita_id - ID entità recensita
 * @param {number} recensione.valutazione - Voto numerico
 * @param {string} [recensione.titolo]
 * @param {string} [recensione.contenuto]
 * @returns {Promise<Object>} { success: true, id } o { success: false, error }
 */
exports.inserisciRecensione=async(recensione)=>{
    // Estraggo i dati
    const { valutazione, titolo, contenuto, entita_tipo, entita_id, utente_id } = recensione;
    const sql = `INSERT INTO RECENSIONI (utente_id, entita_tipo, entita_id, valutazione, titolo, contenuto, data_recensione, visibile) VALUES (?, ?, ?, ?, ?, ?, NOW(), true) RETURNING id`;
    return new Promise((resolve, reject) => {
        sqlite.run(sql, [utente_id, entita_tipo, entita_id, valutazione, titolo, contenuto], function(err, result) {
            if (err) {
                return resolve({ success: false, error: err.message });
            }
            resolve({ success: true, id: result.rows[0].id });
        });
    });
}

/**
 * Recupera le recensioni visibili scritte da uno specifico utente
 * @async
 * @param {number} userId - ID dell'utente
 * @returns {Promise<Array<Object>>} Array di recensioni
 */
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
        RECENSIONI.utente_id = ? AND RECENSIONI.visibile = true
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

/**
 * Aggiorna una recensione (solo se appartiene all'utente)
 * @async
 * @param {number} recensioneId - ID recensione
 * @param {number} userId - ID utente che tenta l'aggiornamento
 * @param {Object} dati - Campi aggiornati { valutazione, titolo, contenuto }
 * @returns {Promise<Object>} { success: true, changes }
 */
exports.updateRecensione = async (recensioneId, userId, dati) => {
    const { valutazione, titolo, contenuto } = dati;
    const sql = `UPDATE RECENSIONI SET valutazione = ?, titolo = ?, contenuto = ?, data_recensione = NOW() 
                 WHERE id = ? AND utente_id = ? AND visibile = true`;
    
    return new Promise((resolve, reject) => {
        sqlite.run(sql, [valutazione, titolo, contenuto, recensioneId, userId], function(err) {
            if (err) {
                return reject({ error: 'Error updating review: ' + err.message });
            }
            resolve({ success: true, changes: this.changes });
        });
    });
}

/**
 * Segna una recensione come non visibile (soft-delete) se appartiene all'utente
 * @async
 * @param {number} recensioneId
 * @param {number} userId
 * @returns {Promise<Object>} { success: true, changes }
 */
exports.deleteRecensione = async (recensioneId, userId) => {
    const sql = `UPDATE RECENSIONI SET visibile = false WHERE id = ? AND utente_id = ?`;
    
    return new Promise((resolve, reject) => {
        sqlite.run(sql, [recensioneId, userId], function(err) {
            if (err) {
                return reject({ error: 'Error deleting review: ' + err.message });
            }
            resolve({ success: true, changes: this.changes });
        });
    });
}

/**
 * Recupera tutte le recensioni (admin view) con immagini utente se presenti
 * @async
 * @returns {Promise<Array<Object>>} Array di recensioni complete
 */
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

/**
 * Recupera una recensione per ID
 * @async
 * @param {number} id - ID recensione
 * @returns {Promise<Object|null>} Oggetto recensione o null
 */
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

/**
 * Aggiorna il flag di visibilità di una recensione (usato per moderazione)
 * @async
 * @param {number} id - ID recensione
 * @param {boolean} visibile - true per visibile, false per nascondere
 * @returns {Promise<Object>} { success: true, changes }
 */
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

/**
 * Elimina permanentemente una recensione (uso admin)
 * @async
 * @param {number} id - ID recensione
 * @returns {Promise<Object>} { success: true, changes }
 */
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