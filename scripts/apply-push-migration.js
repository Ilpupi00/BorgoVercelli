#!/usr/bin/env node

/**
 * Script per applicare la migration delle push subscriptions
 * Esegue la migration SQL sul database PostgreSQL configurato
 */

'use strict';

// Carica le variabili d'ambiente dal file .env
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const db = require('../src/core/config/database');

const MIGRATION_FILE = path.join(__dirname, '../database/migrations/add_push_subscriptions.sql');

async function applyMigration() {
  console.log('🚀 Applicazione migration push_subscriptions...\n');

  try {
    // Leggi il file SQL
    if (!fs.existsSync(MIGRATION_FILE)) {
      console.error('❌ File migration non trovato:', MIGRATION_FILE);
      process.exit(1);
    }

    const sql = fs.readFileSync(MIGRATION_FILE, 'utf8');
    
    console.log('📄 Migration file caricato');
    console.log('📊 Esecuzione SQL...\n');

    // Esegui la migration
    await db.query(sql);

    console.log('✅ Migration applicata con successo!\n');

    // Verifica che la tabella sia stata creata
    const result = await db.query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'push_subscriptions' 
      ORDER BY ordinal_position
    `);

    if (result.rows.length > 0) {
      console.log('📋 Struttura tabella push_subscriptions:');
      result.rows.forEach(row => {
        console.log(`   - ${row.column_name}: ${row.data_type}`);
      });
      console.log('');
    }

    // Conta le subscription esistenti (se ci sono)
    const countResult = await db.query('SELECT COUNT(*) as count FROM push_subscriptions');
    console.log(`📊 Subscription attuali nel database: ${countResult.rows[0].count}\n`);

    console.log('✅ Tutto pronto! Puoi ora eseguire lo script di migrazione dati:');
    console.log('   node scripts/migrate-push-subscriptions.js\n');

  } catch (error) {
    console.error('❌ Errore durante l\'applicazione della migration:', error.message);
    
    if (error.message.includes('already exists')) {
      console.log('\n⚠️  La tabella esiste già. Migration già applicata.');
    } else {
      console.error('\nDettagli errore:', error);
      process.exit(1);
    }
  } finally {
    await db.close();
  }
}

// Esegui la migration
applyMigration().catch(error => {
  console.error('❌ Errore fatale:', error);
  process.exit(1);
});
