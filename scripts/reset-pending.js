require('dotenv').config();
const db = require('../src/core/config/database');

(async () => {
    await new Promise(r => setTimeout(r, 1000));
    
    console.log('\n🔄 Reset notifiche pending per invio immediato...\n');
    
    const res = await db.query(`
        UPDATE notifications
        SET send_after = NOW(),
            attempts = 0,
            last_error = NULL
        WHERE status = 'pending'
          AND send_after > NOW()
        RETURNING id, type
    `);
    
    if (res.rowCount === 0) {
        console.log('✅ Nessuna notifica da resettare.');
    } else {
        console.log(`✅ Reset completato per ${res.rowCount} notifiche:\n`);
        res.rows.forEach(n => {
            console.log(`   - ID ${n.id} (${n.type})`);
        });
        console.log('\n💡 Ora il worker può processarle immediatamente.');
    }
    
    process.exit(0);
})().catch(err => {
    console.error('Errore:', err);
    process.exit(1);
});
