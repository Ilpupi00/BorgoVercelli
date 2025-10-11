'use strict';
const express = require('express');
const router = express.Router();
const path = require('path');
const { isLoggedIn } = require('../middlewares/auth');
const daoNotizie = require('../services/dao-notizie');
const daoEventi = require('../services/dao-eventi');
const daoRecensioni = require('../services/dao-recensioni');
const daoMembriSocieta = require('../services/dao-membri-societa');

router.get('/homepage', async (req, res) => {
    try {
        const notizie = await daoNotizie.getNotizie() || [];
        const eventi = await daoEventi.getEventi() || [];
        const recensioni = await daoRecensioni.getRecensioni() || [];
        const isLoggedIn = req.isAuthenticated && req.isAuthenticated();
        res.render('homepage', {
            notizie: notizie,
            eventi: eventi,
            recensioni: recensioni,
            isLoggedIn: isLoggedIn
        });
    } catch (error) {
        console.error('Errore nel caricamento della homepage:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/campionato',(req,res)=>{
    try {
        // Dati fittizi per la classifica, da sostituire con dati reali dal DB
        const classifica = [
            { posizione: 1, nome: 'Squadra 1', punti: 80, classe: 'table-success' },
            { posizione: 2, nome: 'Squadra 2', punti: 72, classe: 'table-secondary' },
            { posizione: 3, nome: 'Squadra 3', punti: 69, classe: 'table-secondary' },
            { posizione: 4, nome: 'Squadra 4', punti: 68, classe: 'table-secondary' },
            { posizione: 5, nome: 'Squadra 5', punti: 65, classe: 'table-secondary' },
            { posizione: 6, nome: 'Squadra 6', punti: 60, classe: '' },
            { posizione: 7, nome: 'Squadra 7', punti: 58, classe: '' },
            { posizione: 8, nome: 'Squadra 8', punti: 55, classe: '' },
            { posizione: 9, nome: 'Squadra 9', punti: 50, classe: '' },
            { posizione: 10, nome: 'Squadra 10', punti: 42, classe: '' },
            { posizione: 11, nome: 'Squadra 11', punti: 37, classe: '' },
            { posizione: 12, nome: 'Squadra 12', punti: 36, classe: 'table-warning' },
            { posizione: 13, nome: 'Squadra 13', punti: 29, classe: 'table-warning' },
            { posizione: 14, nome: 'Squadra 14', punti: 20, classe: 'table-warning' },
            { posizione: 15, nome: 'Squadra 15', punti: 16, classe: 'table-warning' },
            { posizione: 16, nome: 'Squadra 16', punti: 11, classe: 'table-danger' }
        ];
        const isLoggedIn = req.isAuthenticated && req.isAuthenticated();
        res.render('campionato', { classifica, isLoggedIn });
    } catch (error) {
        console.error('Errore nel caricamento del campionato:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/squadre', async (req, res) => {
    try {
        const squadre = await require('../services/dao-squadre').getSquadre() || [];
        const isLoggedIn = req.isAuthenticated && req.isAuthenticated();
        res.render('squadre', {
            squadre: squadre,
            isLoggedIn: isLoggedIn
        });
    } catch (error) {
        console.error('Errore nel caricamento delle squadre:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/galleria', async (req, res) => {
    try {
        const immagini = await require('../services/dao-galleria').getImmagini() || [];
        const isLoggedIn = req.isAuthenticated && req.isAuthenticated();
        res.render('galleria', {
            immagini: immagini,
            isLoggedIn: isLoggedIn
        });
    } catch (error) {
        console.error('Errore nel caricamento delle immagini:', error);
        res.status(500).send('Internal Server Error');
    }
});
router.get('/societa', async (req, res) => {
    try {
        const membriSocieta = await daoMembriSocieta.getMembriSocieta() || [];
        const isLoggedIn = req.isAuthenticated && req.isAuthenticated();
        res.render('societa', {
            membriSocieta: membriSocieta,
            isLoggedIn: isLoggedIn
        });
    } catch (error) {
        console.error('Errore nel caricamento della pagina società:', error);
        res.status(500).send('Internal Server Error');
    }
});
router.get('/prenotazione', async (req, res) => {
    try {
        const campi = await require('../services/dao-prenotazione').getCampiAttivi() || [];
        const oggi = new Date().toISOString().slice(0, 10);
        const orariDisponibili = {};
        for (const campo of campi) {
            try {
                const orari = await require('../services/dao-prenotazione').getDisponibilitaCampo(campo.id, oggi);
                orariDisponibili[campo.id] = orari || [];
            } catch (e) {
                orariDisponibili[campo.id] = [];
            }
        }
        const isLoggedIn = req.isAuthenticated && req.isAuthenticated();
        res.render('prenotazione', {
            campi: campi,
            orariDisponibili: orariDisponibili,
            oggi: oggi,
            isLoggedIn: isLoggedIn
        });
    } catch (error) {
        console.error('Errore nel caricamento della prenotazione:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/login',(req,res)=>{
    res.render('Login');
});

router.get('/registrazione',(req,res)=>{
    res.render('Registrazione');
});

router.get('/scrivi/recensione',isLoggedIn,(req,res)=>{
    res.sendFile(path.join(__dirname, '../public', 'index.html'),(err)=>{
        if (err) {
            console.error('Error sending file:', err);
            res.status(500).send('Internal Server Error');
        };
    });
});

router.get('/eventi/all',(req,res)=>{
    res.sendFile(path.join(__dirname, '../public', 'index.html'),(err)=>{
        if(err){
            console.log('Error sending file:', err);
            res.status(500).send('Internal Server Error');
        }
    });
});

router.get('/recensioni/all', async (req, res) => {
    try {
        const recensioni = await daoRecensioni.getRecensioni() || [];
        const totalReviews = recensioni.length;
        const averageRating = totalReviews > 0 ? recensioni.reduce((sum, r) => sum + r.valutazione, 0) / totalReviews : 0;
        const ratingCounts = {};
        for (let i = 1; i <= 5; i++) {
            ratingCounts[i] = recensioni.filter(r => r.valutazione === i).length;
        }
        const isLoggedIn = req.isAuthenticated && req.isAuthenticated();
        res.render('reviews', {
            reviews: recensioni,
            averageRating: averageRating,
            ratingCounts: ratingCounts,
            totalReviews: totalReviews,
            isLoggedIn: isLoggedIn
        });
    } catch (error) {
        console.error('Errore nel caricamento delle recensioni:', error);
        res.status(500).send('Internal Server Error');
    }
});


module.exports= router;
