/**
 * @fileoverview File principale dell'applicazione Express
 * @description Configura l'applicazione Express, middleware, autenticazione Passport,
 * sessioni, route e gestione errori. Entry point per tutte le richieste HTTP.
 */

"use strict";

// Carica variabili d'ambiente dal file .env
require("dotenv").config();

// ==================== IMPORT MODULI ====================
// Moduli Express e middleware
const express = require("express");
const morgan = require("morgan"); // Logger HTTP
const path = require("path");
const methodOverride = require("method-override"); // Supporto per metodi HTTP PUT/DELETE
const cookieParser = require("cookie-parser");
const helmet = require("helmet"); // Security headers
const rateLimit = require("express-rate-limit"); // Rate limiting

// Autenticazione e utenti
const userDao = require("./features/users/services/dao-user");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const session = require("express-session");

// Redis per sessioni e notifiche
const { RedisStore } = require("connect-redis");
const { redisClient, initRedis } = require("./core/config/redis");

// ==================== IMPORT ROUTE ====================
// Route condivise
const routes = require("./shared/routes/index");
const routesSession = require("./shared/routes/session");
const routesSendEmail = require("./shared/routes/email");
const routesSitemap = require("./shared/routes/sitemap");
const routesPush = require("./shared/routes/push");

// Worker notifiche push integrato
const notificationsWorker = require("./server/workers/notifications-worker");

// Route features
const routesNotizie = require("./features/notizie/routes/notizie");
const routesEventi = require("./features/eventi/routes/eventi");
const routesRegistrazione = require("./features/auth/routes/login_register");
const routesOAuth = require("./features/auth/routes/oauth");
const routesRecensioni = require("./features/recensioni/routes/recensioni");
const routesSquadre = require("./features/squadre/routes/squadre");
const routesGalleria = require("./features/galleria/routes/galleria");
const routesPrenotazione = require("./features/prenotazioni/routes/prenotazione");
const routesAdmin = require("./features/admin/routes/admin");
const routesCampionati = require("./features/campionati/routes/campionati");
const routesUsers = require("./features/users/routes/users");

// ==================== CONFIGURAZIONE PASSPORT ====================
/**
 * Strategia locale di Passport per autenticazione email/password
 * Utilizza il DAO utenti per verificare le credenziali
 */
passport.use(
  new LocalStrategy(
    { usernameField: "email", passwordField: "password" },
    function (email, password, done) {
      userDao
        .getUser(email, password)
        .then((user) => {
          if (user) return done(null, user);
          else return done(null, false, { message: "Invalid credentials" });
        })
        .catch((err) =>
          done(null, false, { message: err.error || "Login fallito" }),
        );
    },
  ),
);

/**
 * Serializza l'utente nella sessione (salva solo l'ID)
 */
passport.serializeUser(function (user, done) {
  done(null, user.id);
});

/**
 * Deserializza l'utente dalla sessione (recupera l'oggetto completo)
 */
passport.deserializeUser(function (id, done) {
  userDao
    .getUserById(id)
    .then((user) => {
      done(null, user);
    })
    .catch((err) => {
      console.error("[PASSPORT] Errore deserializeUser:", err);
      done(err, null);
    });
});

// Inizializza strategie OAuth (Google, Facebook)
const { initOAuth } = require("./core/config/passport-oauth");
initOAuth();

// ==================== CREAZIONE APP EXPRESS ====================
const app = express();

// ==================== SECURITY HEADERS (Helmet) ====================
/**
 * Helmet aggiunge header HTTP di sicurezza:
 * - X-Frame-Options: SAMEORIGIN (anti-clickjacking)
 * - X-Content-Type-Options: nosniff
 * - Referrer-Policy: strict-origin-when-cross-origin
 * - X-XSS-Protection (legacy browsers)
 * - Strict-Transport-Security (HSTS) in produzione
 */
