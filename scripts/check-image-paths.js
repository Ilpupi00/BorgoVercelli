const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../database/database.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 Controllo percorsi immagini nel database\n');

db.all(`SELECT id, entita_id, entita_riferimento, url FROM IMMAGINI WHERE entita_riferimento = 'utente' ORDER BY id DESC LIMIT 10`, (err, rows) => {
    if (err) {
        console.error('Errore:', err);
        db.close();
        return;
    }
    
    console.log('📸 Immagini profilo utente:');
    console.table(rows);
    
    const problemi = rows.filter(r => r.url && (r.url.startsWith('src/public/') || !r.url.startsWith('/')));
    
    if (problemi.length > 0) {
        console.log('\n⚠️  Percorsi da correggere:');
        problemi.forEach(p => {
            const vecchio = p.url;
            let nuovo = vecchio;
            if (vecchio.startsWith('src/public/uploads/')) {
                nuovo = '/' + vecchio.slice('src/public/'.length);
            } else if (vecchio.startsWith('uploads/')) {
                nuovo = '/' + vecchio;
            }
            console.log(`  ID ${p.id}: "${vecchio}" → "${nuovo}"`);
        });
    } else {
        console.log('\n✅ Tutti i percorsi sono corretti!');
    }
    
    db.close();
});
