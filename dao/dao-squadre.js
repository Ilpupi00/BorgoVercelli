'use strict';

const sqlite = require('../db.js');
const Giocatore = require('../model/giocatore.js');
const Squadra = require('../model/squadra.js');

const makeSquadra = (row) => {
    return new Squadra(
        row.id,
        row.nome,
        row.id_immagine,
        row.Anno   
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
        sqlite.all(sql, (err, squadre) => {
            if (err) {
                return reject({ error: 'Error retrieving teams: ' + err.message });
            }
            resolve(squadre.map(makeSquadra) || []);
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