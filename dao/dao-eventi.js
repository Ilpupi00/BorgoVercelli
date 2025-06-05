'use strict';

const sqlite = require('../db.js');

exports.getEventi= function(){
    const sql = 'SELECT * FROM EVENTI';
    return new Promise((resolve, reject) => {
        sqlite.all(sql)
        .then((eventi) => {
            if (!eventi || eventi.length === 0) {
                return reject({ error: 'No events found' });
            }
            resolve(eventi);
        })
        .catch((err) => {
            reject({ error: 'Error retrieving events: ' + err.message });
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