/**
 * @fileoverview DAO per la gestione delle squadre e giocatori
 * Fornisce metodi per CRUD di squadre, giocatori e dirigenti
 * @module features/squadre/services/dao-squadre
 */

'use strict';

const sqlite = require('../../../core/config/database');
const Giocatore = require('../../../core/models/giocatore.js');
const Squadra = require('../../../core/models/squadra.js');
const daoDirigenti = require('./dao-dirigenti-squadre.js');

/**
 * Factory: crea un'istanza di Squadra da una riga DB
 * @param {Object} row - Riga del DB contenente i campi squadra
 * @returns {Squadra}
 */
const makeSquadra = (row) => {
    return new Squadra(
        row.id,
        row.nome,
        row.immagine_url,
        row.Anno,
        row.dirigenti || [],  // Aggiunto per dirigenti
        row.giocatori || [],   // Aggiunto per giocatori
        row.numero_giocatori || 0  // Numero di giocatori attivi
    );
}

/**
 * Factory: crea un'istanza di Giocatore da una riga DB
 * @param {Object} row - Riga DB con campi giocatore
 * @returns {Giocatore}
 */
const makeGiocatore = (row) => {
    return new Giocatore({
        id: row.id,
        id_immagine: row.id_immagine,
        squadra_id: row.squadra_id,
        numero_maglia: row.numero_maglia,
        ruolo: row.ruolo,
        data_nascita: row.data_nascita,
        piede_preferito: row.piede_preferito,
        data_inizio_tesseramento: row.data_inizio_tesseramento,
        data_fine_tesseramento: row.data_fine_tesseramento,
        attivo: row.attivo,
        created_at: row.created_at,
        updated_at: row.updated_at,
        Nazionalita: row.nazionalita,
        Nome: row.nome,
        Cognome: row.cognome
    });
}



/**
 * Recupera tutte le squadre con immagine e conteggio giocatori
 * Per ogni squadra recupera anche i dirigenti associati
 * @async
 * @returns {Promise<Array<Squadra>>} Array di istanze Squadra
 */
exports.getSquadre = async () => {
    const sql = `
        SELECT 
            s.*, 
            i.url AS immagine_url,
            (SELECT COUNT(*) FROM GIOCATORI g WHERE g.squadra_id = s.id AND g.attivo = true) AS numero_giocatori
        FROM SQUADRE s 
        -- In Postgres usiamo la tabella IMMAGINI con relazione tramite entita_riferimento/entita_id
        LEFT JOIN IMMAGINI i ON i.entita_riferimento = 'squadra' AND i.entita_id = s.id AND i.ordine = 1
    `;
    return new Promise((resolve, reject) => {
        sqlite.all(sql, async (err, squadre) => {
            if (err) {
                return reject({ error: 'Error retrieving teams: ' + err.message });
            }
            // Per ogni squadra, recupera i dirigenti
            const squadreConDirigenti = await Promise.all(squadre.map(async (squadra) => {
                const dirigenti = await daoDirigenti.getDirigentiBySquadra(squadra.id);
                return { ...squadra, dirigenti };
            }));
            resolve(squadreConDirigenti.map(makeSquadra) || []);
        });
    });
}

/**
 * Recupera tutti i giocatori attivi con i campi principali e immagine
 * @async
 * @returns {Promise<Array<Giocatore>>} Array di istanze Giocatore
 */
exports.getGiocatori =async ()=>{
    const sql = `SELECT 
        g.id,
        i.url AS id_immagine,
        g.squadra_id,
        g.numero_maglia,
        g.ruolo,
        g.data_nascita,
        g.piede_preferito,
        g.data_inizio_tesseramento,
        g.data_fine_tesseramento,
        g.attivo,
        g.created_at,
        g.updated_at,
        g.Nazionalità AS nazionalita,
        g.Nome AS nome,
        g.Cognome AS cognome
    FROM GIOCATORI g
    LEFT JOIN IMMAGINI i ON g.immagini_id = i.id`;
    return new Promise((resolve, reject) => {
        sqlite.all(sql, (err, rows) => {
            if (err) {
                return reject({ error: 'Error retrieving players: ' + err.message });
            }
            // Mappa ogni riga in un oggetto Giocatore
            const giocatori = (rows || []).map(makeGiocatore);
            resolve(giocatori);
        });
    });
}

