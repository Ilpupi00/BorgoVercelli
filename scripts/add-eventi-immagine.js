require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('railway.app') ? { rejectUnauthorized: false } : false
});

console.log('🔧 Aggiunta colonna immagine_principale_id a EVENTI\n');

async function addColumn() {
  try {
    // Verifica se esiste immagine_id
    const checkCol = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'eventi' 
      AND column_name LIKE '%immagine%'
    `);
    
    console.log('📋 Colonne immagine trovate:');
    checkCol.rows.forEach(r => console.log(`   - ${r.column_name}`));
    
    const hasImmagineId = checkCol.rows.some(r => r.column_name === 'immagine_id');
    
    if (hasImmagineId) {
      console.log('\n✅ Colonna immagine_id già presente!\n');
    } else {
      console.log('\n⚠️  Colonna immagine_id non trovata. Aggiunta...');
      await pool.query(`
        ALTER TABLE EVENTI 
        ADD COLUMN IF NOT EXISTS immagine_id INTEGER
      `);
      console.log('✅ Colonna immagine_id aggiunta\n');
    }
    
    // Verifica
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_eventi,
        COUNT(immagine_id) as eventi_con_immagine
      FROM EVENTI
    `);
    
    console.log('📊 Riepilogo:');
    console.log(`   Totale eventi: ${result.rows[0].total_eventi}`);
    console.log(`   Con immagine: ${result.rows[0].eventi_con_immagine}\n`);
    
  } catch (error) {
    console.error('❌ Errore:', error.message);
  } finally {
    await pool.end();
  }
}

addColumn();
