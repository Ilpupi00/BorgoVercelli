require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('railway.app') ? { rejectUnauthorized: false } : false
});

console.log('🔍 Struttura tabella EVENTI\n');

pool.query(`
  SELECT column_name, data_type, is_nullable
  FROM information_schema.columns 
  WHERE table_name = 'eventi' 
  ORDER BY ordinal_position
`).then(result => {
  console.table(result.rows);
  
  // Cerca qualsiasi colonna con "immagine"
  const immagineCol = result.rows.find(r => r.column_name.includes('immagine'));
  
  if (immagineCol) {
    console.log(`\n✅ Colonna trovata: ${immagineCol.column_name}\n`);
  } else {
    console.log('\n❌ Nessuna colonna con "immagine" trovata\n');
  }
  
  pool.end();
}).catch(err => {
  console.error('❌ Errore:', err.message);
  pool.end();
});
