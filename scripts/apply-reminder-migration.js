/**
 * Script per applicare la migration reminder_sent
 */

const db = require('../src/core/config/database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    try {
        console.log('📋 Applicando migration: add_reminder_sent_to_prenotazioni.sql');
        
        const sqlPath = path.join(__dirname, '../database/migrations/add_reminder_sent_to_prenotazioni.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        // Esegui la migration
        await db.query(sql);
        
        console.log('✅ Migration applicata con successo!');
        console.log('📊 Verifico la struttura...');
        
        // Verifica che la colonna esista
        const checkResult = await db.query(`
            SELECT column_name, data_type, column_default 
            FROM information_schema.columns 
            WHERE table_name = 'prenotazioni' 
            AND column_name = 'reminder_sent'
        `);
        
        if (checkResult.rows.length > 0) {
            console.log('✅ Colonna reminder_sent trovata:');
            console.log(checkResult.rows[0]);
        } else {
            console.log('⚠️ Colonna reminder_sent non trovata');
        }
        
        // Verifica indice
        const indexResult = await db.query(`
            SELECT indexname 
            FROM pg_indexes 
            WHERE tablename = 'prenotazioni' 
            AND indexname = 'idx_prenotazioni_reminder_check'
        `);
        
        if (indexResult.rows.length > 0) {
            console.log('✅ Indice idx_prenotazioni_reminder_check creato');
        } else {
            console.log('⚠️ Indice non trovato');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Errore durante la migration:', error);
        process.exit(1);
    }
}

runMigration();
