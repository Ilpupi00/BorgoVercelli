#!/usr/bin/env node
/**
 * Script per applicare la migration della tabella notifications
 */

require('dotenv').config();
const db = require('../src/core/config/database');
const fs = require('fs');
const path = require('path');

async function applyMigration() {
    console.log('🚀 Applicazione migration notifications...');
    
    try {
        // Leggi il file SQL
        const migrationPath = path.join(__dirname, '../database/migrations/add_notifications_table.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');
        
        console.log('📄 SQL migration letto da:', migrationPath);
        
        // Esegui la migration
        await db.query(sql);
        
        console.log('✅ Tabella notifications creata con successo!');
        
        // Verifica la tabella
        const result = await db.query('SELECT COUNT(*) as count FROM notifications');
        console.log(`📊 Tabella verificata: ${result.rows[0].count} notifiche presenti`);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Errore durante la migration:', error.message);
        process.exit(1);
    }
}

applyMigration();
