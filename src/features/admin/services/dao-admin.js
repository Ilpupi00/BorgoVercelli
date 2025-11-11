'use strict';

const db = require('../../../core/config/database');

/**
 * DAO per operazioni admin specifiche
 */

/**
 * Conta elementi per statistiche (notizie, eventi, ecc.)
 * @param {string} sql - Query SQL per il conteggio
 * @param {Array} params - Parametri per la query
 * @returns {Promise<number>} - Numero di elementi
 */
function getCount(sql, params) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, result) => {
            if (err) {
                console.error('Error getting count for stats:', err);
                return reject(err);
            }
            const row = result && result.rows && result.rows[0];
            resolve(row && (row.count || 0) || 0);
        });
    });
}

/**
 * Inserisce un'immagine nella tabella IMMAGINI
 * @param {string} imageUrl - URL dell'immagine
 * @param {string} tipo - Tipo di entità (es. 'Campo')
 * @param {string} entitaRiferimento - Nome dell'entità
 * @param {number} entitaId - ID dell'entità
 * @param {number} ordine - Ordine di visualizzazione
 * @returns {Promise<Object>} - Risultato dell'inserimento
 */
function insertImmagine(imageUrl, tipo, entitaRiferimento, entitaId, ordine = 1) {
    return new Promise((resolve, reject) => {
        const now = new Date().toISOString();
        const sql = 'INSERT INTO IMMAGINI (url, tipo, entita_riferimento, entita_id, ordine, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)';
        
        db.run(sql, [imageUrl, tipo, entitaRiferimento, entitaId, ordine, now, now], (err, result) => {
            if (err) {
                console.error('Errore inserimento immagine:', err);
                return reject(err);
            }
            resolve({ success: true, rowCount: result ? result.rowCount : 0 });
        });
    });
}

/**
 * Elimina immagini di un'entità specifica
 * @param {string} entitaRiferimento - Nome dell'entità (es. 'Campo')
 * @param {number} entitaId - ID dell'entità
 * @returns {Promise<Object>} - Risultato della cancellazione
 */
function deleteImmaginiByEntita(entitaRiferimento, entitaId) {
    return new Promise((resolve, reject) => {
        const sql = 'DELETE FROM IMMAGINI WHERE entita_riferimento = ? AND entita_id = ?';
        
        db.run(sql, [entitaRiferimento, entitaId], (err, result) => {
            if (err) {
                console.error('Errore cancellazione immagini:', err);
                return reject(err);
            }
            resolve({ success: true, rowCount: result ? result.rowCount : 0 });
        });
    });
}

/**
 * Conta il numero di squadre in un campionato
 * @param {number} campionatoId - ID del campionato
 * @returns {Promise<number>} - Numero di squadre
 */
function countSquadreByCampionato(campionatoId) {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT COUNT(*) as count FROM CLASSIFICA WHERE campionato_id = ?';
        
        db.get(sql, [campionatoId], (err, result) => {
            if (err) {
                console.error('Errore conteggio squadre campionato:', err);
                return reject(err);
            }
            const row = result && result.rows && result.rows[0];
            resolve(row ? (row.count || 0) : 0);
        });
    });
}

/**
 * Conta notizie pubblicate in un periodo
 * @param {string} dataInizio - Data inizio periodo (ISO string)
 * @param {string} dataFine - Data fine periodo (ISO string)
 * @returns {Promise<number>} - Numero di notizie
 */
function countNotiziePubblicate(dataInizio, dataFine) {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT COUNT(*) as count FROM NOTIZIE WHERE pubblicata = true AND data_pubblicazione >= ? AND data_pubblicazione < ?';
        db.get(sql, [dataInizio, dataFine], (err, result) => {
            if (err) {
                console.error('Errore conteggio notizie pubblicate:', err);
                return reject(err);
            }
            const row = result && result.rows && result.rows[0];
            resolve(row ? (row.count || 0) : 0);
        });
    });
}

/**
 * Conta eventi pubblicati in un periodo
 * @param {string} dataInizio - Data inizio periodo (ISO string)
 * @param {string} dataFine - Data fine periodo (ISO string)
 * @returns {Promise<number>} - Numero di eventi
 */
function countEventiPubblicati(dataInizio, dataFine) {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT COUNT(*) as count FROM EVENTI WHERE pubblicato = true AND data_pubblicazione >= ? AND data_pubblicazione < ?';
        db.get(sql, [dataInizio, dataFine], (err, result) => {
            if (err) {
                console.error('Errore conteggio eventi pubblicati:', err);
                return reject(err);
            }
            const row = result && result.rows && result.rows[0];
            resolve(row ? (row.count || 0) : 0);
        });
    });
}

module.exports = {
    getCount,
    insertImmagine,
    deleteImmaginiByEntita,
    countSquadreByCampionato,
    countNotiziePubblicate,
    countEventiPubblicati
};