/**
 * Crea una nuova squadra
 * @param {string} nome - Nome della squadra
 * @param {number} annoFondazione - Anno di fondazione
 * @returns {Promise<Object>} { id, message }
 */
exports.createSquadra = function(nome, annoFondazione) {
    const sql = 'INSERT INTO SQUADRE (nome, Anno) VALUES (?, ?) RETURNING id';
    return new Promise((resolve, reject) => {
        sqlite.run(sql, [nome, annoFondazione], function(err, result) {
            if (err) {
                console.error('Errore SQL insert squadra:', err);
                return reject({ error: 'Errore nella creazione della squadra: ' + err.message });
            }
            resolve({ id: result.rows[0].id, message: 'Squadra creata con successo' });
        });
    });
}

/**
 * Aggiorna i dati di una squadra
 * @param {number} id - ID della squadra
 * @param {string} nome - Nuovo nome
 * @param {number} anno - Anno
 * @param {number|null} [id_immagine] - ID immagine logo (opzionale)
 * @returns {Promise<Object>} { message }
 */
exports.updateSquadra = function(id, nome, anno, id_immagine = null) {
    let sql = 'UPDATE SQUADRE SET nome = ?, Anno = ?';
    let params = [nome, anno,];
    if (id_immagine !== null) {
        sql += ', id_immagine = ?';
        params.push(id_immagine);
    }
    sql += ' WHERE id = ?';
    params.push(parseInt(id));
    return new Promise((resolve, reject) => {
        sqlite.run(sql, params, function(err, result) {
            if (err) {
                console.error('Errore SQL update squadra:', err);
                return reject({ error: 'Errore nell\'aggiornamento della squadra: ' + err.message });
            }
            const changes = (result && typeof result.rowCount === 'number') ? result.rowCount : 0;
            if (changes === 0) {
                return reject({ error: 'Squadra non trovata' });
            }
            resolve({ message: 'Squadra aggiornata con successo' });
        });
    });
}

/**
 * Elimina una squadra (hard delete)
 * @param {number} id - ID squadra
 * @returns {Promise<Object>} { message }
 */
exports.deleteSquadra = function(id) {
    const sql = 'DELETE FROM SQUADRE WHERE id = ?';
    return new Promise((resolve, reject) => {
        sqlite.run(sql, [parseInt(id)], function(err, result) {
            if (err) {
                console.error('Errore SQL delete squadra:', err);
                return reject({ error: 'Errore nella cancellazione della squadra: ' + err.message });
            }
            const changes = (result && typeof result.rowCount === 'number') ? result.rowCount : 0;
            if (changes === 0) {
                return reject({ error: 'Squadra non trovata' });
            }
            resolve({ message: 'Squadra cancellata con successo' });
        });
    });
}

/**
 * Recupera una squadra per ID (include dirigenti e giocatori)
 * @param {number} id - ID squadra
 * @returns {Promise<Object|null>} Oggetto squadra esteso o null
 */
exports.getSquadraById = function(id) {
    const sql = 'SELECT * FROM SQUADRE WHERE id = ?';
    return new Promise((resolve, reject) => {
        sqlite.get(sql, [parseInt(id)], async (err, squadra) => {
            if (err) {
                return reject({ error: 'Errore nel recupero della squadra: ' + err.message });
            }
            if (!squadra) {
                // Restituisci null invece di errore per gestire meglio il caso
                return resolve(null);
            }
            // Recupera i dirigenti
            const dirigenti = await daoDirigenti.getDirigentiBySquadra(squadra.id);
            // Recupera i giocatori
            const giocatori = await this.getGiocatoriBySquadra(squadra.id);
            resolve({ ...squadra, dirigenti, giocatori });
        });
    });
}

/**
 * Cerca squadre per termine (autocomplete)
 * @async
 * @param {string} searchTerm - Term for LIKE query
 * @returns {Promise<Array<Squadra>>} Array di squadre (limit 10)
 */
