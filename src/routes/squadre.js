'use strict';

const express = require('express');
const router = express.Router();
const daoSquadre = require('../services/dao-squadre');
const daoUser = require('../services/dao-user');
const daoDirigenti = require('../services/dao-dirigenti-squadre');
const daoGalleria = require('../services/dao-galleria');
const multer = require('multer');
const { isLoggedIn, isAdmin } = require('../middlewares/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'src/public/images/');
  },
  filename: (req, file, cb) => {
    const uniqueName = 'squadra_' + Date.now() + '_' + file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Solo file immagine sono permessi'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  }
});

router.get('/getsquadre', async (req, res) => {
    try {
        const squadre = await daoSquadre.getSquadre();
        res.json(squadre || []);
    } catch (err) {
        console.error('Errore nel recupero delle squadre:', err);
        res.status(500).json({ error: 'Errore nel caricamento delle squadre' });
    }
});

router.get('/getgiocatori', (req,res)=>{
    daoSquadre.getGiocatori()
        .then((giocatori) => {
            if (!giocatori || giocatori.length === 0) {
                console.warn('Nessun giocatore trovato');
                return res.status(404).json({ error: 'Nessun giocatore trovato' });
            }
            res.json({ giocatori: giocatori });
        })
        .catch((err) => {
            console.error('Errore nel recupero dei giocatori:', err);
            res.status(500).json({ error: 'Errore nel caricamento dei giocatori' });
        });
});

router.post('/createsquadra', isLoggedIn, isAdmin, async (req, res) => {
    try {
        const { nome, annoFondazione } = req.body;
        if (!nome || !annoFondazione) {
            return res.status(400).json({ error: 'Nome e anno fondazione sono obbligatori' });
        }
        const result = await daoSquadre.createSquadra(nome, parseInt(annoFondazione));
        res.status(201).json(result);
    } catch (err) {
        console.error('Errore creazione squadra:', err);
        res.status(500).json({ error: err.error || 'Errore durante la creazione della squadra' });
    }
});

router.put('/updatesquadra/:id', isLoggedIn, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, annoFondazione } = req.body;
        if (!nome || !annoFondazione) {
            return res.status(400).json({ error: 'Nome e anno fondazione sono obbligatori' });
        }
        await daoSquadre.updateSquadra(id, nome, parseInt(annoFondazione));
        res.json({ message: 'Squadra aggiornata con successo' });
    } catch (err) {
        console.error('Errore aggiornamento squadra:', err);
        res.status(500).json({ error: err.error || 'Errore durante l\'aggiornamento della squadra' });
    }
});

router.delete('/deletesquadra/:id', isLoggedIn, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await daoSquadre.deleteSquadra(id);
        res.json({ message: 'Squadra eliminata con successo' });
    } catch (err) {
        console.error('Errore eliminazione squadra:', err);
        res.status(500).json({ error: err.error || 'Errore durante l\'eliminazione della squadra' });
    }
});

router.put('/squadre/:id', isLoggedIn, isAdmin, upload.single('logo'), async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, anno } = req.body;
        if (!nome || !anno) {
            return res.status(400).json({ error: 'Nome e anno fondazione sono obbligatori' });
        }
        let id_immagine = null;
        if (req.file) {
            id_immagine = req.file.filename;
        }
        await daoSquadre.updateSquadra(id, nome, parseInt(anno), id_immagine);
        res.json({ success: true, message: 'Squadra aggiornata con successo' });
    } catch (err) {
        console.error('Errore aggiornamento squadra:', err);
        res.status(500).json({ error: err.error || 'Errore durante l\'aggiornamento della squadra' });
    }
});

router.delete('/squadre/:id', isLoggedIn, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await daoSquadre.deleteSquadra(id);
        res.json({ success: true, message: 'Squadra eliminata con successo' });
    } catch (err) {
        console.error('Errore eliminazione squadra:', err);
        res.status(500).json({ error: err.error || 'Errore durante l\'eliminazione della squadra' });
    }
});

router.get('/getsquadra/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const squadra = await daoSquadre.getSquadraById(id);
        res.json(squadra);
    } catch (err) {
        console.error('Errore recupero squadra:', err);
        res.status(500).json({ error: err.error || 'Errore durante il recupero della squadra' });
    }
});

router.get('/squadra/gestione/:id', isLoggedIn,async (req,res)=>{
    try{
        const squadra=await daoSquadre.getSquadraById(req.params.id);
        res.render('modifica_squadra',{
            isLogged: true,
            user: req.user,
            squadra:squadra
        });
    }catch(error){
        console.error('Errore nel caricamento della pagina modifica squadra:', error);
        res.render('modifica_squadra',{
            isLogged: true,
            user: req.user,
            error: 'Errore nel caricamento della pagina modifica squadra'
        });
        res.status(500).send('Internal Server Error, Server not responding');
    }
});

