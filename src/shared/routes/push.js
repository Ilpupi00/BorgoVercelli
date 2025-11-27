'use strict';

const express = require('express');
const router = express.Router();
const pushService = require('../services/webpush');

/**
 * GET /push/vapidPublicKey
 * Restituisce la chiave pubblica VAPID per la subscription client
 */
router.get('/push/vapidPublicKey', (req, res) => {
  try {
    res.json({ 
      publicKey: process.env.VAPID_PUBLIC_KEY || '' 
    });
  } catch (error) {
    console.error('Errore recupero VAPID public key:', error);
    res.status(500).json({ error: 'Errore server' });
  }
});

/**
 * POST /push/subscribe
 * Salva una nuova subscription per l'utente corrente
 * Body: { subscription object dal PushManager }
 */
router.post('/push/subscribe', express.json(), async (req, res) => {
  try {
    const subscription = req.body;
    
    // DEBUG: log cookies and session to troubleshoot 401 issues
    console.log('[PUSH] /push/subscribe invoked - headers.cookie=', req.headers.cookie);
    try { console.log('[PUSH] req.session (debug):', !!req.session, Object.keys(req.session || {})); } catch(e) { console.log('[PUSH] req.session logging error', e); }

    // Verifica che l'utente sia autenticato
    if (!req.session || !req.session.user || !req.session.user.id) {
      return res.status(401).json({ error: 'Utente non autenticato' });
    }

    const userId = req.session.user.id;
    const isAdmin = req.session.user.tipo_utente === 'admin';

    // Valida la subscription
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: 'Subscription non valida' });
    }

    await pushService.addSubscription(subscription, userId, isAdmin);
    
    res.status(201).json({ 
      success: true,
      message: 'Subscription salvata con successo' 
    });
  } catch (error) {
    console.error('Errore salvataggio subscription:', error);
    res.status(500).json({ error: 'Errore salvataggio subscription' });
  }
});

/**
 * POST /push/unsubscribe
 * Rimuove la subscription dell'utente corrente
 * Body: { endpoint }
 */
router.post('/push/unsubscribe', express.json(), async (req, res) => {
  try {
    const { endpoint } = req.body;
    
    if (!endpoint) {
      return res.status(400).json({ error: 'Endpoint richiesto' });
    }

    pushService.removeSubscription(endpoint);
    
    res.json({ 
      success: true,
      message: 'Subscription rimossa con successo' 
    });
  } catch (error) {
    console.error('Errore rimozione subscription:', error);
    res.status(500).json({ error: 'Errore rimozione subscription' });
  }
});

/**
 * GET /push/subscriptions
 * Visualizza tutte le subscription (solo per admin)
 */
router.get('/push/subscriptions', (req, res) => {
  try {
    // Verifica che l'utente sia admin
    if (!req.session || !req.session.user || req.session.user.tipo_utente !== 'admin') {
      return res.status(403).json({ error: 'Accesso negato' });
    }

    const subscriptions = pushService.loadSubscriptions();
    
    // Nascondi dati sensibili
    const safeSubs = subscriptions.map(s => ({
      userId: s.userId,
      isAdmin: s.isAdmin,
      createdAt: s.createdAt,
      endpoint: s.endpoint.substring(0, 50) + '...'
    }));
    
    res.json({ 
      count: subscriptions.length,
      subscriptions: safeSubs 
    });
  } catch (error) {
    console.error('Errore recupero subscriptions:', error);
    res.status(500).json({ error: 'Errore server' });
  }
});

/**
 * POST /push/test
 * Route di debug per inviare una notifica di prova al user corrente o agli admin
 * Body: { to: 'me'|'admins'|'all', title, body, url }
 */
router.post('/push/test', express.json(), async (req, res) => {
  try {
    if (!req.session || !req.session.user || !req.session.user.id) {
      return res.status(401).json({ error: 'Utente non autenticato' });
    }

    const { to = 'me', title = 'Test Notifica', body = 'Questa è una notifica di test', url = '/' } = req.body;

    const payload = { title, body, url };

    if (to === 'me') {
      const userId = req.session.user.id;
      const result = await pushService.sendNotificationToUsers([userId], payload);
      return res.json({ success: true, target: 'me', result });
    } else if (to === 'admins') {
      const result = await pushService.sendNotificationToAdmins(payload);
      return res.json({ success: true, target: 'admins', result });
    } else if (to === 'all') {
      const result = await pushService.sendNotificationToAll(payload);
      return res.json({ success: true, target: 'all', result });
    }

    return res.status(400).json({ error: 'Parametro to non valido' });
  } catch (error) {
    console.error('Errore /push/test:', error);
    res.status(500).json({ error: 'Errore invio test notifiche' });
  }
});

module.exports = router;
