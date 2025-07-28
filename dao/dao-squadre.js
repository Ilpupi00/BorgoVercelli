'use strict';

const sqlite = require('../db.js');

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
        sqlite.all(sql, (err, giocatori) => {
            if (err) {
                return reject({ error: 'Error retrieving players: ' + err.message });
            }
            resolve(giocatori || []);
        });
    });
}