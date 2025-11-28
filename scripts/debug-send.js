const webpush = require('web-push');
const db = require('../src/core/config/database');

(async () => {
  try {
    webpush.setVapidDetails(
      `mailto:${process.env.VAPID_EMAIL || 'no-reply@example.com'}`,
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );

    const res = await db.query('SELECT id, endpoint, p256dh, auth, user_id FROM push_subscriptions ORDER BY created_at DESC LIMIT 1');
    if (!res.rows || res.rows.length === 0) {
      console.error('No subscription found');
      process.exit(2);
    }

    const row = res.rows[0];
    const sub = {
      endpoint: row.endpoint,
      keys: {
        p256dh: row.p256dh,
        auth: row.auth
      }
    };

    console.log('Sending to endpoint (truncated):', sub.endpoint.substring(0, 120) + '...');

    const payload = {
      title: 'Direct Debug Test',
      body: 'Invio diretto da scripts/debug-send.js',
      url: '/'
    };

    await webpush.sendNotification(sub, JSON.stringify(payload), { TTL: 60, urgency: 'high' });
    console.log('Send call resolved without error');
    process.exit(0);
  } catch (e) {
    console.error('Send error:', e);
    if (e.statusCode) console.error('StatusCode:', e.statusCode);
    if (e.body) console.error('Body:', e.body);
    process.exit(3);
  }
})();
