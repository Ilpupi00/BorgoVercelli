require('dotenv').config();
const db = require('../src/core/config/database');

(async () => {
    await new Promise(r => setTimeout(r, 1000));
    
    const res = await db.query(`
        SELECT id, type, status, send_after, attempts, 
               EXTRACT(EPOCH FROM (send_after - NOW())) as seconds_to_send
        FROM notifications 
        WHERE status = 'pending' 
        ORDER BY send_after 
        LIMIT 5
    `);
    
    console.log('\n📋 Notifiche PENDING:');
    console.log('═══════════════════════════════════════\n');
    
    if (res.rows.length === 0) {
        console.log('Nessuna notifica pending trovata.');
    } else {
        res.rows.forEach(n => {
            const secsToSend = Math.round(n.seconds_to_send);
            const status = secsToSend <= 0 ? '✅ PRONTA' : `⏳ tra ${secsToSend}s`;
            console.log(`ID ${n.id} (${n.type}):`);
            console.log(`  Status: ${status}`);
            console.log(`  Tentativi: ${n.attempts}`);
            console.log(`  send_after: ${n.send_after.toISOString()}`);
            console.log('');
        });
    }
    
    process.exit(0);
})().catch(err => {
    console.error('Errore:', err);
    process.exit(1);
});
