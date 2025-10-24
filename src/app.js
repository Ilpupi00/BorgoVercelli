'use strict';

require('dotenv').config();

// Importa i moduli necessari
const express = require('express');
const morgan = require('morgan');
const path = require('path');
const methodOverride = require('method-override');
const userDao = require('./services/dao-user');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');

// Importa le route
const routes = require('./routes/index');
const routesNotizie = require('./routes/notizie');
const routesEventi = require('./routes/routes-eventi');
const routesRegistrazione = require('./routes/login_register');
const routesSession = require('./routes/session');
const routesRecensioni = require('./routes/recensioni');
const routesSendEmail = require('./routes/email');
const routesSquadre = require('./routes/squadre');
const routesGalleria = require('./routes/galleria');
const routesPrenotazione = require('./routes/prenotazione');
const routesAdmin = require('./routes/admin');
const routesCampionati = require('./routes/campionati');
const routesUsers = require('./routes/users');

//configura passport
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

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  userDao.getUserById(id).then(user => {
    done(null, user);
  });
});

// Crea l'app Express
const app = express();

// Redirect dalla root alla Homepage
app.get('/', (req, res) => {
  res.redirect('/homepage');
});

// Configura i middleware
app.use(express.json({ limit: '10mb' }));
app.use(morgan('tiny'));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(methodOverride(function (req, res) {
  if (req.body && typeof req.body === 'object' && '_method' in req.body) {
    var method = req.body._method;
    delete req.body._method;
    return method;
  }
}));

// Provide a favicon to avoid 404 in browser console. Serve the logo as PNG for favicon.
app.get('/favicon.ico', function(req, res) {
  console.log('Serving /favicon.ico -> Logo.png');
  res.sendFile(path.join(__dirname, 'public', 'images', 'Logo.png'));
});

// Serve i file statici dalla cartella "public"
app.use(express.static(path.join(__dirname, 'public')));

// Route specifica per eventi/all - ora gestita in routes-eventi.js


//// Configura sessione e passport
app.use(session({
   secret: "your-secret-key",
   resave: false,
    saveUninitialized: true
}));

// Inizializza Passport e la gestione della sessione
app.use(passport.initialize());
app.use(passport.session());

// Middleware to set global locals for templates
app.use(async function(req, res, next) {
  res.locals.isLogged = req.isAuthenticated ? req.isAuthenticated() : false;
  res.locals.user = req.user || null;
  res.locals.currentPath = req.path;
   if (req.isAuthenticated() && req.user) {
     try {
      const imageUrl = await userDao.getImmagineProfiloByUserId(req.user.id);
      res.locals.imageUrl = imageUrl;
     }catch (error) {
      console.error('Errore nel recupero immagine profilo:', error);
      res.locals.imageUrl = null;
     }
  }
  next();
});

// Usa le route importate
app.use('/', routes);
app.use('/', routesNotizie);
app.use('/', routesEventi);
app.use('/', routesRegistrazione);
app.use('/', routesSession);
app.use('/', routesRecensioni);
app.use('/', routesSendEmail);
app.use('/', routesSquadre);
app.use('/', routesGalleria);
app.use('/prenotazione', routesPrenotazione);
app.use('/', routesAdmin);
app.use('/campionato', routesCampionati);
app.use('/', routesUsers);

// Serve uploaded files at the canonical public path '/uploads'
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Legacy route (some DB records or older clients might reference '/src/public/uploads/...')
// Keep this as a compatibility shim so images already stored with that URL remain accessible.
app.use('/src/public/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Configura il motore di template EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  // Per richieste API, restituisci JSON
  if (req.headers.accept && req.headers.accept.includes('application/json')) {
    res.status(404).json({ error: 'Endpoint non trovato' });
  } else {
    res.status(404);
    res.render('error', { message: 'Pagina non trovata', error: {} });
  }
});



// gestisci tutte le altre route non trovate
app.use((req, res) => {
  res.statusCode = 404;
  res.end('Not Found');
});



module.exports = app;
