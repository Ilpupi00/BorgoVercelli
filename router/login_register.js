
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

// Nuova route per recuperare solo la foto profilo
router.get('/api/user/profile-pic', async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Non autenticato' });
    }
    try {
        const user = await userDao.getUserById(req.user.id);
        const profilePic = await userDao.getImmagineProfiloByUserId(user.id);
        res.json({ profilePic });
    } catch (err) {
        res.status(500).json({ error: 'Errore nel recupero della foto profilo' });
    }
});
// Route per aggiornare il profilo utente
router.put('/Me/update', async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ success: false, error: 'Non autenticato' });
        console.log("Errore nella update");
    }
    try {
        const { nome, cognome, email, telefono } = req.body;
        // Costruisci oggetto solo con i campi non vuoti
        const updateFields = {};
        if (nome && nome.trim() !== '') updateFields.nome = nome;
        if (cognome && cognome.trim() !== '') updateFields.cognome = cognome;
        if (email && email.trim() !== '') updateFields.email = email;
        if (telefono && telefono.trim() !== '') updateFields.telefono = telefono;
        if (Object.keys(updateFields).length === 0) {
            return res.json({ success: false, error: 'Nessun campo da aggiornare' });
        }
        await userDao.updateUser(req.user.id, updateFields);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Errore aggiornamento profilo' });
    }
});
module.exports = router;