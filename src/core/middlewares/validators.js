"use strict";

/**
 * Modulo centralizzato di validazione con express-validator.
 * Tutte le regole di validazione del sito sono definite qui.
 */
const { body, param, query, validationResult } = require("express-validator");

// ============================================================
// Helper: middleware che controlla gli errori di validazione
// e ritorna 400 con la lista degli errori in formato JSON
// ============================================================

/**
 * Middleware generico per gestire gli errori di validazione.
 * Da usare come ultimo middleware nella catena di validazione.
 * Ritorna JSON con array di errori se la validazione fallisce.
 */
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formatted = errors.array().map((e) => ({
      field: e.path || e.param,
      message: e.msg,
    }));
    return res.status(400).json({ error: formatted[0].message, errors: formatted });
  }
  next();
};

/**
 * Versione di handleValidation che fa render di una view EJS
 * in caso di errore (utile per route che rispondono con HTML).
 * @param {string} viewName - Nome della view da renderizzare
 * @param {function} extraDataFn - Funzione (req) => oggetto di dati extra per la view
 */
const handleValidationRender = (viewName, extraDataFn) => {
  return (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const formatted = errors.array().map((e) => ({
        field: e.path || e.param,
        message: e.msg,
      }));
      const extraData = typeof extraDataFn === "function" ? extraDataFn(req) : {};
      return res.status(400).render(viewName, {
        ...extraData,
        error: formatted[0].message,
        errors: formatted,
      });
    }
    next();
  };
};

// ============================================================
// REGOLE DI VALIDAZIONE PER AUTH (login, registrazione, profilo)
// ============================================================

/** POST /registrazione */
const validateRegistrazione = [
  body("nome")
    .trim()
    .notEmpty()
    .withMessage("Il nome è obbligatorio"),
  body("cognome")
    .trim()
    .notEmpty()
    .withMessage("Il cognome è obbligatorio"),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("L'email è obbligatoria")
    .isEmail()
    .withMessage("Formato email non valido")
    .normalizeEmail(),
  body("password")
    .notEmpty()
    .withMessage("La password è obbligatoria")
    .isLength({ min: 6 })
    .withMessage("La password deve essere di almeno 6 caratteri"),
  body("telefono")
    .optional({ values: "falsy" })
    .trim(),
  handleValidation,
];

/** PUT /profilo */
const validateProfiloUpdate = [
  body("nome")
    .optional({ values: "falsy" })
    .trim()
    .notEmpty()
    .withMessage("Il nome non può essere vuoto"),
  body("cognome")
    .optional({ values: "falsy" })
    .trim()
    .notEmpty()
    .withMessage("Il cognome non può essere vuoto"),
  body("email")
    .optional({ values: "falsy" })
    .trim()
    .isEmail()
    .withMessage("Formato email non valido")
    .normalizeEmail(),
  body("telefono")
    .optional({ values: "undefined" })
    .trim(),
  body("ruolo_preferito")
    .optional({ values: "undefined" })
    .trim(),
  body("piede_preferito")
    .optional({ values: "undefined" })
    .trim(),
  handleValidation,
];

/** POST /api/user/change-password */
const validateChangePassword = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Password attuale e nuova password sono obbligatorie"),
  body("newPassword")
    .notEmpty()
    .withMessage("Password attuale e nuova password sono obbligatorie")
    .isLength({ min: 6 })
    .withMessage("La nuova password deve essere di almeno 6 caratteri"),
  handleValidation,
];

/** POST /forgot-password */
const validateForgotPassword = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email richiesta")
    .isEmail()
    .withMessage("Formato email non valido"),
  handleValidation,
];

/** POST /reset-password */
const validateResetPassword = [
  body("token")
    .notEmpty()
    .withMessage("Token e password richiesti"),
  body("password")
    .notEmpty()
    .withMessage("Token e password richiesti")
    .isLength({ min: 6 })
    .withMessage("La password deve essere di almeno 6 caratteri"),
  handleValidation,
];

// ============================================================
// REGOLE DI VALIDAZIONE PER USERS
// ============================================================

