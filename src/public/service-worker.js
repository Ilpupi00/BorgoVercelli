'use strict';

/**
 * Service Worker per Web Push Notifications
 * Gestisce la ricezione delle notifiche push e l'interazione utente
 * Compatibile con tutti i browser moderni (Chrome, Firefox, Safari, Edge)
 */

// Nome della cache per il service worker
const CACHE_NAME = 'borgo-vercelli-sw-v1';

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
  
  // Configurazione opzioni notifica con supporto cross-browser
  const options = {
    body: data.body || 'Hai ricevuto una notifica',
    icon: data.icon || '/assets/images/Logo.png',
    badge: data.badge || '/assets/images/Logo.png',
    data: {
      url: data.url || '/',
      timestamp: Date.now(),
      ...(data.data || {})
    },
    // Tag univoco per evitare soppressione su Chrome e permettere raggruppamento
    tag: data.tag || `bv-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
    renotify: true,
    requireInteraction: data.requireInteraction !== undefined ? data.requireInteraction : false,
    silent: false
  };

  // Aggiungi vibrazione solo se supportata (non su iOS)
  if ('vibrate' in navigator) {
    options.vibrate = data.vibrate || [200, 100, 200];
  }

  // Aggiungi azioni solo se supportate (non su Safari iOS < 16.4)
  if (data.actions && Array.isArray(data.actions) && data.actions.length > 0) {
    // Limita a 2 azioni per massima compatibilità
    options.actions = data.actions.slice(0, 2);
  }

  // Aggiungi immagine se fornita e supportata
  if (data.image) {
    options.image = data.image;
  }

  // Aggiungi timestamp visibile se non già presente nel body
  if (data.timestamp) {
    options.timestamp = data.timestamp;
  }

  // Inoltra il payload ai client attivi (fallback in-page) con gestione errori robusta
  const forwardToClients = async () => {
    try {
      const allClients = await clients.matchAll({ 
        includeUncontrolled: true, 
        type: 'window' 
      });
      
      console.log('[Service Worker] forwardToClients -> clients trovati:', allClients.length);
      
      if (allClients.length > 0) {
        const msg = { type: 'push', payload: data };
        
        // Invia a tutti i client in parallelo
        await Promise.allSettled(
          allClients.map(client => 
            client.postMessage(msg).catch(e => 
              console.warn('[Service Worker] Impossibile postMessage a client:', e)
            )
          )
        );
      }
      
      return allClients.length;
    } catch (e) {
      console.error('[Service Worker] Errore forwarding message ai clients:', e);
      return 0;
    }
  };

  // Mostra la notifica con gestione errori robusta
  const showNotificationSafely = async () => {
    try {
      console.log('[Service Worker] showNotification -> title:', title);
      console.log('[Service Worker] showNotification -> options:', JSON.stringify(options, null, 2));
      
      await self.registration.showNotification(title, options);
      
      console.log('[Service Worker] ✅ showNotification completato con successo');
      return { shown: true };
    } catch (e) {
      console.error('[Service Worker] ❌ showNotification fallita:', e);
      
      // Fallback: prova con opzioni minime per massima compatibilità
      try {
        console.log('[Service Worker] Tentativo fallback con opzioni minime...');
        await self.registration.showNotification(title, {
          body: options.body,
          icon: options.icon,
          data: options.data,
          tag: options.tag
        });
        console.log('[Service Worker] ✅ Fallback showNotification completato');
        return { shown: true, fallback: true };
      } catch (fallbackError) {
        console.error('[Service Worker] ❌ Anche fallback showNotification fallita:', fallbackError);
        return { shown: false, error: String(e), fallbackError: String(fallbackError) };
      }
    }
  };

  // Gestisci l'evento push in modo asincrono
  event.waitUntil((async () => {
    try {
      const [showResult, clientsCount] = await Promise.all([
        showNotificationSafely(),
        forwardToClients()
      ]);
      
      console.log('[Service Worker] 📊 Push handling completato:');
      console.log('[Service Worker]   - Notifica mostrata:', showResult.shown);
      console.log('[Service Worker]   - Client messaggiati:', clientsCount);
      
      if (showResult.fallback) {
        console.log('[Service Worker]   - Usato fallback per compatibilità');
      }
    } catch (error) {
      console.error('[Service Worker] ❌ Errore generale push handling:', error);
    }
  })());
});

// Event listener per il click sulla notifica (compatibile con tutti i browser)
self.addEventListener('notificationclick', event => {
  console.log('[Service Worker] 🖱️ Notifica cliccata:', event.notification.tag);
  
  // Chiudi la notifica
  event.notification.close();

  // Ottieni l'URL da aprire
  const urlToOpen = new URL(
    event.notification.data?.url || '/',
    self.location.origin
  ).href;

  console.log('[Service Worker] URL da aprire:', urlToOpen);

  // Gestisci le azioni se presenti (non tutte le piattaforme le supportano)
  if (event.action) {
    console.log('[Service Worker] Azione cliccata:', event.action);
    // Qui potresti gestire azioni specifiche
  }

  // Gestisci l'apertura/focus della finestra
  event.waitUntil((async () => {
    try {
      // Cerca finestre aperte
      const windowClients = await clients.matchAll({
        type: 'window',
        includeUncontrolled: true
      });

      console.log('[Service Worker] Finestre aperte trovate:', windowClients.length);

      // Cerca una finestra con lo stesso origin
      for (const client of windowClients) {
        try {
          const clientUrl = new URL(client.url);
          const targetUrl = new URL(urlToOpen);
          
          // Se troviamo una finestra con lo stesso URL o stesso origin, focusla e naviga
          if (clientUrl.origin === targetUrl.origin) {
            console.log('[Service Worker] Finestra esistente trovata, focus e navigazione');
            
            // Su alcuni browser, navigate potrebbe non essere disponibile
            if (client.navigate && clientUrl.href !== targetUrl.href) {
              await client.navigate(urlToOpen);
            }
            
            if ('focus' in client) {
              await client.focus();
            }
            
            return;
          }
        } catch (e) {
          console.warn('[Service Worker] Errore confronto URL client:', e);
        }
      }

      // Se non c'è una finestra aperta con lo stesso origin, aprila
      if (clients.openWindow) {
        console.log('[Service Worker] Apertura nuova finestra');
        await clients.openWindow(urlToOpen);
      } else {
        console.warn('[Service Worker] openWindow non disponibile su questo browser');
      }
    } catch (error) {
      console.error('[Service Worker] ❌ Errore gestione click notifica:', error);
    }
  })());
});

// Event listener per la chiusura della notifica
self.addEventListener('notificationclose', event => {
  console.log('[Service Worker] 🔕 Notifica chiusa:', event.notification.tag);
  
  // Opzionale: invia analytics o tracking
  const data = event.notification.data || {};
  if (data.trackClose) {
    console.log('[Service Worker] Tracking chiusura notifica');
    // Qui potresti inviare un evento di tracking al server
  }
});

// Event listener per l'installazione del service worker
self.addEventListener('install', event => {
  console.log('[Service Worker] 📦 Installazione in corso...');
  
  event.waitUntil((async () => {
    try {
      // Pre-cache delle risorse critiche (opzionale)
      // const cache = await caches.open(CACHE_NAME);
      // await cache.addAll(['/assets/images/Logo.png']);
      
      console.log('[Service Worker] ✅ Installazione completata');
      
      // Forza l'attivazione immediata senza attendere
      await self.skipWaiting();
    } catch (error) {
      console.error('[Service Worker] ❌ Errore durante installazione:', error);
    }
  })());
});

// Event listener per l'attivazione del service worker
self.addEventListener('activate', event => {
  console.log('[Service Worker] ⚡ Attivazione in corso...');
  
  event.waitUntil((async () => {
    try {
      // Pulizia cache vecchie (opzionale)
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => {
            console.log('[Service Worker] 🗑️ Rimozione cache vecchia:', name);
            return caches.delete(name);
          })
      );
      
      // Prendi il controllo immediato di tutti i client
      await clients.claim();
      
      console.log('[Service Worker] ✅ Attivazione completata');
      console.log('[Service Worker] 🎯 Service Worker ora attivo e in controllo');
    } catch (error) {
      console.error('[Service Worker] ❌ Errore durante attivazione:', error);
    }
  })());
});

// Event listener per messaggi dai client (opzionale, per comunicazione bidirezionale)
self.addEventListener('message', event => {
  console.log('[Service Worker] 💬 Messaggio ricevuto dal client:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  // Rispondi al client se necessario
  if (event.ports && event.ports[0]) {
    event.ports[0].postMessage({ 
      type: 'ACK', 
      message: 'Message received' 
    });
  }
});

// Gestione errori globali del service worker
self.addEventListener('error', event => {
  console.error('[Service Worker] ❌ Errore globale:', event.error);
});

self.addEventListener('unhandledrejection', event => {
  console.error('[Service Worker] ❌ Promise rejection non gestita:', event.reason);
});

console.log('[Service Worker] 🚀 Service Worker caricato e pronto');
console.log('[Service Worker] 📍 Scope:', self.registration?.scope || 'unknown');
