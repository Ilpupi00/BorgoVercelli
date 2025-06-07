'use strict';

const sqlite = require('../db.js');

exports.getEventi = function(){
    const sql = 'SELECT * FROM EVENTI';
    return new Promise((resolve, reject) => {
        sqlite.all(sql, (err, eventi) => {
            if (err) {
                console.error('Errore SQL:', err);
                return reject({ error: 'Error retrieving events: ' + err.message });
            }
            // Restituisci un array vuoto se non ci sono eventi invece di reject
            resolve(eventi || []);
        });
    });
}

exports.getEventoById = function(id) {
    const sql = 'SELECT * FROM EVENTI WHERE id = ?';
    return new Promise((resolve, reject) => {
        sqlite.get(sql, [id])
        .then((evento) => {
            if (!evento) {
                return reject({ error: 'Event not found' });
            }
            resolve(evento);
        })
        .catch((err) => {
            reject({ error: 'Error retrieving event: ' + err.message });
        });
    });
}