app.use(
  helmet({
    contentSecurityPolicy: false, // CSP disabilitato perché la configurazione specifica dipende da quill, chart.js ecc.
    crossOriginEmbedderPolicy: false, // Disabilitato per compatibilità con risorse esterne (immagini OAuth, ecc.)
  })
);

// ==================== RATE LIMITING ====================
/**
 * Rate limiting su endpoint sensibili per prevenire brute-force e abusi
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: 20, // max 20 tentativi per finestra
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Troppi tentativi. Riprova tra 15 minuti." },
  skip: (req) => process.env.NODE_ENV !== "production" && !process.env.RAILWAY_ENVIRONMENT,
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 ora
  max: 10, // max 10 richieste per ora
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Troppi tentativi di reset password. Riprova tra un'ora." },
});

// Railway (e altri PaaS) terminano HTTPS al reverse proxy e inoltrano in HTTP.
// Senza trust proxy, Express non vede la connessione come sicura e il cookie
// secure:true non viene impostato/inviato → sessione persa dopo OAuth redirect.
app.set("trust proxy", 1);

// ==================== ROUTE PRINCIPALE ====================
/**
 * Redirect dalla root alla homepage
 */
app.get("/", (req, res) => {
  res.redirect("/homepage");
});

// Configura i middleware
app.use(express.json({ limit: "10mb" }));
app.use(morgan("tiny"));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
app.use(
  methodOverride(function (req, res) {
    if (req.body && typeof req.body === "object" && "_method" in req.body) {
      var method = req.body._method;
      delete req.body._method;
      return method;
    }
  }),
);

// ==================== CONFIGURAZIONE MIDDLEWARE ====================

/**
 * Gestione del favicon
 * Serve il logo come favicon per evitare 404 nella console del browser
 */
app.get("/favicon.ico", function (req, res) {
  console.log("Serving /favicon.ico -> Logo.png");
  res.sendFile(path.join(__dirname, "public", "assets", "images", "Logo.png"));
});

// Legacy/default image fallbacks: always serve Campo.png for old default image paths
app.get(
  [
    "/images/default-news.jpg",
    "/assets/images/default-news.jpg",
    "/images/default-event.jpg",
    "/assets/images/default-event.jpg",
  ],
  function (req, res) {
    return res.sendFile(
      path.join(__dirname, "public", "assets", "images", "Campo.png"),
    );
  },
);

/**
 * Serve i file statici dalla cartella "public"
 * Include immagini, CSS, JavaScript lato client
 */
app.use(express.static(path.join(__dirname, "public")));
// Support legacy and shorthand image URLs: serve /images/* from public/assets/images
// This makes URLs like /images/default-news.jpg resolve to src/public/assets/images/default-news.jpg
app.use(
  "/images",
  express.static(path.join(__dirname, "public", "assets", "images")),
);

// ==================== CONFIGURAZIONE SESSIONI ====================

/**
 * Configura sessione Express con Redis Store
 * - store: RedisStore per persistenza sessioni in Redis
 * - secret: chiave per firmare il cookie di sessione
 * - resave: non salva sessione se non modificata
 * - saveUninitialized: non salva sessioni vuote non autenticate
 * - cookie: secure: false in sviluppo, true in production con HTTPS
 */
app.use(
  session({
    store: new RedisStore({ client: redisClient }),
    secret:
      process.env.SESSION_SECRET || "your-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production", // true solo con HTTPS
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 giorni
      sameSite: "lax",
    },
  }),
);

/**
 * Inizializza Passport per autenticazione
 * Gestisce login/logout e persistenza utente in sessione
 */
app.use(passport.initialize());
app.use(passport.session());

// Normalize req.user so routes can rely on consistent role fields
const normalizeUser = require("./core/middlewares/normalizeUser");
app.use(normalizeUser);

// ==================== MIDDLEWARE AUTENTICAZIONE ====================

/**
 * Middleware JWT per funzionalità "Ricordami"
 * Ripristina automaticamente la sessione da token JWT se presente
 */
const { jwtAuth } = require("./core/middlewares/jwt");
app.use(jwtAuth);

