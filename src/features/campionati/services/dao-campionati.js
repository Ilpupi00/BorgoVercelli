/**
 * @fileoverview DAO per la gestione dei campionati
 * Fornisce operazioni CRUD per campionati, squadre e classifiche
 * @module features/campionati/services/dao-campionati
 */

'use strict';

const sqlite = require('../../../core/config/database');
const Campionato = require('../../../core/models/campionato.js');

/**
 * Factory function per creare istanze Campionato da righe database
 *
 * @param {Object} row - Riga del database con dati campionato
 * @param {number} row.id - ID univoco campionato
 * @param {string} row.nome - Nome del campionato
 * @param {string} row.stagione - Stagione (es: "2024-2025")
 * @param {string} row.categoria - Categoria (es: "Prima Categoria")
 * @param {number|null} row.fonte_esterna_id - ID fonte esterna
 * @param {string|null} row.url_fonte - URL fonte esterna
 * @param {boolean} row.attivo - Stato attivo campionato
 * @param {string} row.created_at - Data creazione
 * @param {string} row.updated_at - Data ultimo aggiornamento
 * @param {number} row.promozione_diretta - Numero promozioni dirette
 * @param {number} row.playoff_start - Posizione inizio playoff
 * @param {number} row.playoff_end - Posizione fine playoff
 * @param {number} row.playout_start - Posizione inizio playout
 * @param {number} row.playout_end - Posizione fine playout
 * @param {number} row.retrocessione_diretta - Numero retrocessioni dirette
 * @returns {Campionato} Istanza Campionato
 */
const makeCampionato = (row) => {
    return new Campionato(
        row.id,
        row.nome,
        row.stagione,
        row.categoria,
        row.fonte_esterna_id,
        row.url_fonte,
        row.attivo,
        row.created_at,
        row.updated_at,
        row.promozione_diretta,
        row.playoff_start,
        row.playoff_end,
        row.playout_start,
        row.playout_end,
        row.retrocessione_diretta
    );
};

/**
 * Ottiene tutti i campionati (senza filtro attivo per admin)
 * @async
 * @returns {Promise<Campionato[]>} Array di tutti i campionati
 * @throws {Object} Oggetto errore con proprietà error
 */
exports.getAllCampionati = async function() {
    const sql = `
        SELECT id, nome, stagione, categoria, fonte_esterna_id, url_fonte, attivo, created_at, updated_at,
               promozione_diretta, playoff_start, playoff_end, playout_start, playout_end, retrocessione_diretta
        FROM CAMPIONATI
        ORDER BY created_at DESC, nome ASC
    `;

    return new Promise((resolve, reject) => {
        sqlite.all(sql, (err, campionati) => {
            if (err) {
                console.error('Errore SQL:', err);
                return reject({ error: 'Errore nel recupero dei campionati: ' + err.message });
            }

            try {
                const result = campionati.map(makeCampionato) || [];
                resolve(result);
            } catch (e) {
                console.error('Errore nella creazione degli oggetti Campionato:', e);
                reject({ error: 'Errore nella creazione degli oggetti Campionato: ' + e.message });
            }
        });
    });
};

/**
 * Ottiene tutti i campionati attivi (per utenti normali)
 * @async
 * @returns {Promise<Campionato[]>} Array di campionati attivi
 * @throws {Object} Oggetto errore con proprietà error
 */
exports.getCampionati = async function() {
    const sql = `
        SELECT id, nome, stagione, categoria, fonte_esterna_id, url_fonte, attivo, created_at, updated_at,
               promozione_diretta, playoff_start, playoff_end, playout_start, playout_end, retrocessione_diretta
        FROM CAMPIONATI
        WHERE attivo = true
        ORDER BY nome ASC
    `;

    return new Promise((resolve, reject) => {
        sqlite.all(sql, (err, campionati) => {
            if (err) {
                console.error('Errore SQL:', err);
                return reject({ error: 'Errore nel recupero dei campionati: ' + err.message });
            }

            try {
                const result = campionati.map(makeCampionato) || [];
                resolve(result);
            } catch (e) {
                console.error('Errore nella creazione degli oggetti Campionato:', e);
                reject({ error: 'Errore nella creazione degli oggetti Campionato: ' + e.message });
            }
        });
    });
};

/**
 * Ottiene un campionato per ID
 * @async
 * @param {number} id - ID del campionato da recuperare
 * @returns {Promise<Campionato|null>} Istanza Campionato o null se non trovato
 * @throws {Object} Oggetto errore con proprietà error
 */
