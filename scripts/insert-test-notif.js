require('dotenv').config();
const db = require('../src/core/config/database');

(async () => {
  try {
    const payload = {
      title: '🧪 Test Push - Manual',
      body: 'Messaggio di prova inviato manualmente dal test script',
      icon: '/assets/images/Logo.png',
      url: '/',
      tag: 'manual-test'
    };

    const res = await db.query(
      `INSERT INTO notifications (type, payload, status, priority, send_after, max_attempts)
       VALUES ($1, $2, $3, $4, NOW(), $5)
       RETURNING id`,
      ['admin', JSON.stringify(payload), 'pending', 1, 3]
    );

    console.log('Notifica inserita con ID', res.rows[0].id);
    process.exit(0);
  } catch (e) {
    console.error('Errore inserimento notifica:', e);
    process.exit(1);
  }
})();
