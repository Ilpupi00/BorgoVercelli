/**
 * @fileoverview Configurazione temi dinamici - BorgoVercelli
 * @module core/config/themes.config
 * @description Definisce i 4 temi predefiniti dell'applicazione e le funzioni
 *   utilitarie per generare CSS dinamico tramite variabili CSS personalizzabili.
 *
 * TEMI DISPONIBILI:
 *   - light  : Tema chiaro (default)
 *   - dark   : Tema scuro
 *   - sport  : Blu scuro + verde vivace (squadre/sport)
 *   - nature : Verde naturale + sfondo crema
 */

"use strict";

// ==================== TEMI PREDEFINITI ====================

/**
 * Mappa di tutti i temi predefiniti.
 * Ogni tema espone una palette di variabili CSS che il middleware
 * inietterà come <style> inline nell'<head> di ogni pagina.
 *
 * @type {Object.<string, ThemeDefinition>}
 *
 * @typedef {Object} ThemeColors
 * @property {string} primary               - Colore primario (btn, link)
 * @property {string} primary_hover         - Colore primario al hover
 * @property {string} secondary             - Colore secondario
 * @property {string} success               - Colore successo
 * @property {string} danger                - Colore pericolo
 * @property {string} warning               - Colore avvertimento
 * @property {string} info                  - Colore informativo
 * @property {string} background            - Sfondo principale del body
 * @property {string} surface              - Sfondo secondario (cards, sidebar)
 * @property {string} text_primary          - Testo principale
 * @property {string} text_secondary        - Testo secondario
 * @property {string} border               - Colore bordi
 * @property {string} card_background      - Sfondo card
 * @property {string} card_border          - Bordo card
 * @property {string} card_shadow          - Ombra card
 * @property {string} btn_primary_bg       - Sfondo bottone primario
 * @property {string} btn_primary_text     - Testo bottone primario
 * @property {string} btn_primary_hover    - Hover bottone primario
 * @property {string} input_border         - Bordo input
 * @property {string} input_bg             - Sfondo input
 * @property {string} input_text           - Testo input
 * @property {string} navbar_bg            - Sfondo navbar (può essere gradiente)
 * @property {string} navbar_text          - Testo navbar
 * @property {string} footer_bg            - Sfondo footer
 * @property {string} footer_text          - Testo footer
 * @property {string} gradient_primary     - Gradiente primario
 * @property {string} gradient_success     - Gradiente successo
 *
 * @typedef {Object} ThemeDefinition
 * @property {string}      id          - Identificatore univoco
 * @property {string}      nome        - Nome leggibile
 * @property {string}      descrizione - Breve descrizione
 * @property {string}      icona       - Icona Bootstrap Icons
 * @property {ThemeColors} colori      - Palette colori completa
 */