/** PUT /users/update */
const validateUserUpdate = [
  body("nome")
    .optional({ values: "falsy" })
    .trim()
    .notEmpty()
    .withMessage("Il nome non può essere vuoto"),
  body("cognome")
    .optional({ values: "falsy" })
    .trim()
    .notEmpty()
    .withMessage("Il cognome non può essere vuoto"),
  body("email")
    .optional({ values: "falsy" })
    .trim()
    .isEmail()
    .withMessage("Formato email non valido")
    .normalizeEmail(),
  body("telefono")
    .optional({ values: "undefined" })
    .trim(),
  body("data_nascita")
    .optional({ values: "falsy" })
    .isISO8601()
    .withMessage("Formato data non valido"),
  body("codice_fiscale")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ min: 16, max: 16 })
    .withMessage("Il codice fiscale deve essere di 16 caratteri")
    .matches(/^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/i)
    .withMessage("Formato codice fiscale non valido"),
  handleValidation,
];

// ============================================================
// REGOLE DI VALIDAZIONE PER PRENOTAZIONI
// ============================================================

/** Helper: validazione orario HH:MM */
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(:\d{2})?$/;
const cfPattern = /^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/i;

/** POST /prenotazioni/check */
const validatePrenotazioneCheck = [
  body("campo_id")
    .notEmpty()
    .withMessage("Dati obbligatori mancanti: campo_id, data, inizio, fine"),
  body("data")
    .notEmpty()
    .withMessage("Dati obbligatori mancanti: campo_id, data, inizio, fine")
    .isISO8601()
    .withMessage("Data non valida"),
  body("inizio")
    .notEmpty()
    .withMessage("Dati obbligatori mancanti: campo_id, data, inizio, fine")
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage("Formato orario non valido. Usa HH:MM"),
  body("fine")
    .notEmpty()
    .withMessage("Dati obbligatori mancanti: campo_id, data, inizio, fine")
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage("Formato orario non valido. Usa HH:MM"),
  body("fine").custom((fine, { req }) => {
    if (req.body.inizio && fine && req.body.inizio >= fine) {
      throw new Error(
        "Intervallo non valido: l'orario di inizio deve essere precedente alla fine"
      );
    }
    return true;
  }),
  handleValidation,
];

/** Validazione documento di identità (condizionale) - da usare come chain */
const documentoValidation = [
  body("tipo_documento")
    .optional({ values: "falsy" })
    .isIn(["CF", "ID"])
    .withMessage(
      'Il tipo documento deve essere "CF" (Codice Fiscale) o "ID" (Documento Identità)'
    ),
  body("codice_fiscale").custom((val, { req }) => {
    if (req.body.tipo_documento === "CF") {
      if (!val || val.trim().length !== 16) {
        throw new Error(
          "Il codice fiscale deve essere esattamente 16 caratteri alfanumerici"
        );
      }
      if (!cfPattern.test(val.trim())) {
        throw new Error(
          "Il codice fiscale non rispetta il formato italiano standard"
        );
      }
    }
    return true;
  }),
  body("numero_documento").custom((val, { req }) => {
    if (req.body.tipo_documento === "ID") {
      if (!val || val.trim().length < 5) {
        throw new Error(
          "Il numero del documento deve contenere almeno 5 caratteri"
        );
      }
    }
    return true;
  }),
];

/** POST /prenotazioni */
const validatePrenotazioneCreate = [
  body("campo_id")
    .notEmpty()
    .withMessage("Dati obbligatori mancanti"),
  body("data_prenotazione")
    .notEmpty()
    .withMessage("Dati obbligatori mancanti"),
  body("ora_inizio")
    .notEmpty()
    .withMessage("Dati obbligatori mancanti")
    .matches(timeRegex)
    .withMessage("Formato orario non valido. Usa HH:MM"),
  body("ora_fine")
    .notEmpty()
    .withMessage("Dati obbligatori mancanti")
    .matches(timeRegex)
    .withMessage("Formato orario non valido. Usa HH:MM"),
  body("telefono")
    .trim()
    .notEmpty()
    .withMessage("Numero di telefono obbligatorio"),
  ...documentoValidation,
  handleValidation,
];

