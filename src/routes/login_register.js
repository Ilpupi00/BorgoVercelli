

const express = require('express');
const router = express.Router();
const userDao = require('../services/dao-user');
const dirigenteDao = require('../services/dao-dirigenti-squadre');
const daoNotizie = require('../services/dao-notizie');
const daoEventi = require('../services/dao-eventi');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { isLoggedIn } = require('../middlewares/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'src/public/uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = 'user_' + req.user.id + '_' + Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

router.post('/registrazione', async (req, res) => {
    try {
        await userDao.createUser(req.body);
        res.status(201).json({ message: 'Registrazione avvenuta con successo' });
    } catch (err) {
        console.error('Errore durante la registrazione:', err); 
        res.status(400).json({ error: err.error || err.message || 'Errore durante la registrazione' });
    }
});

router.get('/me', async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.redirect('/login');
    }
    if (req.user.tipo_utente_id === 1) {
        return res.redirect('/admin');
    }
    try {
        const user = await userDao.getUserById(req.user.id);
        const imageUrl = await userDao.getImmagineProfiloByUserId(user.id);
        // const giocatore = await userDao.getGiocatoreByUserId(user.id);
        const giocatore = null; // Temporaneamente disabilitato per incompatibilità schema DB
        let dirigente = null;
        try {
            dirigente = await dirigenteDao.getDirigenteByUserId(user.id);
        } catch (dirErr) {
            console.error('Errore recupero dirigente:', dirErr);
        }

        // Recupera statistiche e attività recenti
        let stats = { prenotazioni_totali: 0, recensioni_totali: 0, prenotazioni_mese: 0, recensioni_mese: 0 };
        let activity = { prenotazioni: [], recensioni: [] };
        
        try {
            stats = await userDao.getUserStats(user.id) || stats;
        } catch (statsErr) {
            console.error('Errore recupero statistiche:', statsErr);
        }
        
        try {
            activity = await userDao.getUserRecentActivity(user.id) || activity;
        } catch (activityErr) {
            console.error('Errore recupero attività:', activityErr);
        }

        res.render('profilo', {
            user,
            imageUrl,
            giocatore,
            dirigente,
            stats,
            activity,
            isLogged: true
        });
    } catch (err) {
        console.error('Errore nel caricamento del profilo:', err);
        res.status(500).render('error', { error: { message: 'Errore nel caricamento del profilo' } });
    }
});

router.get('/profilo', async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.redirect('/login');
    }
    if (req.user.tipo_utente_id === 1) {
        return res.redirect('/admin');
    }
    try {
        const user = await userDao.getUserById(req.user.id);
        const imageUrl = await userDao.getImmagineProfiloByUserId(user.id);
        console.log('imageUrl length:', imageUrl ? imageUrl.length : 'null');
        console.log('imageUrl starts with:', imageUrl ? imageUrl.substring(0, 50) : 'null');
        // const giocatore = await userDao.getGiocatoreByUserId(user.id);
        const giocatore = null; // Temporaneamente disabilitato per incompatibilità schema DB
        let dirigente = null;
        try {
            dirigente = await dirigenteDao.getDirigenteByUserId(user.id);
        } catch (dirErr) {
            console.error('Errore recupero dirigente:', dirErr);
        }

        // Recupera statistiche e attività recenti
        let stats = { prenotazioni_totali: 0, recensioni_totali: 0, prenotazioni_mese: 0, recensioni_mese: 0 };
        let activity = { prenotazioni: [], recensioni: [] };
        
        try {
            stats = await userDao.getUserStats(user.id) || stats;
        } catch (statsErr) {
            console.error('Errore recupero statistiche:', statsErr);
        }
        
        try {
            activity = await userDao.getUserRecentActivity(user.id) || activity;
        } catch (activityErr) {
            console.error('Errore recupero attività:', activityErr);
        }

        // Recupera notizie ed eventi personali per dirigenti e admin
        let notiziePersonali = [];
        let eventiPersonali = [];
        if (dirigente || user.isAdmin) {
            try {
                notiziePersonali = await daoNotizie.getNotiziePersonali(user.id);
            } catch (err) {
                console.error('Errore recupero notizie personali:', err);
            }
            try {
                eventiPersonali = await daoEventi.getEventiPersonali(user.id);
            } catch (err) {
                console.error('Errore recupero eventi personali:', err);
            }
        }

        res.render('profilo', {
            user,
            imageUrl,
            giocatore,
            dirigente,
            stats,
            activity,
            notiziePersonali,
            eventiPersonali,
            isLogged: true
        });
    } catch (err) {
        console.error('Errore nel caricamento del profilo:', err);
        res.status(500).render('error', { error: { message: 'Errore nel caricamento del profilo' } });
    }
});

