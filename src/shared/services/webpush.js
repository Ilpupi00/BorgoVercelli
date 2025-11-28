'use strict';

const webpush = require('web-push');
const fs = require('fs');
const path = require('path');

const STORE = path.join(__dirname, '../../data/webpush.json');

// Configura VAPID details
const vapidEmail = process.env.VAPID_EMAIL || 'no-reply@example.com';
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || '';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';

// Validazione chiavi VAPID
if (!vapidPublicKey || !vapidPrivateKey) {
  console.error('[WEBPUSH] ATTENZIONE: Chiavi VAPID non configurate! Le notifiche push non funzioneranno.');
  console.error('[WEBPUSH] Configura VAPID_PUBLIC_KEY e VAPID_PRIVATE_KEY nel file .env');
} else {
  console.log('[WEBPUSH] Chiavi VAPID configurate correttamente');
  console.log('[WEBPUSH] VAPID Email:', vapidEmail);
  console.log('[WEBPUSH] VAPID Public Key:', vapidPublicKey.substring(0, 20) + '...');
}

webpush.setVapidDetails(
  `mailto:${vapidEmail}`,
  vapidPublicKey,
  vapidPrivateKey
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
    const raw = fs.readFileSync(STORE, 'utf8');
    // Handle BOM or stray quotes/newlines gracefully
    const data = (raw || '').trim();
    if (!data) return [];
    if (data.startsWith("'[") || data.startsWith('"[')) {
      console.warn('[WEBPUSH] Subscription file contains wrapped quotes, attempting to sanitize');
      const sanitized = data.slice(1, -1);
      return JSON.parse(sanitized);
    }
    return JSON.parse(data);
  } catch (error) {
    console.error('Errore caricamento subscriptions:', error);
    try {
      console.warn('[WEBPUSH] Resetting corrupted subscription store');
      fs.writeFileSync(STORE, '[]', 'utf8');
    } catch (writeErr) {
      console.error('[WEBPUSH] Impossibile ripristinare webpush.json:', writeErr);
    }
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
    // Normalize userId when possible to keep a consistent type
    let normalizedUserId = userId;
    if (userId !== undefined && userId !== null) {
      const n = Number(userId);
      if (!Number.isNaN(n)) normalizedUserId = n;
    }
    
    // Verifica se la subscription esiste già
    const existingIndex = subscriptions.findIndex(s => s.endpoint === subscription.endpoint);
    if (existingIndex === -1) {
      // Nuova subscription
      subscriptions.push({
        ...subscription,
        userId: normalizedUserId,
        isAdmin,
        createdAt: new Date().toISOString()
      });
      saveSubscriptions(subscriptions);
      console.log(`[WEBPUSH] ✅ Subscription aggiunta per user ${userId} (admin: ${isAdmin})`);
      console.log(`[WEBPUSH] Endpoint: ${subscription.endpoint.substring(0, 50)}...`);
    } else {
      // Aggiorna la subscription esistente (potrebbe essere cambiato userId o isAdmin)
      subscriptions[existingIndex] = {
        ...subscription,
        userId: normalizedUserId,
        isAdmin,
        createdAt: subscriptions[existingIndex].createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      saveSubscriptions(subscriptions);
      console.log(`[WEBPUSH] 🔄 Subscription aggiornata per user ${userId} (admin: ${isAdmin})`);
      console.log(`[WEBPUSH] Endpoint: ${subscription.endpoint.substring(0, 50)}...`);
    }
  } catch (error) {
    console.error('[WEBPUSH] ❌ Errore aggiunta/aggiornamento subscription:', error);
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
    console.log('[WEBPUSH] 📤 sendNotificationToUsers chiamato');
    console.log('[WEBPUSH] Target userIds:', userIds);
    console.log('[WEBPUSH] Payload:', JSON.stringify(payload, null, 2));
    
    const subscriptions = loadSubscriptions();
    console.log('[WEBPUSH] Subscriptions totali caricate:', subscriptions.length);
    
    // Match userIds robustly by stringifying both sides to avoid type mismatch (number vs string)
    const userIdStrings = userIds.map(u => String(u));
    const targetSubs = subscriptions.filter(s => userIdStrings.includes(String(s.userId)));
    console.log('[WEBPUSH] Subscriptions trovate per questi user:', targetSubs.length);
    // Log subscriptions that have missing/undefined userId (helpful for debugging)
    const missingIdSubs = subscriptions.filter(s => s.userId === undefined || s.userId === null);
    if (missingIdSubs.length > 0) console.warn('[WEBPUSH] Attenzione - alcune subscription non hanno userId:', missingIdSubs.length);
    
    if (targetSubs.length > 0) {
      console.log('[WEBPUSH] Dettagli subscriptions target:');
      targetSubs.forEach((sub, idx) => {
        console.log(`[WEBPUSH]   ${idx + 1}. userId: ${sub.userId}, admin: ${sub.isAdmin}, endpoint: ${sub.endpoint.substring(0, 50)}...`);
      });
    }
    
    if (targetSubs.length === 0) {
      console.log('[WEBPUSH] ⚠️ Nessuna subscription trovata per gli utenti specificati');
      console.log('[WEBPUSH] Suggerimento: Gli utenti devono accettare le notifiche nel browser');
      return { sent: 0, failed: 0 };
    }

    console.log('[WEBPUSH] 🚀 Invio notifiche in corso...');
    const results = await Promise.allSettled(
      targetSubs.map((sub, idx) => {
        console.log(`[WEBPUSH] Invio ${idx + 1}/${targetSubs.length} a userId ${sub.userId}...`);
        return webpush.sendNotification(sub, JSON.stringify(payload), {
          TTL: 86400, // 24 ore
          urgency: 'high'
        }).then(() => {
          console.log(`[WEBPUSH] ✅ Notifica ${idx + 1} inviata con successo`);
          return { success: true };
        }).catch(err => {
          console.error(`[WEBPUSH] ❌ Errore invio notifica ${idx + 1}:`, err.message);
          console.error(`[WEBPUSH] Status Code:`, err.statusCode);
          console.error(`[WEBPUSH] Body:`, err.body);
          
          // Rimuovi subscription non valide
          if (err.statusCode === 410 || err.statusCode === 404) {
            console.log(`[WEBPUSH] 🗑️ Rimozione subscription scaduta/non valida`);
            removeSubscription(sub.endpoint);
            return { removed: sub.endpoint };
          }
          throw err;
        });
      })
    );

    const sent = results.filter(r => r.status === 'fulfilled' && !r.value?.removed).length;
    const failed = results.filter(r => r.status === 'rejected').length;
    const removed = results.filter(r => r.status === 'fulfilled' && r.value?.removed).length;
    
    console.log(`[WEBPUSH] 📊 Risultato invio:`);
    console.log(`[WEBPUSH]   ✅ Inviate: ${sent}`);
    console.log(`[WEBPUSH]   ❌ Fallite: ${failed}`);
    console.log(`[WEBPUSH]   🗑️ Rimosse: ${removed}`);
    
    // Log dettagliati sugli errori
    results.forEach((r, idx) => {
      if (r.status === 'rejected') {
        console.error('[WEBPUSH] ❌ Rejected per userId', targetSubs[idx]?.userId);
        console.error('[WEBPUSH]    Motivo:', r.reason?.message || r.reason);
        if (r.reason?.stack) console.error('[WEBPUSH]    Stack:', r.reason.stack);
      } else if (r.value && r.value.removed) {
        console.warn('[WEBPUSH] 🗑️ Subscription rimossa:', targetSubs[idx]?.endpoint?.substring(0, 50) + '...');
      }
    });
    return { sent, failed, removed, results };
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
    console.log('[WEBPUSH] 👑 sendNotificationToAdmins chiamato');
    console.log('[WEBPUSH] Payload:', JSON.stringify(payload, null, 2));
    
    const subscriptions = loadSubscriptions();
    console.log('[WEBPUSH] Subscriptions totali caricate:', subscriptions.length);
    
    const adminSubs = subscriptions.filter(s => s.isAdmin === true);
    console.log('[WEBPUSH] Admin subscriptions trovate:', adminSubs.length);
    // Log sintetico delle admin subscriptions per debug (no keys complete)
    try {
      const adminSummary = adminSubs.map(s => ({ userId: s.userId, endpoint: (s.endpoint||'').substring(0,60) + '...' }));
      console.log('[WEBPUSH] Admin subscriptions summary:', JSON.stringify(adminSummary, null, 2));
    } catch (e) {
      console.warn('[WEBPUSH] Impossibile serializzare adminSubs per summary', e && e.message);
    }
    
    if (adminSubs.length > 0) {
      console.log('[WEBPUSH] Dettagli admin subscriptions:');
      adminSubs.forEach((sub, idx) => {
        console.log(`[WEBPUSH]   ${idx + 1}. userId: ${sub.userId}, endpoint: ${sub.endpoint.substring(0, 50)}...`);
      });
    }
    
    if (adminSubs.length === 0) {
      console.log('[WEBPUSH] ⚠️ Nessuna subscription admin trovata');
      console.log('[WEBPUSH] Suggerimento: Gli admin devono accettare le notifiche nel browser');
      return { sent: 0, failed: 0 };
    }

    console.log('[WEBPUSH] 🚀 Invio notifiche admin in corso...');
    const results = await Promise.allSettled(
      adminSubs.map((sub, idx) => {
        console.log(`[WEBPUSH] Invio admin ${idx + 1}/${adminSubs.length} a userId ${sub.userId}...`);
        return webpush.sendNotification(sub, JSON.stringify(payload), {
          TTL: 86400,
          urgency: 'high'
        }).then(() => {
          console.log(`[WEBPUSH] ✅ Notifica admin ${idx + 1} inviata con successo`);
          return { success: true };
        }).catch(err => {
          console.error(`[WEBPUSH] ❌ Errore invio notifica admin ${idx + 1}:`, err.message);
          console.error(`[WEBPUSH] Status Code:`, err.statusCode);
          console.error(`[WEBPUSH] Body:`, err.body);
          
          if (err.statusCode === 410 || err.statusCode === 404) {
            console.log(`[WEBPUSH] 🗑️ Rimozione subscription admin scaduta/non valida`);
            removeSubscription(sub.endpoint);
            return { removed: sub.endpoint };
          }
          throw err;
        });
      })
    );

    const sent = results.filter(r => r.status === 'fulfilled' && !r.value?.removed).length;
    const failed = results.filter(r => r.status === 'rejected').length;
    const removed = results.filter(r => r.status === 'fulfilled' && r.value?.removed).length;
    
    console.log(`[WEBPUSH] 📊 Risultato invio admin:`);
    console.log(`[WEBPUSH]   ✅ Inviate: ${sent}`);
    console.log(`[WEBPUSH]   ❌ Fallite: ${failed}`);
    console.log(`[WEBPUSH]   🗑️ Rimosse: ${removed}`);
    
    results.forEach((r, idx) => {
      if (r.status === 'rejected') {
        console.error('[WEBPUSH] ❌ Rejected per admin userId', adminSubs[idx]?.userId);
        console.error('[WEBPUSH]    Motivo:', r.reason?.message || r.reason);
        if (r.reason?.stack) console.error('[WEBPUSH]    Stack:', r.reason.stack);
      } else if (r.value && r.value.removed) {
        console.warn('[WEBPUSH] 🗑️ Admin subscription rimossa:', adminSubs[idx]?.endpoint?.substring(0, 50) + '...');
      }
    });
    return { sent, failed, removed, results };
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

