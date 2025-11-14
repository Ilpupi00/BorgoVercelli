require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('railway.app') ? { rejectUnauthorized: false } : false
});

console.log('🔍 Diagnosi Immagini - Percorsi e File Fisici\n');

async function diagnose() {
  const client = await pool.connect();
  
  try {
    // 1. Controlla percorsi nel DB
    const dbImages = await client.query(`
      SELECT id, tipo, entita_riferimento, url, created_at 
      FROM IMMAGINI 
      ORDER BY id DESC 
      LIMIT 10
    `);
    
    console.log('📊 Ultimi 10 percorsi salvati nel DATABASE:');
    console.table(dbImages.rows.map(r => ({
      id: r.id,
      tipo: r.tipo,
      entita: r.entita_riferimento,
      url: r.url,
      formato: r.url?.startsWith('/uploads/') ? '✅ Corretto' : '❌ Sbagliato'
    })));
    
    // 2. Controlla file locali
    const localUploadPath = path.join(process.cwd(), 'src', 'public', 'uploads');
    console.log('\n📁 File LOCALI in:', localUploadPath);
    
    if (fs.existsSync(localUploadPath)) {
      const localFiles = fs.readdirSync(localUploadPath).filter(f => f !== '.gitkeep');
      if (localFiles.length > 0) {
        console.log(`   Trovati ${localFiles.length} file:`);
        localFiles.slice(0, 5).forEach(f => console.log(`   - ${f}`));
        if (localFiles.length > 5) console.log(`   ... e altri ${localFiles.length - 5}`);
      } else {
        console.log('   ⚠️  Nessun file trovato (normale in locale se non hai caricato nulla)');
      }
    } else {
      console.log('   ❌ Directory non esiste');
    }
    
    // 3. Verifica corrispondenza
    console.log('\n🔗 Verifica corrispondenza DB ↔ File:');
    for (const img of dbImages.rows.slice(0, 5)) {
      if (!img.url || !img.url.startsWith('/uploads/')) continue;
      
      const filename = img.url.replace('/uploads/', '');
      const localPath = path.join(localUploadPath, filename);
      const exists = fs.existsSync(localPath);
      
      console.log(`   ${img.url}`);
      console.log(`      DB: ✅ | File locale: ${exists ? '✅ Esiste' : '❌ Mancante'}`);
    }
    
    // 4. Riepilogo
    console.log('\n📋 RIEPILOGO:');
    const correctPaths = dbImages.rows.filter(r => r.url?.startsWith('/uploads/')).length;
    const wrongPaths = dbImages.rows.filter(r => r.url && !r.url.startsWith('/uploads/')).length;
    
    console.log(`   ✅ Percorsi corretti nel DB: ${correctPaths}/${dbImages.rows.length}`);
    console.log(`   ❌ Percorsi sbagliati nel DB: ${wrongPaths}/${dbImages.rows.length}`);
    
    if (wrongPaths > 0) {
      console.log('\n   ⚠️  Esegui: npm run fix-railway-paths');
    }
    
    console.log('\n💡 COSA FARE:');
    console.log('   1. Se i percorsi DB sono corretti (✅) ma i file non si vedono:');
    console.log('      → Problema di serving in app.js o file mancanti su Railway');
    console.log('   2. Se i percorsi DB sono sbagliati (❌):');
    console.log('      → Esegui: npm run fix-railway-paths');
    console.log('   3. Se tutto è ✅ in locale ma non funziona su Railway:');
    console.log('      → Verifica volume montato e variabile RAILWAY_ENVIRONMENT\n');
    
  } catch (error) {
    console.error('❌ Errore:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

diagnose();