const THEMES = {

  // ── LIGHT ──────────────────────────────────────────────────────────────────
  light: {
    id: "light",
    nome: "Tema Chiaro",
    descrizione: "Tema classico con sfondo bianco e accenti blu",
    icona: "bi-sun-fill",
    colori: {
      primary:            "#0d6efd",
      primary_hover:      "#0a58ca",
      secondary:          "#22b14c",
      success:            "#22c55e",
      danger:             "#ef4444",
      warning:            "#f59e0b",
      info:               "#3b82f6",
      background:         "#ffffff",
      surface:            "#f8fafc",
      text_primary:       "#1e293b",
      text_secondary:     "#64748b",
      border:             "#e2e8f0",
      card_background:    "#ffffff",
      card_border:        "#e2e8f0",
      card_shadow:        "0 1px 3px rgba(0,0,0,0.1)",
      btn_primary_bg:     "#0d6efd",
      btn_primary_text:   "#ffffff",
      btn_primary_hover:  "#0a58ca",
      input_border:       "#cbd5e1",
      input_bg:           "#ffffff",
      input_text:         "#1e293b",
      navbar_bg:          "linear-gradient(135deg,#0d6efd 0%,#2563eb 100%)",
      navbar_text:        "#ffffff",
      footer_bg:          "#1e293b",
      footer_text:        "#cbd5e1",
      gradient_primary:   "linear-gradient(135deg,#0d6efd 0%,#2563eb 100%)",
      gradient_success:   "linear-gradient(135deg,#22c55e 0%,#16a34a 100%)",
    },
  },

  // ── DARK ───────────────────────────────────────────────────────────────────
  dark: {
    id: "dark",
    nome: "Tema Scuro",
    descrizione: "Tema notturno premium — Indigo Night con sfondo profondo e accenti viola/indigo",
    icona: "bi-moon-stars-fill",
    colori: {
      primary:            "#818cf8",   // indigo chiaro vibrante
      primary_hover:      "#a5b4fc",
      secondary:          "#34d399",   // verde smeraldo
      success:            "#34d399",
      danger:             "#f87171",
      warning:            "#fbbf24",
      info:               "#60a5fa",
      background:         "#0f1117",   // nero-blu profondo (SOLIDO!)
      surface:            "#161b27",   // layer intermedio
      text_primary:       "#f1f5f9",   // quasi bianco
      text_secondary:     "#cbd5e1",   // grigio chiaro
      border:             "#2e3650",
      card_background:    "#1e2535",   // card solida visibile
      card_border:        "#2e3650",
      card_shadow:        "0 4px 16px rgba(0,0,0,0.5)",
      btn_primary_bg:     "#6366f1",
      btn_primary_text:   "#ffffff",
      btn_primary_hover:  "#818cf8",
      input_border:       "#2e3650",
      input_bg:           "#1c2233",
      input_text:         "#f1f5f9",
      navbar_bg:          "linear-gradient(135deg,#1e1b4b 0%,#312e81 100%)",
      navbar_text:        "#ffffff",
      footer_bg:          "#0f1117",
      footer_text:        "#94a3b8",
      gradient_primary:   "linear-gradient(135deg,#6366f1 0%,#818cf8 100%)",
      gradient_success:   "linear-gradient(135deg,#10b981 0%,#34d399 100%)",
    },
  },

  // ── SPORT ──────────────────────────────────────────────────────────────────
  sport: {
    id: "sport",
    nome: "Tema Sport",
    descrizione: "Colori squadra: blu scuro e verde vivace per l'energia sportiva",
    icona: "bi-trophy-fill",
    colori: {
      primary:            "#003d82",
      primary_hover:      "#00307a",
      secondary:          "#00a651",
      success:            "#00a651",
      danger:             "#dc2626",
      warning:            "#f59e0b",
      info:               "#0284c7",
      background:         "#f0f4f8",
      surface:            "#e8edf3",
      text_primary:       "#0a1628",
      text_secondary:     "#3d5a7a",
      border:             "#c8d6e5",
      card_background:    "#ffffff",
      card_border:        "#c8d6e5",
      card_shadow:        "0 4px 12px rgba(0,61,130,0.12)",
      btn_primary_bg:     "#003d82",
      btn_primary_text:   "#ffffff",
      btn_primary_hover:  "#00307a",
      input_border:       "#a8bbd4",
      input_bg:           "#ffffff",
      input_text:         "#0a1628",
      navbar_bg:          "linear-gradient(135deg,#003d82 0%,#005cbf 100%)",
      navbar_text:        "#ffffff",
      footer_bg:          "#0a1628",
      footer_text:        "#8fa9c8",
      gradient_primary:   "linear-gradient(135deg,#003d82 0%,#005cbf 100%)",
      gradient_success:   "linear-gradient(135deg,#007a3c 0%,#00a651 100%)",
    },
  },

  // ── NATURE ─────────────────────────────────────────────────────────────────
  nature: {
    id: "nature",
    nome: "Tema Natura",
    descrizione: "Verde naturale con sfondo crema per un look fresco e rilassante",
    icona: "bi-tree-fill",
    colori: {
      primary:            "#27ae60",
      primary_hover:      "#219a52",
      secondary:          "#2ecc71",
      success:            "#2ecc71",
      danger:             "#e74c3c",
      warning:            "#f39c12",
      info:               "#1abc9c",
      background:         "#f5faf9",
      surface:            "#eaf4ef",
      text_primary:       "#1a3326",
      text_secondary:     "#4a7c59",
      border:             "#c5dfc9",
      card_background:    "#ffffff",
      card_border:        "#c5dfc9",
      card_shadow:        "0 4px 12px rgba(39,174,96,0.12)",
      btn_primary_bg:     "#27ae60",
      btn_primary_text:   "#ffffff",
      btn_primary_hover:  "#219a52",
      input_border:       "#a8c8b4",
      input_bg:           "#ffffff",
      input_text:         "#1a3326",
      navbar_bg:          "linear-gradient(135deg,#1a6b3a 0%,#27ae60 100%)",
      navbar_text:        "#ffffff",
      footer_bg:          "#1a3326",
      footer_text:        "#8fbf9c",
      gradient_primary:   "linear-gradient(135deg,#1a6b3a 0%,#27ae60 100%)",
      gradient_success:   "linear-gradient(135deg,#145a32 0%,#1e8449 100%)",
    },
  },
};

