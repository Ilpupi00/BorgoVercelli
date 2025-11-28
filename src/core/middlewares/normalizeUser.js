'use strict';

/**
 * Middleware per normalizzare l'oggetto `req.user` fornito da Passport
 * - Imposta `req.user.tipo_utente` a valori canonici ('admin','dirigente','utente')
 * - Imposta `req.user.isAdmin` boolean
 * - Non sovrascrive i campi se già presenti
 */
module.exports = function normalizeUser(req, res, next) {
  try {
    if (!req.user) return next();

    // Do not override if already correctly set
    if (!req.user.tipo_utente) {
      const nome = (req.user.tipo_utente_nome || '').toString().toLowerCase();
      if (nome.includes('ammin') || nome.includes('admin')) {
        req.user.tipo_utente = 'admin';
      } else if (nome.includes('dirigen')) {
        req.user.tipo_utente = 'dirigente';
      } else if (nome.includes('utente')) {
        req.user.tipo_utente = 'utente';
      } else if (req.user.tipo_utente_id === 1) {
        req.user.tipo_utente = 'admin';
      }
    }

    // Ensure tipo_utente_id is a number when possible (leave as-is otherwise)
    if (req.user.tipo_utente_id !== undefined) {
      const n = Number(req.user.tipo_utente_id);
      if (!Number.isNaN(n)) req.user.tipo_utente_id = n;
    }

    // Compute isAdmin if not explicitly set
    if (req.user.isAdmin === undefined) {
      req.user.isAdmin = (
        req.user.isAdmin === true ||
        req.user.tipo_utente === 'admin' ||
        (typeof req.user.tipo_utente_nome === 'string' && req.user.tipo_utente_nome.toLowerCase().includes('ammin')) ||
        req.user.tipo_utente_id === 1
      );
    }

    // Small debug log to help trace normalization issues
    try {
      console.log('[MIDDLEWARE] normalizeUser ->', { id: req.user.id, tipo_utente: req.user.tipo_utente, tipo_utente_nome: req.user.tipo_utente_nome, tipo_utente_id: req.user.tipo_utente_id, isAdmin: req.user.isAdmin });
    } catch (e) {}
  } catch (err) {
    console.error('[MIDDLEWARE] normalizeUser error:', err);
  }
  return next();
};
