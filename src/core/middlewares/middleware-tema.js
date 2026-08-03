/**
 * @fileoverview Middleware tema dinamico - BorgoVercelli
 * @module core/middlewares/middleware-tema
 * @description Middleware Express che risolve il tema attivo per ogni richiesta
 *   seguendo questo ordine di priorità:
 *
 *   1. Preferenza dell'utente autenticato (database)
 *   2. Cookie 'tema' (utenti non autenticati o cache)
 *   3. Tema globale del sito (impostato dall'admin nel database)
 *   4. Fallback 'light' se qualsiasi errore si verifica
 *
 * Il middleware inietta nel template:
 *   - res.locals.tema     → oggetto tema completo
 *   - res.locals.temaId   → string ID del tema
 *   - res.locals.temaCSS  → CSS inline (variabili :root)
 *
 * NOTA: Il cookie 'tema' ha durata 30 giorni e segue le stesse policy
 *   di sicurezza del cookie di sessione (secure in production).
 */

"use strict";

const {
  getTheme,
  generateThemeCSS,
  generateCustomThemeCSS,
  DEFAULT_THEME,
  isValidThemeId,
} = require("../config/themes.config");

// DAO importato lazy per evitare dipendenze circolari durante il bootstrap
let daoTema = null;

/**
 * Carica il DAO tema al primo utilizzo (lazy load).
 * Se il DAO non è disponibile (DB non raggiunto) ritorna null silenziosamente.
 *
 * @returns {Object|null}
 */
function getDaoTema() {
  if (daoTema) return daoTema;
  try {
    daoTema = require("../../features/temi/services/dao-tema");
    return daoTema;
  } catch (err) {
    console.warn("[TEMA-MW] DAO tema non disponibile:", err.message);
    return null;
  }
}

/**
 * Imposta il cookie 'tema' sulla risposta.
 *
 * @param {Object} res    - Express Response
 * @param {string} temaId - ID del tema da salvare
 */
function setCookieTema(res, temaId) {
  const isProduction = process.env.NODE_ENV === "production";
  res.cookie("tema", temaId, {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 giorni in ms
    httpOnly: false,                    // Accessibile da JS per sincronizzazione client
    secure: isProduction,
    sameSite: "lax",
    path: "/",
  });
}

/**
 * Middleware principale - risolve il tema per la richiesta corrente.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function loadTema(req, res, next) {
  try {
    const dao = getDaoTema();
    let temaId = DEFAULT_THEME;
    let temaObj = null;
    let isPersonalizzato = false;

    // ── STEP 1: Preferenza utente autenticato ──────────────────────────────
    if (req.isAuthenticated && req.isAuthenticated() && req.user && dao) {
      try {
        const preferenza = await dao.getPreferenzaTema(req.user.id);
        if (preferenza && preferenza.tema_id) {
          temaId = preferenza.tema_id;
          console.debug(`[TEMA-MW] Tema da preferenza utente ${req.user.id}: ${temaId}`);
        }
      } catch (err) {
        console.warn("[TEMA-MW] Errore lettura preferenza utente:", err.message);
        // Continua con gli step successivi
      }
    }

    // ── STEP 2: Cookie 'tema' (se non trovato da DB) ───────────────────────
    if (temaId === DEFAULT_THEME && req.cookies && req.cookies.tema) {
      const cookieTema = req.cookies.tema;
      if (isValidThemeId(cookieTema) || (cookieTema && typeof cookieTema === "string")) {
        temaId = cookieTema;
        console.debug(`[TEMA-MW] Tema da cookie: ${temaId}`);
      }
    }

    // ── STEP 3: Tema globale del sito (admin) ──────────────────────────────
    if (temaId === DEFAULT_THEME && dao) {
      try {
        const globale = await dao.getTemaAttivo();
        if (globale && globale.tema_attivo) {
          temaId = globale.tema_attivo;
          console.debug(`[TEMA-MW] Tema globale dal DB: ${temaId}`);
        }
      } catch (err) {
        console.warn("[TEMA-MW] Errore lettura tema globale:", err.message);
      }
    }

    // ── Risolvi l'oggetto tema ─────────────────────────────────────────────

    // Prova prima temi predefiniti
    temaObj = getTheme(temaId);

    if (!temaObj && dao) {
      // Tenta come tema personalizzato (slug)
      try {
        const custom = await dao.getTemaPersonalizzatoBySlug(temaId);
        if (custom && custom.colori) {
          const colori = typeof custom.colori === "string"
            ? JSON.parse(custom.colori)
            : custom.colori;

          temaObj = {
            id: custom.slug,
            nome: custom.nome,
            descrizione: custom.descrizione || "",
            icona: "bi-palette-fill",
            colori,
          };
          isPersonalizzato = true;
          console.debug(`[TEMA-MW] Tema personalizzato caricato: ${custom.nome}`);
        }
      } catch (err) {
        console.warn("[TEMA-MW] Errore caricamento tema personalizzato:", err.message);
      }
    }

    // Fallback definitivo al tema light
    if (!temaObj) {
      console.warn(`[TEMA-MW] Tema '${temaId}' non trovato, fallback a '${DEFAULT_THEME}'`);
      temaId = DEFAULT_THEME;
      temaObj = getTheme(DEFAULT_THEME);
    }

    // ── Genera CSS inline ─────────────────────────────────────────────────
    let temaCSS;
    if (isPersonalizzato && temaObj.colori) {
      temaCSS = generateCustomThemeCSS(temaObj.colori, temaObj.id);
    } else {
      temaCSS = generateThemeCSS(temaObj);
    }

    // ── Aggiorna cookie (mantieni sincronizzato) ───────────────────────────
    setCookieTema(res, temaId);

    // ── Esponi nel request e nei locals del template ───────────────────────
    req.tema        = temaObj;
    req.temaId      = temaId;
    res.locals.tema              = temaObj;
    res.locals.temaId            = temaId;
    res.locals.temaCSS           = temaCSS;
    res.locals.temaIsPersonalizzato = isPersonalizzato;

    // Fetch all themes to populate dropdowns globally
    let tuttiTemi = [];
    try {
      const predefined = require("../config/themes.config").getAllThemes();
      let custom = [];
      if (dao) {
        custom = await dao.getTemiPersonalizzati(true); // solo attivi
      }
      
      tuttiTemi = [
        ...predefined,
        ...custom.map(c => ({
          id: c.slug,
          nome: c.nome,
          icona: "bi-palette-fill",
          isCustom: true
        }))
      ];
    } catch (e) {
      console.warn("[TEMA-MW] Errore fetch temi disponibili:", e.message);
    }
    res.locals.temiDisponibili = tuttiTemi;

  } catch (err) {
    // Fallback globale: non bloccare mai la richiesta per il tema
    console.error("[TEMA-MW] Errore imprevisto, fallback a light:", err.message);
    const fallback = getTheme(DEFAULT_THEME);
    req.tema        = fallback;
    req.temaId      = DEFAULT_THEME;
    res.locals.tema              = fallback;
    res.locals.temaId            = DEFAULT_THEME;
    res.locals.temaCSS           = generateThemeCSS(fallback);
    res.locals.temaIsPersonalizzato = false;
  }

  next();
}

module.exports = { loadTema };