/** PUT /prenotazioni/:id */
const validatePrenotazioneUpdate = [
  param("id")
    .isInt()
    .withMessage("ID prenotazione non valido"),
  body("campo_id")
    .notEmpty()
    .withMessage("Devi selezionare un campo"),
  body("data_prenotazione")
    .trim()
    .notEmpty()
    .withMessage("Devi fornire una data per la prenotazione")
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage("La data deve essere nel formato YYYY-MM-DD (es: 2026-01-15)"),
  body("ora_inizio")
    .notEmpty()
    .withMessage("Devi fornire ora inizio e ora fine"),
  body("ora_fine")
    .notEmpty()
    .withMessage("Devi fornire ora inizio e ora fine"),
  body("telefono")
    .trim()
    .notEmpty()
    .withMessage("Devi fornire un numero di telefono")
    .matches(/^\+39\s?[0-9]{9,10}$/)
    .withMessage(
      "Il numero deve essere in formato: +39 seguito da 9-10 cifre (es: +39 3331234567)"
    ),
  ...documentoValidation,
  handleValidation,
];

/** PATCH /prenotazioni/:id/stato */
const validatePrenotazioneStato = [
  param("id")
    .isInt()
    .withMessage("ID prenotazione non valido"),
  body("stato")
    .notEmpty()
    .withMessage("Stato richiesto")
    .isIn(["in_attesa", "confermata", "annullata", "scaduta"])
    .withMessage("Stato non valido"),
  handleValidation,
];

/** GET /campi/:id/disponibilita */
const validateDisponibilita = [
  param("id")
    .isInt()
    .withMessage("ID campo non valido"),
  query("data")
    .notEmpty()
    .withMessage("Data richiesta"),
  handleValidation,
];

/** GET /prenotazione/export-report */
const validateExportReport = [
  query("dataInizio")
    .notEmpty()
    .withMessage("Data inizio e data fine sono obbligatorie"),
  query("dataFine")
    .notEmpty()
    .withMessage("Data inizio e data fine sono obbligatorie"),
  handleValidation,
];

// ============================================================
// REGOLE DI VALIDAZIONE PER NOTIZIE
// ============================================================

/** POST /notizie/nuova e POST /notizie/:id (update) */
const validateNotizia = (isUpdate = false) => {
  const rules = [
    body("titolo")
      .trim()
      .notEmpty()
      .withMessage("Titolo e contenuto sono obbligatori"),
    body("contenuto")
      .notEmpty()
      .withMessage("Titolo e contenuto sono obbligatori")
      .custom((val) => {
        if (val && Buffer.byteLength(val, "utf8") > 5 * 1024 * 1024) {
          throw new Error(
            "Il contenuto della notizia è troppo grande (max 5MB)."
          );
        }
        const textContent = val.replace(/<[^>]*>/g, "").trim();
        if (textContent.length < 1) {
          throw new Error(
            "Il contenuto della notizia deve contenere del testo effettivo"
          );
        }
        return true;
      }),
  ];
  return rules;
};

// ============================================================
// REGOLE DI VALIDAZIONE PER RECENSIONI
// ============================================================

/** POST /recensione */
const validateRecensioneCreate = [
  body("valutazione")
    .notEmpty()
    .withMessage("Dati mancanti")
    .isInt({ min: 1, max: 5 })
    .withMessage("La valutazione deve essere tra 1 e 5"),
  body("titolo")
    .trim()
    .notEmpty()
    .withMessage("Dati mancanti"),
  body("contenuto")
    .trim()
    .notEmpty()
    .withMessage("Dati mancanti"),
  body("entita_tipo")
    .trim()
    .notEmpty()
    .withMessage("Dati mancanti"),
  body("entita_id")
    .notEmpty()
    .withMessage("Dati mancanti"),
  handleValidation,
];

/** PUT /recensioni/:id */
const validateRecensioneUpdate = [
  param("id")
    .isInt()
    .withMessage("ID recensione non valido"),
  body("valutazione")
    .notEmpty()
    .withMessage("Dati mancanti")
    .isInt({ min: 1, max: 5 })
    .withMessage("La valutazione deve essere tra 1 e 5"),
  body("titolo")
    .trim()
    .notEmpty()
    .withMessage("Dati mancanti"),
  body("contenuto")
    .trim()
    .notEmpty()
    .withMessage("Dati mancanti"),
  handleValidation,
];

// ============================================================
// REGOLE DI VALIDAZIONE PER SQUADRE
// ============================================================

/** POST /createsquadra e PUT /updatesquadra/:id */
const validateSquadra = [
  body("nome")
    .trim()
    .notEmpty()
    .withMessage("Nome e anno fondazione sono obbligatori"),
  body("annoFondazione")
    .notEmpty()
    .withMessage("Nome e anno fondazione sono obbligatori")
    .isInt()
    .withMessage("Anno fondazione deve essere un numero"),
  handleValidation,
];