router.get('/squadre/gestione/:id', isLoggedIn,async (req,res)=>{
    try{
        const squadra=await daoSquadre.getSquadraById(req.params.id);
        res.render('modifica_squadra',{
            isLogged: true,
            user: req.user,
            squadra:squadra
        });
    }catch(error){
        console.error('Errore nel caricamento della pagina modifica squadra:', error);
        res.render('modifica_squadra',{
            isLogged: true,
            user: req.user,
            error: 'Errore nel caricamento della pagina modifica squadra'
        });
        res.status(500).send('Internal Server Error, Server not responding');
    }
});

router.post('/squadre/:id/dirigenti', isLoggedIn, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Email è obbligatoria' });
        }
        // Trova l'utente per email
        const daoUser = require('../services/dao-user');
        const user = await daoUser.getUserByEmail(email);
        if (!user) {
            return res.status(404).json({ error: 'Utente non trovato' });
        }
        // Aggiungi come dirigente
        await daoDirigenti.addDirigente({
            utente_id: user.id,
            squadra_id: id,
            ruolo: 'Dirigente'
        });
        res.json({ success: true, message: 'Dirigente aggiunto con successo' });
    } catch (err) {
        console.error('Errore aggiunta dirigente:', err);
        res.status(500).json({ error: err.error || 'Errore durante l\'aggiunta del dirigente' });
    }
});

router.delete('/squadre/:id/dirigenti/:managerId', isLoggedIn, isAdmin, async (req, res) => {
    try {
        const { managerId } = req.params;
        await daoDirigenti.removeDirigente(managerId);
        res.json({ success: true, message: 'Dirigente rimosso con successo' });
    } catch (err) {
        console.error('Errore rimozione dirigente:', err);
        res.status(500).json({ error: err.error || 'Errore durante la rimozione del dirigente' });
    }
});

router.post('/squadre/:id/giocatori', isLoggedIn, isAdmin, upload.single('foto'), async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, cognome, ruolo, numero_maglia, data_nascita, piede_preferito, nazionalita } = req.body;

        if (!nome || !cognome) {
            return res.status(400).json({ error: 'Nome e cognome sono obbligatori' });
        }

        let immagini_id = null;
        if (req.file) {
            immagini_id = req.file.filename;
        }

        const giocatoreData = {
            nome,
            cognome,
            ruolo,
            numero_maglia: numero_maglia ? parseInt(numero_maglia) : null,
            data_nascita,
            piede_preferito,
            nazionalita,
            squadra_id: parseInt(id),
            immagini_id
        };

        await daoSquadre.createGiocatore(giocatoreData);
        res.json({ success: true, message: 'Giocatore aggiunto con successo' });
    } catch (err) {
        console.error('Errore aggiunta giocatore:', err);
        res.status(500).json({ error: err.error || 'Errore durante l\'aggiunta del giocatore' });
    }
});

router.put('/squadre/:id/giocatori/:playerId', isLoggedIn, isAdmin, upload.single('foto'), async (req, res) => {
    try {
        const { playerId } = req.params;
        const { nome, cognome, ruolo, numero_maglia, data_nascita, piede_preferito, nazionalita } = req.body;

        if (!nome || !cognome) {
            return res.status(400).json({ error: 'Nome e cognome sono obbligatori' });
        }

        let immagini_id = null;
        if (req.file) {
            immagini_id = req.file.filename;
        }

        const giocatoreData = {
            nome,
            cognome,
            ruolo,
            numero_maglia: numero_maglia ? parseInt(numero_maglia) : null,
            data_nascita,
            piede_preferito,
            nazionalita,
            immagini_id
        };

        await daoSquadre.updateGiocatore(playerId, giocatoreData);
        res.json({ success: true, message: 'Giocatore aggiornato con successo' });
    } catch (err) {
        console.error('Errore aggiornamento giocatore:', err);
        res.status(500).json({ error: err.error || 'Errore durante l\'aggiornamento del giocatore' });
    }
});

router.delete('/squadre/:id/giocatori/:playerId', isLoggedIn, isAdmin, async (req, res) => {
    try {
        const { playerId } = req.params;
        await daoSquadre.deleteGiocatore(playerId);
        res.json({ success: true, message: 'Giocatore rimosso con successo' });
    } catch (err) {
        console.error('Errore rimozione giocatore:', err);
        res.status(500).json({ error: err.error || 'Errore durante la rimozione del giocatore' });
    }
});

// API per ricerca utenti (per autocomplete dirigenti)
router.get('/api/search-users', isLoggedIn, isAdmin, async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.length < 2) {
            return res.json({ users: [] });
        }

        const users = await daoUser.searchUsers(q);
        res.json({ users: users || [] });
    } catch (err) {
        console.error('Errore ricerca utenti:', err);
        res.status(500).json({ error: 'Errore durante la ricerca degli utenti' });
    }
});

module.exports=router;