'use strict';

const sqlite = require('../config/database');
const Giocatore = require('../models/giocatore.js');
const Squadra = require('../models/squadra.js');
const daoDirigenti = require('./dao-dirigenti-squadre.js');

const makeSquadra = (row) => {
    return new Squadra(
        row.id,
        row.nome,
        row.id_immagine,
        row.Anno,
        row.dirigenti || []  // Aggiunto per dirigenti
    );
}

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
        nazionalita: row.nazionalita,
        nome: row.nome,
        cognome: row.cognome
    });
}



exports.getSquadre = async () => {
    const sql = 'SELECT * FROM SQUADRE';
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

exports.getGiocatori =async ()=>{
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
    FROM GIOCATORI`;
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

exports.createSquadra = function(nome, annoFondazione) {
    const sql = 'INSERT INTO SQUADRE (nome, Anno) VALUES (?, ?)';
    return new Promise((resolve, reject) => {
        sqlite.run(sql, [nome, annoFondazione], function(err) {
            if (err) {
                console.error('Errore SQL insert squadra:', err);
                return reject({ error: 'Errore nella creazione della squadra: ' + err.message });
            }
            resolve({ id: this.lastID, message: 'Squadra creata con successo' });
        });
    });
}

exports.updateSquadra = function(id, nome, annoFondazione) {
    const sql = 'UPDATE SQUADRE SET nome = ?, Anno = ? WHERE id = ?';
    return new Promise((resolve, reject) => {
        sqlite.run(sql, [nome, annoFondazione, parseInt(id)], function(err) {
            if (err) {
                console.error('Errore SQL update squadra:', err);
                return reject({ error: 'Errore nell\'aggiornamento della squadra: ' + err.message });
            }
            if (this.changes === 0) {
                return reject({ error: 'Squadra non trovata' });
            }
            resolve({ message: 'Squadra aggiornata con successo' });
        });
    });
}

exports.deleteSquadra = function(id) {
    const sql = 'DELETE FROM SQUADRE WHERE id = ?';
    return new Promise((resolve, reject) => {
        sqlite.run(sql, [parseInt(id)], function(err) {
            if (err) {
                console.error('Errore SQL delete squadra:', err);
                return reject({ error: 'Errore nella cancellazione della squadra: ' + err.message });
            }
            if (this.changes === 0) {
                return reject({ error: 'Squadra non trovata' });
            }
            resolve({ message: 'Squadra cancellata con successo' });
        });
    });
}

exports.getSquadraById = function(id) {
    const sql = 'SELECT * FROM SQUADRE WHERE id = ?';
    return new Promise((resolve, reject) => {
        sqlite.get(sql, [parseInt(id)], async (err, squadra) => {
            if (err) {
                return reject({ error: 'Errore nel recupero della squadra: ' + err.message });
            }
            if (!squadra) {
                return reject({ error: 'Squadra non trovata' });
            }
            // Recupera i dirigenti
            const dirigenti = await daoDirigenti.getDirigentiBySquadra(squadra.id);
            resolve({ ...squadra, dirigenti });
        });
    });
}

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