exports.getCampionatoById = async function(id) {
    const sql = `
        SELECT id, nome, stagione, categoria, fonte_esterna_id, url_fonte, attivo, created_at, updated_at,
               promozione_diretta, playoff_start, playoff_end, playout_start, playout_end, retrocessione_diretta
        FROM CAMPIONATI
        WHERE id = ?
    `;

    return new Promise((resolve, reject) => {
        sqlite.get(sql, [id], (err, row) => {
            if (err) {
                console.error('Errore SQL:', err);
                return reject({ error: 'Errore nel recupero del campionato: ' + err.message });
            }

            try {
                const result = row ? makeCampionato(row) : null;
                resolve(result);
            } catch (e) {
                console.error('Errore nella creazione dell\'oggetto Campionato:', e);
                reject({ error: 'Errore nella creazione dell\'oggetto Campionato: ' + e.message });
            }
        });
    });
};

/**
 * Crea un nuovo campionato
 * @async
 * @param {Object} campionatoData - Dati del campionato da creare
 * @param {string} campionatoData.nome - Nome del campionato
 * @param {string} campionatoData.stagione - Stagione (es: "2024-2025")
 * @param {string} campionatoData.categoria - Categoria del campionato
 * @param {number|null} [campionatoData.fonte_esterna_id] - ID fonte esterna
 * @param {string|null} [campionatoData.url_fonte] - URL fonte esterna
 * @param {boolean} [campionatoData.attivo=true] - Stato attivo
 * @param {number} [campionatoData.promozione_diretta=2] - Numero promozioni dirette
 * @param {number} [campionatoData.playoff_start=3] - Posizione inizio playoff
 * @param {number} [campionatoData.playoff_end=6] - Posizione fine playoff
 * @param {number} [campionatoData.playout_start=11] - Posizione inizio playout
 * @param {number} [campionatoData.playout_end=14] - Posizione fine playout
 * @param {number} [campionatoData.retrocessione_diretta=2] - Numero retrocessioni dirette
 * @returns {Promise<number>} ID del campionato creato
 * @throws {Object} Oggetto errore con proprietà error
 */
exports.createCampionato = async function(campionatoData) {
    const sql = `
        INSERT INTO CAMPIONATI (nome, stagione, categoria, fonte_esterna_id, url_fonte, attivo, 
                                promozione_diretta, playoff_start, playoff_end, playout_start, playout_end, 
                                retrocessione_diretta, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `;

    const values = [
        campionatoData.nome,
        campionatoData.stagione,
        campionatoData.categoria || null,
        campionatoData.fonte_esterna_id || null,
        campionatoData.url_fonte || null,
    campionatoData.attivo !== undefined ? (campionatoData.attivo ? true : false) : true,
        campionatoData.promozione_diretta || 2,
        campionatoData.playoff_start || 3,
        campionatoData.playoff_end || 6,
        campionatoData.playout_start || 11,
        campionatoData.playout_end || 14,
        campionatoData.retrocessione_diretta || 2
    ];

    const sqlWithReturning = sql + ' RETURNING id';
    return new Promise((resolve, reject) => {
        sqlite.run(sqlWithReturning, values, function(err, result) {
            if (err) {
                console.error('Errore SQL:', err);
                return reject({ error: 'Errore nella creazione del campionato: ' + err.message });
            }

            // Ritorna l'ID del nuovo campionato
            resolve({ id: result.rows[0].id, message: 'Campionato creato con successo' });
        });
    });
};

/**
 * Aggiorna un campionato esistente
 * @async
 * @param {number} id - ID del campionato da aggiornare
 * @param {Object} campionatoData - Dati aggiornati del campionato
 * @param {string} [campionatoData.nome] - Nuovo nome del campionato
 * @param {string} [campionatoData.stagione] - Nuova stagione
 * @param {string} [campionatoData.categoria] - Nuova categoria
 * @param {number|null} [campionatoData.fonte_esterna_id] - Nuovo ID fonte esterna
 * @param {string|null} [campionatoData.url_fonte] - Nuovo URL fonte esterna
 * @param {boolean} [campionatoData.attivo] - Nuovo stato attivo
 * @param {number} [campionatoData.promozione_diretta] - Nuovo numero promozioni dirette
 * @param {number} [campionatoData.playoff_start] - Nuova posizione inizio playoff
 * @param {number} [campionatoData.playoff_end] - Nuova posizione fine playoff
 * @param {number} [campionatoData.playout_start] - Nuova posizione inizio playout
 * @param {number} [campionatoData.playout_end] - Nuova posizione fine playout
 * @param {number} [campionatoData.retrocessione_diretta] - Nuovo numero retrocessioni dirette
 * @returns {Promise<Object>} Oggetto con messaggio di successo
 * @throws {Object} Oggetto errore con proprietà error
 */
