'use strict';

/**
 * @fileoverview DAO per la gestione degli eventi
 * Fornisce CRUD e ricerche per eventi
 * 
 * NOTA IMPORTANTE: Le funzioni di recupero eventi includono automaticamente
 * l'URL dell'immagine principale tramite LEFT JOIN con la tabella IMMAGINI.
 * L'URL viene esposto come proprietà 'immagine_url' nell'oggetto evento.
 * 
 * @module features/eventi/services/dao-eventi
 */

const sqlite = require('../../../core/config/database');
const Evento = require('../../../core/models/evento.js');

const makeEvento=(row)=>{
    return new Evento(
        row.id,
        row.titolo,
        row.descrizione,
        row.data_inizio,
        row.data_fine,
        row.luogo,
        row.tipo_evento,
        row.autore_id,
        row.squadra_id,
        row.campo_id,
        row.max_partecipanti,
        row.pubblicato,
        row.created_at,
        row.updated_at
    );
}

/**
 * Recupera tutti gli eventi
 * @async
 * @returns {Promise<Array<Evento>>} Array di eventi
 */
exports.getEventi = function(){
    return new Promise((resolve, reject) => {
    // Return only published events by default to avoid exposing drafts in public lists
    // Use boolean true for Postgres boolean column
    // JOIN con IMMAGINI per recuperare l'URL dell'immagine principale
    const sql = `
        SELECT 
            e.id, e.titolo, e.descrizione, e.data_inizio, e.data_fine, e.luogo, 
            e.tipo_evento, e.autore_id, e.squadra_id, e.campo_id, e.max_partecipanti, 
            e.pubblicato, e.created_at, e.updated_at,
            i.url as immagine_url
        FROM EVENTI e
        LEFT JOIN IMMAGINI i ON i.entita_riferimento = 'evento' AND i.entita_id = e.id AND i.ordine = 1
        WHERE e.pubblicato = true 
        ORDER BY e.data_inizio DESC
    `;
        sqlite.all(sql, (err, eventi) => {
            if (err) {
                console.error('Errore SQL:', err);
                return reject({ error: 'Error retrieving events: ' + err.message });
            }
            const risultato = eventi.map(row => {
                const evento = makeEvento(row);
                // Aggiungi l'URL dell'immagine se presente
                if (row.immagine_url) {
                    evento.immagine_url = row.immagine_url;
                }
                return evento;
            }) || [];
            resolve(risultato);
        });
    });
}

/**
 * Recupera solo gli eventi pubblicati
 * @async
 * @returns {Promise<Array<Evento>>}
 */
exports.getEventiPubblicati = function(){
    return new Promise((resolve, reject) => {
    // Ensure consistent ordering and boolean-based published check
    // JOIN con IMMAGINI per recuperare l'URL dell'immagine principale
    const sql = `
        SELECT 
            e.id, e.titolo, e.descrizione, e.data_inizio, e.data_fine, e.luogo, 
            e.tipo_evento, e.autore_id, e.squadra_id, e.campo_id, e.max_partecipanti, 
            e.pubblicato, e.created_at, e.updated_at,
            i.url as immagine_url
        FROM EVENTI e
        LEFT JOIN IMMAGINI i ON i.entita_riferimento = 'evento' AND i.entita_id = e.id AND i.ordine = 1
        WHERE e.pubblicato = true 
        ORDER BY e.data_inizio DESC
    `;
        sqlite.all(sql, (err, eventi) => {
            if (err) {
                console.error('Errore SQL:', err);
                return reject({ error: 'Error retrieving published events: ' + err.message });
            }
            const risultato = eventi.map(row => {
                const evento = makeEvento(row);
                // Aggiungi l'URL dell'immagine se presente
                if (row.immagine_url) {
                    evento.immagine_url = row.immagine_url;
                }
                return evento;
            }) || [];
            resolve(risultato);
        });
    });
}

/**
 * Recupera un evento per ID con immagini
 * @async
 * @param {number} id - ID evento
 * @returns {Promise<Evento>} Istanza Evento con array immagini
 */
