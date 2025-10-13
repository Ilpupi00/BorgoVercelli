'use strict';

const sqlite = require('../config/database');
const Campionato = require('../models/campionato.js');

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
        row.updated_at
    );
};

/**
 * Ottiene tutti i campionati
 */
exports.getCampionati = async function() {
    const sql = `
        SELECT id, nome, stagione, categoria, fonte_esterna_id, url_fonte, attivo, created_at, updated_at
        FROM CAMPIONATI
        ORDER BY created_at DESC
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
        SELECT id, nome, stagione, categoria, fonte_esterna_id, url_fonte, attivo, created_at, updated_at
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
        INSERT INTO CAMPIONATI (nome, stagione, categoria, fonte_esterna_id, url_fonte, attivo, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `;

    const values = [
        campionatoData.nome,
        campionatoData.stagione,
        campionatoData.categoria || null,
        campionatoData.fonte_esterna_id || null,
        campionatoData.url_fonte || null,
        campionatoData.attivo ? 1 : 0
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
        SET nome = ?, stagione = ?, categoria = ?, fonte_esterna_id = ?, url_fonte = ?, attivo = ?, updated_at = datetime('now')
        WHERE id = ?
    `;

    const values = [
        campionatoData.nome,
        campionatoData.stagione,
        campionatoData.categoria || null,
        campionatoData.fonte_esterna_id || null,
        campionatoData.url_fonte || null,
        campionatoData.attivo ? 1 : 0,
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

            resolve({ message: 'Campionato aggiornato con successo' });
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