/** PUT /squadre/:id (alias update) */
const validateSquadraAlias = [
  body("nome")
    .trim()
    .notEmpty()
    .withMessage("Nome e anno fondazione sono obbligatori"),
  body("anno")
    .notEmpty()
    .withMessage("Nome e anno fondazione sono obbligatori")
    .isInt()
    .withMessage("Anno fondazione deve essere un numero"),
  handleValidation,
];

/** POST /squadre/:id/dirigenti */
const validateAddDirigente = [
  body("userId")
    .optional()
    .isInt()
    .withMessage("ID utente deve essere numerico"),
  body("user_id")
    .optional()
    .isInt()
    .withMessage("ID utente deve essere numerico"),
  body("selectedUtenteId")
    .optional()
    .isInt()
    .withMessage("ID utente deve essere numerico"),
  // Validazione custom: almeno uno dei campi userId deve essere presente
  body().custom((value, { req }) => {
    const rawUserId =
      req.body.userId || req.body.user_id || req.body.selectedUtenteId;
    if (!rawUserId) {
      throw new Error("ID utente è obbligatorio e deve essere numerico");
    }
    const parsed = parseInt(rawUserId, 10);
    if (!Number.isInteger(parsed)) {
      throw new Error("ID utente è obbligatorio e deve essere numerico");
    }
    return true;
  }),
  handleValidation,
];

/** PUT /squadre/:id/dirigenti/:managerId */
const validateUpdateDirigente = [
  param("managerId")
    .isInt()
    .withMessage("ID dirigente non valido"),
  body("ruolo")
    .trim()
    .notEmpty()
    .withMessage("Il ruolo è obbligatorio"),
  handleValidation,
];

/** POST /squadre/:id/giocatori e PUT /squadre/:id/giocatori/:playerId */
const validateGiocatore = [
  body("nome")
    .trim()
    .notEmpty()
    .withMessage("Nome e cognome sono obbligatori"),
  body("cognome")
    .trim()
    .notEmpty()
    .withMessage("Nome e cognome sono obbligatori"),
  body("numero_maglia")
    .optional({ values: "falsy" })
    .isInt()
    .withMessage("Il numero maglia deve essere un numero"),
  handleValidation,
];

// ============================================================
// REGOLE DI VALIDAZIONE PER EVENTI
// ============================================================

/** POST /evento/nuovo e PUT /evento/:id */
const validateEvento = [
  body("titolo")
    .trim()
    .notEmpty()
    .withMessage("Il titolo è obbligatorio"),
  body("data_inizio")
    .notEmpty()
    .withMessage("La data di inizio è obbligatoria"),
  body("luogo")
    .optional({ values: "falsy" })
    .trim(),
  body("tipo_evento")
    .optional({ values: "falsy" })
    .trim(),
  body("max_partecipanti")
    .optional({ values: "falsy" })
    .isInt({ min: 0 })
    .withMessage("Il numero massimo di partecipanti deve essere un numero positivo"),
  handleValidation,
];

// ============================================================
// REGOLE DI VALIDAZIONE PER ADMIN
// ============================================================

/** POST /admin/utenti */
const validateAdminCreateUser = [
  body("nome")
    .trim()
    .notEmpty()
    .withMessage("Nome, cognome, email e password sono obbligatori"),
  body("cognome")
    .trim()
    .notEmpty()
    .withMessage("Nome, cognome, email e password sono obbligatori"),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Nome, cognome, email e password sono obbligatori")
    .isEmail()
    .withMessage("Formato email non valido")
    .normalizeEmail(),
  body("password")
    .notEmpty()
    .withMessage("Nome, cognome, email e password sono obbligatori")
    .isLength({ min: 6 })
    .withMessage("La password deve essere di almeno 6 caratteri"),
  body("telefono")
    .optional({ values: "falsy" })
    .trim(),
  body("tipo_utente_id")
    .optional({ values: "falsy" })
    .isInt()
    .withMessage("Tipo utente non valido"),
  handleValidation,
];

