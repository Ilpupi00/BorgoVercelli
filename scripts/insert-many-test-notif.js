require('dotenv').config();
const db = require('../src/core/config/database');

const COUNT = parseInt(process.argv[2] || '20', 10);

(async () => {
  try {
    for (let i = 0; i < COUNT; i++) {
      const payload = {
        title: `🧪 Bulk Test ${i+1}`,
        body: `Messaggio di prova bulk #${i+1}`,
        icon: '/assets/images/Logo.png',
        url: '/',
        tag: `bulk-test-${i+1}`
      };

      const res = await db.query(
        `INSERT INTO notifications (type, payload, status, priority, send_after, max_attempts)
         VALUES ($1, $2, $3, $4, NOW(), $5)
         RETURNING id`,
        ['admin', JSON.stringify(payload), 'pending', 1, 3]
      );

      console.log('Inserted ID', res.rows[0].id);
    }
    process.exit(0);
  } catch (e) {
    console.error('Errore inserimento notifica:', e);
    process.exit(1);
  }
})();
