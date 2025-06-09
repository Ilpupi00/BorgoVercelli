'use strict';

const sqlite = require('../db.js');

exports.getEventi = function(){
    // Usa gli alias per compatibilità con il frontend
    const sql = 'SELECT id, titolo, data_inizio as data, descrizione as sottotitolo FROM EVENTI;';
    return new Promise((resolve, reject) => {
        sqlite.all(sql, (err, eventi) => {
            if (err) {
                console.error('Errore SQL:', err);
                return reject({ error: 'Error retrieving events: ' + err.message });
            }
            resolve(eventi || []);
        });
    });
}

exports.getEventoById = function(id) {
    // Puoi aggiungere anche qui gli alias se necessario
    const sql = 'SELECT id, titolo, data_inizio as data, descrizione as sottotitolo, * FROM EVENTI WHERE id = ?';
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