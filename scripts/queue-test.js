require('dotenv').config();
const notifications = require('../src/shared/services/notifications');

(async () => {
  try {
    const payload = {
      title: 'Test Queue Immediate',
      body: 'Verifica send_after DB-side',
      icon: '/assets/images/Logo.png',
      url: '/'
    };

    const res = await notifications.queueNotificationForUsers([8], payload);
    console.log('queue result:', res);
    process.exit(0);
  } catch (e) {
    console.error('queue-test error:', e);
    process.exit(1);
  }
})();
