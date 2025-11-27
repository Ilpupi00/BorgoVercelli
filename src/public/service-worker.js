'use strict';

/**
 * Service Worker per Web Push Notifications
 * Gestisce la ricezione delle notifiche push e l'interazione utente
 */

// Event listener per le notifiche push in arrivo
self.addEventListener('push', event => {
  console.log('[Service Worker] Push ricevuto:', event);
  
  let data = {};
  
  try {
    data = event.data ? event.data.json() : {};
  } catch (error) {
    console.error('[Service Worker] Errore parsing push data:', error);
    data = {
      title: 'Notifica',
      body: event.data ? event.data.text() : 'Hai ricevuto una notifica'
    };
  }

  const title = data.title || 'Borgo Vercelli';
  const options = {
    body: data.body || 'Hai ricevuto una notifica',
    icon: data.icon || '/assets/images/icon-192.png',
    badge: data.badge || '/assets/images/badge-72.png',
    data: {
      url: data.url || '/',
      timestamp: Date.now(),
      ...data.data
    },
    tag: data.tag || 'default-notification',
    requireInteraction: data.requireInteraction || false,
    vibrate: data.vibrate || [200, 100, 200],
    actions: data.actions || []
  };

  // Mostra la notifica
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
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
