/**
 * Push Notification Manager
 * Gestisce la registrazione del service worker e la subscription alle notifiche push
 */

class PushNotificationManager {
  constructor() {
    this.registration = null;
    this.subscription = null;
    this.isSupported = ('serviceWorker' in navigator && 'PushManager' in window);
  }

  /**
   * Verifica se le notifiche push sono supportate
   */
  static isSupported() {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  }

  /**
   * Converte una chiave VAPID da base64 a Uint8Array
   */
  urlBase64ToUint8Array(base64String) {
    try {
      if (!base64String || typeof base64String !== 'string') {
        throw new Error('VAPID public key must be a string');
      }
      
      // Sanitize: remove whitespace, newlines, and any non-base64url characters
      let sanitized = base64String.trim().replace(/[\s\r\n]+/g, '');
      
      // Ensure only valid base64url characters (A-Z, a-z, 0-9, -, _)
      if (!/^[A-Za-z0-9_-]+$/.test(sanitized)) {
        console.warn('VAPID key contains invalid characters, sanitizing...');
        sanitized = sanitized.replace(/[^A-Za-z0-9_-]/g, '');
      }

      // Add padding if needed
      const padding = '='.repeat((4 - (sanitized.length % 4)) % 4);
      
      // Convert base64url to base64
      const base64 = (sanitized + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

      // Decode base64 to binary
      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);

      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }

      console.log('[VAPID] Key conversion successful, length:', outputArray.length);
      return outputArray;
    } catch (e) {
      console.error('[VAPID] Errore conversione key:', e);
      console.error('[VAPID] Input key:', base64String);
      console.error('[VAPID] Key length:', base64String ? base64String.length : 0);
      throw new Error('Failed to convert VAPID key: ' + e.message);
    }
  }

  /**
   * Registra il service worker
   */
  async registerServiceWorker() {
    try {
      if (!this.isSupported) {
        throw new Error('Le notifiche push non sono supportate su questo browser');
      }

      this.registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/'
      });

      console.log('Service Worker registrato:', this.registration);

      // Aspetta che il service worker sia pronto
      await navigator.serviceWorker.ready;

      return this.registration;
    } catch (error) {
      console.error('Errore registrazione Service Worker:', error);
      throw error;
    }
  }

  /**
   * Richiede il permesso per le notifiche
   */
  async requestPermission() {
    try {
      const permission = await Notification.requestPermission();

      if (permission === 'granted') {
        console.log('Permesso notifiche concesso');
        return true;
      } else if (permission === 'denied') {
        console.log('Permesso notifiche negato');
        return false;
      } else {
        console.log('Permesso notifiche non deciso');
        return false;
      }
    } catch (error) {
      console.error('Errore richiesta permesso notifiche:', error);
      throw error;
    }
  }

  /**
   * Mostra istruzioni all'utente quando il permesso notifiche è NEGATO.
   * Crea un modal con link alle impostazioni del browser quando possibile.
   */
  showPermissionDeniedInstructions() {
    try {
      if (document.getElementById('pushPermissionDeniedModal')) return;

      const ua = navigator.userAgent || '';
      let settingsHref = '';
      let instructions = 'Devi abilitare le notifiche nelle impostazioni del browser per riceverle.';

      if (ua.includes('Chrome') || ua.includes('Chromium') || ua.includes('Edg/')) {
        settingsHref = 'chrome://settings/content/notifications';
      } else if (ua.includes('Firefox')) {
        settingsHref = 'about:preferences#privacy';
      } else if (ua.includes('Safari') && ua.includes('Mac')) {
        // Safari non permette aprire le preferenze via URL; fornire istruzioni generiche
        settingsHref = '';
        instructions = 'Apri Safari > Preferenze > Siti web > Notifiche e abilita per questo sito.';
      }

      const modalHtml = `
        <div class="modal fade" id="pushPermissionDeniedModal" tabindex="-1" aria-labelledby="pushPermissionDeniedLabel" aria-hidden="true">
          <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title" id="pushPermissionDeniedLabel">Permessi Notifiche Negati</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body">
                <p>${instructions}</p>
                ${settingsHref ? `<p><a href="${settingsHref}" target="_blank" rel="noopener">Apri impostazioni notifiche browser</a></p>` : ''}
                <p class="small text-muted">Se hai negato in precedenza, potrebbe essere necessario modificare le impostazioni per questo sito.</p>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Chiudi</button>
              </div>
            </div>
          </div>
        </div>
      `;

      document.body.insertAdjacentHTML('beforeend', modalHtml);
      const modalEl = document.getElementById('pushPermissionDeniedModal');
      const bsModal = new bootstrap.Modal(modalEl);
      modalEl.addEventListener('hidden.bs.modal', function () { this.remove(); });
      bsModal.show();
    } catch (e) {
      console.warn('Errore mostra istruzioni permesso negato:', e);
    }
  }

  /**
   * Ottiene la chiave pubblica VAPID dal server
   */
  async getVapidPublicKey() {
    try {
      const response = await fetch('/push/vapidPublicKey', { credentials: 'include' });
      
      if (!response.ok) {
        throw new Error('Errore recupero VAPID key');
      }

      const data = await response.json();
      return data.publicKey;
    } catch (error) {
      console.error('Errore recupero VAPID key:', error);
      throw error;
    }
  }

  /**
   * Sottoscrive l'utente alle notifiche push
   */
  async subscribe() {
    try {
      console.log('[Push Manager] 🚀 Inizio processo di subscription...');
      
      if (!this.isSupported) {
        throw new Error('Le notifiche push non sono supportate su questo browser');
      }

      // Registra il service worker se non è già registrato
      if (!this.registration) {
        console.log('[Push Manager] Registrazione service worker...');
        this.registration = await this.registerServiceWorker();
      }

      // Richiedi il permesso
      console.log('[Push Manager] Richiesta permesso notifiche...');
      const hasPermission = await this.requestPermission();
      
      if (!hasPermission) {
        console.log('[Push Manager] ❌ Permesso notifiche negato');
        // Mostra istruzioni all'utente per riabilitare il permesso (se negato)
        try { 
          this.showPermissionDeniedInstructions(); 
        } catch(e) {
          console.warn('[Push Manager] Errore mostra istruzioni:', e);
        }
        throw new Error('Permesso notifiche negato');
      }

      console.log('[Push Manager] ✅ Permesso notifiche concesso');

      // Ottieni la chiave VAPID pubblica
      console.log('[Push Manager] Recupero VAPID public key...');
      const vapidPublicKey = await this.getVapidPublicKey();
      
      if (!vapidPublicKey) {
        throw new Error('VAPID public key non disponibile dal server');
      }

      console.log('[Push Manager] VAPID key ricevuta, lunghezza:', vapidPublicKey.length);

      // Crea la subscription con gestione errori migliorata
      try {
        console.log('[Push Manager] Tentativo di subscription...');
        
        const subscribeOptions = {
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey)
        };

        this.subscription = await this.registration.pushManager.subscribe(subscribeOptions);
        console.log('[Push Manager] ✅ Subscription creata con successo');
        
      } catch (err) {
        console.warn('[Push Manager] ⚠️ Subscription fallita al primo tentativo:', err.message);
        
        // Fallback: prova a normalizzare la chiave VAPID e riprova
        try {
          console.log('[Push Manager] Tentativo fallback con VAPID key normalizzata...');
          
          const normalized = vapidPublicKey.trim().replace(/\s+/g, '');
          const alt = normalized.replace(/\+/g, '-').replace(/\//g, '_');
          
          this.subscription = await this.registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: this.urlBase64ToUint8Array(alt)
          });
          
          console.log('[Push Manager] ✅ Subscription creata con successo (fallback)');
          
        } catch (err2) {
          console.error('[Push Manager] ❌ Subscription fallita anche con fallback:', err2);
          
          // Report error to server for debugging
          try {
            const errorReport = {
              message: (err2 && err2.message) || String(err2),
              name: err2 && err2.name,
              code: err2 && err2.code,
              stack: err2 && err2.stack,
              userAgent: navigator.userAgent,
              vapidSample: vapidPublicKey ? vapidPublicKey.substring(0, 50) : null,
              timestamp: new Date().toISOString()
            };
            
            await fetch('/push/subscribe-error', {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(errorReport)
            }).catch(e => console.warn('[Push Manager] Errore invio report errore:', e));
          } catch (e) {
            console.warn('[Push Manager] Impossibile inviare report errore:', e);
          }
          
          throw err2;
        }
      }

      console.log('[Push Manager] Subscription endpoint:', this.subscription.endpoint.substring(0, 60) + '...');

      // Invia la subscription al server
      console.log('[Push Manager] Invio subscription al server...');
      
      const response = await fetch('/push/subscribe', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(this.subscription)
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error('[Push Manager] ❌ Errore dal server:', response.status, errorText);
        throw new Error(`Errore salvataggio subscription: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('[Push Manager] ✅ Subscription salvata sul server:', result);

      return this.subscription;
      
    } catch (error) {
      console.error('[Push Manager] ❌ Errore durante subscription:', error);
      
      // Mostra un messaggio utente-friendly per errori comuni
      if (error.message.includes('401') || error.message.includes('non autenticato')) {
        console.error('[Push Manager] Utente non autenticato - reindirizzare al login');
      } else if (error.name === 'NotAllowedError') {
        console.error('[Push Manager] Permesso negato dall\'utente');
      } else if (error.name === 'NotSupportedError') {
        console.error('[Push Manager] Push notifications non supportate su questo dispositivo');
      }
      
      throw error;
    }
  }

  /**
   * Annulla la subscription alle notifiche push
   */
  async unsubscribe() {
    try {
      if (!this.subscription) {
        // Prova a recuperare la subscription esistente
        const reg = await navigator.serviceWorker.ready;
        this.subscription = await reg.pushManager.getSubscription();
      }

      if (this.subscription) {
        // Rimuovi dal server
        await fetch('/push/unsubscribe', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            endpoint: this.subscription.endpoint
          })
        });

        // Annulla la subscription locale
        await this.subscription.unsubscribe();
        this.subscription = null;
        
        console.log('Subscription rimossa');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Errore unsubscribe:', error);
      throw error;
    }
  }

  /**
   * Verifica se l'utente è già sottoscritto
   */
  async isSubscribed() {
    try {
      if (!this.isSupported) {
        return false;
      }

      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.getSubscription();
      
      return subscription !== null;
    } catch (error) {
      console.error('Errore verifica subscription:', error);
      return false;
    }
  }

  /**
   * Ottiene la subscription corrente
   */
  async getSubscription() {
    try {
      if (!this.isSupported) {
        return null;
      }

      const reg = await navigator.serviceWorker.ready;
      return await reg.pushManager.getSubscription();
    } catch (error) {
      console.error('Errore recupero subscription:', error);
      return null;
    }
  }
}

// Funzione helper globale per inizializzare le notifiche push
async function initPushNotifications() {
  try {
    console.log('[Push Init] 🚀 Inizializzazione push notifications...');
    
    const manager = new PushNotificationManager();
    
    if (!PushNotificationManager.isSupported()) {
      console.log('[Push Init] ⚠️ Le notifiche push non sono supportate su questo browser');
      console.log('[Push Init] Browser:', navigator.userAgent);
      return null;
    }

    console.log('[Push Init] ✅ Browser supporta push notifications');

    // Assicura che il service worker sia registrato PRIMA di chiamare ready/getSubscription
    try {
      await manager.registerServiceWorker();
      console.log('[Push Init] ✅ Service worker registrato');
    } catch (err) {
      console.warn('[Push Init] ⚠️ Impossibile registrare service worker:', err);
      return null;
    }

    // Verifica se l'utente è già sottoscritto
    const isSubscribed = await manager.isSubscribed();
    console.log('[Push Init] Stato subscription:', isSubscribed ? 'SOTTOSCRITTO' : 'NON SOTTOSCRITTO');
    
    if (!isSubscribed) {
      // Sottoscrivi automaticamente se non è già sottoscritto
      console.log('[Push Init] Tentativo di subscription automatica...');
      
      try {
        await manager.subscribe();
        console.log('[Push Init] ✅ Utente sottoscritto alle notifiche push');
      } catch (subError) {
        console.warn('[Push Init] ⚠️ Impossibile sottoscrivere automaticamente:', subError.message);
        
        // Non è un errore critico - l'utente può sottoscriversi manualmente dopo
        if (subError.message.includes('negato')) {
          console.log('[Push Init] L\'utente ha negato il permesso - può essere richiesto manualmente');
        }
      }
    } else {
      console.log('[Push Init] Utente già sottoscritto');
      
      // Se l'endpoint è già presente sul client, assicurati che sia salvato anche sul server
      try {
        const existingSub = await manager.getSubscription();
        
        if (existingSub) {
          console.log('[Push Init] Sincronizzazione subscription esistente con il server...');
          
          const response = await fetch('/push/subscribe', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(existingSub)
          });
          
          if (!response.ok) {
            const txt = await response.text();
            console.warn('[Push Init] ⚠️ Errore sincronizzazione:', response.status, txt);
          } else {
            console.log('[Push Init] ✅ Subscription sincronizzata con il server');
          }
        }
      } catch (e) {
        console.warn('[Push Init] ⚠️ Errore durante sincronizzazione:', e);
      }
    }

    console.log('[Push Init] ✅ Inizializzazione completata');
    return manager;
    
  } catch (error) {
    console.error('[Push Init] ❌ Errore inizializzazione push notifications:', error);
    return null;
  }
}

// Esporta per uso globale
if (typeof window !== 'undefined') {
  window.PushNotificationManager = PushNotificationManager;
  window.initPushNotifications = initPushNotifications;
}
