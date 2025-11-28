/**
 * @fileoverview File principale dell'applicazione Express
 * @description Configura l'applicazione Express, middleware, autenticazione Passport,
 * sessioni, route e gestione errori. Entry point per tutte le richieste HTTP.
 */

'use strict';

// Carica variabili d'ambiente dal file .env
require('dotenv').config();

// ==================== IMPORT MODULI ====================
// Moduli Express e middleware
const express = require('express');
const morgan = require('morgan'); // Logger HTTP
const path = require('path');
const methodOverride = require('method-override'); // Supporto per metodi HTTP PUT/DELETE
const cookieParser = require('cookie-parser');

// Autenticazione e utenti
const userDao = require('./features/users/services/dao-user');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');

// ==================== IMPORT ROUTE ====================
// Route condivise
const routes = require('./shared/routes/index');
const routesSession = require('./shared/routes/session');
const routesSendEmail = require('./shared/routes/email');
const routesSitemap = require('./shared/routes/sitemap');
const routesPush = require('./shared/routes/push');

// Route features
const routesNotizie = require('./features/notizie/routes/notizie');
const routesEventi = require('./features/eventi/routes/eventi');
const routesRegistrazione = require('./features/auth/routes/login_register');
const routesRecensioni = require('./features/recensioni/routes/recensioni');
const routesSquadre = require('./features/squadre/routes/squadre');
const routesGalleria = require('./features/galleria/routes/galleria');
const routesPrenotazione = require('./features/prenotazioni/routes/prenotazione');
const routesAdmin = require('./features/admin/routes/admin');
const routesCampionati = require('./features/campionati/routes/campionati');
const routesUsers = require('./features/users/routes/users');

// ==================== CONFIGURAZIONE PASSPORT ====================
/**
 * Strategia locale di Passport per autenticazione email/password
 * Utilizza il DAO utenti per verificare le credenziali
 */
passport.use(new LocalStrategy(
  { usernameField: 'email', passwordField: 'password' },
  function(email, password, done) {
    userDao.getUser(email, password)
      .then(user => {
        if (user) return done(null, user);
        else return done(null, false, { message: "Invalid credentials" });
      })
      .catch(err => done(null, false, { message: err.error || "Login fallito" }));
  }
));

/**
 * Serializza l'utente nella sessione (salva solo l'ID)
 */
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

/**
 * Deserializza l'utente dalla sessione (recupera l'oggetto completo)
 */
passport.deserializeUser(function(id, done) {
  userDao.getUserById(id).then(user => {
    done(null, user);
  });
});

// ==================== CREAZIONE APP EXPRESS ====================
const app = express();

// ==================== ROUTE PRINCIPALE ====================
/**
 * Redirect dalla root alla homepage
 */
app.get('/', (req, res) => {
  res.redirect('/homepage');
});

// Configura i middleware
app.use(express.json({ limit: '10mb' }));
app.use(morgan('tiny'));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(methodOverride(function (req, res) {
  if (req.body && typeof req.body === 'object' && '_method' in req.body) {
    var method = req.body._method;
    delete req.body._method;
    return method;
  }
}));

// ==================== CONFIGURAZIONE MIDDLEWARE ====================

/**
 * Gestione del favicon
 * Serve il logo come favicon per evitare 404 nella console del browser
 */
app.get('/favicon.ico', function(req, res) {
  console.log('Serving /favicon.ico -> Logo.png');
  res.sendFile(path.join(__dirname, 'public', 'assets', 'images', 'Logo.png'));
});

// Legacy/default image fallbacks: always serve Campo.png for old default image paths
app.get(['/images/default-news.jpg', '/assets/images/default-news.jpg', '/images/default-event.jpg', '/assets/images/default-event.jpg'], function(req, res) {
  return res.sendFile(path.join(__dirname, 'public', 'assets', 'images', 'Campo.png'));
});

/**
 * Serve i file statici dalla cartella "public"
 * Include immagini, CSS, JavaScript lato client
 */
app.use(express.static(path.join(__dirname, 'public')));
// Support legacy and shorthand image URLs: serve /images/* from public/assets/images
// This makes URLs like /images/default-news.jpg resolve to src/public/assets/images/default-news.jpg
app.use('/images', express.static(path.join(__dirname, 'public', 'assets', 'images')));

// ==================== CONFIGURAZIONE SESSIONI ====================

/**
 * Configura sessione Express
 * - secret: chiave per firmare il cookie di sessione
 * - resave: non salva sessione se non modificata
 * - saveUninitialized: salva anche sessioni nuove vuote
 */
app.use(session({
   secret: "your-secret-key",
   resave: false,
    saveUninitialized: true
}));

/**
 * Inizializza Passport per autenticazione
 * Gestisce login/logout e persistenza utente in sessione
 */
app.use(passport.initialize());
app.use(passport.session());

// Normalize req.user so routes can rely on consistent role fields
const normalizeUser = require('./core/middlewares/normalizeUser');
app.use(normalizeUser);

// ==================== MIDDLEWARE AUTENTICAZIONE ====================

/**
 * Middleware JWT per funzionalità "Ricordami"
 * Ripristina automaticamente la sessione da token JWT se presente
 */
const { jwtAuth } = require('./core/middlewares/jwt');
app.use(jwtAuth);

// ==================== MIDDLEWARE GESTIONE AUTOMATICA ====================

/**
 * DAO per prenotazioni (usato per controlli automatici)
 */
