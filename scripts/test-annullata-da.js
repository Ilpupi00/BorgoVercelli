/**
 * Script di test per verificare la colonna annullata_da
 */

const db = require('../src/core/config/database');

async function testColumn() {
    console.log('🔍 Verifica della colonna annullata_da...\n');
    
    try {
        // Attendi che il database sia pronto
        await db.ready;
        
        // 1. Verifica struttura tabella
        console.log('1️⃣ Verifica struttura tabella PRENOTAZIONI:');
        await new Promise((resolve, reject) => {
            db.all(`
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns 
                WHERE table_name = 'prenotazioni'
                ORDER BY ordinal_position
            `, [], (err, cols) => {
                if (err) return reject(err);
                console.table(cols);
                
                const hasColumn = cols.some(c => c.column_name === 'annullata_da');
                if (hasColumn) {
                    console.log('✅ Colonna annullata_da trovata!\n');
                } else {
                    console.log('❌ Colonna annullata_da NON trovata!\n');
                }
                resolve();
            });
        });
        
        // 2. Mostra alcune prenotazioni
        console.log('2️⃣ Esempio di prenotazioni (ultime 5):');
        await new Promise((resolve, reject) => {
            db.all(`
                SELECT id, stato, annullata_da, created_at
                FROM PRENOTAZIONI 
                ORDER BY id DESC 
                LIMIT 5
            `, [], (err, rows) => {
                if (err) return reject(err);
                console.table(rows);
                resolve();
            });
        });
        
        // 3. Conteggio per stato
        console.log('3️⃣ Conteggio prenotazioni per stato:');
        await new Promise((resolve, reject) => {
            db.all(`
                SELECT stato, annullata_da, COUNT(*) as count
                FROM PRENOTAZIONI 
                GROUP BY stato, annullata_da
                ORDER BY stato, annullata_da
            `, [], (err, rows) => {
                if (err) return reject(err);
                console.table(rows);
                resolve();
            });
        });
        
        console.log('\n✅ Test completato!');
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Errore:', error);
        process.exit(1);
    }
}

testColumn();
