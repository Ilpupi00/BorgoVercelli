'use strict';
const express = require('express');
const router = express.Router();
const path = require('path');
const { isLoggedIn, isAdmin } = require('../middleware/auth');
const userDao = require('../dao/dao-user');
const notizieDao = require('../dao/dao-notizie');
const eventiDao = require('../dao/dao-eventi');
const galleriDao = require('../dao/dao-galleria');
const squadreDao = require('../dao/dao-squadre');
const recensioniDao = require('../dao/dao-recensioni');
const prenotazioniDao = require('../dao/dao-prenotazione');

router.get('/admin', isLoggedIn, isAdmin, async (req, res) => {
    try {
        const imageUrl = await userDao.getImmagineProfiloByUserId(req.user.id);
        res.render('Admin/admin.ejs', { user: req.user, imageUrl });
    } catch (err) {
        console.error('Errore nel caricamento della pagina admin:', err);
        res.status(500).send('Errore interno del server');
    }
});

router.get('/admin/notizie', isLoggedIn, isAdmin, async (req, res) => {
    try {
        const notizie = await notizieDao.getNotizie();
        res.render('Admin/Contenuti/Gestione_Notizie.ejs', { user: req.user, notizie });
    } catch (err) {
        console.error('Errore nel caricamento delle notizie:', err);
        res.status(500).send('Errore interno del server');
    }
});

router.get('/admin/eventi', isLoggedIn, isAdmin, async (req, res) => {
    try {
        const eventi = await eventiDao.getEventi();
        res.render('Admin/Contenuti/Gestione_Eventi.ejs', { user: req.user, eventi });
    } catch (err) {
        console.error('Errore nel caricamento degli eventi:', err);
        res.status(500).send('Errore interno del server');
    }
});


router.get('/admin/galleria', isLoggedIn, isAdmin, async (req, res) => {
    try{
        const immagini = await galleriDao.getImmagini();
        res.render('Admin/Contenuti/Gestione_Galleria.ejs', { user: req.user, immagini });
    } catch (err) {
        console.error('Errore nel caricamento della galleria:', err);
        res.status(500).send('Errore interno del server');
    }
});

router.get('/admin/squadre', isLoggedIn, isAdmin, async (req, res) => {
    try{
        const squadre = await squadreDao.getSquadre();
        res.render('Admin/Contenuti/Gestione_Squadre.ejs', { user: req.user, squadre });
    } catch (err) {
        console.error('Errore nel caricamento delle squadre:', err);
        res.status(500).send('Errore interno del server');
    }
});

router.get('/admin/utenti', isLoggedIn, isAdmin, async (req, res) => {
    try{
        const utenti = await userDao.getAllUsers();
        res.render('Admin/Contenuti/Gestore_Utenti.ejs', { user: req.user, utenti });
    } catch (err) {
        console.error('Errore nel caricamento degli utenti:', err);
        res.status(500).send('Errore interno del server');
    }
});

router.get('/admin/recensioni', isLoggedIn, isAdmin, async (req, res) => {
    try{
        const recensioni = await recensioniDao.getRecensioni();
        res.render('Admin/Contenuti/Gestione_Recensioni.ejs', { user: req.user, recensioni });
    } catch (err) {
        console.error('Errore nel caricamento delle recensioni:', err);
        res.status(500).send('Errore interno del server');
    }
});

router.get('/admin/prenotazioni', isLoggedIn, isAdmin, async (req, res) => {
    try{
        const prenotazioni = await prenotazioniDao.getAllPrenotazioni();
        res.render('Admin/Contenuti/Gestione_Prenotazione.ejs', { user: req.user, prenotazioni });
    } catch (err) {
        console.error('Errore nel caricamento delle prenotazioni:', err);
        res.status(500).send('Errore interno del server');
    }
});

router.get('/admin/statistiche', isLoggedIn, isAdmin, async (req, res) => {
    try{
        // Per ora passiamo dati vuoti, da implementare la logica per le statistiche
        const statistiche = {};
        res.render('Admin/Contenuti/Statistiche.ejs', { user: req.user, statistiche });
    } catch (err) {
        console.error('Errore nel caricamento delle statistiche:', err);
        res.status(500).send('Errore interno del server');
    }
});

module.exports = router;
