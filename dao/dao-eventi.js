'use strict';

const sqlite = require('../db.js');
const Evento = require('../model/evento.js');

const makeEvento=(row)=>{
    return new Evento(
        row.id,
        row.titolo,
        row.descrizione,
        row.data_inizio,
        row.data_fine,
        row.luogo,
        row.tipo_evento,
        row.squadra_id,
        row.campo_id,
        row.max_partecipanti,
        row.pubblicato,
        row.created_at,
        row.updated_at,
        row.immagini_id
    );
}

exports.getEventi = function(){
    // Usa i nomi originali delle colonne per compatibilità con il costruttore Evento
    const sql = 'SELECT id, titolo, descrizione, data_inizio, data_fine, luogo, tipo_evento, squadra_id, campo_id, max_partecipanti, pubblicato, created_at, updated_at, immagini_id FROM EVENTI;';
    return new Promise((resolve, reject) => {
        sqlite.all(sql, (err, eventi) => {
            if (err) {
                console.error('Errore SQL:', err);
                return reject({ error: 'Error retrieving events: ' + err.message });
            }
            resolve(eventi.map(makeEvento) || []);
        });
    });
}

exports.getEventoById = function(id) {
    // Puoi aggiungere anche qui gli alias se necessario
    const sql = 'SELECT * FROM EVENTI WHERE id = ?';
    return new Promise((resolve, reject) => {
        sqlite.get(sql, [id])
        .then((evento) => {
            if (!evento) {
                return reject({ error: 'Event not found' });
            }
            resolve(makeEvento(evento));
        })
        .catch((err) => {
            reject({ error: 'Error retrieving event: ' + err.message });
        });
    });
}