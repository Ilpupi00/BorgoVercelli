'use strict';

const sqlite = require('../db.js');
const Giocatore = require('../model/giocatore.js');
//const Squadre = require('../model/squadra.js');

const makeGiocatore = (row) => {
    return new Giocatore(
        row.id,
        row.squadra_id,
        row.numero_maglia,
        row.ruolo,
        row.data_nascita,
        row.altezza,
        row.peso,
        row.piede_preferito,
        row.data_inizio_tesseramento,
        row.data_fine_tesseramento,
        row.attivo,
        row.created_at,
        row.updated_at,
        row.Nazionalita, 
        row.nome,
        row.cognome
    );
}



exports.getSquadre = async () => {
    const sql = 'SELECT * FROM SQUADRE';
    return new Promise((resolve, reject) => {
        sqlite.all(sql, (err, squadre) => {
            if (err) {
                return reject({ error: 'Error retrieving teams: ' + err.message });
            }
            resolve(squadre || []);
        });
    });
}

exports.getGiocatori =async ()=>{
    const sql = 'SELECT * FROM GIOCATORI';
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