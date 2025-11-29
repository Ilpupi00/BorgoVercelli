require('dotenv').config();
const { Pool } = require('pg');

async function applyMigration() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    try {
        console.log('Connessione al database...');
        
        // 1. Aggiungi colonna
        console.log('Aggiungendo colonna reminder_sent...');
        await pool.query(`
            ALTER TABLE PRENOTAZIONI 
            ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT FALSE
        `);
        console.log('✅ Colonna aggiunta');
        
        // 2. Crea indice
        console.log('Creando indice...');
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_prenotazioni_reminder_check 
            ON PRENOTAZIONI (stato, reminder_sent, data_prenotazione, ora_inizio)
            WHERE stato = 'confermata' AND reminder_sent = false
        `);
        console.log('✅ Indice creato');
        
        // 3. Aggiungi commento
        console.log('Aggiungendo commento...');
        await pool.query(`
            COMMENT ON COLUMN PRENOTAZIONI.reminder_sent 
            IS 'Indica se è stato inviato il promemoria push 2 ore prima'
        `);
        console.log('✅ Commento aggiunto');
        
        console.log('\n✅ Migration completata con successo!');
        
    } catch (error) {
        console.error('❌ Errore:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

applyMigration();
