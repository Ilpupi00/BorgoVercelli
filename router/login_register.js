const express = require('express');
const router = express.Router();
const userDao = require('../dao/dao-user');

router.post('/registrazione', async (req, res) => {
    try {
        await userDao.createUser(req.body);
        res.status(201).json({ message: 'Registrazione avvenuta con successo' });
    } catch (err) {
        console.error('Errore durante la registrazione:', err); 
        res.status(400).json({ error: err.error || err.message || 'Errore durante la registrazione' });
    }
});

router.get('/Me', async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.redirect('/Login');
    }
    try {
        const user = await userDao.getUserById(req.user.id);
        const imageUrl = await userDao.getImmagineProfiloByUserId(user.id);
        res.render('profilo', {
            user,
            imageUrl,
            isLogged: true
        });
    } catch (err) {
        res.status(500).render('error', { error: { message: 'Errore nel caricamento del profilo' } });
    }
});

router.get('/Logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            console.error('Errore durante il logout:', err);
            return res.status(500).json({ error: 'Errore durante il logout' });
        }
        req.session.destroy((err) => {
            if (err) {
                console.error('Errore nella distruzione della sessione:', err);
                return res.status(500).json({ error: 'Errore durante il logout' });
            }
            res.redirect('/Homepage');
        });
    });
});


module.exports = router;