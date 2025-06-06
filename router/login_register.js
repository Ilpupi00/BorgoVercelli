const express = require('express');
const router = express.Router();
const userDao = require('../dao/dao-user');

router.post('/', async (req, res) => {
    try {
        await userDao.createUser(req.body);
        res.status(201).json({ message: 'Registrazione avvenuta con successo' });
    } catch (err) {
        console.error('Errore durante la registrazione:', err); // <--- AGGIUNGI QUESTO
        res.status(400).json({ error: err.error || err.message || 'Errore durante la registrazione' });
    }
});

router.get('/Me', async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.redirect('/Login');
    }
    try {
        const user = await userDao.getUserById(req.user.id);
        res.render('profilo', {
            user,
            isLogged: true // oppure: req.isAuthenticated()
        });
    } catch (err) {
        res.status(500).render('error', { error: { message: 'Errore nel caricamento del profilo' } });
    }
});

router.delete('/Logout', (req, res, next) => {
    req.logout(function(err) {
        if (err) return next(err);
        req.session.destroy(() => {
            res.status(200).json({ message: 'Logout effettuato' });
        });
    });
});


module.exports = router;