/**
 * Script di diagnostica per verificare se ci sono notizie senza ID nel database
 */

require('dotenv').config();
const db = require('../src/core/config/database');

async function checkNotizieIds() {
    try {
        console.log('🔍 Controllo notizie nel database...\n');

        // Aspetta che il DB sia connesso
        await db.ready;

        // Query per trovare tutte le notizie
        const sql = `
            SELECT N.id, N.titolo, N.pubblicata, N.created_at
            FROM NOTIZIE N
            ORDER BY N.created_at DESC
        `;

        return new Promise((resolve, reject) => {
            db.all(sql, [], (err, rows) => {
                if (err) {
                    console.error('❌ Errore nella query:', err);
                    return reject(err);
                }

                console.log(`📊 Totale notizie trovate: ${rows.length}\n`);

                // Controlla se ci sono notizie senza ID
                const noId = rows.filter(r => !r.id);
                
                if (noId.length > 0) {
                    console.error(`⚠️  ATTENZIONE: Trovate ${noId.length} notizie SENZA ID!`);
                    console.error('Dettagli notizie senza ID:');
                    noId.forEach((row, idx) => {
                        console.error(`  ${idx + 1}. Titolo: "${row.titolo || 'N/A'}", Created: ${row.created_at || 'N/A'}`);
                    });
                    console.error('\n⚠️  Queste notizie causeranno errori /notizia/undefined!\n');
                } else {
                    console.log('✅ Tutte le notizie hanno un ID valido!\n');
                }

                // Mostra le prime 5 notizie per verifica
                console.log('📝 Prime 5 notizie:');
                rows.slice(0, 5).forEach((row, idx) => {
                    console.log(`  ${idx + 1}. ID: ${row.id}, Titolo: "${row.titolo || 'N/A'}", Pubblicata: ${row.pubblicata ? 'Sì' : 'No'}`);
                });

                db.close();
                resolve();
            });
        });
    } catch (error) {
        console.error('❌ Errore durante il controllo:', error);
        process.exit(1);
    }
}

// Esegui lo script
checkNotizieIds()
    .then(() => {
        console.log('\n✅ Controllo completato!');
        process.exit(0);
    })
    .catch((err) => {
        console.error('\n❌ Errore:', err);
        process.exit(1);
    });