// ==================== COSTANTI ====================

/** Tema di fallback se nessuna preferenza è impostata */
const DEFAULT_THEME = "light";

/** Lista degli ID temi predefiniti validi */
const VALID_THEME_IDS = Object.keys(THEMES);

// ==================== FUNZIONI UTILITARIE ====================

/**
 * Recupera la definizione di un tema predefinito per ID.
 *
 * @param {string} id - ID del tema (es. 'light', 'dark', 'sport', 'nature')
 * @returns {ThemeDefinition|null} Oggetto tema o null se non trovato
 *
 * @example
 * const tema = getTheme('sport');
 * console.log(tema.nome); // "Tema Sport"
 */
function getTheme(id) {
  if (!id || typeof id !== "string") return THEMES[DEFAULT_THEME];
  return THEMES[id.toLowerCase()] || null;
}

/**
 * Restituisce la lista di tutti i temi predefiniti come array.
 *
 * @returns {ThemeDefinition[]} Array di definizioni tema
 */
function getAllThemes() {
  return Object.values(THEMES);
}

/**
 * Verifica se un ID tema è un tema predefinito valido.
 *
 * @param {string} id - ID da verificare
 * @returns {boolean}
 */
function isValidThemeId(id) {
  return VALID_THEME_IDS.includes(id);
}

/**
 * Genera il blocco CSS con le variabili CSS a partire da un oggetto tema.
 * Il CSS viene iniettato inline nell'<head> per evitare FOUC (Flash Of Unstyled Content).
 *
 * Le variabili seguono la convenzione già usata nel progetto (theme-variables.css):
 *   --primary-color, --bg-primary, --card-bg, ecc.
 *
 * @param {ThemeDefinition|Object} tema - Oggetto tema (predefinito o personalizzato)
 * @returns {string} Stringa CSS completa con :root { ... }
 *
 * @example
 * const css = generateThemeCSS(getTheme('nature'));
 * // → ":root { --primary-color: #27ae60; ... }"
 */