exports.updateCampionato = async function(id, campionatoData) {
    const sql = `
        UPDATE CAMPIONATI
        SET nome = ?, stagione = ?, categoria = ?, fonte_esterna_id = ?, url_fonte = ?, attivo = ?, 
            promozione_diretta = ?, playoff_start = ?, playoff_end = ?, playout_start = ?, playout_end = ?, 
            retrocessione_diretta = ?, updated_at = datetime('now')
        WHERE id = ?
    `;

    const values = [
        campionatoData.nome,
        campionatoData.stagione,
        campionatoData.categoria || null,
        campionatoData.fonte_esterna_id || null,
        campionatoData.url_fonte || null,
    campionatoData.attivo !== undefined ? (campionatoData.attivo ? true : false) : true,
        campionatoData.promozione_diretta || 2,
        campionatoData.playoff_start || 3,
        campionatoData.playoff_end || 6,
        campionatoData.playout_start || 11,
        campionatoData.playout_end || 14,
        campionatoData.retrocessione_diretta || 2,
        id
    ];

    return new Promise((resolve, reject) => {
        sqlite.run(sql, values, function(err, result) {
            if (err) {
                console.error('Errore SQL:', err);
                return reject({ error: 'Errore nell\'aggiornamento del campionato: ' + err.message });
            }

            const changes = (result && typeof result.rowCount === 'number') ? result.rowCount : 0;
            if (changes === 0) {
                return reject({ error: 'Campionato non trovato' });
            }

            resolve({ message: 'Campionato aggiornato con successo', id: id, changes });
        });
    });
};

/**
 * Elimina un campionato
 */
/**
 * Elimina un campionato per ID
 * @async
 * @param {number} id - ID del campionato da eliminare
 * @returns {Promise<Object>} Oggetto con messaggio di successo
 * @throws {Object} Oggetto errore con proprietà error
 */
exports.deleteCampionato = async function(id) {
    const sql = 'DELETE FROM CAMPIONATI WHERE id = ?';

    return new Promise((resolve, reject) => {
        sqlite.run(sql, [id], function(err, result) {
            if (err) {
                console.error('Errore SQL:', err);
                return reject({ error: 'Errore nell\'eliminazione del campionato: ' + err.message });
            }

            const changes = (result && typeof result.rowCount === 'number') ? result.rowCount : 0;
            if (changes === 0) {
                return reject({ error: 'Campionato non trovato' });
            }

            resolve({ message: 'Campionato eliminato con successo', changes });
        });
    });
};

/**
 * Toggle dello stato attivo/inattivo di un campionato
 */
/**
 * Attiva o disattiva un campionato
 * @async
 * @param {number} id - ID del campionato
 * @param {boolean} attivo - true per attivare, false per disattivare
 * @returns {Promise<Object>} Oggetto con messaggio di successo
 * @throws {Object} Oggetto errore con proprietà error
 */
exports.toggleCampionatoStatus = async function(id, attivo) {
    const sql = `
        UPDATE CAMPIONATI
        SET attivo = ?, updated_at = datetime('now')
        WHERE id = ?
    `;

    return new Promise((resolve, reject) => {
        sqlite.run(sql, [attivo ? true : false, id], function(err, result) {
            if (err) {
                console.error('Errore SQL:', err);
                return reject({ error: 'Errore nell\'aggiornamento dello stato del campionato: ' + err.message });
            }

            const changes = (result && typeof result.rowCount === 'number') ? result.rowCount : 0;
            if (changes === 0) {
                return reject({ error: 'Campionato non trovato' });
            }

            resolve({ message: 'Stato del campionato aggiornato con successo', changes });
        });
    });
};

/**
 * Ottiene la classifica per un campionato specifico
 */
/**
 * Ottiene la classifica per un campionato specifico
 * @async
 * @param {number} campionatoId - ID del campionato
 * @returns {Promise<Array<Object>>} Array di oggetti rappresentanti le righe della classifica
 * @throws {Object} Oggetto errore con proprietà error
 */
