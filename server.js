
'use strict';
const express=require('express');
const morgan=require('morgan');
const path=require('path');
const userDao= require('./dao/dao-user');
const port = process.env.PORT || 3001; // Fixed port configuration
const passport = require('passport');
const LocalStrategy= require('passport-local').Strategy;
const session = require('express-session');
const router = require('./router/index');
const routerNotizie = require('./router/notizie');
const routerRegistrazione = require('./router/login_register');
const routerSession = require('./router/session');
const routerRecensioni = require('./router/recensioni');
const routerSendEmail = require('./router/email');
const routerSquadre = require('./router/squadre');

//passport configuration
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

// Serializzazione e deserializzazione dell'utente
passport.serializeUser(function(user, done) {
  done(null,user.id);
});

passport.deserializeUser(function(id, done) {
  userDao.getUserById(id).then(user=>{
    done(null,user);
  });
});

//express app setup
const app=express();

// Redirect dalla root alla Homepage
app.get('/', (req, res) => {
  res.redirect('/Homepage');
});

app.use(express.json());
app.use(morgan('tiny'));

// Middleware per il parsing del corpo delle richieste
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

const isLoggedIn=(req,res,next)=>{
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).send({ error: 'Unauthorized' });
}

app.use(session({
  secret:"your-secret-key",
  resave:false,
  saveUninitialized:true
}));

//passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Redirect dalla root alla Homepage
app.get('/', (req, res) => {
  res.redirect('/Homepage');
});
//tutti i file per il routing sono stati spostati in una cartella chiamata router
app.use('/',router);
app.use('/', routerNotizie);
app.use('/',routerRegistrazione);
app.use('/',routerSession);
app.use('/',routerRecensioni);
app.use('/', routerSendEmail);
app.use('/', routerSquadre);
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.get('/Homepage', (req,res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'), (err) => {
    if (err) {
      console.error('Error sending file:', err);
      res.status(500).send('Internal Server Error');
    }
  });
});

app.listen(port,()=>{
    console.log(`Server is running on http://localhost:${port}`);
});