function generateThemeCSS(tema) {
  if (!tema || !tema.colori) {
    // Fallback sicuro: genera CSS dal tema light
    tema = THEMES[DEFAULT_THEME];
  }

  const c = tema.colori;

  // Mappa le chiavi del tema alle variabili CSS usate nel progetto
  const vars = {
    // ── Colori primari ──
    "--primary-color":        c.primary,
    "--primary-variant":      c.primary_hover,
    "--primary-hover":        c.primary_hover,
    "--primary-active":       c.primary_hover,
    "--btn-primary-bg":       c.btn_primary_bg      || c.primary,
    "--btn-primary-text":     c.btn_primary_text    || "#ffffff",
    "--btn-primary-hover":    c.btn_primary_hover   || c.primary_hover,

    // ── Colori secondari / stato ──
    "--secondary-color":      c.secondary,
    "--success":              c.success,
    "--danger":               c.danger,
    "--warning":              c.warning,
    "--info":                 c.info,

    // ── Background ──
    "--bg-primary":           c.background,
    "--bg-secondary":         c.surface,
    "--bg-tertiary":          c.surface,
    "--bg-elevated":          c.card_background     || c.surface,
    "--bg-hover":             c.surface,

    // ── Testo ──
    "--text-primary":         c.text_primary,
    "--text-secondary":       c.text_secondary,
    "--text-tertiary":        c.text_secondary,
    "--text-on-primary":      c.btn_primary_text    || "#ffffff",
    "--text-muted":           c.text_secondary,

    // ── Bordi ──
    "--border-color":         c.border,
    "--border-hover":         c.border,
    "--border-focus":         c.primary,

    // ── Card ──
    "--card-bg":              c.card_background     || c.background,
    "--card-border":          c.card_border         || c.border,
    "--card-shadow":          c.card_shadow         || "0 1px 3px rgba(0,0,0,0.1)",

    // ── Shadow ──
    "--shadow-sm":            "0 1px 2px rgba(0,0,0,0.08)",
    "--shadow-md":            "0 4px 6px rgba(0,0,0,0.1)",
    "--shadow-lg":            "0 10px 15px rgba(0,0,0,0.1)",

    // ── Input ──
    "--input-bg":             c.input_bg            || c.background,
    "--input-border":         c.input_border        || c.border,
    "--input-text":           c.input_text          || c.text_primary,
    "--input-placeholder":    c.text_secondary,
    "--input-focus-border":   c.primary,

    // ── Navbar ──
    "--navbar-bg":            c.navbar_bg,
    "--navbar-text":          c.navbar_text         || "#ffffff",
    "--navbar-hover":         "rgba(255,255,255,0.1)",
    "--navbar-active":        "rgba(255,255,255,0.2)",

    // ── Footer ──
    "--footer-bg":            c.footer_bg,
    "--footer-text":          c.footer_text,
    "--footer-heading":       "#ffffff",

    // ── Gradienti ──
    "--gradient-primary":     c.gradient_primary    || `linear-gradient(135deg,${c.primary} 0%,${c.primary_hover} 100%)`,
    "--gradient-success":     c.gradient_success    || `linear-gradient(135deg,${c.success} 0%,${c.secondary} 100%)`,

    // ── Misc ──
    "--border-radius-sm":     "0.375rem",
    "--border-radius-md":     "0.5rem",
    "--border-radius-lg":     "0.75rem",
    "--transition-speed":     "0.3s",
  };

  // Costruisce il blocco :root { ... }
  const varLines = Object.entries(vars)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `  ${k}: ${v};`)
    .join("\n");
  return `:root, :root[data-theme="${tema.id}"] {\n${varLines}\n}`;
}

/**
 * Genera CSS per un tema personalizzato a partire da un oggetto colori.
 * Usato quando il tema è creato dall'admin e non rientra nei predefiniti.
 *
 * @param {ThemeColors} colori - Oggetto colori (può essere parziale; mancanti → light)
 * @param {string}      [nomeSlug="custom"] - Slug del tema per commenti CSS
 * @returns {string} CSS generato
 */
function generateCustomThemeCSS(colori, nomeSlug = "custom") {
  if (!colori || typeof colori !== "object") {
    return generateThemeCSS(THEMES[DEFAULT_THEME]);
  }

  // Merge con il tema light come base per le variabili mancanti
  const base = { ...THEMES[DEFAULT_THEME].colori, ...colori };
  const temaFittizio = {
    id: nomeSlug,
    nome: nomeSlug,
    colori: base,
  };

  return `/* Tema personalizzato: ${nomeSlug} */\n${generateThemeCSS(temaFittizio)}`;
}

// ==================== EXPORT ====================

module.exports = {
  THEMES,
  DEFAULT_THEME,
  VALID_THEME_IDS,
  getTheme,
  getAllThemes,
  isValidThemeId,
  generateThemeCSS,
  generateCustomThemeCSS,
};
