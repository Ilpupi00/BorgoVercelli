'use strict';

/**
 * @fileoverview DAO per la gestione delle notizie
 * Fornisce funzioni per creare, leggere, aggiornare, filtrare e cancellare notizie
 * @module features/notizie/services/dao-notizie
 */

const sqlite = require('../../../core/config/database');
const Notizie= require('../../../core/models/notizia.js');

const makeNotizie = (row) => {
    // Costruisci il nome completo dell'autore
    let autore = '';
    if (row.autore_nome || row.autore_cognome) {
        autore = `${row.autore_nome || ''} ${row.autore_cognome || ''}`.trim();
    } else if (row.N_autore_id || row.autore_id) {
        autore = `Autore ID: ${row.N_autore_id || row.autore_id}`;
    }

    const notiziaId = row.N_id || row.id;
    
    // Log warning if ID is missing
    if (!notiziaId) {
        console.warn('[DAO-NOTIZIE] WARNING: Notizia senza ID valido trovata:', {
            titolo: row.N_titolo || row.titolo,
            raw_N_id: row.N_id,
            raw_id: row.id
        });
    }

    return new Notizie(
        notiziaId,
        row.N_titolo || row.titolo,
        row.N_sottotitolo || row.sottotitolo,
        {
            url: row.immagine_url || '/assets/images/default-news.jpg',
            id: row.N_immagine || row.immagine_principale_id
        },
        row.N_contenuto || row.contenuto,
        autore, // Usa il nome completo invece dell'ID
        row.N_autore_id || row.autore_id,
        row.N_pubblicata || row.pubblicata,
        row.N_data_pubblicazione || row.data_pubblicazione,
        row.N_visualizzazioni || row.visualizzazioni,
        row.N_created_at || row.created_at || null,
        row.N_updated_at || row.updated_at || null
    );
}
/**
 * Recupera tutte le notizie (anche bozza) con autore e immagine
 * @async
 * @returns {Promise<Array<Notizie>>}
 */