const daoPrenotazione = require('./features/prenotazioni/services/dao-prenotazione');

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
app.use(async function(req, res, next) {
  const now = Date.now();
  
  // Esegui il controllo solo una volta ogni 5 minuti
  if (!lastAutoCheck || (now - lastAutoCheck) > 5 * 60 * 1000) {
    lastAutoCheck = now;
    
    // Esegui in background senza bloccare la richiesta corrente
    setImmediate(async () => {
      try {
        // 1. Marca come scadute le prenotazioni passate
        await daoPrenotazione.checkAndUpdateScadute();
        
        // 2. Accetta automaticamente prenotazioni in attesa da più di 3 giorni
        await daoPrenotazione.autoAcceptPendingBookings();
        
        // 3. Verifica e riattiva sospensioni scadute
        await userDao.verificaSospensioniScadute();
      } catch (error) {
        console.error('[AUTO-CHECK] Errore durante il controllo automatico:', error);
      }
    });
  }
  next();
});

// ==================== MIDDLEWARE VARIABILI GLOBALI ====================

/**
 * Middleware per impostare variabili globali nei template EJS
 * Rende disponibili in tutte le views:
 * - isLogged: boolean se l'utente è autenticato
 * - user: oggetto utente corrente (o null)
 * - currentPath: percorso URL corrente
 * - imageUrl: URL immagine profilo dell'utente
 */
app.use(async function(req, res, next) {
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
      console.error('Errore nel recupero immagine profilo:', error);
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
app.use('/', routes);                             // Homepage e pagine generiche
// Debug endpoint: collect client-side computed styles for navbar (development only)
app.post('/__debug-navbar', express.json(), (req, res) => {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log('[NAVBAR_DEBUG]', JSON.stringify(req.body, null, 2));
    }
  } catch (e) {
    console.error('[NAVBAR_DEBUG] Error logging debug info', e);
  }
  res.sendStatus(200);
});

app.use('/', routesSitemap);                      // Sitemap dinamica
app.use('/', routesPush);                         // Web Push Notifications
app.use('/', routesNotizie);                      // Gestione notizie
app.use('/', routesEventi);                       // Gestione eventi
app.use('/', routesRegistrazione);                // Login e registrazione
app.use('/', routesSession);                      // Gestione sessioni
app.use('/', routesRecensioni);                   // Sistema recensioni
app.use('/', routesSendEmail);                    // Invio email
app.use('/', routesSquadre);                      // Gestione squadre
app.use('/', routesGalleria);                     // Galleria immagini
app.use('/prenotazione', routesPrenotazione);     // Sistema prenotazioni
app.use('/', routesAdmin);                        // Pannello amministrazione
app.use('/campionato', routesCampionati);         // Gestione campionati
app.use('/users', routesUsers);                   // Profili utenti

// ==================== GESTIONE FILE CARICATI ====================

/**
 * Determina il percorso degli upload in base all'ambiente
 * Railway: /data/uploads (volume persistente)
 * Locale: src/public/uploads (sviluppo)
 */
const uploadsPath = process.env.RAILWAY_ENVIRONMENT 
  ? '/data/uploads' 
  : path.join(__dirname, 'public/uploads');

console.log('[APP] Serving uploads from:', uploadsPath);
console.log('[APP] RAILWAY_ENVIRONMENT:', process.env.RAILWAY_ENVIRONMENT);

/**
 * Serve file caricati dagli utenti al percorso pubblico '/uploads'
 */
app.use('/uploads', express.static(uploadsPath));

/**
 * Route legacy per compatibilità
 * Alcuni record DB o client vecchi potrebbero usare '/src/public/uploads/...'
 */
app.use('/src/public/uploads', express.static(uploadsPath));

// ==================== CONFIGURAZIONE TEMPLATE ENGINE ====================

/**
 * Configura EJS come motore di template
 */
app.set('view engine', 'ejs');

/**
 * Configura directory multiple per le views
 * Organizzate per feature per seguire la struttura modulare del progetto
 */
app.set('views', [
  path.join(__dirname, 'shared/views'),              // Views condivise
  path.join(__dirname, 'features/admin/views'),      // Admin panel
  path.join(__dirname, 'features/auth/views'),       // Login/registrazione
  path.join(__dirname, 'features/campionati/views'), // Campionati
  path.join(__dirname, 'features/eventi/views'),     // Eventi
  path.join(__dirname, 'features/galleria/views'),   // Galleria
  path.join(__dirname, 'features/notizie/views'),    // Notizie
  path.join(__dirname, 'features/prenotazioni/views'),// Prenotazioni
  path.join(__dirname, 'features/recensioni/views'), // Recensioni
  path.join(__dirname, 'features/squadre/views')     // Squadre
]);

// ==================== GESTIONE ERRORI ====================

/**
 * Gestione 404 - Pagina non trovata
 * Differenzia tra richieste API (JSON) e pagine web (HTML)
 */
app.use(function(req, res, next) {
  // Per richieste API, restituisci JSON
  if (req.headers.accept && req.headers.accept.includes('application/json')) {
    res.status(404).json({ error: 'Endpoint non trovato' });
  } else {
    // Per richieste web, mostra pagina di errore
    res.status(404);
    res.render('error', { message: 'Pagina non trovata', error: {} });
  }
});

/**
 * Fallback finale per route non gestite
 * Cattura qualsiasi richiesta che non sia stata gestita dai middleware precedenti
 */
app.use((req, res) => {
  res.statusCode = 404;
  res.end('Not Found');
});

// ==================== EXPORT ====================

module.exports = app;
