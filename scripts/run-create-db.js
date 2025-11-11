#!/usr/bin/env node
/**
 * Esegue lo script SQL `create_postgres_db.sql` contro il DATABASE_URL
 * Questo script è pensato per essere invocato in fase di build (postinstall)
 * su Railway. Comportamento:
 * - Se `DATABASE_URL` non è impostata, esce senza errori.
 * - Controlla l'esistenza di una tabella chiave (`tipi_utente`); se esiste
 *   non esegue nulla (idempotente).
 * - Altrimenti esegue gli statements presenti in create_postgres_db.sql
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function main() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        console.log('[run-create-db] DATABASE_URL non impostata: skipping create DB.');
        return;
    }

    const sqlPath = path.join(__dirname, '..', 'create_postgres_db.sql');
    if (!fs.existsSync(sqlPath)) {
        console.log('[run-create-db] SQL file not found at', sqlPath);
        return;
    }

    const client = new Client({ connectionString: databaseUrl, ssl: (process.env.NODE_ENV === 'production' || process.env.PGSSLMODE === 'require') ? { rejectUnauthorized: false } : false });

    try {
        await client.connect();
        console.log('[run-create-db] Connected to Postgres');

        // Controlla se la tabella tipi_utente esiste già
        const checkRes = await client.query("SELECT to_regclass('public.tipi_utente') as exists");
        if (checkRes.rows && checkRes.rows[0] && checkRes.rows[0].exists) {
            console.log('[run-create-db] Table tipi_utente already exists — skipping creation.');
            await client.end();
            return;
        }

        // Leggi il file SQL e divide per statement
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Rimuovi commenti a linea singola che iniziano con -- per evitare problemi
        const withoutComments = sql.split('\n').filter(line => !line.trim().startsWith('--')).join('\n');

        const statements = withoutComments
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        console.log('[run-create-db] Executing', statements.length, 'statements');

        for (const stmt of statements) {
            try {
                await client.query(stmt);
            } catch (err) {
                console.error('[run-create-db] Error executing statement:', err.message || err);
                // On error, close and exit non-zero to fail the build
                await client.end();
                process.exit(1);
            }
        }

        console.log('[run-create-db] Database schema created successfully');
        await client.end();
    } catch (err) {
        console.error('[run-create-db] Fatal error:', err.message || err);
        try { await client.end(); } catch (e) {}
        process.exit(1);
    }
}

main();
