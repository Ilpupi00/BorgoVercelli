'use strict';

const sqlite = require('../config/database');
const Notizie= require('../models/notizia.js');

const makeNotizie = (row) => {
    // Costruisci il nome completo dell'autore
    let autore = '';
    if (row.autore_nome || row.autore_cognome) {
        autore = `${row.autore_nome || ''} ${row.autore_cognome || ''}`.trim();
    } else if (row.N_autore_id || row.autore_id) {
        autore = `Autore ID: ${row.N_autore_id || row.autore_id}`;
    }

    return new Notizie(
        row.N_id || row.id,
        row.N_titolo || row.titolo,
        row.N_sottotitolo || row.sottotitolo,
        {
            url: row.immagine_url || '/images/default-news.jpg',
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

exports.getNotiziePaginated = async function(offset = 0, limit = 6){
    const sql = `
        SELECT N.id as N_id, N.titolo as N_titolo, N.sottotitolo as N_sottotitolo, N.immagine_principale_id as N_immagine, N.contenuto as N_contenuto, N.autore_id as N_autore_id, N.pubblicata as N_pubblicata, N.data_pubblicazione as N_data_pubblicazione, N.visualizzazioni as N_visualizzazioni, N.created_at as N_created_at, N.updated_at as N_updated_at, U.nome as autore_nome, U.cognome as autore_cognome, I.url as immagine_url
        FROM NOTIZIE N
        LEFT JOIN UTENTI U ON N.autore_id = U.id
        LEFT JOIN IMMAGINI I ON I.entita_riferimento = 'notizia' AND I.entita_id = N.id AND I.ordine = 1
        WHERE N.pubblicata = 1
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

exports.createNotizia = async function(notiziaData) {
    const sql = `INSERT INTO NOTIZIE (titolo, sottotitolo, contenuto, immagine_principale_id, autore_id, pubblicata, data_pubblicazione, visualizzazioni, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, CASE WHEN ? = 1 THEN datetime('now') ELSE NULL END, 0, datetime('now'), datetime('now'))`;

    return new Promise((resolve, reject) => {
        sqlite.run(sql, [
            notiziaData.titolo,
            notiziaData.sottotitolo,
            notiziaData.contenuto,
            notiziaData.immagine_principale_id,
            notiziaData.autore_id,
            notiziaData.pubblicata,
            notiziaData.pubblicata
        ], function(err) {
            if (err) {
                return reject({ error: 'Error creating news: ' + err.message });
            }
            resolve({ success: true, id: this.lastID });
        });
    });
}

exports.updateNotizia = async function(id, notiziaData) {
    const sql = `UPDATE NOTIZIE SET
                 titolo = ?, sottotitolo = ?, contenuto = ?, immagine_principale_id = ?,
                 pubblicata = ?, data_pubblicazione = CASE WHEN ? = 1 THEN datetime('now') ELSE NULL END, updated_at = datetime('now')
                 WHERE id = ?`;

    return new Promise((resolve, reject) => {
        sqlite.run(sql, [
            notiziaData.titolo,
            notiziaData.sottotitolo,
            notiziaData.contenuto,
            notiziaData.immagine_principale_id,
            notiziaData.pubblicata ? 1 : 0,
            notiziaData.pubblicata ? 1 : 0,
            id
        ], function(err) {
            if (err) {
                return reject({ error: 'Error updating news: ' + err.message });
            }
            resolve({ success: true, changes: this.changes });
        });
    });
}

exports.togglePubblicazioneNotizia = async function(id) {
    const sql = `UPDATE NOTIZIE SET
                 pubblicata = CASE WHEN pubblicata = 1 THEN 0 ELSE 1 END,
                 data_pubblicazione = CASE WHEN pubblicata = 0 THEN datetime('now') WHEN pubblicata = 1 THEN NULL ELSE data_pubblicazione END,
                 updated_at = datetime('now')
                 WHERE id = ?`;

    return new Promise((resolve, reject) => {
        sqlite.run(sql, [id], function(err) {
            if (err) {
                return reject({ error: 'Error toggling news publication: ' + err.message });
            }
            resolve({ success: true, changes: this.changes });
        });
    });
}

exports.searchNotizie = async function(searchTerm) {
    const sql = `
        SELECT N.id as N_id, N.titolo as N_titolo, N.sottotitolo as N_sottotitolo, N.immagine_principale_id as N_immagine, N.autore_id as N_autore_id, N.pubblicata as N_pubblicata, N.data_pubblicazione as N_data_pubblicazione, N.created_at as N_created_at, N.updated_at as N_updated_at, U.nome as autore_nome, U.cognome as autore_cognome, I.url as immagine_url
        FROM NOTIZIE N
        LEFT JOIN UTENTI U ON N.autore_id = U.id
        LEFT JOIN IMMAGINI I ON I.entita_riferimento = 'notizia' AND I.entita_id = N.id AND I.ordine = 1
        WHERE N.pubblicata = 1 AND (N.titolo LIKE ? OR N.sottotitolo LIKE ?)
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

exports.getNotizieFiltered = async function(filters = {}, offset = 0, limit = 12) {
    let sql = `
        SELECT N.id as N_id, N.titolo as N_titolo, N.sottotitolo as N_sottotitolo, N.immagine_principale_id as N_immagine, N.contenuto as N_contenuto, N.autore_id as N_autore_id, N.pubblicata as N_pubblicata, N.data_pubblicazione as N_data_pubblicazione, N.visualizzazioni as N_visualizzazioni, N.created_at as N_created_at, N.updated_at as N_updated_at, U.nome as autore_nome, U.cognome as autore_cognome, I.url as immagine_url
        FROM NOTIZIE N
        LEFT JOIN UTENTI U ON N.autore_id = U.id
        LEFT JOIN IMMAGINI I ON I.entita_riferimento = 'notizia' AND I.entita_id = N.id AND I.ordine = 1
        WHERE N.pubblicata = 1
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

exports.getNotizieAuthors = async function() {
    const sql = `
        SELECT DISTINCT (U.nome || ' ' || U.cognome) as nome_completo
        FROM NOTIZIE N
        LEFT JOIN UTENTI U ON N.autore_id = U.id
        WHERE N.pubblicata = 1 AND U.nome IS NOT NULL AND U.cognome IS NOT NULL
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