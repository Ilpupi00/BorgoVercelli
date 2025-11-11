/**
 * @fileoverview Configurazione e connessione al database Postgres
 * @module core/config/database
 * @description Questa versione si connette esclusivamente a Postgres
 * usando la variabile d'ambiente `DATABASE_URL`. Se la variabile non
 * è presente, il processo terminerà con errore per evitare fallback.
 */

'use strict';

if (!process.env.DATABASE_URL) {
    console.error('[database] FATAL: process.env.DATABASE_URL non è impostata.');
    console.error('[database] L\'applicazione è configurata per connettersi solo a Postgres tramite DATABASE_URL (es. fornita da Railway).');
    process.exit(1);
}

const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;
const useSSL = process.env.NODE_ENV === 'production' || process.env.PGSSLMODE === 'require';

const pool = new Pool({
    connectionString,
    ssl: useSSL ? { rejectUnauthorized: false } : false
});

console.log('[database] using Postgres via DATABASE_URL');

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