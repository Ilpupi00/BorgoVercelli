
'use strict';
const express = require('express');
const morgan = require('morgan');
const path = require('path');
const userDao = require('./dao/dao-user');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
const routes = require('./routes/index');
const routesNotizie = require('./routes/notizie');
const routesEventi = require('./routes/eventi');
const routesRegistrazione = require('./routes/login_register');
const routesSession = require('./routes/session');
const routesRecensioni = require('./routes/recensioni');
const routesSendEmail = require('./routes/email');
const routesSquadre = require('./routes/squadre');
const routesGalleria = require('./routes/galleria');
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
  res.redirect('/Homepage');
});

app.use(express.json());
app.use(morgan('tiny'));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

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
app.use('/prenotazione', routesPrenotazione);
app.use('/', routesAdmin);
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.get('/Homepage', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'), (err) => {
    if (err) {
      console.error('Error sending file:', err);
      res.status(500).send('Internal Server Error');
    }
  });
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  res.status(404);
  res.render('error', { message: 'Pagina non trovata', error: {} });
});

// error handler
app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});


module.exports = app;
