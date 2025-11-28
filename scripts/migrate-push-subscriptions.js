/**
 * Script di migrazione: Importa le subscription dal file JSON al database PostgreSQL
 * 
 * Questo script legge le subscription dal file webpush.json e le inserisce
 * nella nuova tabella push_subscriptions nel database.
 */

'use strict';

// Carica le variabili d'ambiente dal file .env
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const db = require('../src/core/config/database');

const JSON_FILE = path.join(__dirname, '../src/data/webpush.json');

async function migrateSubscriptions() {
  console.log('🚀 Inizio migrazione subscription da JSON a PostgreSQL...\n');

  try {
    // Leggi il file JSON
    if (!fs.existsSync(JSON_FILE)) {
      console.log('⚠️  File webpush.json non trovato. Nessuna subscription da migrare.');
      console.log('📁 Path cercato:', JSON_FILE);
      return;
    }

    const rawData = fs.readFileSync(JSON_FILE, 'utf8');
    const subscriptions = JSON.parse(rawData);

    console.log(`📊 Trovate ${subscriptions.length} subscription nel file JSON\n`);

    if (subscriptions.length === 0) {
      console.log('✅ Nessuna subscription da migrare.');
      return;
    }

    let imported = 0;
    let skipped = 0;
    let errors = 0;

    // Importa ogni subscription
    for (const sub of subscriptions) {
      try {
        // Validazione base
        if (!sub.endpoint || !sub.keys || !sub.keys.p256dh || !sub.keys.auth) {
          console.log(`⚠️  Subscription non valida (manca endpoint o keys):`, sub.userId || 'unknown');
          skipped++;
          continue;
        }

        // Inserisci nel database
        await db.query(
          `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, is_admin, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (endpoint) DO NOTHING`,
          [
            sub.userId || null,
            sub.endpoint,
            sub.keys.p256dh,
            sub.keys.auth,
            sub.isAdmin || false,
            sub.createdAt || new Date().toISOString(),
            sub.updatedAt || sub.createdAt || new Date().toISOString()
          ]
        );

        imported++;
        console.log(`✅ Importata subscription per user ${sub.userId || 'N/A'} (admin: ${sub.isAdmin || false})`);

      } catch (error) {
        errors++;
        console.error(`❌ Errore importazione subscription:`, error.message);
      }
    }

    console.log('\n📊 Riepilogo migrazione:');
    console.log(`   ✅ Importate: ${imported}`);
    console.log(`   ⚠️  Saltate: ${skipped}`);
    console.log(`   ❌ Errori: ${errors}`);
    console.log(`   📝 Totale: ${subscriptions.length}`);

    // Backup del file JSON
    const backupFile = JSON_FILE + '.backup-' + Date.now();
    fs.copyFileSync(JSON_FILE, backupFile);
    console.log(`\n💾 Backup creato: ${backupFile}`);
    console.log('   (Puoi eliminare il file JSON originale dopo aver verificato che tutto funzioni)\n');

    console.log('✅ Migrazione completata con successo!\n');

  } catch (error) {
    console.error('❌ Errore durante la migrazione:', error);
    process.exit(1);
  } finally {
    // Chiudi la connessione al database
    await db.close();
  }
}

// Esegui la migrazione
migrateSubscriptions().catch(error => {
  console.error('❌ Errore fatale:', error);
  process.exit(1);
});
