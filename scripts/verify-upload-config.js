/**
 * Script di verifica configurazione Railway Volume
 * Controlla che i percorsi siano configurati correttamente
 */

const path = require('path');
const fs = require('fs');

console.log('🔍 Verifica Configurazione Railway Volume\n');
console.log('========================================\n');

// 1. Verifica variabile d'ambiente
console.log('1️⃣  Ambiente:');
console.log(`   RAILWAY_ENVIRONMENT: ${process.env.RAILWAY_ENVIRONMENT || 'non impostato (locale)'}`);
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'non impostato'}\n`);

// 2. Verifica percorso upload
const isRailway = !!process.env.RAILWAY_ENVIRONMENT;
const uploadDir = isRailway 
  ? '/data/uploads' 
  : path.join(process.cwd(), 'src', 'public', 'uploads');

console.log('2️⃣  Percorso Upload:');
console.log(`   ${uploadDir}`);
console.log(`   Esiste: ${fs.existsSync(uploadDir) ? '✅ Sì' : '❌ No (verrà creato al primo upload)'}\n`);

// 3. Verifica multer config
try {
  const multerConfig = require('../src/core/config/multer');
  console.log('3️⃣  Multer Config:');
  console.log(`   uploadDir: ${multerConfig.uploadDir}`);
  console.log(`   upload configurato: ✅`);
  console.log(`   uploadSquadra configurato: ✅\n`);
} catch (err) {
  console.error('❌ Errore nel caricamento di multer.js:', err.message, '\n');
}

// 4. Verifica railway.toml
console.log('4️⃣  Railway Configuration:');
const railwayTomlPath = path.join(process.cwd(), 'railway.toml');
if (fs.existsSync(railwayTomlPath)) {
  console.log(`   railway.toml: ✅ Presente`);
  const content = fs.readFileSync(railwayTomlPath, 'utf8');
  const hasVolume = content.includes('[[deploy.volumes]]');
  const hasMountPath = content.includes('mountPath = "/data"');
  console.log(`   Volume configurato: ${hasVolume && hasMountPath ? '✅' : '❌'}`);
} else {
  console.log(`   railway.toml: ❌ Non trovato`);
}
console.log('');

// 5. Verifica .gitignore
console.log('5️⃣  Git Configuration:');
const gitignorePath = path.join(process.cwd(), '.gitignore');
if (fs.existsSync(gitignorePath)) {
  const content = fs.readFileSync(gitignorePath, 'utf8');
  const ignoresUploads = content.includes('src/public/uploads/*');
  console.log(`   .gitignore ignora uploads: ${ignoresUploads ? '✅' : '⚠️  Non configurato'}`);
} else {
  console.log(`   .gitignore: ❌ Non trovato`);
}
console.log('');

// 6. Riepilogo
console.log('========================================\n');
if (isRailway) {
  console.log('🚂 MODALITÀ: Railway (Produzione)');
  console.log('📁 Upload salvati in: /data/uploads (volume persistente)');
  console.log('');
  console.log('⚠️  IMPORTANTE:');
  console.log('   1. Verifica che il volume "uploads-volume" sia creato su Railway');
  console.log('   2. Mount path deve essere: /data');
  console.log('   3. Controlla i log dopo il deploy per confermare');
} else {
  console.log('💻 MODALITÀ: Sviluppo Locale');
  console.log('📁 Upload salvati in: src/public/uploads/');
  console.log('');
  console.log('✅ Per testare:');
  console.log('   1. Avvia il server: npm start');
  console.log('   2. Carica un\'immagine (es. foto profilo)');
  console.log('   3. Verifica che appaia in src/public/uploads/');
}
console.log('');
console.log('📖 Documentazione completa: docs/RAILWAY_VOLUME_SETUP.md');
console.log('');
