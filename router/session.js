'use strict';

const express = require('express');
const router = express.Router();
const passport = require('passport');

// Login
router.post('/session', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) return next(err);
        if (!user) return res.status(401).json({ error: info?.message || 'Login fallito' });
        req.logIn(user, (err) => {
            if (err) return next(err);
            return res.status(200).json({ message: 'Login effettuato' });
        });
    })(req, res, next);
});

// Logout
router.delete('/session', (req, res, next) => {
    req.logout(function(err) {
        if (err) return next(err);
        res.status(200).json({ message: 'Logout effettuato' });
    });
});

// Rotta GET per evitare "Cannot GET /session"
router.get('/session', (req, res) => {
    res.status(405).json({ error: 'Metodo non consentito' });
});




module.exports = router;