exports.getClassificaByCampionatoId = async function(campionatoId) {
    // Prima recupera le regole del campionato
    const regoleSql = `
        SELECT promozione_diretta, playoff_start, playoff_end, playout_start, playout_end, retrocessione_diretta
        FROM CAMPIONATI
        WHERE id = ?
    `;
    const regole = await new Promise((resolve, reject) => {
        sqlite.get(regoleSql, [campionatoId], (err, row) => {
            if (err) {
                console.error('Errore SQL regole:', err);
                return reject({ error: 'Error retrieving regole: ' + err.message });
            }
            resolve(row || {});
        });
    });

    const sql = `
        SELECT posizione, squadra_nome as nome, punti, nostra_squadra_id
        FROM CLASSIFICA
        WHERE campionato_id = ?
        ORDER BY posizione ASC
    `;
    return new Promise((resolve, reject) => {
        sqlite.all(sql, [campionatoId], (err, classifica) => {
            if (err) {
                console.error('Errore SQL:', err);
                return reject({ error: 'Error retrieving classifica: ' + err.message });
            }
            try {
                // Aggiungi classe per posizione
                const result = classifica.map(squadra => {
                    let classe = '';
                    if (squadra.posizione <= (regole.promozione_diretta || 2)) {
                        classe = 'table-success'; // Promozione diretta
                    } else if (squadra.posizione >= (regole.playoff_start || 3) && squadra.posizione <= (regole.playoff_end || 6)) {
                        classe = 'table-secondary'; // Playoff
                    } else if (!squadra.nostra_squadra_id && squadra.posizione >= (regole.playout_start || 11) && squadra.posizione <= (regole.playout_end || 14)) {
                        classe = 'table-warning'; // Play-out (non per la nostra squadra)
                    } else if (squadra.posizione > (16 - (regole.retrocessione_diretta || 2))) {
                        classe = 'table-danger'; // Retrocessione diretta
                    }
                    // La nostra squadra mantiene la classe basata sulla posizione
                    return {
                        posizione: squadra.posizione,
                        nome: squadra.nome,
                        punti: squadra.punti,
                        classe: classe
                    };
                }) || [];
                resolve(result);
            } catch (e) {
                console.error('Errore nella mappatura:', e);
                reject({ error: 'Error mapping classifica: ' + e.message });
            }
        });
    });
};

/**
 * Aggiunge una squadra al campionato
 */
/**
 * Aggiunge una squadra alla classifica di un campionato
 * @async
 * @param {number} campionatoId - ID del campionato
 * @param {Object} squadraData - Dati della squadra da inserire
 * @param {string} squadraData.squadra_nome - Nome della squadra
 * @param {number|null} [squadraData.nostra_squadra_id] - ID se è la nostra squadra
 * @param {number} [squadraData.posizione] - Posizione iniziale
 * @param {number} [squadraData.punti] - Punti iniziali
 * @param {number} [squadraData.partite_giocate]
 * @param {number} [squadraData.vittorie]
 * @param {number} [squadraData.pareggi]
 * @param {number} [squadraData.sconfitte]
 * @param {number} [squadraData.gol_fatti]
 * @param {number} [squadraData.gol_subiti]
 * @returns {Promise<Object>} Oggetto con id e messaggio di successo
 * @throws {Object} Oggetto errore con proprietà error
 */
exports.addSquadraCampionato = async function(campionatoId, squadraData) {
    const sql = `
        INSERT INTO CLASSIFICA (campionato_id, squadra_nome, nostra_squadra_id, posizione, punti, 
                               partite_giocate, vittorie, pareggi, sconfitte, gol_fatti, gol_subiti, 
                               differenza_reti, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `;

    const values = [
        campionatoId,
        squadraData.squadra_nome || squadraData.nome,
        squadraData.nostra_squadra_id || null,
        squadraData.posizione || 0,
        squadraData.punti || 0,
        (squadraData.partite_giocate || 0),
        squadraData.vittorie || squadraData.vinte || 0,
        squadraData.pareggi || squadraData.pareggiate || 0,
        squadraData.sconfitte || squadraData.perse || 0,
        squadraData.gol_fatti || 0,
        squadraData.gol_subiti || 0,
        (squadraData.differenza_reti || ((squadraData.gol_fatti || 0) - (squadraData.gol_subiti || 0)))
    ];

    const sqlWithReturning = sql + ' RETURNING id';
    return new Promise((resolve, reject) => {
        sqlite.run(sqlWithReturning, values, function(err, result) {
            if (err) {
                console.error('Errore SQL:', err);
                return reject({ error: 'Errore nell\'aggiunta della squadra: ' + err.message });
            }
            resolve({ id: result.rows[0].id, message: 'Squadra aggiunta con successo' });
        });
    });
};

