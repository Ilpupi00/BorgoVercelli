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
    return new Promise(async (resolve, reject) => {
        try {
            // Converti ? in $1, $2, etc.
            let pgSql = sql;
            let paramIndex = 1;
            pgSql = pgSql.replace(/\?/g, () => `$${paramIndex++}`);
            
            const result = await db.query(pgSql, params);
            resolve(result.rows[0] ? (result.rows[0].count || 0) : 0);
        } catch (err) {
            console.error('[DAO-ADMIN] Error getting count for stats:', err);
            reject(err);
        }
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
    return new Promise(async (resolve, reject) => {
        try {
            const now = new Date().toISOString();
            // PostgreSQL usa $1, $2, etc. invece di ?
            const sql = 'INSERT INTO IMMAGINI (url, tipo, entita_riferimento, entita_id, ordine, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *';
            
            const result = await db.query(sql, [imageUrl, tipo, entitaRiferimento, entitaId, ordine, now, now]);
            
            console.log('[DAO-ADMIN] ✅ Immagine inserita nel DB:', result.rows[0]);
            resolve({ success: true, id: result.rows[0].id, rowCount: result.rowCount });
        } catch (err) {
            console.error('[DAO-ADMIN] ❌ Errore inserimento immagine:', err);
            reject(err);
        }
    });
}

/**
 * Elimina immagini di un'entità specifica
 * @param {string} entitaRiferimento - Nome dell'entità (es. 'Campo')
 * @param {number} entitaId - ID dell'entità
 * @returns {Promise<Object>} - Risultato della cancellazione
 */
function deleteImmaginiByEntita(entitaRiferimento, entitaId) {
    return new Promise(async (resolve, reject) => {
        try {
            // Prima recupera gli URL delle immagini da eliminare
            const selectSql = 'SELECT url FROM IMMAGINI WHERE entita_riferimento = $1 AND entita_id = $2';
            
            const selectResult = await db.query(selectSql, [entitaRiferimento, entitaId]);
            const rows = selectResult.rows;
            
            // Elimina i file fisici
            if (rows && rows.length > 0) {
                const { deleteImageFile } = require('../../../shared/utils/file-helper');
                rows.forEach(row => {
                    if (row.url) {
                        console.log('[deleteImmaginiByEntita] Eliminazione file:', row.url);
                        deleteImageFile(row.url);
                    }
                });
            }
            
            // Poi elimina i record dal DB
            const deleteSql = 'DELETE FROM IMMAGINI WHERE entita_riferimento = $1 AND entita_id = $2';
            const deleteResult = await db.query(deleteSql, [entitaRiferimento, entitaId]);
            
            resolve({ success: true, rowCount: deleteResult.rowCount });
        } catch (err) {
            console.error('[DAO-ADMIN] ❌ Errore cancellazione immagini:', err);
            reject(err);
        }
    });
}

/**
 * Conta il numero di squadre in un campionato
 * @param {number} campionatoId - ID del campionato
 * @returns {Promise<number>} - Numero di squadre
 */
function countSquadreByCampionato(campionatoId) {
    return new Promise(async (resolve, reject) => {
        try {
            const sql = 'SELECT COUNT(*) as count FROM CLASSIFICA WHERE campionato_id = $1';
            const result = await db.query(sql, [campionatoId]);
            resolve(result.rows[0] ? (result.rows[0].count || 0) : 0);
        } catch (err) {
            console.error('[DAO-ADMIN] Errore conteggio squadre campionato:', err);
            reject(err);
        }
    });
}

/**
 * Conta notizie pubblicate in un periodo
 * @param {string} dataInizio - Data inizio periodo (ISO string)
 * @param {string} dataFine - Data fine periodo (ISO string)
 * @returns {Promise<number>} - Numero di notizie
 */
function countNotiziePubblicate(dataInizio, dataFine) {
    return new Promise(async (resolve, reject) => {
        try {
            const sql = 'SELECT COUNT(*) as count FROM NOTIZIE WHERE pubblicata = true AND data_pubblicazione >= $1 AND data_pubblicazione < $2';
            const result = await db.query(sql, [dataInizio, dataFine]);
            resolve(result.rows[0] ? (result.rows[0].count || 0) : 0);
        } catch (err) {
            console.error('[DAO-ADMIN] Errore conteggio notizie pubblicate:', err);
            reject(err);
        }
    });
}

/**
 * Conta eventi pubblicati in un periodo
 * @param {string} dataInizio - Data inizio periodo (ISO string)
 * @param {string} dataFine - Data fine periodo (ISO string)
 * @returns {Promise<number>} - Numero di eventi
 */
function countEventiPubblicati(dataInizio, dataFine) {
    return new Promise(async (resolve, reject) => {
        try {
            // Nota: la tabella EVENTI non contiene una colonna 'data_pubblicazione'.
            // Usiamo 'data_inizio' come timestamp di riferimento per il conteggio degli eventi
            // pubblicati nel periodo richiesto.
            const sql = 'SELECT COUNT(*) as count FROM EVENTI WHERE pubblicato = true AND data_inizio >= $1 AND data_inizio < $2';
            const result = await db.query(sql, [dataInizio, dataFine]);
            resolve(result.rows[0] ? (result.rows[0].count || 0) : 0);
        } catch (err) {
            console.error('[DAO-ADMIN] Errore conteggio eventi pubblicati:', err);
            reject(err);
        }
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
