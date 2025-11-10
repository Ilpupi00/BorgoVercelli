/**
 * @fileoverview Configurazione e connessione al database SQLite
 * @module core/config/database
 * @description Gestisce la connessione al database SQLite del progetto.
 * Il database contiene tutte le tabelle per utenti, notizie, eventi, prenotazioni, ecc.
 */

'use strict';

const path = require('path');

// Supporta due modalità di connessione:
// - Se è presente process.env.DATABASE_URL => usa Postgres (pg Pool)
// - Altrimenti mantiene il fallback su SQLite per sviluppo locale

// Costruisce una connection string da PG_* env vars se DATABASE_URL non è fornita
const buildPgUrlFromParts = () => {
    if (!process.env.PG_HOST && !process.env.PG_DATABASE && !process.env.PG_USER) return null;
    const user = process.env.PG_USER || 'postgres';
    const pass = process.env.PG_PASSWORD ? encodeURIComponent(process.env.PG_PASSWORD) : '';
    const host = process.env.PG_HOST || 'localhost';
    const port = process.env.PG_PORT || '5432';
    const dbName = process.env.PG_DATABASE || 'postgres';
    return `postgres://${user}:${pass}@${host}:${port}/${dbName}`;
};

const connectionString = process.env.DATABASE_URL || buildPgUrlFromParts();

if (connectionString) {
    // Postgres / Railway
    const { Pool } = require('pg');

    // Railway Postgres spesso richiede SSL in produzione
    const useSSL = process.env.NODE_ENV === 'production' || process.env.PGSSLMODE === 'require';

    const pool = new Pool({
        connectionString,
        ssl: useSSL ? { rejectUnauthorized: false } : false
    });

    console.log('[database] using Postgres via DATABASE_URL');

    // Wrapper che emula l'API minima usata dal progetto (sqlite3):
    // db.get(sql, params, cb), db.all(sql, params, cb), db.run(sql, params, cb)
    const db = {
        get: (sql, params, cb) => {
            if (typeof params === 'function') { cb = params; params = []; }
            pool.query(sql, params)
                .then(res => cb && cb(null, res.rows && res.rows[0] ? res.rows[0] : undefined))
                .catch(err => cb && cb(err));
        },
        all: (sql, params, cb) => {
            if (typeof params === 'function') { cb = params; params = []; }
            pool.query(sql, params)
                .then(res => cb && cb(null, res.rows))
                .catch(err => cb && cb(err));
        },
        run: (sql, params, cb) => {
            if (typeof params === 'function') { cb = params; params = []; }
            pool.query(sql, params)
                .then(res => {
                    if (cb) cb(null, { rowCount: res.rowCount, rows: res.rows });
                })
                .catch(err => cb && cb(err));
        },
        close: () => pool.end()
    };

    module.exports = db;

} else {
    // Fallback: SQLite (sviluppo locale)
    const sqlite3 = require('sqlite3').verbose();

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

    // Chiusura del database quando l'applicazione termina (opzionale)
    // process.on('exit', () => {
    //     console.log('Closing database');
    //     db.close();
    // });

    module.exports = db;
}