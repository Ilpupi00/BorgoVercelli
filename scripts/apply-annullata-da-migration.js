/**
 * Script per applicare la migration che aggiunge la colonna annullata_da
 * alla tabella PRENOTAZIONI
 */

const fs = require('fs');
const path = require('path');
const db = require('../src/core/config/database');

async function applyMigration() {
    try {
        console.log('📦 Applicazione migration: add_annullata_da_column.sql');
        
        // Leggi il file SQL
        const migrationPath = path.join(__dirname, '../database/migrations/add_annullata_da_column.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');
        
        console.log('📄 SQL da eseguire:');
        console.log(sql);
        console.log('');
        
        // Esegui la migration
        await new Promise((resolve, reject) => {
            db.run(sql, [], (err, result) => {
                if (err) {
                    console.error('❌ Errore durante l\'applicazione della migration:', err);
                    return reject(err);
                }
                console.log('✅ Migration applicata con successo!');
                resolve(result);
            });
        });
        
        // Verifica che la colonna sia stata aggiunta
        console.log('');
        console.log('🔍 Verifica della struttura della tabella PRENOTAZIONI...');
        
        await new Promise((resolve, reject) => {
            db.all(`
                SELECT column_name, data_type, is_nullable 
                FROM information_schema.columns 
                WHERE table_name = 'prenotazioni' 
                AND column_name = 'annullata_da'
            `, [], (err, rows) => {
                if (err) {
                    console.error('❌ Errore durante la verifica:', err);
                    return reject(err);
                }
                
                if (rows && rows.length > 0) {
                    console.log('✅ Colonna annullata_da trovata:');
                    console.table(rows);
                } else {
                    console.log('⚠️ Colonna annullata_da non trovata nella tabella');
                }
                resolve();
            });
        });
        
        console.log('');
        console.log('✨ Processo completato!');
        console.log('');
        console.log('📝 Riepilogo delle modifiche:');
        console.log('   - Aggiunta colonna annullata_da (VARCHAR(10)) alla tabella PRENOTAZIONI');
        console.log('   - La colonna traccia se l\'annullamento è stato fatto da "user" o "admin"');
        console.log('   - Gli utenti possono riattivare solo le prenotazioni annullate da loro stessi');
        console.log('');
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Errore fatale:', error);
        process.exit(1);
    }
}

// Esegui la migration
applyMigration();