exports.getNotizie = async function(){
    const sql = `
        SELECT N.id as N_id, N.titolo as N_titolo, N.sottotitolo as N_sottotitolo, N.immagine_principale_id as N_immagine, N.contenuto as N_contenuto, N.autore_id as N_autore_id, N.pubblicata as N_pubblicata, N.data_pubblicazione as N_data_pubblicazione, N.visualizzazioni as N_visualizzazioni, N.created_at as N_created_at, N.updated_at as N_updated_at, U.nome as autore_nome, U.cognome as autore_cognome, I.url as immagine_url
        FROM NOTIZIE N
        LEFT JOIN UTENTI U ON N.autore_id = U.id
        LEFT JOIN IMMAGINI I ON I.entita_riferimento = 'notizia' AND I.entita_id = N.id AND I.ordine = 1
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

/**
 * Recupera le notizie pubblicate paginando il risultato
 * @async
 * @param {number} offset - Offset per la paginazione
 * @param {number} limit - Numero di record per pagina
 * @returns {Promise<Array<Notizie>>}
 */
exports.getNotiziePaginated = async function(offset = 0, limit = 6){
    const sql = `
        SELECT N.id as N_id, N.titolo as N_titolo, N.sottotitolo as N_sottotitolo, N.immagine_principale_id as N_immagine, N.contenuto as N_contenuto, N.autore_id as N_autore_id, N.pubblicata as N_pubblicata, N.data_pubblicazione as N_data_pubblicazione, N.visualizzazioni as N_visualizzazioni, N.created_at as N_created_at, N.updated_at as N_updated_at, U.nome as autore_nome, U.cognome as autore_cognome, I.url as immagine_url
        FROM NOTIZIE N
        LEFT JOIN UTENTI U ON N.autore_id = U.id
        LEFT JOIN IMMAGINI I ON I.entita_riferimento = 'notizia' AND I.entita_id = N.id AND I.ordine = 1
        WHERE N.pubblicata = true
        ORDER BY N.data_pubblicazione DESC
        LIMIT ? OFFSET ?
    `;
    return new Promise((resolve, reject) => {
        sqlite.all(sql, [limit, offset], (err, notizie) => {
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

/**
 * Recupera una notizia per ID
 * @async
 * @param {number} id - ID della notizia
 * @returns {Promise<Notizie>} Istanza Notizie
 */
exports.getNotiziaById = async function(id) {
    const sql = `
        SELECT N.id as N_id, N.titolo as N_titolo, N.sottotitolo as N_sottotitolo, N.immagine_principale_id as N_immagine, N.contenuto as N_contenuto, N.autore_id as N_autore_id, N.pubblicata as N_pubblicata, N.data_pubblicazione as N_data_pubblicazione, N.visualizzazioni as N_visualizzazioni, N.created_at as N_created_at, N.updated_at as N_updated_at, U.nome as autore_nome, U.cognome as autore_cognome, I.url as immagine_url
        FROM NOTIZIE N
        LEFT JOIN UTENTI U ON N.autore_id = U.id
        LEFT JOIN IMMAGINI I ON I.entita_riferimento = 'notizia' AND I.entita_id = N.id AND I.ordine = 1
        WHERE N.id = ?
    `;
    return new Promise((resolve, reject) => {
        sqlite.get(sql, [id], (err, notizia) => {
            if (err) {
                return reject({ error: 'Error retrieving news: ' + err.message });
            }
            if (!notizia) {
                // Return null when not found so callers can handle 404 vs 500
                return resolve(null);
            }
            resolve(makeNotizie(notizia));
        });
    });
}

/**
 * Elimina una notizia per ID
 * @async
 * @param {number} id - ID della notizia
 * @returns {Promise<Object>} { success: true }
 */
exports.deleteNotiziaById = async function(id) {
    const sql = 'DELETE FROM NOTIZIE WHERE id = ?';
    return new Promise((resolve, reject) => {
        sqlite.run(sql, [id], function(err, result) {
            if (err) {
                return reject({ error: 'Error deleting news: ' + err.message });
            }
            const deleted = result && typeof result.rowCount === 'number' ? result.rowCount : 0;
            if (deleted === 0) {
                return resolve({ success: false, deleted: 0 });
            }
            resolve({ success: true, deleted });
        });
    });
}

/**
 * Crea una nuova notizia. Se `pubblicata` è true imposta data_pubblicazione a now
 * @async
 * @param {Object} notiziaData - Dati della notizia
 * @returns {Promise<Object>} { success: true, id }
 */
exports.createNotizia = async function(notiziaData) {
    const sql = `INSERT INTO NOTIZIE (titolo, sottotitolo, contenuto, immagine_principale_id, autore_id, pubblicata, data_pubblicazione, visualizzazioni, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, CASE WHEN ? = true THEN NOW() ELSE NULL END, 0, NOW(), NOW())
                 RETURNING id`;

    return new Promise((resolve, reject) => {
        sqlite.run(sql, [
            notiziaData.titolo,
            notiziaData.sottotitolo,
            notiziaData.contenuto,
            notiziaData.immagine_principale_id,
            notiziaData.autore_id,
            notiziaData.pubblicata,
            notiziaData.pubblicata
        ], function(err, result) {
            if (err) {
                return reject({ error: 'Error creating news: ' + err.message });
            }
            const id = result && result.rows && result.rows[0] ? result.rows[0].id : null;
            resolve({ success: true, id });
        });
    });
}

/**
 * Aggiorna una notizia esistente
 * @async
 * @param {number} id - ID della notizia
 * @param {Object} notiziaData - Campi aggiornati
 * @returns {Promise<Object>} { success: true, changes }
 */
exports.updateNotizia = async function(id, notiziaData) {
    const sql = `UPDATE NOTIZIE SET
                 titolo = ?, sottotitolo = ?, contenuto = ?, immagine_principale_id = ?,
                 pubblicata = ?, data_pubblicazione = CASE WHEN ? = true THEN NOW() ELSE NULL END, updated_at = NOW()
                 WHERE id = ?`;

    return new Promise((resolve, reject) => {
        sqlite.run(sql, [
            notiziaData.titolo,
            notiziaData.sottotitolo,
            notiziaData.contenuto,
            notiziaData.immagine_principale_id,
            notiziaData.pubblicata ? true : false,
            notiziaData.pubblicata ? true : false,
            id
        ], function(err, result) {
            if (err) {
                return reject({ error: 'Error updating news: ' + err.message });
            }
            const changes = (result && typeof result.rowCount === 'number') ? result.rowCount : 0;
            resolve({ success: true, changes });
        });
    });
}

/**
 * Attiva/disattiva la pubblicazione di una notizia
 * @async
 * @param {number} id - ID della notizia
 * @returns {Promise<Object>} { success: true, changes }
 */
exports.togglePubblicazioneNotizia = async function(id) {
    const sql = `UPDATE NOTIZIE SET
                 pubblicata = CASE WHEN pubblicata = true THEN false ELSE true END,
                 data_pubblicazione = CASE WHEN pubblicata = false THEN NOW() WHEN pubblicata = true THEN NULL ELSE data_pubblicazione END,
                 updated_at = NOW()
                 WHERE id = ?`;

    return new Promise((resolve, reject) => {
        sqlite.run(sql, [id], function(err, result) {
            if (err) {
                return reject({ error: 'Error toggling news publication: ' + err.message });
            }
            const changes = (result && typeof result.rowCount === 'number') ? result.rowCount : 0;
            resolve({ success: true, changes });
        });
    });
}

/**
 * Cerca notizie pubblicate per titolo/sottotitolo
 * @async
 * @param {string} searchTerm - Term con % per LIKE
 * @returns {Promise<Array<Notizie>>}
 */
exports.searchNotizie = async function(searchTerm) {
    const sql = `
        SELECT N.id as N_id, N.titolo as N_titolo, N.sottotitolo as N_sottotitolo, N.immagine_principale_id as N_immagine, N.contenuto as N_contenuto, N.autore_id as N_autore_id, N.pubblicata as N_pubblicata, N.data_pubblicazione as N_data_pubblicazione, N.visualizzazioni as N_visualizzazioni, N.created_at as N_created_at, N.updated_at as N_updated_at, U.nome as autore_nome, U.cognome as autore_cognome, I.url as immagine_url
        FROM NOTIZIE N
        LEFT JOIN UTENTI U ON N.autore_id = U.id
        LEFT JOIN IMMAGINI I ON I.entita_riferimento = 'notizia' AND I.entita_id = N.id AND I.ordine = 1
        WHERE N.pubblicata = true AND (N.titolo LIKE ? OR N.sottotitolo LIKE ?)
        ORDER BY N.data_pubblicazione DESC
        LIMIT 5
    `;
    return new Promise((resolve, reject) => {
        sqlite.all(sql, [searchTerm, searchTerm], (err, notizie) => {
            if (err) {
                console.error('Errore SQL search notizie:', err);
                return reject({ error: 'Error searching news: ' + err.message });
            }

            try {
                const result = notizie.map(makeNotizie) || [];
                resolve(result);
            } catch (e) {
                console.error('Errore nella mappatura delle notizie:', e);
                reject({ error: 'Error mapping news data' });
            }
        });
    });
}

/**
 * Recupera notizie applicando filtri (testo, autore, date) con paginazione
 * @async
 * @param {Object} filters - Filtri: search, author, dateFrom, dateTo
 * @param {number} offset
 * @param {number} limit
 * @returns {Promise<Array<Notizie>>}
 */
exports.getNotizieFiltered = async function(filters = {}, offset = 0, limit = 12) {
    let sql = `
        SELECT N.id as N_id, N.titolo as N_titolo, N.sottotitolo as N_sottotitolo, N.immagine_principale_id as N_immagine, N.contenuto as N_contenuto, N.autore_id as N_autore_id, N.pubblicata as N_pubblicata, N.data_pubblicazione as N_data_pubblicazione, N.visualizzazioni as N_visualizzazioni, N.created_at as N_created_at, N.updated_at as N_updated_at, U.nome as autore_nome, U.cognome as autore_cognome, I.url as immagine_url
        FROM NOTIZIE N
        LEFT JOIN UTENTI U ON N.autore_id = U.id
        LEFT JOIN IMMAGINI I ON I.entita_riferimento = 'notizia' AND I.entita_id = N.id AND I.ordine = 1
        WHERE N.pubblicata = true
    `;
    
    const params = [];
    
    // Filtro per ricerca testuale
    if (filters.search && filters.search.trim()) {
        const searchTerm = `%${filters.search.trim()}%`;
        sql += ` AND (N.titolo LIKE ? OR N.sottotitolo LIKE ? OR N.contenuto LIKE ?)`;
        params.push(searchTerm, searchTerm, searchTerm);
    }
    
    // Filtro per autore
    if (filters.author && filters.author.trim()) {
        sql += ` AND (U.nome || ' ' || U.cognome) LIKE ?`;
        params.push(`%${filters.author.trim()}%`);
    }
    
    // Filtro per data da
    if (filters.dateFrom) {
        sql += ` AND N.data_pubblicazione >= ?`;
        params.push(filters.dateFrom);
    }
    
    // Filtro per data a
    if (filters.dateTo) {
        sql += ` AND N.data_pubblicazione <= ?`;
        params.push(filters.dateTo);
    }
    
    sql += ` ORDER BY N.data_pubblicazione DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    
    return new Promise((resolve, reject) => {
        sqlite.all(sql, params, (err, notizie) => {
            if (err) {
                console.error('Errore SQL filtered notizie:', err);
                return reject({ error: 'Error retrieving filtered news: ' + err.message });
            }

            try {
                const result = notizie.map(makeNotizie) || [];
                resolve(result);
            } catch (e) {
                return reject({ error: 'Error mapping filtered news: ' + e.message });
            }
        });
    });
}

