require('dotenv').config();
const { Pool } = require('pg');

// Connessione al database PostgreSQL Railway
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('railway.app') ? { rejectUnauthorized: false } : false
});

console.log('🔧 Correzione percorsi immagini in PostgreSQL Railway\n');
console.log('📡 Connessione a:', process.env.DATABASE_URL ? 'Railway PostgreSQL' : '❌ DATABASE_URL non trovata!\n');

if (!process.env.DATABASE_URL) {
  console.error('❌ Errore: DATABASE_URL non configurata nel file .env');
  console.log('   Aggiungi nel .env: DATABASE_URL=postgresql://...');
  process.exit(1);
}

async function fixPaths() {
  const client = await pool.connect();
  
  try {
    // 1. Mostra situazione prima
    const before = await client.query(`
      SELECT COUNT(*) as total, 
             COUNT(CASE WHEN url LIKE 'src/public/uploads/%' THEN 1 END) as da_correggere,
             COUNT(CASE WHEN url LIKE '/uploads/%' THEN 1 END) as corretti
      FROM IMMAGINI
    `);
    
    console.log('📊 Situazione PRIMA:');
    console.log(`   Totale immagini: ${before.rows[0].total}`);
    console.log(`   Da correggere: ${before.rows[0].da_correggere}`);
    console.log(`   Già corretti: ${before.rows[0].corretti}\n`);
    
    // 2. Mostra esempi di cosa verrà corretto
    const examples = await client.query(`
      SELECT id, entita_riferimento, url 
      FROM IMMAGINI 
      WHERE url LIKE 'src/public/uploads/%' 
      LIMIT 5
    `);
    
    if (examples.rows.length > 0) {
      console.log('🔍 Esempi di percorsi da correggere:');
      examples.rows.forEach(row => {
        const nuovo = '/' + row.url.substring('src/public/'.length);
        console.log(`   ${row.entita_riferimento} (ID ${row.id}):`);
        console.log(`      ❌ "${row.url}"`);
        console.log(`      ✅ "${nuovo}"`);
      });
      console.log('');
    }
    
    // 3. Esegui correzione principale
    const result1 = await client.query(`
      UPDATE IMMAGINI 
      SET url = '/' || SUBSTRING(url FROM ${('src/public/'.length + 1)})
      WHERE url LIKE 'src/public/uploads/%'
    `);
    
    console.log(`✅ Aggiornati ${result1.rowCount} record (src/public/uploads/ → /uploads/)\n`);
    
    // 4. Correggi percorsi senza slash iniziale
    const result2 = await client.query(`
      UPDATE IMMAGINI 
      SET url = '/' || url
      WHERE url LIKE 'uploads/%' AND url NOT LIKE '/uploads/%'
    `);
    
    if (result2.rowCount > 0) {
      console.log(`✅ Corretti ${result2.rowCount} percorsi senza slash (uploads/ → /uploads/)\n`);
    }
    
    // 5. Mostra situazione dopo
    const after = await client.query(`
      SELECT COUNT(*) as total,
             COUNT(CASE WHEN url LIKE '/uploads/%' THEN 1 END) as corretti,
             COUNT(CASE WHEN url LIKE 'src/public/%' THEN 1 END) as ancora_sbagliati
      FROM IMMAGINI
    `);
    
    console.log('📊 Situazione DOPO:');
    console.log(`   Totale immagini: ${after.rows[0].total}`);
    console.log(`   Corretti (/uploads/...): ${after.rows[0].corretti}`);
    console.log(`   Ancora sbagliati: ${after.rows[0].ancora_sbagliati}\n`);
    
    // 6. Mostra alcuni esempi corretti
    const correctedExamples = await client.query(`
      SELECT id, entita_riferimento, tipo, url 
      FROM IMMAGINI 
      WHERE url LIKE '/uploads/%' 
      ORDER BY id DESC 
      LIMIT 8
    `);
    
    if (correctedExamples.rows.length > 0) {
      console.log('📸 Esempi di URL corretti:');
      correctedExamples.rows.forEach(ex => {
        console.log(`   ${ex.tipo || ex.entita_riferimento} (ID ${ex.id}): ${ex.url}`);
      });
    }
    
    console.log('\n✅ Correzione completata!');
    console.log('   Ora puoi fare il deploy su Railway con i percorsi corretti.\n');
    
  } catch (error) {
    console.error('❌ Errore durante la correzione:', error.message);
    if (error.code === 'ENOTFOUND') {
      console.error('   Verifica che DATABASE_URL sia corretta e che il database sia raggiungibile.');
    }
  } finally {
    client.release();
    await pool.end();
  }
}

fixPaths();
