'use strict';

const express = require('express');
const router = express.Router();
const passport = require('passport');
const getLoggedUser = require('../../core/middlewares/getUser');
const { generateToken } = require('../../core/middlewares/jwt');

// Login
router.post('/session', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) return next(err);
        if (!user) return res.status(401).json({ error: info?.message || 'Login fallito' });
        
        // Verifica stato utente prima del login
        if (user.isBannato && user.isBannato()) {
            return res.status(403).json({ 
                error: 'Account bannato', 
                type: 'banned',
                message: 'Il tuo account è stato bannato permanentemente. Contatta l\'amministrazione per maggiori informazioni.' 
            });
        }
        
        if (user.isSospeso && user.isSospeso()) {
            // Verifica se la sospensione è scaduta
            if (user.isSospensioneScaduta && user.isSospensioneScaduta()) {
                // Sospensione scaduta, riattiva automaticamente
                const userDao = require('../../features/users/services/dao-user');
                userDao.revocaSospensioneBan(user.id).catch(err => {
                    console.error('Errore riattivazione automatica:', err);
                });
                // Continua con il login
            } else {
                const moment = require('moment');
                const dataFine = user.data_fine_sospensione 
                    ? moment(user.data_fine_sospensione).format('DD/MM/YYYY HH:mm')
                    : 'Non specificato';
                return res.status(403).json({ 
                    error: 'Account sospeso', 
                    type: 'suspended',
                    message: `Il tuo account è temporaneamente sospeso fino al ${dataFine}. Motivo: ${user.motivo_sospensione || 'Non specificato'}`,
                    dataFine: dataFine,
                    motivo: user.motivo_sospensione || 'Non specificato'
                });
            }
        }
        
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
            
            return res.status(200).json({ 
                message: 'Login effettuato',
                showNotificationPrompt: true // Flag per mostrare richiesta notifiche
            });
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