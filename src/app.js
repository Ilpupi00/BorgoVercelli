
'use strict';

const express = require('express');
const morgan = require('morgan');
const path = require('path');
const methodOverride = require('method-override');
const userDao = require('./services/dao-user');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
const routes = require('./routes/index');
const routesNotizie = require('./routes/notizie');
const routesEventi = require('./routes/routes-eventi');
const routesRegistrazione = require('./routes/login_register');
const routesSession = require('./routes/session');
const routesRecensioni = require('./routes/recensioni');
const routesSendEmail = require('./routes/email');
const routesSquadre = require('./routes/squadre');
const routesGalleria = require('./routes/galleria');
console.log('routesGalleria loaded:', typeof routesGalleria);
const routesPrenotazione = require('./routes/prenotazione');
const routesAdmin = require('./routes/admin');

// passport configuration
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

const app = express();

// Redirect dalla root alla Homepage
app.get('/', (req, res) => {
  res.redirect('/homepage');
});

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
app.use(express.static(path.join(__dirname, 'public')));

// Route specifica per eventi/all - ora gestita in routes-eventi.js

const isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).send({ error: 'Unauthorized' });
}

app.use(session({
  secret: "your-secret-key",
  resave: false,
  saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

// Middleware to set global locals for templates
app.use(async function(req, res, next) {
  res.locals.isLogged = req.isAuthenticated();
  res.locals.currentPath = req.path;
  if (req.isAuthenticated() && req.user) {
    try {
      const imageUrl = await userDao.getImmagineProfiloByUserId(req.user.id);
      res.locals.imageUrl = imageUrl;
    } catch (error) {
      console.error('Errore nel recupero immagine profilo:', error);
      res.locals.imageUrl = null;
    }
  } else {
    res.locals.imageUrl = null;
  }
  next();
});
app.get('/eventi', async (req, res) => {
  try {
    const dao = require('./services/dao-eventi');
    const eventi = await dao.getEventi();
    // Filtra solo gli eventi pubblicati
    const eventiPubblicati = eventi.filter(evento => evento.pubblicato === 1 || evento.pubblicato === true);
    res.render('eventi', {
      title: 'Eventi - Asd BorgoVercelli 2022',
      eventi: eventiPubblicati || []
    });
  } catch (error) {
    console.error('Errore nel caricamento degli eventi:', error);
    res.render('eventi', {
      title: 'Eventi - Asd BorgoVercelli 2022',
      eventi: []
    });
  }
});

// Routing
app.use('/', routes);
app.use('/', routesNotizie);
app.use('/', routesEventi);
app.use('/', routesRegistrazione);
app.use('/', routesSession);
app.use('/', routesRecensioni);
app.use('/', routesSendEmail);
app.use('/', routesSquadre);
app.use('/', routesGalleria);
app.use('/', routesPrenotazione);
app.use('/', routesAdmin);

app.use('/src/public/uploads', express.static(path.join(__dirname, 'public/uploads')));

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

// catch 404 and forward to error handler
// app.use(function(req, res, next) {
//   const err = new Error('Endpoint non trovato');
//   err.status = 404;
//   next(err);
// });

app.use((req, res) => {
  res.statusCode = 404;
  res.end('Not Found');
});

// error handler
// app.use(function(err, req, res, next) {
//   // Imposta valori di default per le variabili locali
//   res.locals.isLogged = req.isAuthenticated ? req.isAuthenticated() : false;
//   res.locals.currentPath = req.path || '/';
//   res.locals.imageUrl = req.isAuthenticated && req.user ? req.user.immagine_profilo : null;

//   res.locals.message = err.message;
//   res.locals.error = req.app.get('env') === 'development' ? err : {};
//   res.status(err.status || 500);
//   res.render('error');
// });


module.exports = app;