exports.searchSquadre = async function(searchTerm) {
    const sql = `
        SELECT id, nome, id_immagine, Anno
        FROM SQUADRE
        WHERE nome LIKE ?
        ORDER BY nome ASC
        LIMIT 10
    `;
    return new Promise((resolve, reject) => {
        sqlite.all(sql, [searchTerm], async (err, squadre) => {
            if (err) {
                console.error('Errore SQL search squadre:', err);
                return reject({ error: 'Error searching teams: ' + err.message });
            }
            // Per ogni squadra, recupera i dirigenti
            const squadreConDirigenti = await Promise.all(squadre.map(async (squadra) => {
                const dirigenti = await daoDirigenti.getDirigentiBySquadra(squadra.id);
                return makeSquadra({ ...squadra, dirigenti });
            }));
            resolve(squadreConDirigenti || []);
        });
    });
}

/**
 * Recupera i giocatori attivi di una specifica squadra
 * @param {number} squadraId - ID della squadra
 * @returns {Promise<Array<Giocatore>>} Array di giocatori
 */
exports.getGiocatoriBySquadra = function(squadraId) {
    const sql = `SELECT 
        id,
        immagini_id AS id_immagine,
        squadra_id,
        numero_maglia,
        ruolo,
        data_nascita,
        piede_preferito,
        data_inizio_tesseramento,
        data_fine_tesseramento,
        attivo,
        created_at,
        updated_at,
        Nazionalità AS nazionalita,
        Nome AS nome,
        Cognome AS cognome
    FROM GIOCATORI 
    WHERE squadra_id = ? AND attivo = true
    ORDER BY numero_maglia ASC`;
    return new Promise((resolve, reject) => {
        sqlite.all(sql, [parseInt(squadraId)], (err, rows) => {
            if (err) {
                return reject({ error: 'Errore nel recupero dei giocatori: ' + err.message });
            }
            const giocatori = (rows || []).map(makeGiocatore);
            resolve(giocatori);
        });
    });
}

/**
 * Crea un nuovo giocatore
 * @param {Object} giocatoreData - Dati del giocatore
 * @returns {Promise<Object>} { id, message }
 */
exports.createGiocatore = function(giocatoreData) {
    const sql = `INSERT INTO GIOCATORI
        (Nome, Cognome, numero_maglia, ruolo, data_nascita, piede_preferito, Nazionalità, squadra_id, immagini_id, attivo, data_inizio_tesseramento)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, true, NOW())
        RETURNING id`;
    return new Promise((resolve, reject) => {
        sqlite.run(sql, [
            giocatoreData.nome,
            giocatoreData.cognome,
            giocatoreData.numero_maglia || null,
            giocatoreData.ruolo || null,
            giocatoreData.data_nascita || null,
            giocatoreData.piede_preferito || null,
            giocatoreData.nazionalita || null,
            giocatoreData.squadra_id,
            giocatoreData.immagini_id || null
        ], function(err, result) {
            if (err) {
                console.error('Errore SQL insert giocatore:', err);
                return reject({ error: 'Errore nella creazione del giocatore: ' + err.message });
            }
            resolve({ id: result.rows[0].id, message: 'Giocatore creato con successo' });
        });
    });
}

// NOTE: updateGiocatore implemented later using COALESCE to preserve existing immagini_id when not provided

/**
 * Rimuove (soft-delete) un giocatore impostando attivo = 0
 * @param {number} id - ID giocatore
 * @returns {Promise<Object>} { message }
 */
exports.deleteGiocatore = function(id) {
    const sql = 'UPDATE GIOCATORI SET attivo = false, data_fine_tesseramento = NOW() WHERE id = ?';
    return new Promise((resolve, reject) => {
        sqlite.run(sql, [parseInt(id)], function(err, result) {
            if (err) {
                console.error('Errore SQL delete giocatore:', err);
                return reject({ error: 'Errore nella rimozione del giocatore: ' + err.message });
            }
            const changes = (result && typeof result.rowCount === 'number') ? result.rowCount : 0;
            if (changes === 0) {
                return reject({ error: 'Giocatore non trovato' });
            }
            resolve({ message: 'Giocatore rimosso con successo' });
        });
    });
}

