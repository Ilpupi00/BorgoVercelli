'use strict';

/**
 * Service Worker per Web Push Notifications
 * Gestisce la ricezione delle notifiche push e l'interazione utente
 */

// Event listener per le notifiche push in arrivo
self.addEventListener('push', event => {
  console.log('[Service Worker] Push ricevuto (start)', event);

  let data = {};

  try {
    data = event.data ? event.data.json() : {};
  } catch (error) {
    console.error('[Service Worker] Errore parsing push data:', error);
    try {
      const text = event.data ? event.data.text() : 'Hai ricevuto una notifica';
      data = { title: 'Notifica', body: text };
    } catch (e) {
      data = { title: 'Notifica', body: 'Hai ricevuto una notifica' };
    }
  }

  const title = data.title || 'Borgo Vercelli';
  const options = {
    body: data.body || 'Hai ricevuto una notifica',
    icon: data.icon || '/assets/images/Logo.png',
    badge: data.badge || '/assets/images/Logo.png',
    data: {
      url: data.url || '/',
      timestamp: Date.now(),
      ...data.data
    },
    // Use a unique tag per notification to avoid Chrome suppressing toasts
    tag: data.tag || `bv-${Date.now()}-${Math.floor(Math.random()*100000)}`,
    renotify: true,
    requireInteraction: data.requireInteraction !== undefined ? data.requireInteraction : false,
    vibrate: data.vibrate || [200, 100, 200],
    silent: false,
    actions: data.actions || []
  };

  // Inoltra il payload ai client attivi (fallback in-page)
  const msg = { type: 'push', payload: data };
  const forwardToClients = async () => {
    try {
      const allClients = await clients.matchAll({ includeUncontrolled: true, type: 'window' });
      console.log('[Service Worker] forwardToClients -> clients trovati:', allClients.length);
      for (const c of allClients) {
        try {
          c.postMessage(msg);
        } catch (e) {
          console.warn('[Service Worker] Impossibile postMessage a client:', e);
        }
      }
      return allClients.length;
    } catch (e) {
      console.error('[Service Worker] Errore forwarding message ai clients:', e);
      return 0;
    }
  };

  // Mostra la notifica e inoltra il messaggio in parallelo; logga il risultato
  const doShow = async () => {
    try {
      console.log('[Service Worker] showNotification -> title:', title, 'options:', options);
      await self.registration.showNotification(title, options);
      console.log('[Service Worker] showNotification -> completato');
      return { shown: true };
    } catch (e) {
      console.error('[Service Worker] showNotification -> fallita:', e);
      return { shown: false, error: String(e) };
    }
  };

  event.waitUntil((async () => {
    const [showResult, clientsCount] = await Promise.all([doShow(), forwardToClients()]);
    console.log('[Service Worker] push handling completato -> showResult:', showResult, 'clientsMessaged:', clientsCount);
  })());
});

// Event listener per il click sulla notifica
self.addEventListener('notificationclick', event => {
  console.log('[Service Worker] Notifica cliccata:', event);
  
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(windowClients => {
      // Cerca se c'è già una finestra aperta con l'URL
      for (let client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Se non c'è una finestra aperta, aprila
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Event listener per la chiusura della notifica
self.addEventListener('notificationclose', event => {
  console.log('[Service Worker] Notifica chiusa:', event);
  // Qui puoi tracciare le notifiche chiuse senza interazione
});

// Event listener per l'installazione del service worker
self.addEventListener('install', event => {
  console.log('[Service Worker] Installato');
  // Forza l'attivazione immediata
  self.skipWaiting();
});

// Event listener per l'attivazione del service worker
self.addEventListener('activate', event => {
  console.log('[Service Worker] Attivato');
  // Prendi il controllo di tutti i client immediatamente
  event.waitUntil(clients.claim());
});
