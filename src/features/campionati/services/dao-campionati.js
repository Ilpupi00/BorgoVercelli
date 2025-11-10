'use strict';

const sqlite = require('../../../core/config/database');
const Campionato = require('../../../core/models/campionato.js');

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
        campionatoData.attivo !== undefined ? (campionatoData.attivo ? 1 : 0) : 1,
        campionatoData.promozione_diretta || 2,
        campionatoData.playoff_start || 3,
        campionatoData.playoff_end || 6,
        campionatoData.playout_start || 11,
        campionatoData.playout_end || 14,
        campionatoData.retrocessione_diretta || 2
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
        campionatoData.attivo !== undefined ? (campionatoData.attivo ? 1 : 0) : 1,
        campionatoData.promozione_diretta || 2,
        campionatoData.playoff_start || 3,
        campionatoData.playoff_end || 6,
        campionatoData.playout_start || 11,
        campionatoData.playout_end || 14,
        campionatoData.retrocessione_diretta || 2,
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

            resolve({ message: 'Campionato aggiornato con successo', id: id });
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

/**
 * Aggiunge una squadra al campionato
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

    return new Promise((resolve, reject) => {
        sqlite.run(sql, values, function(err) {
            if (err) {
                console.error('Errore SQL:', err);
                return reject({ error: 'Errore nell\'aggiunta della squadra: ' + err.message });
            }
            resolve({ id: this.lastID, message: 'Squadra aggiunta con successo' });
        });
    });
};

/**
 * Rimuove una squadra dal campionato
 */
exports.removeSquadraCampionato = async function(campionatoId, squadraNome) {
    const sql = 'DELETE FROM CLASSIFICA WHERE campionato_id = ? AND squadra_nome = ?';

    return new Promise((resolve, reject) => {
        sqlite.run(sql, [campionatoId, squadraNome], function(err) {
            if (err) {
                console.error('Errore SQL:', err);
                return reject({ error: 'Errore nella rimozione della squadra: ' + err.message });
            }

            if (this.changes === 0) {
                return reject({ error: 'Squadra non trovata' });
            }

            resolve({ message: 'Squadra rimossa con successo' });
        });
    });
};

/**
 * Ottiene tutte le squadre di un campionato
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
        sqlite.run(sql, values, function(err) {
            if (err) {
                console.error('Errore SQL:', err);
                return reject({ error: 'Errore nell\'aggiornamento della squadra: ' + err.message });
            }

            if (this.changes === 0) {
                return reject({ error: 'Squadra non trovata' });
            }

            resolve({ message: 'Squadra aggiornata con successo' });
        });
    });
};