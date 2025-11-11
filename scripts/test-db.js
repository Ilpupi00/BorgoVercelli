#!/usr/bin/env node
/**
 * Small test script to verify DATABASE_URL connection and list tables.
 * Usage: set DATABASE_URL env (Railway provides it) and run `node scripts/test-db.js`.
 */

'use strict';

const { Client } = require('pg');

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
    console.error('[test-db] ERROR: process.env.DATABASE_URL not set');
    process.exit(2);
}

(async () => {
    const client = new Client({ connectionString: databaseUrl, ssl: (process.env.NODE_ENV === 'production' || process.env.PGSSLMODE === 'require') ? { rejectUnauthorized: false } : false });
    try {
        await client.connect();
        console.log('[test-db] Connected to DATABASE_URL');

        // List user tables in public schema
        const res = await client.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename");
        console.log('[test-db] Tables:');
        for (const r of res.rows) console.log(' -', r.tablename);

        // Quick sample query (if NOTIZIE exists)
        try {
            const sample = await client.query('SELECT COUNT(*) AS cnt FROM NOTIZIE');
            console.log('[test-db] NOTIZIE count:', sample.rows[0].cnt);
        } catch (e) {
            // ignore if table missing
        }

        await client.end();
        process.exit(0);
    } catch (err) {
        console.error('[test-db] Connection/query error:', err.message || err);
        try { await client.end(); } catch (e) {}
        process.exit(1);
    }
})();