router.get('/Logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            console.error('Errore durante il logout:', err);
            return res.status(500).json({ error: 'Errore durante il logout' });
        }
        // Rimuovi il token JWT se presente
        res.clearCookie('rememberToken');
        req.session.destroy((err) => {
            if (err) {
                console.error('Errore nella distruzione della sessione:', err);
                return res.status(500).json({ error: 'Errore durante il logout' });
            }
            res.redirect('/homepage');
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
// Route per aggiornare il profilo utente (alias per /update)
router.put('/profilo', async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ success: false, error: 'Non autenticato' });
    }
    try {
        // Aggiorna solo i dati profilo
        let updateFields = {};
        if (req.body.nome && req.body.nome.trim() !== '') updateFields.nome = req.body.nome;
        if (req.body.cognome && req.body.cognome.trim() !== '') updateFields.cognome = req.body.cognome;
        if (req.body.email && req.body.email.trim() !== '') updateFields.email = req.body.email;
        if (req.body.telefono !== undefined) updateFields.telefono = req.body.telefono || '';
        if (req.body.ruolo_preferito !== undefined) updateFields.ruolo_preferito = req.body.ruolo_preferito || null;
        if (req.body.piede_preferito !== undefined) updateFields.piede_preferito = req.body.piede_preferito || null;
        if (Object.keys(updateFields).length > 0) {
            await userDao.updateUser(req.user.id, updateFields);
        }
        res.json({ success: true });
    } catch (err) {
        console.error('Errore aggiornamento profilo:', err);
        res.status(500).json({ success: false, error: err.message || err });
    }
});

// Route dedicata solo alla modifica della foto profilo
router.post('/update-profile-pic', isLoggedIn, upload.single('profilePic'), async (req, res) => {
    console.log('Route /update-profile-pic chiamata');
    console.log('User autenticato:', req.isAuthenticated());
    console.log('File ricevuto:', req.file ? req.file.filename : 'nessun file');
    
    if (!req.isAuthenticated()) {
        return res.status(401).json({ success: false, error: 'Non autenticato' });
    }
    
    // Validazione file
    if (!req.file) {
        console.log('Nessun file ricevuto');
        return res.status(400).json({ success: false, error: 'File non valido o danneggiato.' });
    }
    
    // Controlla dimensione file (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (req.file.size > maxSize) {
        return res.status(400).json({ success: false, error: 'File troppo grande. Massimo 5MB.' });
    }
    
    // Controlla tipo MIME
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(req.file.mimetype)) {
        return res.status(400).json({ success: false, error: 'Tipo file non supportato. Usa JPEG, PNG, GIF o WebP.' });
    }
    
    try {
        const filePath = 'src/public/uploads/' + req.file.filename;
        console.log('File path:', filePath);
        
        await userDao.updateProfilePicture(req.user.id, filePath);
        console.log('Foto profilo aggiornata nel database');
        
        res.json({ success: true, imageUrl: filePath });
    } catch (err) {
        console.error('Errore aggiornamento foto profilo:', err);
        res.status(500).json({ success: false, error: 'Errore interno del server' });
    }
});

