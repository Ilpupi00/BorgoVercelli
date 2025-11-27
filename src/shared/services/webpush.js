'use strict';

const webpush = require('web-push');
const fs = require('fs');
const path = require('path');

const STORE = path.join(__dirname, '../../data/webpush.json');

// Configura VAPID details
webpush.setVapidDetails(
  `mailto:${process.env.VAPID_EMAIL || 'no-reply@example.com'}`,
  process.env.VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || ''
);

/**
 * Carica le subscription dal file JSON
 * @returns {Array} Array di subscription
 */
function loadSubscriptions() {
  try {
    if (!fs.existsSync(STORE)) {
      return [];
    }
    const data = fs.readFileSync(STORE, 'utf8');
    return JSON.parse(data || '[]');
  } catch (error) {
    console.error('Errore caricamento subscriptions:', error);
    return [];
  }
}

/**
 * Salva le subscription nel file JSON
 * @param {Array} subscriptions - Array di subscription da salvare
 */
function saveSubscriptions(subscriptions) {
  try {
    const dir = path.dirname(STORE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(STORE, JSON.stringify(subscriptions, null, 2), 'utf8');
  } catch (error) {
    console.error('Errore salvataggio subscriptions:', error);
  }
}

/**
 * Aggiunge una nuova subscription
 * @param {Object} subscription - Oggetto subscription dal client
 * @param {Number} userId - ID dell'utente
 * @param {Boolean} isAdmin - Se l'utente è admin
 */
async function addSubscription(subscription, userId, isAdmin = false) {
  try {
    const subscriptions = loadSubscriptions();
    
    // Verifica se la subscription esiste già
    const exists = subscriptions.find(s => s.endpoint === subscription.endpoint);
    if (!exists) {
      subscriptions.push({
        ...subscription,
        userId,
        isAdmin,
        createdAt: new Date().toISOString()
      });
      saveSubscriptions(subscriptions);
      console.log(`Subscription aggiunta per user ${userId} (admin: ${isAdmin})`);
    } else {
      console.log(`Subscription già esistente per endpoint ${subscription.endpoint}`);
    }
  } catch (error) {
    console.error('Errore aggiunta subscription:', error);
    throw error;
  }
}

/**
 * Rimuove subscription scadute o non valide
 * @param {String} endpoint - Endpoint della subscription da rimuovere
 */
function removeSubscription(endpoint) {
  try {
    const subscriptions = loadSubscriptions();
    const filtered = subscriptions.filter(s => s.endpoint !== endpoint);
    saveSubscriptions(filtered);
    console.log(`Subscription rimossa: ${endpoint}`);
  } catch (error) {
    console.error('Errore rimozione subscription:', error);
  }
}

/**
 * Invia notifica push a specifici utenti
 * @param {Array} userIds - Array di ID utenti destinatari
 * @param {Object} payload - Dati della notifica
 * @returns {Promise<Object>} Risultato dell'invio
 */
async function sendNotificationToUsers(userIds, payload) {
  try {
    const subscriptions = loadSubscriptions();
    const targetSubs = subscriptions.filter(s => userIds.includes(s.userId));
    console.log('[WEBPUSH] sendNotificationToUsers -> target userIds:', userIds, 'found subs:', targetSubs.length);
    console.log('[WEBPUSH] payload:', payload);
    
    if (targetSubs.length === 0) {
      console.log('Nessuna subscription trovata per gli utenti specificati');
      return { sent: 0, failed: 0 };
    }

    const results = await Promise.allSettled(
      targetSubs.map(sub =>
        webpush.sendNotification(sub, JSON.stringify(payload), {
          TTL: 86400, // 24 ore
          urgency: 'high'
        }).catch(err => {
          // Rimuovi subscription non valide
          if (err.statusCode === 410 || err.statusCode === 404) {
            removeSubscription(sub.endpoint);
            return { removed: sub.endpoint };
          }
          throw err;
        })
      )
    );

    const sent = results.filter(r => r.status === 'fulfilled' && !r.value?.removed).length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    console.log(`Notifiche inviate: ${sent}, fallite: ${failed}`);
    // Log dettagliati sugli errori
    results.forEach((r, idx) => {
      if (r.status === 'rejected') {
        console.error('[WEBPUSH] sendNotificationToUsers - rejected for endpoint:', targetSubs[idx]?.endpoint, r.reason || r.reason?.stack || r);
      } else if (r.value && r.value.removed) {
        console.warn('[WEBPUSH] sendNotificationToUsers - removed subscription:', r.value.removed);
      }
    });
    return { sent, failed, results };
  } catch (error) {
    console.error('Errore invio notifiche:', error);
    throw error;
  }
}

/**
 * Invia notifica push a tutti gli admin
 * @param {Object} payload - Dati della notifica
 * @returns {Promise<Object>} Risultato dell'invio
 */
async function sendNotificationToAdmins(payload) {
  try {
    const subscriptions = loadSubscriptions();
    const adminSubs = subscriptions.filter(s => s.isAdmin === true);
    console.log('[WEBPUSH] sendNotificationToAdmins -> adminSubs found:', adminSubs.length);
    console.log('[WEBPUSH] payload:', payload);
    
    if (adminSubs.length === 0) {
      console.log('Nessuna subscription admin trovata');
      return { sent: 0, failed: 0 };
    }

    const results = await Promise.allSettled(
      adminSubs.map(sub =>
        webpush.sendNotification(sub, JSON.stringify(payload), {
          TTL: 86400,
          urgency: 'high'
        }).catch(err => {
          if (err.statusCode === 410 || err.statusCode === 404) {
            removeSubscription(sub.endpoint);
            return { removed: sub.endpoint };
          }
          throw err;
        })
      )
    );

    const sent = results.filter(r => r.status === 'fulfilled' && !r.value?.removed).length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    console.log(`Notifiche admin inviate: ${sent}, fallite: ${failed}`);
    results.forEach((r, idx) => {
      if (r.status === 'rejected') {
        console.error('[WEBPUSH] sendNotificationToAdmins - rejected for endpoint:', adminSubs[idx]?.endpoint, r.reason || r.reason?.stack || r);
      } else if (r.value && r.value.removed) {
        console.warn('[WEBPUSH] sendNotificationToAdmins - removed subscription:', r.value.removed);
      }
    });
    return { sent, failed, results };
  } catch (error) {
    console.error('Errore invio notifiche admin:', error);
    throw error;
  }
}

/**
 * Invia notifica push a tutti gli utenti registrati
 * @param {Object} payload - Dati della notifica
 * @returns {Promise<Object>} Risultato dell'invio
 */
async function sendNotificationToAll(payload) {
  try {
    const subscriptions = loadSubscriptions();
    
    if (subscriptions.length === 0) {
      console.log('Nessuna subscription trovata');
      return { sent: 0, failed: 0 };
    }

    const results = await Promise.allSettled(
      subscriptions.map(sub =>
        webpush.sendNotification(sub, JSON.stringify(payload), {
          TTL: 86400,
          urgency: 'normal'
        }).catch(err => {
          if (err.statusCode === 410 || err.statusCode === 404) {
            removeSubscription(sub.endpoint);
            return { removed: sub.endpoint };
          }
          throw err;
        })
      )
    );

    const sent = results.filter(r => r.status === 'fulfilled' && !r.value?.removed).length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    console.log(`Notifiche broadcast inviate: ${sent}, fallite: ${failed}`);
    return { sent, failed, results };
  } catch (error) {
    console.error('Errore broadcast notifiche:', error);
    throw error;
  }
}

module.exports = {
  addSubscription,
  removeSubscription,
  sendNotificationToUsers,
  sendNotificationToAdmins,
  sendNotificationToAll,
  loadSubscriptions
};

