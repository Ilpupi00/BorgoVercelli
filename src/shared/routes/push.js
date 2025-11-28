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
    
    // DEBUG: log cookies, session and passport user to troubleshoot 401 issues
    console.log('[PUSH] /push/subscribe invoked - headers.cookie=', req.headers.cookie);
    try { console.log('[PUSH] req.session (debug):', !!req.session, Object.keys(req.session || {})); } catch(e) { console.log('[PUSH] req.session logging error', e); }
    try { console.log('[PUSH] req.user (passport):', !!req.user, req.user ? { id: req.user.id, tipo_utente: req.user.tipo_utente, tipo_utente_nome: req.user.tipo_utente_nome, tipo_utente_id: req.user.tipo_utente_id, isAdmin: req.user.isAdmin } : null); } catch(e) { console.log('[PUSH] req.user logging error', e); }

    // Verifica che l'utente sia autenticato tramite Passport
    if (!req.isAuthenticated || !req.isAuthenticated() || !req.user || !req.user.id) {
      return res.status(401).json({ error: 'Utente non autenticato' });
    }

    const userId = req.user.id;
    // Determine admin status robustly: accept multiple shapes coming from DAO/model
    const isAdmin = (
      req.user.isAdmin === true ||
      req.user.tipo_utente === 'admin' ||
      (typeof req.user.tipo_utente_nome === 'string' && req.user.tipo_utente_nome.toLowerCase() === 'admin') ||
      req.user.tipo_utente_id === 1
    );

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
 * POST /push/subscribe-anon
 * Temporary debug: salva una subscription senza autenticazione (userId: 0)
 */
router.post('/push/subscribe-anon', express.json(), async (req, res) => {
  try {
    const subscription = req.body;
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: 'Subscription non valida' });
    }
    // userId 0 = anon test
    await pushService.addSubscription(subscription, 0, false);
    return res.status(201).json({ success: true, message: 'Subscription anon salvata' });
  } catch (error) {
    console.error('Errore /push/subscribe-anon:', error);
    return res.status(500).json({ error: 'Errore server' });
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
 * POST /push/subscribe-error
 * Route di debug: riceve report di errori di subscribe dal client
 */
router.post('/push/subscribe-error', express.json(), (req, res) => {
  try {
    const body = req.body || {};
    console.error('[PUSH] Client subscribe error report:', JSON.stringify(body, null, 2));
    return res.json({ received: true });
  } catch (error) {
    console.error('Errore /push/subscribe-error:', error);
    return res.status(500).json({ error: 'Errore server' });
  }
});

/**
 * GET /push/subscriptions
 * Visualizza tutte le subscription (solo per admin)
 */
router.get('/push/subscriptions', (req, res) => {
  try {
    // Verifica che l'utente sia admin (usando Passport)
    if (!req.isAuthenticated || !req.isAuthenticated() || !req.user || !(
      req.user.isAdmin === true ||
      req.user.tipo_utente === 'admin' ||
      (typeof req.user.tipo_utente_nome === 'string' && req.user.tipo_utente_nome.toLowerCase() === 'admin') ||
      req.user.tipo_utente_id === 1
    )) {
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
 * GET /push/my-subscriptions
 * Debug route: restituisce le subscription salvate per l'utente corrente (autenticazione richiesta)
 */
router.get('/push/my-subscriptions', (req, res) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated() || !req.user || !req.user.id) {
      return res.status(401).json({ error: 'Utente non autenticato' });
    }

    const subscriptions = pushService.loadSubscriptions();
    const myId = String(req.user.id);
    const mySubs = subscriptions.filter(s => String(s.userId) === myId);

    console.log(`[PUSH] /push/my-subscriptions -> userId=${myId}, found=${mySubs.length}`);

    return res.json({ count: mySubs.length, subscriptions: mySubs });
  } catch (error) {
    console.error('Errore /push/my-subscriptions:', error);
    return res.status(500).json({ error: 'Errore server' });
  }
});

/**
 * GET /push/debug
 * Temporary debug route: mostra stato autenticazione, user summary e cookie header
 */
router.get('/push/debug', (req, res) => {
  try {
    const isAuth = !!(req.isAuthenticated && req.isAuthenticated() && req.user && req.user.id);
    const userSummary = req.user ? { id: req.user.id, tipo_utente: req.user.tipo_utente, tipo_utente_nome: req.user.tipo_utente_nome, tipo_utente_id: req.user.tipo_utente_id, isAdmin: req.user.isAdmin } : null;
    const cookieHeader = req.headers.cookie || null;

    console.log('[PUSH] /push/debug -> isAuth:', isAuth, 'user:', userSummary ? userSummary.id : null, 'cookie present:', !!cookieHeader);

    return res.json({
      authenticated: isAuth,
      user: userSummary,
      cookie: cookieHeader ? cookieHeader.substring(0, 200) : null
    });
  } catch (error) {
    console.error('Errore /push/debug:', error);
    return res.status(500).json({ error: 'Errore server' });
  }
});

/**
 * GET /push/admin-subs
 * Debug: restituisce tutte le subscription con isAdmin === true (dettagli minimi)
 */
router.get('/push/admin-subs', (req, res) => {
  try {
    const subscriptions = pushService.loadSubscriptions();
    const adminSubs = subscriptions.filter(s => s.isAdmin === true);
    const safe = adminSubs.map(s => ({ userId: s.userId, endpoint: s.endpoint, createdAt: s.createdAt }));
    return res.json({ count: safe.length, subscriptions: safe });
  } catch (error) {
    console.error('Errore /push/admin-subs:', error);
    return res.status(500).json({ error: 'Errore server' });
  }
});

/**
 * POST /push/force-admin-notify
 * Debug: forza l'invio di una notifica agli admin
 * Body: { title, body, url }
 */
router.post('/push/force-admin-notify', express.json(), async (req, res) => {
  try {
    const { title = 'Forza Notifica Admin', body = 'Messaggio di debug', url = '/' } = req.body || {};
    const payload = { title, body, url };
    const result = await pushService.sendNotificationToAdmins(payload);
    return res.json({ success: true, result });
  } catch (error) {
    console.error('Errore /push/force-admin-notify:', error);
    return res.status(500).json({ error: 'Errore invio notifiche admin' });
  }
});

/**
 * GET /push/test
 * Pagina di test per le notifiche push (solo per utenti autenticati)
 */
router.get('/push/test', (req, res) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.redirect('/login');
  }
  res.render('test-push', {
    user: req.user,
    isLogged: true
  });
});

/**
 * POST /push/test
 * Route di debug per inviare una notifica di prova al user corrente o agli admin
 * Body: { to: 'me'|'admins'|'all', title, body, url }
 */
router.post('/push/test', express.json(), async (req, res) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated() || !req.user || !req.user.id) {
      return res.status(401).json({ error: 'Utente non autenticato' });
    }

    const { to = 'me', title = 'Test Notifica', body = 'Questa è una notifica di test', url = '/' } = req.body;

    const payload = { title, body, url };

    if (to === 'me') {
      const userId = req.user.id;
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
