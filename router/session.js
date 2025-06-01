'use strict';

const express= require('express');
const router= express.Router();
const passoport= require('passport');

router.get('login',(req,res)=>{
    res.render('login', { message: req.flash('error') });
})

router.post('/session',function(req,res,next){
    passoport.authenticate('local', (err, user, info) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            return res.render('login', { message: info.message });
        }
        req.logIn(user, (err) => {
            if (err) {
                return next(err);
            }
            return res.redirect('/dashboard');
        });
    })(req, res, next);
});

router.delete('/session', (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).send({ error: 'Logout failed' });
        }
        res.redirect('/login');
    });
    res.end();
});

export default routerUsers;