/**
 * Rimuove una squadra dal campionato
 */
/**
 * Rimuove una squadra dalla classifica di un campionato
 * @async
 * @param {number} campionatoId - ID del campionato
 * @param {string} squadraNome - Nome della squadra da rimuovere
 * @returns {Promise<Object>} Oggetto con messaggio di successo
 * @throws {Object} Oggetto errore con proprietà error
 */
exports.removeSquadraCampionato = async function(campionatoId, squadraNome) {
    const sql = 'DELETE FROM CLASSIFICA WHERE campionato_id = ? AND squadra_nome = ?';

    return new Promise((resolve, reject) => {
        sqlite.run(sql, [campionatoId, squadraNome], function(err, result) {
            if (err) {
                console.error('Errore SQL:', err);
                return reject({ error: 'Errore nella rimozione della squadra: ' + err.message });
            }

            const changes = (result && typeof result.rowCount === 'number') ? result.rowCount : 0;
            if (changes === 0) {
                return reject({ error: 'Squadra non trovata' });
            }

            resolve({ message: 'Squadra rimossa con successo', changes });
        });
    });
};

/**
 * Ottiene tutte le squadre di un campionato
 */
/**
 * Recupera tutte le squadre di un campionato ordinate per posizione
 * @async
 * @param {number} campionatoId - ID del campionato
 * @returns {Promise<Array<Object>>} Array di oggetti squadra
 * @throws {Object} Oggetto errore con proprietà error
 */
exports.getSquadreByCampionatoId = async function(campionatoId) {
    const sql = `
        SELECT id, squadra_nome as nome, nostra_squadra_id, posizione, punti, 
               partite_giocate, vittorie, pareggi, sconfitte, gol_fatti, gol_subiti, differenza_reti
        FROM CLASSIFICA
        WHERE campionato_id = ?
        ORDER BY posizione ASC
    `;

    return new Promise((resolve, reject) => {
        sqlite.all(sql, [campionatoId], (err, squadre) => {
            if (err) {
                console.error('Errore SQL:', err);
                return reject({ error: 'Errore nel recupero delle squadre: ' + err.message });
            }
            resolve(squadre || []);
        });
    });
};

/**
 * Aggiorna i dati di una squadra nel campionato
 */
/**
 * Aggiorna i dati di una squadra nella classifica di un campionato
 * @async
 * @param {number} campionatoId - ID del campionato
 * @param {string} squadraNome - Nome della squadra da aggiornare
 * @param {Object} squadraData - Dati aggiornati della squadra (posizione, punti, gol, ecc.)
 * @returns {Promise<Object>} Oggetto con messaggio di successo
 * @throws {Object} Oggetto errore con proprietà error
 */
exports.updateSquadraCampionato = async function(campionatoId, squadraNome, squadraData) {
    const sql = `
        UPDATE CLASSIFICA
        SET posizione = ?, punti = ?, partite_giocate = ?, vittorie = ?, pareggi = ?, 
            sconfitte = ?, gol_fatti = ?, gol_subiti = ?, differenza_reti = ?, 
            ultimo_aggiornamento = datetime('now'), updated_at = datetime('now')
        WHERE campionato_id = ? AND squadra_nome = ?
    `;

    const values = [
        squadraData.posizione || 0,
        squadraData.punti || 0,
        (squadraData.partite_giocate || ((squadraData.vittorie || squadraData.vinte || 0) + (squadraData.pareggi || squadraData.pareggiate || 0) + (squadraData.sconfitte || squadraData.perse || 0))),
        squadraData.vittorie || squadraData.vinte || 0,
        squadraData.pareggi || squadraData.pareggiate || 0,
        squadraData.sconfitte || squadraData.perse || 0,
        squadraData.gol_fatti || 0,
        squadraData.gol_subiti || 0,
        (squadraData.differenza_reti || ((squadraData.gol_fatti || 0) - (squadraData.gol_subiti || 0))),
        campionatoId,
        squadraNome
    ];

    return new Promise((resolve, reject) => {
        sqlite.run(sql, values, function(err, result) {
            if (err) {
                console.error('Errore SQL:', err);
                return reject({ error: 'Errore nell\'aggiornamento della squadra: ' + err.message });
            }

            const changes = (result && typeof result.rowCount === 'number') ? result.rowCount : 0;
            if (changes === 0) {
                return reject({ error: 'Squadra non trovata' });
            }

            resolve({ message: 'Squadra aggiornata con successo', changes });
        });
    });
};