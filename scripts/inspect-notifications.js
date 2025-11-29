require('dotenv').config();
const db = require('../src/core/config/database');

(async () => {
  try {
    const res = await db.query(
      `SELECT id,type,user_ids,payload,status,attempts,max_attempts,send_after,created_at,sent_at,last_error
       FROM notifications
       ORDER BY created_at DESC
       LIMIT 30`
    );

    console.log(JSON.stringify(res.rows, null, 2));
    process.exit(0);
  } catch (e) {
    console.error('Errore query notifications:', e);
    process.exit(1);
  }
})();
