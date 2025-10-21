'use strict';

const sqlite = require('../config/database');
const Evento = require('../models/evento.js');

const makeEvento=(row)=>{
    return new Evento(
        row.id,
        row.titolo,
        row.descrizione,
        row.data_inizio,
        row.data_fine,
        row.luogo,
        row.tipo_evento,
        row.autore_id,
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
    return new Promise((resolve, reject) => {
        const sql = 'SELECT id, titolo, descrizione, data_inizio, data_fine, luogo, tipo_evento, autore_id, squadra_id, campo_id, max_partecipanti, pubblicato, created_at, updated_at, immagini_id FROM EVENTI;';
        sqlite.all(sql, (err, eventi) => {
            if (err) {
                console.error('Errore SQL:', err);
                return reject({ error: 'Error retrieving events: ' + err.message });
            }
            const risultato = eventi.map(makeEvento) || [];
            resolve(risultato);
        });
    });
}

exports.getEventiPubblicati = function(){
    return new Promise((resolve, reject) => {
        const sql = 'SELECT id, titolo, descrizione, data_inizio, data_fine, luogo, tipo_evento, autore_id, squadra_id, campo_id, max_partecipanti, pubblicato, created_at, updated_at, immagini_id FROM EVENTI WHERE pubblicato = 1;';
        sqlite.all(sql, (err, eventi) => {
            if (err) {
                console.error('Errore SQL:', err);
                return reject({ error: 'Error retrieving published events: ' + err.message });
            }
            const risultato = eventi.map(makeEvento) || [];
            resolve(risultato);
        });
    });
}

exports.getEventoById = function(id) {
    const sql = 'SELECT * FROM EVENTI WHERE id = ?';
    return new Promise((resolve, reject) => {
        sqlite.get(sql, [id], (err, evento) => {
            if (err) {
                console.error('Errore SQL get evento by id:', err);
                return reject({ error: 'Error retrieving event: ' + err.message });
            }
            if (!evento) {
                return reject({ error: 'Event not found' });
            }
            resolve(makeEvento(evento));
        });
    });
}

exports.createEvento = function(eventoData) {
    const sql = `INSERT INTO EVENTI (
        titolo, descrizione, data_inizio, data_fine, luogo, tipo_evento,
        autore_id, squadra_id, campo_id, max_partecipanti, pubblicato, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`;

    return new Promise((resolve, reject) => {
        sqlite.run(sql, [
            eventoData.titolo,
            eventoData.descrizione,
            eventoData.data_inizio,
            eventoData.data_fine,
            eventoData.luogo,
            eventoData.tipo_evento,
            eventoData.autore_id,
            eventoData.squadra_id,
            eventoData.campo_id,
            eventoData.max_partecipanti,
            eventoData.pubblicato ? 1 : 0
        ], function(err) {
            if (err) {
                console.error('Errore SQL create evento:', err);
                return reject({ error: 'Error creating event: ' + err.message });
            }
            resolve({ id: this.lastID, success: true });
        });
    });
}

exports.updateEvento = function(id, eventoData) {
    const sql = `UPDATE EVENTI SET
        titolo = ?, descrizione = ?, data_inizio = ?, data_fine = ?,
        luogo = ?, tipo_evento = ?, autore_id = ?, squadra_id = ?, campo_id = ?,
        max_partecipanti = ?, pubblicato = ?, updated_at = datetime('now')
        WHERE id = ?`;

    return new Promise((resolve, reject) => {
        sqlite.run(sql, [
            eventoData.titolo,
            eventoData.descrizione,
            eventoData.data_inizio,
            eventoData.data_fine,
            eventoData.luogo,
            eventoData.tipo_evento,
            eventoData.autore_id,
            eventoData.squadra_id,
            eventoData.campo_id,
            eventoData.max_partecipanti,
            eventoData.pubblicato ? 1 : 0,
            id
        ], function(err) {
            if (err) {
                console.error('Errore SQL update evento:', err);
                return reject({ error: 'Error updating event: ' + err.message });
            }
            if (this.changes === 0) {
                return reject({ error: 'Event not found' });
            }
            resolve({ success: true });
        });
    });
}

exports.deleteEventoById = function(id) {
    const sql = 'DELETE FROM EVENTI WHERE id = ?';
    return new Promise((resolve, reject) => {
        sqlite.run(sql, [id], function(err) {
            if (err) {
                console.error('Errore SQL delete evento:', err);
                return reject({ error: 'Error deleting event: ' + err.message });
            }
            if (this.changes === 0) {
                return reject({ error: 'Event not found' });
            }
            resolve({ success: true });
        });
    });
}

exports.togglePubblicazioneEvento = function(id) {
    const sql = 'UPDATE EVENTI SET pubblicato = CASE WHEN pubblicato = 1 THEN 0 ELSE 1 END, updated_at = datetime(\'now\') WHERE id = ?';
    return new Promise((resolve, reject) => {
        sqlite.run(sql, [id], function(err) {
            if (err) {
                console.error('Errore SQL toggle pubblicazione evento:', err);
                return reject({ error: 'Error toggling event publication: ' + err.message });
            }
            if (this.changes === 0) {
                return reject({ error: 'Event not found' });
            }
            resolve({ success: true });
        });
    });
}

exports.searchEventi = async function(searchTerm) {
    const sql = `
        SELECT id, titolo, descrizione, data_inizio, data_fine, luogo, tipo_evento, autore_id, squadra_id, campo_id, max_partecipanti, pubblicato, created_at, updated_at, immagini_id
        FROM EVENTI
        WHERE pubblicato = 1 AND (titolo LIKE ? OR descrizione LIKE ? OR luogo LIKE ?)
        ORDER BY data_inizio DESC
        LIMIT 10
    `;
    return new Promise((resolve, reject) => {
        sqlite.all(sql, [searchTerm, searchTerm, searchTerm], (err, eventi) => {
            if (err) {
                console.error('Errore SQL search eventi:', err);
                return reject({ error: 'Error searching events: ' + err.message });
            }
            resolve(eventi.map(makeEvento) || []);
        });
    });
}

exports.getEventiPersonali= async function(utenteId){
    const sql = `SELECT * FROM EVENTI WHERE autore_id = ?`;
    return new Promise((resolve, reject) => {
        sqlite.all(sql, [utenteId], (err, eventi) => {
            if (err) {
                console.error('Errore SQL get eventi personali:', err);
                return reject({ error: 'Error getting personal events: ' + err.message });
            }
            resolve(eventi.map(makeEvento) || []);
        });
    });
}