// ==================== MIDDLEWARE GESTIONE AUTOMATICA ====================

/**
 * DAO per prenotazioni (usato per controlli automatici)
 */
const daoPrenotazione = require("./features/prenotazioni/services/dao-prenotazione");

const PRENOTAZIONI_RETENTION_DAYS = Number.parseInt(
  process.env.PRENOTAZIONI_RETENTION_DAYS || "14",
  10,
);
const PRENOTAZIONI_CLEANUP_INTERVAL_MS = Number.parseInt(
  process.env.PRENOTAZIONI_CLEANUP_INTERVAL_MS || `${24 * 60 * 60 * 1000}`,
  10,
);

/**
 * Timestamp dell'ultimo controllo automatico
 * @type {number|null}
 */
let lastAutoCheck = null;

/**
 * Middleware per gestione automatica periodica
 * Esegue ogni 5 minuti:
 * - Marcatura prenotazioni scadute
 * - Accettazione automatica prenotazioni in attesa da 3+ giorni
 * - Riattivazione sospensioni scadute
 */
app.use(async function (req, res, next) {
  const now = Date.now();

  // Esegui il controllo solo una volta ogni 5 minuti
  if (!lastAutoCheck || now - lastAutoCheck > 5 * 60 * 1000) {
    lastAutoCheck = now;

    // Esegui in background senza bloccare la richiesta corrente
    setImmediate(async () => {
      try {
        // 1. Marca come scadute le prenotazioni passate
        await daoPrenotazione.checkAndUpdateScadute();

        // 2. Accetta automaticamente prenotazioni in attesa da più di 3 giorni
        await daoPrenotazione.autoAcceptPendingBookings();

        // 3. Verifica e riattiva sospensioni scadute
        const daoSospensioni = require("./features/users/services/dao-sospensioni");
        await daoSospensioni.verificaSospensioniScadute();
      } catch (error) {
        console.error(
          "[AUTO-CHECK] Errore durante il controllo automatico:",
          error,
        );
      }
    });
  }
  next();
});

const cleanupPrenotazioniScadute = async () => {
  try {
    await daoPrenotazione.checkAndUpdateScadute();
    const result = await daoPrenotazione.deleteScaduteOlderThanDays(
      PRENOTAZIONI_RETENTION_DAYS,
    );
    console.log(
      `[AUTO-CLEANUP] Prenotazioni scadute eliminate: ${result.deleted || 0} (retention: ${PRENOTAZIONI_RETENTION_DAYS} giorni)`,
    );
  } catch (error) {
    console.error("[AUTO-CLEANUP] Errore pulizia prenotazioni scadute:", error);
  }
};

setImmediate(cleanupPrenotazioniScadute);
setInterval(cleanupPrenotazioniScadute, PRENOTAZIONI_CLEANUP_INTERVAL_MS);

// ==================== MIDDLEWARE VARIABILI GLOBALI ====================

/**
 * Middleware per impostare variabili globali nei template EJS
 * Rende disponibili in tutte le views:
 * - isLogged: boolean se l'utente è autenticato
 * - user: oggetto utente corrente (o null)
 * - currentPath: percorso URL corrente
 * - imageUrl: URL immagine profilo dell'utente
 */
app.use(async function (req, res, next) {
  // Informazioni di autenticazione
  res.locals.isLogged = req.isAuthenticated ? req.isAuthenticated() : false;
  res.locals.user = req.user || null;
  res.locals.currentPath = req.path;

  // Recupera immagine profilo se l'utente è autenticato
  if (req.isAuthenticated() && req.user) {
    try {
      const imageUrl = await userDao.getImmagineProfiloByUserId(req.user.id);
      res.locals.imageUrl = imageUrl;
    } catch (error) {
      console.error("Errore nel recupero immagine profilo:", error);
      res.locals.imageUrl = null;
    }
  }
  next();
});

// ==================== MONTAGGIO ROUTE ====================

/**
 * Monta tutte le route dell'applicazione
 * Organizzate per feature e funzionalità
 */