/**
 * Recupera un giocatore attivo per ID
 * @param {number} id - ID giocatore
 * @returns {Promise<Giocatore>} Istanza Giocatore
 */
exports.getGiocatoreById = function(id) {
    const sql = `SELECT
        id,
        immagini_id AS id_immagine,
        squadra_id,
        numero_maglia,
        ruolo,
        data_nascita,
        piede_preferito,
        data_inizio_tesseramento,
        data_fine_tesseramento,
        attivo,
        created_at,
        updated_at,
        Nazionalità AS nazionalita,
        Nome AS nome,
        Cognome AS cognome
    FROM GIOCATORI WHERE id = ? AND attivo = true`;
    return new Promise((resolve, reject) => {
        sqlite.get(sql, [parseInt(id)], (err, row) => {
            if (err) {
                return reject({ error: 'Errore nel recupero del giocatore: ' + err.message });
            }
            if (!row) {
                return reject({ error: 'Giocatore non trovato' });
            }
            const giocatore = makeGiocatore(row);
            resolve(giocatore);
        });
    });
}

/**
 * Aggiunge un giocatore a una squadra e restituisce l'oggetto appena creato
 * @param {number} squadraId - ID squadra
 * @param {Object} giocatoreData - Dati giocatore
 * @returns {Promise<Giocatore>} Giocatore creato
 */
exports.addGiocatore = function(squadraId, giocatoreData) {
    const sql = `INSERT INTO GIOCATORI (
        squadra_id, numero_maglia, ruolo, piede_preferito, Nazionalità, Nome, Cognome, immagini_id,
        data_inizio_tesseramento, attivo, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), true, NOW(), NOW())
    RETURNING id`;

    return new Promise((resolve, reject) => {
        sqlite.run(sql, [
            parseInt(squadraId),
            giocatoreData.numero_maglia,
            giocatoreData.ruolo,
            giocatoreData.piede_preferito,
            giocatoreData.nazionalita,
            giocatoreData.nome,
            giocatoreData.cognome,
            giocatoreData.foto
        ], function(err, result) {
            if (err) {
                return reject({ error: 'Errore nell\'aggiunta del giocatore: ' + err.message });
            }
            // Recupera il giocatore appena creato
            exports.getGiocatoreById(result.rows[0].id)
                .then(giocatore => resolve(giocatore))
                .catch(err => reject(err));
        });
    });
}

/**
 * Rimuove un giocatore (soft) aggiornando il flag attivo
 * @param {number} id - ID giocatore
 * @returns {Promise<Object>} { message }
 */
exports.removeGiocatore = function(id) {
    const sql = 'UPDATE GIOCATORI SET attivo = false, updated_at = NOW() WHERE id = ?';
    return new Promise((resolve, reject) => {
        sqlite.run(sql, [parseInt(id)], function(err) {
            if (err) {
                return reject({ error: 'Errore nella rimozione del giocatore: ' + err.message });
            }
            if (this.changes === 0) {
                return reject({ error: 'Giocatore non trovato' });
            }
            resolve({ message: 'Giocatore rimosso con successo' });
        });
    });
}

/**
 * Aggiunge un dirigente a una squadra dato l'email dell'utente
 * @param {number} squadraId - ID squadra
 * @param {string} email - Email utente
 * @returns {Promise<Object>} Oggetto dirigente appena creato
 */
