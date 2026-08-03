/**
 * @fileoverview Route Amministrazione Temi
 * @module features/admin/routes/admin-tema
 * @description Gestisce tutte le operazioni di amministrazione dei temi:
 *   visualizzazione dashboard, impostazione tema globale, creazione e gestione
 *   di temi personalizzati. Le route sono protette e accessibili solo agli admin.
 */

"use strict";

const express = require("express");
const router = express.Router();
const daoTema = require("../../temi/services/dao-tema");
const { getAllThemes, getTheme } = require("../../../core/config/themes.config");

// Assumiamo che ci sia un middleware per verificare se l'utente è admin
// Solitamente definito in core/middlewares/auth.js
const { isAdmin } = require("../../../core/middlewares/auth");

/**
 * Middleware di sicurezza: tutte le route in questo file richiedono privilegi di admin
 */
router.use(isAdmin);

/**
 * GET /admin/temi
 * Pagina principale di gestione dei temi (Dashboard)
 */
router.get("/temi", async (req, res) => {
  try {
    const configGlobale = await daoTema.getTemaAttivo();
    const temiPersonalizzati = await daoTema.getTemiPersonalizzati(false);
    const statistiche = await daoTema.getStatisticaTemi();
    const temiPredefiniti = getAllThemes();

    res.render("GestioneTemi", {
      titolo: "Gestione Temi",
      temaAttivo: configGlobale.tema_attivo,
      temiPredefiniti,
      temiPersonalizzati,
      statistiche,
      activePage: "temi" // per la sidebar
    });
  } catch (err) {
    console.error("[ADMIN-TEMA] Errore caricamento dashboard temi:", err);
    res.status(500).render("error", { 
      message: "Errore durante il caricamento della gestione temi",
      error: err 
    });
  }
});

/**
 * POST /admin/temi/attiva
 * Imposta il tema globale del sito
 */
router.post("/temi/attiva", async (req, res) => {
  try {
    const { temaId } = req.body;
    
    if (!temaId) {
      return res.status(400).json({ success: false, message: "ID tema mancante" });
    }

    await daoTema.setTemaAttivo(temaId);
    
    res.json({ 
      success: true, 
      message: `Tema globale impostato su: ${temaId}`,
      temaId
    });
  } catch (err) {
    console.error("[ADMIN-TEMA] Errore attivazione tema globale:", err);
    res.status(500).json({ success: false, message: "Errore interno del server" });
  }
});

/**
 * GET /admin/temi/predefiniti/lista
 * Ritorna la lista dei temi predefiniti in formato JSON
 */
router.get("/temi/predefiniti/lista", (req, res) => {
  try {
    const temi = getAllThemes();
    res.json({ success: true, temi });
  } catch (err) {
    console.error("[ADMIN-TEMA] Errore lista temi predefiniti:", err);
    res.status(500).json({ success: false, message: "Errore interno" });
  }
});

/**
 * POST /admin/temi/crea-personalizzato
 * Crea un nuovo tema personalizzato
 */
router.post("/temi/crea-personalizzato", async (req, res) => {
  try {
    const { nome, slug, descrizione, colori } = req.body;
    const creato_da = req.user ? req.user.id : null;

    if (!nome || !slug || !colori) {
      return res.status(400).json({ 
        success: false, 
        message: "Nome, slug e colori sono campi obbligatori" 
      });
    }

    const nuovoTema = await daoTema.creaTemasPersonalizzato(
      nome, 
      slug, 
      descrizione, 
      colori, 
      creato_da
    );

    res.status(201).json({ 
      success: true, 
      message: "Tema personalizzato creato con successo",
      tema: nuovoTema 
    });
  } catch (err) {
    console.error("[ADMIN-TEMA] Errore creazione tema personalizzato:", err);
    // Gestione errore unique constraint
    if (err.message.includes("Esiste già")) {
      return res.status(409).json({ success: false, message: err.message });
    }
    res.status(500).json({ success: false, message: "Errore interno del server" });
  }
});

/**
 * GET /admin/temi/:id
 * Recupera i dettagli di un singolo tema personalizzato per la modifica
 */
router.get("/temi/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: "ID non valido" });
    }

    const tema = await daoTema.getTemasPersonalizzato(id);
    if (!tema) {
      return res.status(404).json({ success: false, message: "Tema non trovato" });
    }

    res.json({ success: true, tema });
  } catch (err) {
    console.error(`[ADMIN-TEMA] Errore fetch tema ${req.params.id}:`, err);
    res.status(500).json({ success: false, message: "Errore interno del server" });
  }
});

/**
 * PUT /admin/temi/:id
 * Aggiorna un tema personalizzato esistente
 */
router.put("/temi/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: "ID non valido" });
    }

    const datiAggiornati = req.body;
    // Rimuovi campi che non dovrebbero essere aggiornati direttamente
    delete datiAggiornati.id;
    delete datiAggiornati.slug;
    delete datiAggiornati.creato_da;
    
    const tema = await daoTema.aggiornaTemaPersonalizzato(id, datiAggiornati);
    
    res.json({ 
      success: true, 
      message: "Tema aggiornato con successo",
      tema 
    });
  } catch (err) {
    console.error(`[ADMIN-TEMA] Errore aggiornamento tema ${req.params.id}:`, err);
    res.status(500).json({ success: false, message: "Errore interno del server" });
  }
});

/**
 * DELETE /admin/temi/:id
 * Elimina un tema personalizzato
 */
router.delete("/temi/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: "ID non valido" });
    }

    const success = await daoTema.eliminaTemasPersonalizzato(id);
    
    if (success) {
      res.json({ success: true, message: "Tema eliminato con successo" });
    } else {
      res.status(404).json({ success: false, message: "Tema non trovato" });
    }
  } catch (err) {
    console.error(`[ADMIN-TEMA] Errore eliminazione tema ${req.params.id}:`, err);
    res.status(500).json({ success: false, message: "Errore interno del server" });
  }
});

/**
 * POST /admin/temi/preferenza/:utenteId
 * Consente a un admin di impostare la preferenza tema per un utente specifico
 */
router.post("/temi/preferenza/:utenteId", async (req, res) => {
  try {
    const utenteId = parseInt(req.params.utenteId, 10);
    const { temaId } = req.body;
    
    if (isNaN(utenteId) || !temaId) {
      return res.status(400).json({ success: false, message: "Dati non validi" });
    }

    await daoTema.setPreferenzaTema(utenteId, temaId);
    
    res.json({ 
      success: true, 
      message: `Preferenza tema aggiornata per l'utente ${utenteId}` 
    });
  } catch (err) {
    console.error(`[ADMIN-TEMA] Errore preferenza utente ${req.params.utenteId}:`, err);
    res.status(500).json({ success: false, message: "Errore interno del server" });
  }
});

module.exports = router;
