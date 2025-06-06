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

module.exports = router;