exports.getEventoById = function(id) {
    const sql = `
        SELECT 
            e.id, e.titolo, e.descrizione, e.data_inizio, e.data_fine, e.luogo, 
            e.tipo_evento, e.autore_id, e.squadra_id, e.campo_id, e.max_partecipanti, 
            e.pubblicato, e.created_at, e.updated_at,
            i.url as immagine_url
        FROM EVENTI e
        LEFT JOIN IMMAGINI i ON i.entita_riferimento = 'evento' AND i.entita_id = e.id AND i.ordine = 1
        WHERE e.id = ?
    `;
    return new Promise((resolve, reject) => {
        sqlite.get(sql, [id], async (err, evento) => {
            if (err) {
                console.error('Errore SQL get evento by id:', err);
                return reject({ error: 'Error retrieving event: ' + err.message });
            }
            if (!evento) {
                return reject({ error: 'Event not found' });
            }
            
            const eventoObj = makeEvento(evento);
            // Aggiungi l'URL dell'immagine se presente
            if (evento.immagine_url) {
                eventoObj.immagine_url = evento.immagine_url;
            }
            
            // Recupera tutte le immagini associate per eventuali gallerie
            const imgSql = 'SELECT * FROM IMMAGINI WHERE entita_riferimento = ? AND entita_id = ? ORDER BY ordine';
            sqlite.all(imgSql, ['evento', id], (err, immagini) => {
                if (err) {
                    console.warn('Errore recupero immagini evento:', err);
                    eventoObj.immagini = [];
                } else {
                    eventoObj.immagini = immagini || [];
                }
                resolve(eventoObj);
            });
        });
    });
}

/**
 * Crea un nuovo evento
 * @async
 * @param {Object} eventoData - Dati evento
 * @returns {Promise<Object>} { id, success }
 */
exports.createEvento = function(eventoData) {
    const sql = `INSERT INTO EVENTI (
        titolo, descrizione, data_inizio, data_fine, luogo, tipo_evento,
        autore_id, squadra_id, campo_id, max_partecipanti, pubblicato, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    RETURNING id`;

    return new Promise((resolve, reject) => {
        sqlite.run(sql, [
            eventoData.titolo,
            eventoData.descrizione,
            eventoData.data_inizio,
            eventoData.data_fine,
            eventoData.luogo,
            eventoData.tipo_evento,
            eventoData.autore_id,
            eventoData.squadra_id,
            eventoData.campo_id,
            eventoData.max_partecipanti,
            eventoData.pubblicato ? true : false
        ], function(err, result) {
            if (err) {
                console.error('Errore SQL create evento:', err);
                return reject({ error: 'Error creating event: ' + err.message });
            }
            resolve({ id: result.rows[0].id, success: true });
        });
    });
}

/**
 * Aggiorna un evento esistente
 * @async
 * @param {number} id - ID evento
 * @param {Object} eventoData - Campi aggiornati
 * @returns {Promise<Object>} { success }
 */
exports.updateEvento = function(id, eventoData) {
    const sql = `UPDATE EVENTI SET
        titolo = ?, descrizione = ?, data_inizio = ?, data_fine = ?,
        luogo = ?, tipo_evento = ?, autore_id = ?, squadra_id = ?, campo_id = ?,
        max_partecipanti = ?, pubblicato = ?, updated_at = NOW()
        WHERE id = ?`;

    return new Promise((resolve, reject) => {
        sqlite.run(sql, [
            eventoData.titolo,
            eventoData.descrizione,
            eventoData.data_inizio,
            eventoData.data_fine,
            eventoData.luogo,
            eventoData.tipo_evento,
            eventoData.autore_id,
            eventoData.squadra_id,
            eventoData.campo_id,
            eventoData.max_partecipanti,
            eventoData.pubblicato ? true : false,
            id
        ], function(err, result) {
            if (err) {
                console.error('Errore SQL update evento:', err);
                return reject({ error: 'Error updating event: ' + err.message });
            }
            const changes = (result && typeof result.rowCount === 'number') ? result.rowCount : 0;
            if (changes === 0) {
                return reject({ error: 'Event not found' });
            }
            resolve({ success: true, changes });
        });
    });
}

/**
 * Elimina un evento per ID
 * @async
 * @param {number} id - ID evento
 * @returns {Promise<Object>} { success }
 */
exports.deleteEventoById = function(id) {
    const sql = 'DELETE FROM EVENTI WHERE id = ?';
    return new Promise((resolve, reject) => {
        sqlite.run(sql, [id], function(err) {
            if (err) {
                console.error('Errore SQL delete evento:', err);
                return reject({ error: 'Error deleting event: ' + err.message });
            }
            // Postgres wrapper returns result with rowCount
            const changes = (arguments[1] && typeof arguments[1].rowCount === 'number') ? arguments[1].rowCount : 0;
            console.log('[DAO:eventi] deleteEventoById called with id=', id, 'changes=', changes);
            if (changes === 0) {
                return reject({ error: 'Event not found' });
            }
            resolve({ success: true, changes });
        });
    });
}

/**
 * Attiva/disattiva la pubblicazione di un evento
 * @async
 * @param {number} id - ID evento
 * @returns {Promise<Object>} { success }
 */
exports.togglePubblicazioneEvento = function(id) {
    // Use boolean inversion and Postgres NOW() to avoid boolean=int comparisons
    const sql = 'UPDATE EVENTI SET pubblicato = NOT pubblicato, updated_at = NOW() WHERE id = ?';
    return new Promise((resolve, reject) => {
        sqlite.run(sql, [id], function(err, result) {
            if (err) {
                console.error('Errore SQL toggle pubblicazione evento:', err);
                return reject({ error: 'Error toggling event publication: ' + err.message });
            }
            const changes = (result && typeof result.rowCount === 'number') ? result.rowCount : 0;
            console.log('[DAO:eventi] togglePubblicazioneEvento called with id=', id, 'changes=', changes);
            if (changes === 0) {
                return reject({ error: 'Event not found' });
            }
            resolve({ success: true, changes });
        });
    });
}