exports.addDirigente = function(squadraId, email) {
    // Prima recupera l'utente dall'email
    const sqlGetUser = 'SELECT id FROM UTENTI WHERE email = ?';
    const sqlInsertDirigente = 'INSERT INTO DIRIGENTI_SQUADRE (squadra_id, utente_id) VALUES (?, ?)';

    return new Promise((resolve, reject) => {
        sqlite.get(sqlGetUser, [email], (err, user) => {
            if (err) {
                return reject({ error: 'Errore nel recupero dell\'utente: ' + err.message });
            }
            if (!user) {
                return reject({ error: 'Utente con questa email non trovato' });
            }

            // Verifica se l'utente è già dirigente di questa squadra
            const sqlCheck = 'SELECT id FROM DIRIGENTI_SQUADRE WHERE squadra_id = ? AND utente_id = ?';
            sqlite.get(sqlCheck, [parseInt(squadraId), user.id], (err, existing) => {
                if (err) {
                    return reject({ error: 'Errore nella verifica: ' + err.message });
                }
                if (existing) {
                    return reject({ error: 'Questo utente è già dirigente di questa squadra' });
                }

                // Aggiungi il dirigente
                const sqlInsertWithReturning = sqlInsertDirigente + ' RETURNING id';
                sqlite.run(sqlInsertWithReturning, [parseInt(squadraId), user.id], function(err, result) {
                    if (err) {
                        return reject({ error: 'Errore nell\'aggiunta del dirigente: ' + err.message });
                    }
                    // Recupera i dati completi del dirigente appena aggiunto
                    const sqlGetDirigente = `
                        SELECT ds.id, u.email, u.nome, u.cognome, u.immagine_profilo as immagine
                        FROM DIRIGENTI_SQUADRE ds
                        JOIN UTENTI u ON ds.utente_id = u.id
                        WHERE ds.id = ?
                    `;
                    sqlite.get(sqlGetDirigente, [result.rows[0].id], (err, dirigente) => {
                        if (err) {
                            return reject({ error: 'Errore nel recupero del dirigente: ' + err.message });
                        }
                        resolve(dirigente);
                    });
                });
            });
        });
    });
}

/**
 * Rimuove un dirigente da una squadra
 * @param {number} squadraId
 * @param {number} dirigenteId - ID record dirigente nella tabella DIRIGENTI_SQUADRE
 * @returns {Promise<Object>} { message }
 */
exports.removeDirigente = function(squadraId, dirigenteId) {
    const sql = 'DELETE FROM DIRIGENTI_SQUADRE WHERE squadra_id = ? AND id = ?';
    return new Promise((resolve, reject) => {
        sqlite.run(sql, [parseInt(squadraId), parseInt(dirigenteId)], function(err, result) {
            if (err) {
                return reject({ error: 'Errore nella rimozione del dirigente: ' + err.message });
            }
            const changes = (result && typeof result.rowCount === 'number') ? result.rowCount : 0;
            if (changes === 0) {
                return reject({ error: 'Dirigente non trovato in questa squadra' });
            }
            resolve({ message: 'Dirigente rimosso con successo' });
        });
    });
}

// Nota: la funzione `exports.getSquadraById` è definita più sopra e restituisce squadra con dirigenti e giocatori.
// Qui non sovrascriviamo quella implementazione.

/**
 * Aggiorna i dati di un giocatore (mantiene immagini_id se non fornito)
 * @param {number} id - ID giocatore
 * @param {Object} giocatoreData - Dati aggiornati
 * @returns {Promise<Object>} { message }
 */
exports.updateGiocatore = async (id, giocatoreData) => {
    const sql = `UPDATE GIOCATORI SET Nome = ?, Cognome = ?, ruolo = ?, numero_maglia = ?, data_nascita = ?, piede_preferito = ?, Nazionalità = ?, immagini_id = COALESCE(?, immagini_id), updated_at = NOW()
                 WHERE id = ?`;
    return new Promise((resolve, reject) => {
        sqlite.run(sql, [
            giocatoreData.nome,
            giocatoreData.cognome,
            giocatoreData.ruolo,
            giocatoreData.numero_maglia,
            giocatoreData.data_nascita,
            giocatoreData.piede_preferito,
            giocatoreData.nazionalita,
            giocatoreData.immagini_id,
            id
        ], function(err, result) {
            if (err) {
                return reject({ error: 'Errore aggiornamento giocatore: ' + err.message });
            }
            const changes = (result && typeof result.rowCount === 'number') ? result.rowCount : 0;
            if (changes === 0) {
                return reject({ error: 'Giocatore non trovato' });
            }
            resolve({ message: 'Giocatore aggiornato' });
        });
    });
}

// NOTE: removal of giocatore handled above via soft-delete (set attivo = 0) to preserve history
// Esporta l'oggetto exports per compatibilità
module.exports = exports;