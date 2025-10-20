'use strict';

const sqlite = require('../config/database');
const Campionato = require('../models/campionato.js');

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
 * Ottiene tutti i campionati
 */
exports.getCampionati = async function() {
    const sql = `
        SELECT id, nome, stagione, categoria, fonte_esterna_id, url_fonte, attivo, created_at, updated_at,
               promozione_diretta, playoff_start, playoff_end, playout_start, playout_end, retrocessione_diretta
        FROM CAMPIONATI
        WHERE attivo = 1
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
 */
exports.getCampionatoById = async function(id) {
    const sql = `
        SELECT id, nome, stagione, categoria, fonte_esterna_id, url_fonte, attivo, created_at, updated_at
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
 */
exports.createCampionato = async function(campionatoData) {
    const sql = `
        INSERT INTO CAMPIONATI (nome, stagione, categoria, fonte_esterna_id, url_fonte, attivo, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `;

    const values = [
        campionatoData.nome,
        campionatoData.stagione,
        campionatoData.categoria || null,
        campionatoData.fonte_esterna_id || null,
        campionatoData.url_fonte || null,
        campionatoData.attivo ? 1 : 0
    ];

    return new Promise((resolve, reject) => {
        sqlite.run(sql, values, function(err) {
            if (err) {
                console.error('Errore SQL:', err);
                return reject({ error: 'Errore nella creazione del campionato: ' + err.message });
            }

            // Ritorna l'ID del nuovo campionato
            resolve({ id: this.lastID, message: 'Campionato creato con successo' });
        });
    });
};

/**
 * Aggiorna un campionato esistente
 */
exports.updateCampionato = async function(id, campionatoData) {
    const sql = `
        UPDATE CAMPIONATI
        SET nome = ?, stagione = ?, categoria = ?, fonte_esterna_id = ?, url_fonte = ?, attivo = ?, updated_at = datetime('now')
        WHERE id = ?
    `;

    const values = [
        campionatoData.nome,
        campionatoData.stagione,
        campionatoData.categoria || null,
        campionatoData.fonte_esterna_id || null,
        campionatoData.url_fonte || null,
        campionatoData.attivo ? 1 : 0,
        id
    ];

    return new Promise((resolve, reject) => {
        sqlite.run(sql, values, function(err) {
            if (err) {
                console.error('Errore SQL:', err);
                return reject({ error: 'Errore nell\'aggiornamento del campionato: ' + err.message });
            }

            if (this.changes === 0) {
                return reject({ error: 'Campionato non trovato' });
            }

            resolve({ message: 'Campionato aggiornato con successo' });
        });
    });
};

/**
 * Elimina un campionato
 */
exports.deleteCampionato = async function(id) {
    const sql = 'DELETE FROM CAMPIONATI WHERE id = ?';

    return new Promise((resolve, reject) => {
        sqlite.run(sql, [id], function(err) {
            if (err) {
                console.error('Errore SQL:', err);
                return reject({ error: 'Errore nell\'eliminazione del campionato: ' + err.message });
            }

            if (this.changes === 0) {
                return reject({ error: 'Campionato non trovato' });
            }

            resolve({ message: 'Campionato eliminato con successo' });
        });
    });
};

/**
 * Toggle dello stato attivo/inattivo di un campionato
 */
exports.toggleCampionatoStatus = async function(id, attivo) {
    const sql = `
        UPDATE CAMPIONATI
        SET attivo = ?, updated_at = datetime('now')
        WHERE id = ?
    `;

    return new Promise((resolve, reject) => {
        sqlite.run(sql, [attivo ? 1 : 0, id], function(err) {
            if (err) {
                console.error('Errore SQL:', err);
                return reject({ error: 'Errore nell\'aggiornamento dello stato del campionato: ' + err.message });
            }

            if (this.changes === 0) {
                return reject({ error: 'Campionato non trovato' });
            }

            resolve({ message: 'Stato del campionato aggiornato con successo' });
        });
    });
};

/**
 * Ottiene la classifica per un campionato specifico
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