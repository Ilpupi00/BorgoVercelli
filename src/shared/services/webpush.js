'use strict';

const webpush = require('web-push');
const db = require('../../core/config/database');

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
 * Carica le subscription dal database
 * @returns {Promise<Array>} Array di subscription in formato web-push
 */
async function loadSubscriptions() {
  try {
    const result = await db.query(
      `SELECT id, user_id, endpoint, p256dh, auth, is_admin, created_at, updated_at 
       FROM push_subscriptions 
       WHERE error_count < 5
       ORDER BY created_at DESC`
    );
    
    // Converti dal formato DB al formato web-push
    return result.rows.map(row => ({
      endpoint: row.endpoint,
      keys: {
        p256dh: row.p256dh,
        auth: row.auth
      },
      userId: row.user_id,
      isAdmin: row.is_admin,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  } catch (error) {
    console.error('[WEBPUSH] Errore caricamento subscriptions dal database:', error);
    return [];
  }
}

/**
 * Aggiunge o aggiorna una subscription nel database
 * @param {Object} subscription - Oggetto subscription dal client
 * @param {Number} userId - ID dell'utente
 * @param {Boolean} isAdmin - Se l'utente è admin
 * @param {String} userAgent - User agent del browser (opzionale)
 */
async function addSubscription(subscription, userId, isAdmin = false, userAgent = null) {
  try {
    // Validazione base
    if (!subscription || !subscription.endpoint || !subscription.keys) {
      throw new Error('Subscription non valida: mancano endpoint o keys');
    }

    const { endpoint, keys } = subscription;
    const { p256dh, auth } = keys;

    if (!p256dh || !auth) {
      throw new Error('Subscription non valida: mancano p256dh o auth');
    }

    // Normalize userId
    let normalizedUserId = userId;
    if (userId !== undefined && userId !== null) {
      const n = Number(userId);
      if (!Number.isNaN(n)) normalizedUserId = n;
    }

    // Usa UPSERT (INSERT ... ON CONFLICT) per gestire sia insert che update
    const result = await db.query(
      `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, is_admin, user_agent, error_count)
       VALUES ($1, $2, $3, $4, $5, $6, 0)
       ON CONFLICT (endpoint) 
       DO UPDATE SET 
         user_id = EXCLUDED.user_id,
         p256dh = EXCLUDED.p256dh,
         auth = EXCLUDED.auth,
         is_admin = EXCLUDED.is_admin,
         user_agent = EXCLUDED.user_agent,
         updated_at = CURRENT_TIMESTAMP,
         error_count = 0
       RETURNING id, created_at, updated_at`,
      [normalizedUserId, endpoint, p256dh, auth, isAdmin, userAgent]
    );

    const row = result.rows[0];
    const isNew = row.created_at.getTime() === row.updated_at.getTime();

    if (isNew) {
      console.log(`[WEBPUSH] ✅ Subscription aggiunta per user ${normalizedUserId} (admin: ${isAdmin})`);
    } else {
      console.log(`[WEBPUSH] 🔄 Subscription aggiornata per user ${normalizedUserId} (admin: ${isAdmin})`);
    }
    console.log(`[WEBPUSH] Endpoint: ${endpoint.substring(0, 50)}...`);

    return { id: row.id, isNew };
  } catch (error) {
    console.error('[WEBPUSH] ❌ Errore aggiunta/aggiornamento subscription:', error);
    throw error;
  }
}

/**
 * Rimuove una subscription dal database
 * @param {String} endpoint - Endpoint della subscription da rimuovere
 */
async function removeSubscription(endpoint) {
  try {
    const result = await db.query(
      'DELETE FROM push_subscriptions WHERE endpoint = $1 RETURNING id',
      [endpoint]
    );
    
    if (result.rows.length > 0) {
      console.log(`[WEBPUSH] 🗑️ Subscription rimossa: ${endpoint.substring(0, 50)}...`);
    } else {
      console.log(`[WEBPUSH] ⚠️ Subscription non trovata per rimozione: ${endpoint.substring(0, 50)}...`);
    }
  } catch (error) {
    console.error('[WEBPUSH] Errore rimozione subscription:', error);
    throw error;
  }
}

/**
 * Incrementa il contatore errori per una subscription
 * @param {String} endpoint - Endpoint della subscription
 */
async function incrementErrorCount(endpoint) {
  try {
    await db.query(
      `UPDATE push_subscriptions 
       SET error_count = error_count + 1, 
           last_error_at = CURRENT_TIMESTAMP 
       WHERE endpoint = $1`,
      [endpoint]
    );
  } catch (error) {
    console.error('[WEBPUSH] Errore incremento error_count:', error);
  }
}

/**
 * Aggiorna il timestamp di successo per una subscription
 * @param {String} endpoint - Endpoint della subscription
 */
async function updateSuccessTimestamp(endpoint) {
  try {
    await db.query(
      `UPDATE push_subscriptions 
       SET last_success_at = CURRENT_TIMESTAMP,
           error_count = 0
       WHERE endpoint = $1`,
      [endpoint]
    );
  } catch (error) {
    console.error('[WEBPUSH] Errore aggiornamento success timestamp:', error);
  }
}

/**
 * Recupera una singola subscription dal database dato l'endpoint
 * @param {String} endpoint
 * @returns {Promise<Object|null>} row della subscription o null
 */
async function getSubscriptionByEndpoint(endpoint) {
  try {
    const result = await db.query(
      `SELECT id, user_id, endpoint, p256dh, auth, is_admin, user_agent, created_at, updated_at
       FROM push_subscriptions
       WHERE endpoint = $1
       LIMIT 1`,
      [endpoint]
    );
    if (result.rows && result.rows.length > 0) return result.rows[0];
    return null;
  } catch (error) {
    console.error('[WEBPUSH] Errore recupero subscription by endpoint:', error);
    return null;
  }
}

/**
 * Invia notifica push a specifici utenti
 * @param {Array} userIds - Array di ID utenti destinatari
 * @param {Object} payload - Dati della notifica
 * @returns {Promise<Object>} Risultato dell'invio
 */
async function sendNotificationToUsers(userIds, payload, subscriptionsParam = null) {
  try {
    console.log('[WEBPUSH] 📤 sendNotificationToUsers chiamato');
    console.log('[WEBPUSH] Target userIds:', userIds);
    console.log('[WEBPUSH] Payload:', JSON.stringify(payload, null, 2));
    
    const subscriptions = subscriptionsParam || await loadSubscriptions();
    console.log('[WEBPUSH] Subscriptions totali caricate:', subscriptions.length);
    
    // Match userIds robustly by stringifying both sides to avoid type mismatch (number vs string)
    const userIdStrings = userIds.map(u => String(u));
    const targetSubs = subscriptions.filter(s => userIdStrings.includes(String(s.userId)));
    console.log('[WEBPUSH] Subscriptions trovate per questi user:', targetSubs.length);
    
    // Log subscriptions that have missing/undefined userId (helpful for debugging)
    const missingIdSubs = subscriptions.filter(s => s.userId === undefined || s.userId === null);
    if (missingIdSubs.length > 0) {
      console.warn('[WEBPUSH] Attenzione - alcune subscription non hanno userId:', missingIdSubs.length);
    }
    
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
        
        // Prepara la subscription nel formato corretto per web-push
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: sub.keys
        };
        
        return webpush.sendNotification(pushSubscription, JSON.stringify(payload), {
          TTL: 86400, // 24 ore
          urgency: 'high',
          headers: {
            'Topic': payload.tag || 'general'
          }
        }).then(async () => {
          console.log(`[WEBPUSH] ✅ Notifica ${idx + 1} inviata con successo`);
          await updateSuccessTimestamp(sub.endpoint);
          return { success: true };
        }).catch(async (err) => {
          console.error(`[WEBPUSH] ❌ Errore invio notifica ${idx + 1}:`, err.message);
          console.error(`[WEBPUSH] Status Code:`, err.statusCode);
          if (err.body) console.error(`[WEBPUSH] Body:`, err.body);
          
          // Classifica errore per handling appropriato
          if (err.statusCode === 410 || err.statusCode === 404) {
            console.log(`[WEBPUSH] 🗑️ Subscription scaduta/rimossa (${err.statusCode}) - rimozione`);
            await removeSubscription(sub.endpoint);
            return { removed: sub.endpoint, reason: 'expired' };
          } else if (err.statusCode === 403) {
            console.error(`[WEBPUSH] 🚫 Errore 403 - possibile VAPID mismatch o subscription non valida`);
            console.error(`[WEBPUSH] Endpoint: ${sub.endpoint.substring(0, 80)}...`);
            await incrementErrorCount(sub.endpoint);
            throw new Error(`VAPID mismatch o subscription invalida: ${err.message}`);
          } else if (err.statusCode === 401) {
            console.error(`[WEBPUSH] 🔒 Errore 401 - autenticazione VAPID fallita`);
            throw new Error(`VAPID authentication failed: ${err.message}`);
          } else if (err.statusCode >= 500) {
            console.error(`[WEBPUSH] 💥 Errore server push service (${err.statusCode}) - retry possibile`);
            await incrementErrorCount(sub.endpoint);
            throw new Error(`Push service error ${err.statusCode}: ${err.message}`);
          } else {
            console.error(`[WEBPUSH] ⚠️ Errore generico (${err.statusCode || 'unknown'})`);
            await incrementErrorCount(sub.endpoint);
            throw err;
          }
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
    console.error('[WEBPUSH] Errore invio notifiche:', error);
    throw error;
  }
}

/**
 * Invia notifica push a tutti gli admin
 * @param {Object} payload - Dati della notifica
 * @returns {Promise<Object>} Risultato dell'invio
 */
async function sendNotificationToAdmins(payload, subscriptionsParam = null) {
  try {
    console.log('[WEBPUSH] 👑 sendNotificationToAdmins chiamato');
    console.log('[WEBPUSH] Payload:', JSON.stringify(payload, null, 2));
    
    const subscriptions = subscriptionsParam || await loadSubscriptions();
    console.log('[WEBPUSH] Subscriptions totali caricate:', subscriptions.length);
    
    const adminSubs = subscriptions.filter(s => s.isAdmin === true);
    console.log('[WEBPUSH] Admin subscriptions trovate:', adminSubs.length);
    
    // Log sintetico delle admin subscriptions per debug (no keys complete)
    try {
      const adminSummary = adminSubs.map(s => ({ 
        userId: s.userId, 
        endpoint: (s.endpoint || '').substring(0, 60) + '...' 
      }));
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
        
        // Prepara la subscription nel formato corretto per web-push
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: sub.keys
        };
        
        return webpush.sendNotification(pushSubscription, JSON.stringify(payload), {
          TTL: 86400,
          urgency: 'high',
          headers: {
            'Topic': payload.tag || 'admin'
          }
        }).then(async () => {
          console.log(`[WEBPUSH] ✅ Notifica admin ${idx + 1} inviata con successo`);
          await updateSuccessTimestamp(sub.endpoint);
          return { success: true };
        }).catch(async (err) => {
          console.error(`[WEBPUSH] ❌ Errore invio notifica admin ${idx + 1}:`, err.message);
          console.error(`[WEBPUSH] Status Code:`, err.statusCode);
          if (err.body) console.error(`[WEBPUSH] Body:`, err.body);
          
          if (err.statusCode === 410 || err.statusCode === 404) {
            console.log(`[WEBPUSH] 🗑️ Subscription admin scaduta (${err.statusCode}) - rimozione`);
            await removeSubscription(sub.endpoint);
            return { removed: sub.endpoint, reason: 'expired' };
          } else if (err.statusCode === 403) {
            console.error(`[WEBPUSH] 🚫 Admin subscription - errore 403 VAPID mismatch`);
            await incrementErrorCount(sub.endpoint);
            throw new Error(`VAPID mismatch (admin): ${err.message}`);
          } else if (err.statusCode === 401) {
            console.error(`[WEBPUSH] 🔒 Admin subscription - errore 401 auth VAPID`);
            throw new Error(`VAPID authentication failed (admin): ${err.message}`);
          } else if (err.statusCode >= 500) {
            console.error(`[WEBPUSH] 💥 Push service error ${err.statusCode} (admin) - retry possibile`);
            await incrementErrorCount(sub.endpoint);
            throw new Error(`Push service error ${err.statusCode} (admin): ${err.message}`);
          } else {
            await incrementErrorCount(sub.endpoint);
            throw err;
          }
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
    console.error('[WEBPUSH] Errore invio notifiche admin:', error);
    throw error;
  }
}

/**
 * Invia notifica push a tutti gli utenti registrati
 * @param {Object} payload - Dati della notifica
 * @returns {Promise<Object>} Risultato dell'invio
 */
async function sendNotificationToAll(payload, subscriptionsParam = null) {
  try {
    console.log('[WEBPUSH] 📢 sendNotificationToAll chiamato');
    
    const subscriptions = subscriptionsParam || await loadSubscriptions();
    
    if (subscriptions.length === 0) {
      console.log('[WEBPUSH] Nessuna subscription trovata');
      return { sent: 0, failed: 0 };
    }

    console.log(`[WEBPUSH] Invio broadcast a ${subscriptions.length} subscriptions...`);

    const results = await Promise.allSettled(
      subscriptions.map((sub, idx) => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: sub.keys
        };
        
        return webpush.sendNotification(pushSubscription, JSON.stringify(payload), {
          TTL: 86400,
          urgency: 'normal',
          headers: {
            'Topic': payload.tag || 'broadcast'
          }
        }).then(async () => {
          await updateSuccessTimestamp(sub.endpoint);
          return { success: true };
        }).catch(async (err) => {
          if (err.statusCode === 410 || err.statusCode === 404) {
            await removeSubscription(sub.endpoint);
            return { removed: sub.endpoint };
          }
          await incrementErrorCount(sub.endpoint);
          throw err;
        });
      })
    );

    const sent = results.filter(r => r.status === 'fulfilled' && !r.value?.removed).length;
    const failed = results.filter(r => r.status === 'rejected').length;
    const removed = results.filter(r => r.status === 'fulfilled' && r.value?.removed).length;
    
    console.log(`[WEBPUSH] Notifiche broadcast - Inviate: ${sent}, Fallite: ${failed}, Rimosse: ${removed}`);
    return { sent, failed, removed, results };
  } catch (error) {
    console.error('[WEBPUSH] Errore broadcast notifiche:', error);
    throw error;
  }
}

/**
 * Pulisce le subscription con troppi errori dal database
 * @param {Number} maxErrors - Numero massimo di errori tollerati (default: 5)
 */
async function cleanupFailedSubscriptions(maxErrors = 5) {
  try {
    const result = await db.query(
      'DELETE FROM push_subscriptions WHERE error_count >= $1 RETURNING id, endpoint',
      [maxErrors]
    );
    
    console.log(`[WEBPUSH] 🧹 Pulizia completata: ${result.rows.length} subscriptions rimosse`);
    return result.rows.length;
  } catch (error) {
    console.error('[WEBPUSH] Errore pulizia subscriptions:', error);
    throw error;
  }
}

module.exports = {
  addSubscription,
  removeSubscription,
  sendNotificationToUsers,
  sendNotificationToAdmins,
  sendNotificationToAll,
  loadSubscriptions,
  cleanupFailedSubscriptions,
  incrementErrorCount,
  updateSuccessTimestamp,
  getSubscriptionByEndpoint
};