/**
 * Recupera gli autori distinti delle notizie pubblicate (nome completo)
 * @async
 * @returns {Promise<Array<string>>} Array di nomi autori
 */
exports.getNotizieAuthors = async function() {
    const sql = `
        SELECT DISTINCT (U.nome || ' ' || U.cognome) as nome_completo
        FROM NOTIZIE N
        LEFT JOIN UTENTI U ON N.autore_id = U.id
        WHERE N.pubblicata = true AND U.nome IS NOT NULL AND U.cognome IS NOT NULL
        ORDER BY nome_completo
    `;
    return new Promise((resolve, reject) => {
        sqlite.all(sql, (err, rows) => {
            if (err) {
                console.error('Errore SQL authors:', err);
                return reject({ error: 'Error retrieving authors: ' + err.message });
            }
            const authors = rows.map(row => row.nome_completo).filter(name => name && name.trim());
            resolve(authors);
        });
    });
}

/**
 * Recupera le notizie create da un utente specifico (area personale)
 * @async
 * @param {number} userId - ID utente autore
 * @returns {Promise<Array<Notizie>>}
 */
exports.getNotiziePersonali = async function(userId) {
    const sql = `
        SELECT N.id as N_id, N.titolo as N_titolo, N.sottotitolo as N_sottotitolo, N.immagine_principale_id as N_immagine, N.contenuto as N_contenuto, N.autore_id as N_autore_id, N.pubblicata as N_pubblicata, N.data_pubblicazione as N_data_pubblicazione, N.visualizzazioni as N_visualizzazioni, N.created_at as N_created_at, N.updated_at as N_updated_at, U.nome as autore_nome, U.cognome as autore_cognome, I.url as immagine_url
        FROM NOTIZIE N
        LEFT JOIN UTENTI U ON N.autore_id = U.id
        LEFT JOIN IMMAGINI I ON I.entita_riferimento = 'notizia' AND I.entita_id = N.id AND I.ordine = 1
        WHERE N.autore_id = ?
        ORDER BY N.created_at DESC
    `;
    return new Promise((resolve, reject) => {
        sqlite.all(sql, [userId], (err, notizie) => {
            if (err) {
                console.error('Errore SQL get notizie personali:', err);
                return reject({ error: 'Error retrieving personal news: ' + err.message });
            }

            try {
                const result = notizie.map(makeNotizie) || [];
                resolve(result);
            } catch (e) {
                return reject({ error: 'Error mapping personal news: ' + e.message });
            }
        });
    });
}