/**
 * Imposta l'immagine principale per un evento (colonna `immagine_id`)
 * @async
 * @param {number} id - ID evento
 * @param {number} immagineId - ID immagine
 * @returns {Promise<Object>} { success }
 */
exports.setImmagineEvento = function(id, immagineId) {
    const sql = `UPDATE EVENTI SET immagine_id = ?, updated_at = NOW() WHERE id = ?`;
    return new Promise((resolve, reject) => {
        sqlite.run(sql, [immagineId, id], function(err, result) {
            if (err) {
                console.error('Errore SQL set immagine evento:', err);
                return reject({ error: 'Error setting event image: ' + err.message });
            }
            const changes = (result && typeof result.rowCount === 'number') ? result.rowCount : 0;
            resolve({ success: true, changes });
        });
    });
}

/**
 * Cerca eventi pubblicati per titolo/descrizione/luogo
 * @async
 * @param {string} searchTerm - Term per LIKE
 * @returns {Promise<Array<Evento>>}
 */
exports.searchEventi = async function(searchTerm) {
    const sql = `
        SELECT 
            e.id, e.titolo, e.descrizione, e.data_inizio, e.data_fine, e.luogo, 
            e.tipo_evento, e.autore_id, e.squadra_id, e.campo_id, e.max_partecipanti, 
            e.pubblicato, e.created_at, e.updated_at,
            i.url as immagine_url
        FROM EVENTI e
        LEFT JOIN IMMAGINI i ON i.entita_riferimento = 'evento' AND i.entita_id = e.id AND i.ordine = 1
        WHERE e.pubblicato = true AND (e.titolo LIKE ? OR e.descrizione LIKE ? OR e.luogo LIKE ?)
        ORDER BY e.data_inizio DESC
        LIMIT 10
    `;
    return new Promise((resolve, reject) => {
        sqlite.all(sql, [searchTerm, searchTerm, searchTerm], (err, eventi) => {
            if (err) {
                console.error('Errore SQL search eventi:', err);
                return reject({ error: 'Error searching events: ' + err.message });
            }
            const risultato = eventi.map(row => {
                const evento = makeEvento(row);
                if (row.immagine_url) {
                    evento.immagine_url = row.immagine_url;
                }
                return evento;
            }) || [];
            resolve(risultato);
        });
    });
}
        });
    });
}

/**
 * Recupera gli eventi creati da un utente
 * @async
 * @param {number} utenteId - ID autore
 * @returns {Promise<Array<Evento>>}
 */
exports.getEventiPersonali= async function(utenteId){
    const sql = `
        SELECT 
            e.*,
            i.url as immagine_url
        FROM EVENTI e
        LEFT JOIN IMMAGINI i ON i.entita_riferimento = 'evento' AND i.entita_id = e.id AND i.ordine = 1
        WHERE e.autore_id = ?
        ORDER BY e.data_inizio DESC
    `;
    return new Promise((resolve, reject) => {
        sqlite.all(sql, [utenteId], (err, eventi) => {
            if (err) {
                console.error('Errore SQL get eventi personali:', err);
                return reject({ error: 'Error getting personal events: ' + err.message });
            }
            const risultato = eventi.map(row => {
                const evento = makeEvento(row);
                if (row.immagine_url) {
                    evento.immagine_url = row.immagine_url;
                }
                return evento;
            }) || [];
            resolve(risultato);
        });
    });
}

exports.getEventiAll = function(){
    const sql = `
        SELECT 
            e.id, e.titolo, e.descrizione, e.data_inizio, e.data_fine, e.luogo, 
            e.tipo_evento, e.autore_id, e.squadra_id, e.campo_id, e.max_partecipanti, 
            e.pubblicato, e.created_at, e.updated_at,
            i.url as immagine_url
        FROM EVENTI e
        LEFT JOIN IMMAGINI i ON i.entita_riferimento = 'evento' AND i.entita_id = e.id AND i.ordine = 1
        ORDER BY e.data_inizio DESC
    `;
    return new Promise((resolve, reject) => {
        sqlite.all(sql, (err, eventi) => {
            if (err) {
                console.error('Errore SQL get eventi all:', err);
                return reject({ error: 'Error getting all events: ' + err.message });
            }
            const risultato = eventi.map(row => {
                const evento = makeEvento(row);
                if (row.immagine_url) {
                    evento.immagine_url = row.immagine_url;
                }
                return evento;
            }) || [];
            resolve(risultato);
        });
    });
}