// Route per cambio password
router.post('/api/user/change-password', async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Non autenticato' });
    }

    const { currentPassword, newPassword } = req.body;

    // Validazione input
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Password attuale e nuova password sono obbligatorie' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ error: 'La nuova password deve essere di almeno 6 caratteri' });
    }

    try {
        await userDao.changePassword(req.user.id, currentPassword, newPassword);
        res.json({ message: 'Password cambiata con successo' });
    } catch (err) {
        console.error('Errore cambio password:', err);
        res.status(400).json({ error: err.error || err.message || 'Errore durante il cambio password' });
    }
});

// Gestore errori per multer
router.use((err, req, res, next) => {
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, error: 'File troppo grande. Max 10MB.' });
    }
    if (err.message === 'Solo immagini!') {
        return res.status(400).json({ success: false, error: 'Solo immagini! (JPEG, PNG, GIF, BMP, WebP, HEIC)' });
    }
    if (err.message.includes('Unexpected end of form')) {
        return res.status(400).json({ success: false, error: 'File danneggiato o incompleto.' });
    }
    console.error('Errore non gestito:', err);
    res.status(500).json({ success: false, error: 'Errore interno del server' });
});

router.get('/forgot-password', (req, res) => {
    res.render('forgot-password');
});

router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ error: 'Email richiesta' });
    }
    try {
        // Verifica se l'utente esiste
        const user = await userDao.getUserByEmail(email);
        if (!user) {
            // Messaggio generico per sicurezza
            return res.status(200).json({ message: 'Se l\'email è registrata, riceverai un link di reset.' });
        }
        // Genera token di reset
        const resetToken = require('crypto').randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 ora
        // Salva token nel DB (aggiungeremo colonna reset_token e reset_expires)
        await userDao.saveResetToken(user.id, resetToken, expiresAt);
        // Invia email
        const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
        const resetLink = `${baseUrl}/reset-password/${resetToken}`;
        await require('../services/email-service').sendResetEmail(user.email, resetLink);
        res.status(200).json({ message: 'Se l\'email è registrata, riceverai un link di reset.' });
    } catch (err) {
        console.error('Errore forgot password:', err);
        res.status(500).json({ error: 'Errore interno del server' });
    }
});

router.get('/reset-success', (req, res) => {
    res.render('reset-success');
});

router.get('/reset-password/:token', async (req, res) => {
    const { token } = req.params;
    console.log('Accessing reset-password with token:', token);
    try {
        const user = await userDao.getUserByResetToken(token);
        if (!user) {
            console.log('Token invalid or expired');
            return res.render('reset-password', { tokenExpired: true });
        }
        console.log('Token valid, rendering form');
        res.render('reset-password', { tokenExpired: false });
    } catch (err) {
        console.error('Errore verifica token:', err);
        res.render('reset-password', { tokenExpired: true });
    }
});

router.post('/reset-password', async (req, res) => {
    const { token, password } = req.body;
    console.log('Reset password request:', { token: token ? 'present' : 'missing', password: password ? 'present' : 'missing' });
    if (!token || !password) {
        console.log('Missing token or password');
        return res.status(400).json({ error: 'Token e password richiesti' });
    }
    try {
        const user = await userDao.getUserByResetToken(token);
        if (!user) {
            console.log('Invalid or expired token');
            return res.status(400).json({ error: 'Token non valido o scaduto' });
        }
        // Hash della nuova password
        const bcrypt = require('bcrypt');
        const hash = await bcrypt.hash(password, 10);
        await userDao.updatePassword(user.id, hash);
        // Invalida il token dopo l'uso
        await userDao.invalidateResetToken(user.id);
        console.log('Password reset successful for user:', user.id);
        // Redirect alla pagina di successo invece di JSON
        res.redirect('/reset-success');
    } catch (err) {
        console.error('Errore reset password:', err);
        res.status(500).json({ error: 'Errore interno del server' });
    }
});

module.exports = router;