const webpush = require('web-push');
const db = require('../src/core/config/database');

(async () => {
  try {
    webpush.setVapidDetails(
      `mailto:${process.env.VAPID_EMAIL || 'no-reply@example.com'}`,
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );

    const res = await db.query('SELECT id, endpoint, p256dh, auth, user_id, is_admin FROM push_subscriptions ORDER BY created_at DESC');
    const rows = res.rows || [];
    console.log(`Found ${rows.length} subscriptions`);

    let sent = 0, failed = 0, removed = 0;
    const details = [];

    for (const row of rows) {
      const sub = { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } };
      process.stdout.write(`Sending to id=${row.id} user=${row.user_id} admin=${row.is_admin}... `);
      try {
        await webpush.sendNotification(sub, JSON.stringify({ title: 'Batch Test', body: 'Invio di test batch', url: '/' }), { TTL: 60, urgency: 'high' });
        console.log('OK');
        sent += 1;
        details.push({ id: row.id, endpoint: row.endpoint, status: 'ok' });
        // Update success timestamp
        await db.query('UPDATE push_subscriptions SET last_success_at = CURRENT_TIMESTAMP, error_count = 0 WHERE id = $1', [row.id]);
      } catch (e) {
        failed += 1;
        console.log('ERROR', e.statusCode || '', e.body ? (typeof e.body === 'string' ? e.body.substring(0,120) : JSON.stringify(e.body).substring(0,120)) : e.message);
        details.push({ id: row.id, endpoint: row.endpoint, status: 'error', code: e.statusCode || null, body: e.body || String(e) });
        if (e.statusCode === 410 || e.statusCode === 404) {
          removed += 1;
          await db.query('DELETE FROM push_subscriptions WHERE id = $1', [row.id]);
          console.log(' -> removed from DB');
        } else {
          // increment error_count
          await db.query('UPDATE push_subscriptions SET error_count = COALESCE(error_count,0) + 1, last_error_at = CURRENT_TIMESTAMP WHERE id = $1', [row.id]);
        }
      }
    }

    console.log('\nSummary:');
    console.log({ total: rows.length, sent, failed, removed });
    process.exit(0);
  } catch (err) {
    console.error('Batch send error:', err);
    process.exit(2);
  }
})();
