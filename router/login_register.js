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

router.get('/me', async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Utente non autenticato' });
    }
    try {
        const user = await userDao.getUserById(req.user.id);
        res.status(200).json(user);
    } catch (err) {
        console.error('Errore durante il recupero dell\'utente:', err); // <--- AGGIUNGI QUESTO
        res.status(400).json({ error: err.error || err.message || 'Errore durante il recupero dell\'utente' });
    }
});

module.exports = router;