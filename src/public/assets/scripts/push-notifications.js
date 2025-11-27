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
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');
    
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    
    return outputArray;
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
      if (!this.isSupported) {
        throw new Error('Le notifiche push non sono supportate');
      }

      // Registra il service worker se non è già registrato
      if (!this.registration) {
        this.registration = await this.registerServiceWorker();
      }

      // Richiedi il permesso
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        // Mostra istruzioni all'utente per riabilitare il permesso (se negato)
        try { this.showPermissionDeniedInstructions(); } catch(e){}
        throw new Error('Permesso notifiche negato');
      }

      // Ottieni la chiave VAPID pubblica
      const vapidPublicKey = await this.getVapidPublicKey();
      
      if (!vapidPublicKey) {
        throw new Error('VAPID public key non disponibile');
      }

      // Crea la subscription
      this.subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey)
      });

      console.log('Subscription creata:', this.subscription);

      // Invia la subscription al server
      const response = await fetch('/push/subscribe', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(this.subscription)
      });

      if (!response.ok) {
        throw new Error('Errore salvataggio subscription sul server');
      }

      const result = await response.json();
      console.log('Subscription salvata sul server:', result);

      return this.subscription;
    } catch (error) {
      console.error('Errore subscription:', error);
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
    const manager = new PushNotificationManager();
    
    if (!PushNotificationManager.isSupported()) {
      console.log('Le notifiche push non sono supportate su questo browser');
      return null;
    }

    // Assicura che il service worker sia registrato PRIMA di chiamare ready/getSubscription
    try {
      await manager.registerServiceWorker();
      console.log('Service worker registrato (init).');
    } catch (err) {
      console.warn('Impossibile registrare service worker durante init:', err);
    }

    // Verifica se l'utente è già sottoscritto
    const isSubscribed = await manager.isSubscribed();
    
    if (!isSubscribed) {
      // Sottoscrivi automaticamente se non è già sottoscritto
      await manager.subscribe();
      console.log('Utente sottoscritto alle notifiche push');
    } else {
      console.log('Utente già sottoscritto alle notifiche push');
      try {
        // Se l'endpoint è già presente sul client, assicurati che sia salvato anche sul server
        const existingSub = await manager.getSubscription();
        if (existingSub) {
          console.log('Invio subscription esistente al server per assicurare salvataggio');
          await fetch('/push/subscribe', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(existingSub)
          }).then(async res => {
            if (!res.ok) {
              const txt = await res.text();
              console.warn('subscribe existing returned', res.status, txt);
            } else {
              console.log('Subscription esistente inviata al server con successo');
            }
          }).catch(err => console.warn('Errore invio subscription esistente al server', err));
        }
      } catch (e) {
        console.warn('Errore during ensure-subscription-save:', e);
      }
    }

    return manager;
  } catch (error) {
    console.error('Errore inizializzazione push notifications:', error);
    return null;
  }
}

// Esporta per uso globale
if (typeof window !== 'undefined') {
  window.PushNotificationManager = PushNotificationManager;
  window.initPushNotifications = initPushNotifications;
}