app.use("/", routes); // Homepage e pagine generiche

// Applica rate limiting agli endpoint sensibili
app.use("/session", loginLimiter);
app.use("/forgot-password", forgotPasswordLimiter);
app.use("/reset-password", forgotPasswordLimiter);

// Proxy immagini esterne (es. foto Google OAuth) per evitare blocchi browser/CSP
// Limitato a domini noti per prevenire SSRF
const ALLOWED_IMAGE_DOMAINS = [
  "lh3.googleusercontent.com",
  "lh4.googleusercontent.com",
  "lh5.googleusercontent.com",
  "lh6.googleusercontent.com",
  "graph.facebook.com",
  "platform-lookaside.fbsbx.com",
  "avatars.githubusercontent.com",
  "pbs.twimg.com",
];

app.get("/api/proxy-image", async (req, res) => {
  const url = req.query.url;
  if (!url || typeof url !== 'string') return res.status(400).end();
  // Consenti solo URL https
  if (!url.startsWith('https://')) return res.status(403).end();
  // Verifica che il dominio sia nella lista consentita (anti-SSRF)
  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch (e) {
    return res.status(400).end();
  }
  if (!ALLOWED_IMAGE_DOMAINS.includes(parsedUrl.hostname)) {
    return res.status(403).end();
  }
  try {
    const https = require('https');
    const request = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (imgRes) => {
      if (imgRes.statusCode >= 400) return res.status(imgRes.statusCode).end();
      const ct = imgRes.headers['content-type'] || 'image/jpeg';
      // Verifica che la risposta sia effettivamente un'immagine
      if (!ct.startsWith('image/')) return res.status(403).end();
      res.setHeader('Content-Type', ct);
      res.setHeader('Cache-Control', 'public, max-age=86400'); // cache 24h
      imgRes.pipe(res);
  if (!url || typeof url !== "string") return res.status(400).end();
  // Consenti solo URL https (sicurezza)
  if (!url.startsWith("https://")) return res.status(403).end();
  try {
    const https = require("https");
    const request = https.get(
      url,
      { headers: { "User-Agent": "Mozilla/5.0" } },
      (imgRes) => {
        if (imgRes.statusCode >= 400)
          return res.status(imgRes.statusCode).end();
        const ct = imgRes.headers["content-type"] || "image/jpeg";
        res.setHeader("Content-Type", ct);
        res.setHeader("Cache-Control", "public, max-age=86400"); // cache 24h
        res.setHeader("Access-Control-Allow-Origin", "*");
        imgRes.pipe(res);
      },
    );
    request.on("error", () => res.status(500).end());
    request.setTimeout(8000, () => {
      request.destroy();
      res.status(504).end();
    });
  } catch (e) {
    res.status(500).end();
  }
});
// Route debug navbar: solo in development locale
if (process.env.NODE_ENV !== "production" && !process.env.RAILWAY_ENVIRONMENT) {
  app.post("/__debug-navbar", express.json(), (req, res) => {
    try {
      console.log("[NAVBAR_DEBUG]", JSON.stringify(req.body, null, 2));
    } catch (e) {
      console.error("[NAVBAR_DEBUG] Error logging debug info", e);
    }
    res.sendStatus(200);
  });
}

app.use("/", routesSitemap); // Sitemap dinamica
app.use("/", routesPush); // Web Push Notifications
app.use("/", routesNotizie); // Gestione notizie
app.use("/", routesEventi); // Gestione eventi
app.use("/", routesRegistrazione); // Login e registrazione
app.use("/", routesOAuth); // OAuth (Google, Facebook, Apple)
app.use("/", routesSession); // Gestione sessioni
app.use("/", routesRecensioni); // Sistema recensioni
app.use("/", routesSendEmail); // Invio email
app.use("/", routesSquadre); // Gestione squadre
app.use("/", routesGalleria); // Galleria immagini
app.use("/prenotazione", routesPrenotazione); // Sistema prenotazioni
app.use("/", routesAdmin); // Pannello amministrazione
app.use("/campionato", routesCampionati); // Gestione campionati
app.use("/users", routesUsers); // Profili utenti

// ==================== GESTIONE FILE CARICATI ====================

/**
 * Determina il percorso degli upload in base all'ambiente
 * Railway: /data/uploads (volume persistente)
 * Locale: src/public/uploads (sviluppo)
 */
const uploadsPath = process.env.RAILWAY_ENVIRONMENT
  ? "/data/uploads"
  : path.join(__dirname, "public/uploads");

console.log("[APP] Serving uploads from:", uploadsPath);
console.log("[APP] RAILWAY_ENVIRONMENT:", process.env.RAILWAY_ENVIRONMENT);

/**
 * Serve file caricati dagli utenti al percorso pubblico '/uploads'
 */
app.use("/uploads", express.static(uploadsPath));

/**
 * Route legacy per compatibilità
 * Alcuni record DB o client vecchi potrebbero usare '/src/public/uploads/...'
 */
app.use("/src/public/uploads", express.static(uploadsPath));

// ==================== CONFIGURAZIONE TEMPLATE ENGINE ====================

/**
 * Configura EJS come motore di template
 */
app.set("view engine", "ejs");

/**
 * Configura directory multiple per le views
 * Organizzate per feature per seguire la struttura modulare del progetto
 */
app.set("views", [
  path.join(__dirname, "shared/views"), // Views condivise
  path.join(__dirname, "features/admin/views"), // Admin panel
  path.join(__dirname, "features/auth/views"), // Login/registrazione
  path.join(__dirname, "features/campionati/views"), // Campionati
  path.join(__dirname, "features/eventi/views"), // Eventi
  path.join(__dirname, "features/galleria/views"), // Galleria
  path.join(__dirname, "features/notizie/views"), // Notizie
  path.join(__dirname, "features/prenotazioni/views"), // Prenotazioni
  path.join(__dirname, "features/recensioni/views"), // Recensioni
  path.join(__dirname, "features/squadre/views"), // Squadre
]);

// ==================== GESTIONE ERRORI ====================

/**
 * Gestione 404 - Pagina non trovata
 * Differenzia tra richieste API (JSON) e pagine web (HTML)
 */
app.use(function (req, res, next) {
  // Per richieste API, restituisci JSON
  if (req.headers.accept && req.headers.accept.includes("application/json")) {
    res.status(404).json({ error: "Endpoint non trovato" });
  } else {
    // Per richieste web, mostra pagina di errore
    res.status(404);
    res.render("error", { message: "Pagina non trovata", error: {} });
  }
});

/**
 * Fallback finale per route non gestite
 * Cattura qualsiasi richiesta che non sia stata gestita dai middleware precedenti
 */
app.use((req, res) => {
  res.statusCode = 404;
  res.end("Not Found");
});

// ==================== AVVIO WORKER NOTIFICHE ====================

/**
 * Avvia il worker per processare notifiche push in background
 * Il worker si avvia automaticamente dopo un breve delay per permettere
 * al server di completare l'inizializzazione
 */
setImmediate(async () => {
  try {
    console.log("[APP] 🚀 Avvio worker notifiche push...");
    await notificationsWorker.startWorker();
    console.log("[APP] ✅ Worker notifiche push avviato con successo");
  } catch (error) {
    console.error("[APP] ❌ Errore avvio worker notifiche:", error.message);
    console.error(
      "[APP] Le notifiche push non verranno processate automaticamente",
    );
  }
});

/**
 * Gestione graceful shutdown del worker
 */
process.on("SIGTERM", async () => {
  console.log("[APP] Ricevuto SIGTERM, arresto worker notifiche...");
  await notificationsWorker.stopWorker();
});

process.on("SIGINT", async () => {
  console.log("[APP] Ricevuto SIGINT, arresto worker notifiche...");
  await notificationsWorker.stopWorker();
  process.exit(0);
});

// ==================== EXPORT ====================

module.exports = app;
