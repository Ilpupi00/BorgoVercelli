const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../database/database.db');
const db = new sqlite3.Database(dbPath);

console.log('🔧 Correzione percorsi immagini nel database\n');

// 1. Mostra situazione prima
db.all(`SELECT COUNT(*) as total, 
        COUNT(CASE WHEN url LIKE 'src/public/uploads/%' THEN 1 END) as da_correggere
        FROM IMMAGINI`, (err, rows) => {
    if (err) {
        console.error('Errore:', err);
        db.close();
        return;
    }
    
    console.log('📊 Situazione PRIMA:');
    console.log(`   Totale immagini: ${rows[0].total}`);
    console.log(`   Da correggere: ${rows[0].da_correggere}\n`);
    
    // 2. Esegui correzione
    db.run(`UPDATE IMMAGINI 
            SET url = '/' || SUBSTR(url, LENGTH('src/public/') + 1)
            WHERE url LIKE 'src/public/uploads/%'`, function(err) {
        if (err) {
            console.error('Errore durante l\'aggiornamento:', err);
            db.close();
            return;
        }
        
        console.log(`✅ Aggiornati ${this.changes} record\n`);
        
        // 3. Correggi anche percorsi senza slash iniziale
        db.run(`UPDATE IMMAGINI 
                SET url = '/' || url
                WHERE url LIKE 'uploads/%' AND url NOT LIKE '/uploads/%'`, function(err2) {
            if (err2) {
                console.error('Errore:', err2);
                db.close();
                return;
            }
            
            if (this.changes > 0) {
                console.log(`✅ Corretti ${this.changes} percorsi senza slash\n`);
            }
            
            // 4. Mostra situazione dopo
            db.all(`SELECT COUNT(*) as total,
                    COUNT(CASE WHEN url LIKE '/uploads/%' THEN 1 END) as corretti,
                    COUNT(CASE WHEN url LIKE 'src/public/%' THEN 1 END) as ancora_sbagliati
                    FROM IMMAGINI`, (err3, rows2) => {
                if (err3) {
                    console.error('Errore:', err3);
                } else {
                    console.log('📊 Situazione DOPO:');
                    console.log(`   Totale immagini: ${rows2[0].total}`);
                    console.log(`   Corretti (/uploads/...): ${rows2[0].corretti}`);
                    console.log(`   Ancora sbagliati: ${rows2[0].ancora_sbagliati}\n`);
                }
                
                // 5. Mostra alcuni esempi
                db.all(`SELECT id, entita_riferimento, url FROM IMMAGINI WHERE url LIKE '/uploads/%' LIMIT 5`, (err4, examples) => {
                    if (!err4 && examples.length > 0) {
                        console.log('📸 Esempi di URL corretti:');
                        examples.forEach(ex => {
                            console.log(`   ${ex.entita_riferimento} (ID ${ex.id}): ${ex.url}`);
                        });
                    }
                    db.close();
                    console.log('\n✅ Correzione completata! Ricarica la pagina per vedere le immagini.');
                });
            });
        });
    });
});
