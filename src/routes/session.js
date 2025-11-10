'use strict';

const express = require('express');
const router = express.Router();
const passport = require('passport');
const getLoggedUser = require('../middlewares/getUser');
const { generateToken } = require('../middlewares/jwt');

// Login
router.post('/session', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) return next(err);
        if (!user) return res.status(401).json({ error: info?.message || 'Login fallito' });
        req.logIn(user, (err) => {
            if (err) return next(err);
            
            // Se l'utente ha selezionato "Ricordami", genera un JWT token
            if (req.body.remember) {
                const token = generateToken(user);
                // Imposta il cookie con il token JWT (valido 7 giorni)
                res.cookie('rememberToken', token, {
                    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 giorni
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production', // Solo HTTPS in produzione
                    sameSite: 'lax'
                });
            }
            
            return res.status(200).json({ message: 'Login effettuato' });
        });
    })(req, res, next);
});

// Logout
router.delete('/session', (req, res, next) => {
    req.logout(function(err) {
        if (err) return next(err);
        // Rimuovi il token JWT se presente
        res.clearCookie('rememberToken');
        res.status(200).json({ message: 'Logout effettuato' });
    });
});

// Rotta GET per evitare "Cannot GET /session"
router.get('/session', (req, res) => {
    res.status(405).json({ error: 'Metodo non consentito' });
});

router.get('/session/user', getLoggedUser);

module.exports = router;