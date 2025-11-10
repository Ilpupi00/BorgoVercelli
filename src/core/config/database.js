/**
 * @fileoverview Configurazione e connessione al database SQLite
 * @module core/config/database
 * @description Gestisce la connessione al database SQLite del progetto.
 * Il database contiene tutte le tabelle per utenti, notizie, eventi, prenotazioni, ecc.
 */

'use strict';

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

/**
 * Path assoluto al file del database SQLite
 * Il database si trova nella directory database/ alla root del progetto
 * @type {string}
 */
const dbPath = path.join(__dirname, '../../../database/database.db');
console.log('[database] opening sqlite db at', dbPath);

/**
 * Istanza della connessione al database SQLite
 * Utilizzata da tutti i DAO per eseguire query
 * @type {sqlite3.Database}
 */
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database ' + err.message);
    } else {
        console.log('Connected to the SQLite database at', dbPath);
    }
});

// Query di test per verificare la connessione (opzionale)
// db.get("SELECT 1 as test", [], (err, row) => {
//     if (err) console.error('Test query error:', err);
//     else console.log('Test query success:', row);
// });

// Chiusura del database quando l'applicazione termina
// process.on('exit', () => {
//     console.log('Closing database');
//     db.close();
// });

/**
 * Esporta l'istanza del database per l'uso nei DAO
 * @exports db
 */
module.exports = db;