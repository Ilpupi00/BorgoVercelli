'use strict';

const express=require('express');
const morgan=require('morgan');
const path=require('path');
const userDao= require('./dao/dao-user');
const port=3000;
const passport = require('passport');
const LocalStrategy= require('passport-local').Strategy;
const session = require('express-session');
const router = require('./router/index');
const routerNotizie = require('./router/notizie');



passport.use(new LocalStrategy(
  function(email,password,done){
    userDao.getUser(email,password).then((user,check)=>{
      if (user) {
        return done(null, user);
      } 
      if(!check){
        return done(null,false,{"message":"Invalid credentials"});
      }
      else{
        return done(null,false,{"message":"User not found"});
      }
    });
  }
));

passport.serializeUser(function(user, done) {
  done(null,user.id);
});

passport.deserializeUser(function(id, done) {
  userDao.getUserById(id).then(user=>{
    done(null,user);
  });
});

const app=express();
app.use(express.json());
app.use(morgan('tiny'));

app.use(express.static('public', {
  setHeaders: (res, path) => {
    if (path.endsWith('.js') || path.endsWith('.mjs')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
  }
}));

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

app.use(passport.initialize());
app.use(passport.session());
app.use('/',router);
app.use('/Notizie', routerNotizie);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.get('/router/Homepage', (req,res) => {
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