/** PUT /admin/utenti/:id */
const validateAdminUpdateUser = [
  param("id")
    .isInt()
    .withMessage("ID utente non valido"),
  body("nome")
    .optional({ values: "falsy" })
    .trim(),
  body("cognome")
    .optional({ values: "falsy" })
    .trim(),
  body("email")
    .optional({ values: "falsy" })
    .trim()
    .isEmail()
    .withMessage("Formato email non valido")
    .normalizeEmail(),
  body("tipo_utente_id")
    .optional({ values: "falsy" })
    .isInt()
    .withMessage("Tipo utente non valido"),
  handleValidation,
];

/** POST /api/admin/utenti/:id/sospendi */
const validateSospendiUtente = [
  param("id")
    .isInt()
    .withMessage("ID utente non valido"),
  body("motivo")
    .trim()
    .notEmpty()
    .withMessage("Motivo e durata sono obbligatori"),
  body("durataGiorni")
    .notEmpty()
    .withMessage("Motivo e durata sono obbligatori")
    .isInt({ min: 1 })
    .withMessage("La durata deve essere almeno 1 giorno"),
  handleValidation,
];

/** POST /api/admin/utenti/:id/banna */
const validateBannaUtente = [
  param("id")
    .isInt()
    .withMessage("ID utente non valido"),
  body("motivo")
    .trim()
    .notEmpty()
    .withMessage("Il motivo è obbligatorio"),
  handleValidation,
];

/** POST /admin/campi/:id/orari */
const validateAddOrario = [
  param("id")
    .isInt()
    .withMessage("ID campo non valido"),
  body("ora_inizio")
    .notEmpty()
    .withMessage("Ora inizio è obbligatoria")
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage("Formato ora inizio non valido (HH:MM)"),
  body("ora_fine")
    .notEmpty()
    .withMessage("Ora fine è obbligatoria")
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage("Formato ora fine non valido (HH:MM)"),
  body("giorno_settimana")
    .optional({ values: "falsy" })
    .isInt({ min: 0, max: 6 })
    .withMessage("Giorno della settimana non valido (0-6)"),
  handleValidation,
];

/** PUT /admin/campi/modifica/:id */
const validateCampoModifica = [
  param("id")
    .isInt()
    .withMessage("ID campo non valido"),
  body("nome")
    .trim()
    .notEmpty()
    .withMessage("Il nome del campo è obbligatorio"),
  body("capienza_pubblico")
    .optional({ values: "falsy" })
    .isInt({ min: 0 })
    .withMessage("La capienza deve essere un numero positivo"),
  handleValidation,
];

/** POST /api/admin/campionati */
const validateCampionato = [
  body("nome")
    .trim()
    .notEmpty()
    .withMessage("Il nome del campionato è obbligatorio"),
  body("stagione")
    .optional({ values: "falsy" })
    .trim(),
  body("categoria")
    .optional({ values: "falsy" })
    .trim(),
  handleValidation,
];

// ============================================================
// REGOLE DI VALIDAZIONE PER EMAIL
// ============================================================

/** POST /send-email */
const validateSendEmail = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Tutti i campi sono obbligatori."),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Tutti i campi sono obbligatori.")
    .isEmail()
    .withMessage("Formato email non valido"),
  body("subject")
    .trim()
    .notEmpty()
    .withMessage("Tutti i campi sono obbligatori."),
  body("message")
    .trim()
    .notEmpty()
    .withMessage("Tutti i campi sono obbligatori."),
  handleValidation,
];

// ============================================================
// ESPORTAZIONE
// ============================================================

module.exports = {
  handleValidation,
  handleValidationRender,
  // Auth
  validateRegistrazione,
  validateProfiloUpdate,
  validateChangePassword,
  validateForgotPassword,
  validateResetPassword,
  // Users
  validateUserUpdate,
  // Prenotazioni
  validatePrenotazioneCheck,
  validatePrenotazioneCreate,
  validatePrenotazioneUpdate,
  validatePrenotazioneStato,
  validateDisponibilita,
  validateExportReport,
  // Notizie
  validateNotizia,
  // Recensioni
  validateRecensioneCreate,
  validateRecensioneUpdate,
  // Squadre
  validateSquadra,
  validateSquadraAlias,
  validateAddDirigente,
  validateUpdateDirigente,
  validateGiocatore,
  // Eventi
  validateEvento,
  // Admin
  validateAdminCreateUser,
  validateAdminUpdateUser,
  validateSospendiUtente,
  validateBannaUtente,
  validateAddOrario,
  validateCampoModifica,
  validateCampionato,
  // Email
  validateSendEmail,
};
