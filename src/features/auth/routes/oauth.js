/**
 * @fileoverview Route per autenticazione OAuth (Google, Facebook, Apple)
 * @module features/auth/routes/oauth
 * @description Gestisce i redirect verso i provider OAuth e i callback.
 * Apple non è supportato lato backend al momento (solo placeholder).
 */

"use strict";

const express = require("express");
const router = express.Router();
const passport = require("passport");

// ==================== GOOGLE ====================

/**
 * Avvia il flusso OAuth con Google
 * Redirect automatico alla pagina di consenso Google
 */
router.get(
  "/auth/google",
  (req, res, next) => {
    // Verifica che la strategia sia stata configurata
    if (!passport._strategies.google) {
      return res.redirect(
        "/login?error=" +
          encodeURIComponent(
            "Login con Google non ancora configurato. Contatta l'amministratore."
          )
      );
    }
    next();
  },
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

/**
 * Callback di Google dopo l'autenticazione
 */
router.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login?error=google_failed" }),
  (req, res) => {
    console.log(
      `[OAuth] ✅ Login Google riuscito per utente ${req.user.id} (${req.user.email})`
    );
    res.redirect(req.user.tipo_utente_id === 1 ? "/admin" : "/homepage");
  }
);

// ==================== FACEBOOK ====================

/**
 * Avvia il flusso OAuth con Facebook
 */
router.get(
  "/auth/facebook",
  (req, res, next) => {
    if (!passport._strategies.facebook) {
      return res.redirect(
        "/login?error=" +
          encodeURIComponent(
            "Login con Facebook non ancora configurato. Contatta l'amministratore."
          )
      );
    }
    next();
  },
  passport.authenticate("facebook", {
    scope: ["email"],
  })
);

/**
 * Callback di Facebook dopo l'autenticazione
 */
router.get(
  "/auth/facebook/callback",
  passport.authenticate("facebook", { failureRedirect: "/login?error=facebook_failed" }),
  (req, res) => {
    console.log(
      `[OAuth] ✅ Login Facebook riuscito per utente ${req.user.id} (${req.user.email})`
    );
    res.redirect(req.user.tipo_utente_id === 1 ? "/admin" : "/homepage");
  }
);

// ==================== APPLE ====================

/**
 * Avvia il flusso OAuth con Apple (Sign in with Apple)
 */
router.get(
  "/auth/apple",
  (req, res, next) => {
    if (!passport._strategies.apple) {
      return res.redirect(
        "/login?error=" +
          encodeURIComponent(
            "Login con Apple non ancora configurato. Contatta l'amministratore."
          )
      );
    }
    next();
  },
  passport.authenticate("apple")
);

/**
 * Callback di Apple dopo l'autenticazione.
 * Apple usa POST per il callback, non GET.
 */
router.post(
  "/auth/apple/callback",
  passport.authenticate("apple", { failureRedirect: "/login?error=apple_failed" }),
  (req, res) => {
    console.log(
      `[OAuth] ✅ Login Apple riuscito per utente ${req.user.id} (${req.user.email})`
    );
    res.redirect(req.user.tipo_utente_id === 1 ? "/admin" : "/homepage");
  }
);

module.exports = router;
