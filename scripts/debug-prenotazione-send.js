const pushService = require('../src/shared/services/webpush');
const db = require('../src/core/config/database');

(async () => {
  try {
    // Parametri di esempio: puoi modificarli o passarli via env
    const campo_id = process.env.DEBUG_CAMPO_ID || 1;
    const utente_id = process.env.DEBUG_UTENTE_ID || 2;
    const data_prenotazione = process.env.DEBUG_DATA || '2025-12-01';
    const ora_inizio = process.env.DEBUG_ORA_IN || '18:00';
    const ora_fine = process.env.DEBUG_ORA_OUT || '19:00';

    // Recupera nome campo se possibile
    let campoNome = `Campo ${campo_id}`;
    try {
      const r = await db.query('SELECT nome FROM campi WHERE id = $1', [campo_id]);
      if (r && r.rows && r.rows[0] && r.rows[0].nome) campoNome = r.rows[0].nome;
    } catch (e) {
      // Non bloccante
    }

    const dataFormatted = new Date(data_prenotazione).toLocaleDateString('it-IT');

    console.log('[DEBUG PRENOTAZIONE] Invio notifica admin...');
    const resAdmins = await pushService.sendNotificationToAdmins({
      title: '🔔 Nuova Prenotazione (debug-script)',
      body: `${campoNome} - ${dataFormatted} dalle ${ora_inizio} alle ${ora_fine}`,
      icon: '/assets/images/Logo.png',
      url: '/admin',
      tag: `prenotazione-debug-${Date.now()}`,
      requireInteraction: true
    });
    console.log('[DEBUG PRENOTAZIONE] Risultato admin:', resAdmins);

    if (utente_id) {
      console.log('[DEBUG PRENOTAZIONE] Invio notifica utente id=', utente_id);
      const resUser = await pushService.sendNotificationToUsers([Number(utente_id)], {
        title: '✅ Prenotazione Effettuata (debug-script)',
        body: `Hai prenotato: ${campoNome} - ${dataFormatted} dalle ${ora_inizio} alle ${ora_fine}`,
        icon: '/assets/images/Logo.png',
        url: '/users/mie-prenotazioni',
        tag: `prenotazione-debug-${Date.now()}-user`,
        requireInteraction: true
      });
      console.log('[DEBUG PRENOTAZIONE] Risultato utente:', resUser);
    }

    console.log('[DEBUG PRENOTAZIONE] Fine script');
    process.exit(0);
  } catch (err) {
    console.error('[DEBUG PRENOTAZIONE] Errore:', err);
    process.exit(2);
  }
})();
