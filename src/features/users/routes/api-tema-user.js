/**
 * @fileoverview API per i temi (lato utente)
 * @module features/users/routes/api-tema-user
 * @description Fornisce endpoint REST per permettere agli utenti e al frontend
 *   di interagire con il sistema temi senza privilegi di amministrazione.
 */

"use strict";

const express = require("express");
const router = express.Router();
const daoTema = require("../../temi/services/dao-tema");
const { getAllThemes, getTheme } = require("../../../core/config/themes.config");

// Middleware per controllare che l'utente sia autenticato (opzionale su alcuni endpoint)
const { isLoggedIn } = require("../../../core/middlewares/auth");

/**
 * GET /api/temi/corrente
 * Restituisce il tema globale attualmente attivo sul sito
 */
router.get("/temi/corrente", async (req, res) => {
  try {
    const config = await daoTema.getTemaAttivo();
    res.json({ 
      success: true, 
      tema_attivo: config.tema_attivo 
    });
  } catch (err) {
    console.error("[API-TEMA] Errore recupero tema corrente:", err);
    res.status(500).json({ success: false, message: "Errore interno del server" });
  }
});

/**
 * GET /api/temi/lista
 * Restituisce la lista di tutti i temi disponibili (predefiniti + personalizzati attivi)
 */
router.get("/temi/lista", async (req, res) => {
  try {
    const temiPredefiniti = getAllThemes();
    let temiPersonalizzati = [];
    try {
      temiPersonalizzati = await daoTema.getTemiPersonalizzati(true); // true = solo attivi
    } catch (dbErr) {
      console.warn("[API-TEMA] Impossibile caricare temi personalizzati (tabella mancante?):", dbErr.message);
    }
    
    res.json({ 
      success: true, 
      temi: {
        predefiniti: temiPredefiniti,
        personalizzati: temiPersonalizzati
      }
    });
  } catch (err) {
    console.error("[API-TEMA] Errore recupero lista temi:", err);
    res.status(500).json({ success: false, message: "Errore interno del server" });
  }
});

/**
 * GET /api/temi/personalizzato/:slug
 * Recupera un tema personalizzato tramite il suo slug
 */
router.get("/temi/personalizzato/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const tema = await daoTema.getTemaPersonalizzatoBySlug(slug);
    
    if (!tema) {
      return res.status(404).json({ success: false, message: "Tema non trovato" });
    }
    
    res.json({ success: true, tema });
  } catch (err) {
    console.error(`[API-TEMA] Errore recupero tema ${req.params.slug}:`, err);
    res.status(500).json({ success: false, message: "Errore interno del server" });
  }
});

/**
 * GET /api/temi/statistiche
 * Espone pubblicamente le percentuali di utilizzo dei vari temi
 */
router.get("/temi/statistiche", async (req, res) => {
  try {
    const statistiche = await daoTema.getStatisticaTemi();
    res.json({ success: true, statistiche });
  } catch (err) {
    console.error("[API-TEMA] Errore statistiche temi:", err);
    res.status(500).json({ success: false, message: "Errore interno del server" });
  }
});

// ==================== ENDPOINT PROTETTI (Richiedono Login) ====================

/**
 * GET /api/user/tema-preferenza
 * Restituisce la preferenza tema dell'utente attualmente loggato
 */
router.get("/user/tema-preferenza", isLoggedIn, async (req, res) => {
  try {
    const utenteId = req.user.id;
    const preferenza = await daoTema.getPreferenzaTema(utenteId);
    
    res.json({ 
      success: true, 
      preferenza: preferenza ? preferenza.tema_id : null 
    });
  } catch (err) {
    console.error("[API-TEMA] Errore recupero preferenza utente:", err);
    res.status(500).json({ success: false, message: "Errore interno del server" });
  }
});

/**
 * POST /api/user/tema-preferenza
 * Salva o aggiorna la preferenza tema dell'utente attualmente loggato
 */
router.post("/user/tema-preferenza", isLoggedIn, async (req, res) => {
  try {
    const utenteId = req.user.id;
    const { temaId } = req.body;
    
    if (!temaId) {
      return res.status(400).json({ success: false, message: "ID tema mancante" });
    }

    await daoTema.setPreferenzaTema(utenteId, temaId);
    
    res.json({ 
      success: true, 
      message: "Preferenza tema aggiornata con successo",
      temaId
    });
  } catch (err) {
    console.error("[API-TEMA] Errore salvataggio preferenza utente:", err);
    res.status(500).json({ success: false, message: "Errore interno del server" });
  }
});

/**
 * DELETE /api/user/tema-preferenza
 * Rimuove la preferenza dell'utente, facendolo tornare al tema globale/cookie
 */
router.delete("/user/tema-preferenza", isLoggedIn, async (req, res) => {
  try {
    const utenteId = req.user.id;
    await daoTema.deletePreferenzaTema(utenteId);
    
    res.json({ 
      success: true, 
      message: "Preferenza tema rimossa con successo" 
    });
  } catch (err) {
    console.error("[API-TEMA] Errore rimozione preferenza utente:", err);
    res.status(500).json({ success: false, message: "Errore interno del server" });
  }
});

module.exports = router;
