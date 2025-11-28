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
    console.error('[database] Assicurati di configurare DATABASE_URL nelle variabili d\'ambiente.');
    process.exit(1);
}

// Log della connessione per debugging (nasconde la password)
const maskedUrl = process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@');
console.log('[database] Tentativo di connessione a:', maskedUrl);

const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;
const useSSL = process.env.NODE_ENV === 'production' || process.env.PGSSLMODE === 'require';

const pool = new Pool({
    connectionString,
    ssl: useSSL ? { rejectUnauthorized: false } : false,
    // Configurazioni aggiuntive per stabilità
    max: 20, // Numero massimo di connessioni nel pool
    idleTimeoutMillis: 30000, // Chiudi connessioni inattive dopo 30 secondi
    connectionTimeoutMillis: 10000, // Timeout di connessione 10 secondi
});

console.log('[database] using Postgres via DATABASE_URL');
console.log('[database] SSL:', useSSL ? 'enabled' : 'disabled');
console.log('[database] NODE_ENV:', process.env.NODE_ENV || 'development');

// Gestione errori del pool
pool.on('error', (err, client) => {
    console.error('[database] Unexpected error on idle client', err);
    // Non terminare il processo, lascia che l'app continui
});

// Test connessione al database e fornisce una Promise "ready" che può essere attesa
// dall'app prima di mettersi in ascolto. Questo aiuta a fallire velocemente in caso
// di problemi di rete/credenziali invece di lasciare il processo appeso e ricevere
// un SIGTERM dalla piattaforma di hosting.
const ready = pool.query('SELECT NOW()')
    .then(() => {
        console.log('[database] ✅ Connessione al database stabilita con successo');
        return true;
    })
    .catch(err => {
        console.error('[database] ❌ Errore durante la connessione al database:', err.message);
        console.error('[database] Verifica che DATABASE_URL sia corretto e che il database sia accessibile');
        // Rilancia l'errore in modo che il chiamante possa decidere cosa fare (es. exit)
        throw err;
    });

// Helper: convert SQL with '?' placeholders to Postgres $1, $2 ... placeholders
function convertQuestionPlaceholders(sql) {
    let index = 0;
    return sql.replace(/\?/g, () => {
        index += 1;
        return `$${index}`;
    });
}

const db = {
    get: (sql, params, cb) => {
        if (typeof params === 'function') { cb = params; params = []; }
        const pgSql = convertQuestionPlaceholders(sql);
        pool.query(pgSql, params)
            .then(res => cb && cb(null, res.rows && res.rows[0] ? res.rows[0] : undefined))
            .catch(err => cb && cb(err));
    },
    all: (sql, params, cb) => {
        if (typeof params === 'function') { cb = params; params = []; }
        const pgSql = convertQuestionPlaceholders(sql);
        pool.query(pgSql, params)
            .then(res => cb && cb(null, res.rows))
            .catch(err => cb && cb(err));
    },
    run: (sql, params, cb) => {
        if (typeof params === 'function') { cb = params; params = []; }
        const pgSql = convertQuestionPlaceholders(sql);
        pool.query(pgSql, params)
            .then(res => {
                if (cb) cb(null, { rowCount: res.rowCount, rows: res.rows });
            })
            .catch(err => cb && cb(err));
    },
    // Query diretta che restituisce una Promise (utile per async/await)
    query: (sql, params = []) => {
        const pgSql = convertQuestionPlaceholders(sql);
        return pool.query(pgSql, params);
    },
    close: () => pool.end(),
    // Esponiamo anche il pool per operazioni avanzate
    pool
};

// Esponiamo la Promise che indica quando la connessione iniziale è stata verificata
db.ready = ready;

module.exports = db;