'use strict';
const express = require('express');
const path = require('path');
const router = express.Router();
const daoNotizie = require('../services/dao-notizie');
const daoEventi = require('../services/dao-eventi');
const daoRecensioni = require('../services/dao-recensioni');
const daoMembriSocieta = require('../services/dao-membri-societa');
const daoSquadre = require('../services/dao-squadre');
const daoCampi = require('../services/dao-campi');
const { isLoggedIn,isDirigente } = require('../middlewares/auth');
const emailService = require('../services/email-service');


router.get('/homepage', async (req, res) => {
    try {
        // Temporaneamente senza dao per evitare errori
        const notizie = await daoNotizie.getNotiziePaginated(0,3) || [];
        const eventi = await daoEventi.getEventi() || [];
        const recensioni = await daoRecensioni.getRecensioni() || [];
        const isLoggedIn = req.isAuthenticated ? req.isAuthenticated() : false;
        res.render('homepage', {
            notizie: notizie,
            eventi: eventi,
            recensioni: recensioni,
            isLoggedIn: isLoggedIn
        });
    } catch (error) {
        console.error('Errore nel caricamento della homepage:', error);
        res.render('homepage', {
            notizie: [],
            eventi: [],
            recensioni: [],
            isLoggedIn: false
        });
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
        const isLoggedIn = req.isAuthenticated();
        res.render('campionato', { classifica, isLoggedIn });
    } catch (error) {
        console.error('Errore nel caricamento del campionato:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/squadre', async (req, res) => {
    try {
        const squadre = await require('../services/dao-squadre').getSquadre() || [];
        const isLoggedIn = req.isAuthenticated();
        const errorMessage = req.session ? req.session.errorMessage : null;
        if (req.session) {
            req.session.errorMessage = null; // Cancella il messaggio dopo averlo mostrato
        }
        res.render('squadre', {
            squadre: squadre,
            isLoggedIn: isLoggedIn,
            errorMessage: errorMessage
        });
    } catch (error) {
        console.error('Errore nel caricamento delle squadre:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/galleria', async (req, res) => {
    try {
        const immagini = await require('../services/dao-galleria').getImmagini() || [];
        const isLoggedIn = req.isAuthenticated();
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
        const isLoggedIn = req.isAuthenticated();
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
        const isLoggedIn = req.isAuthenticated();
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

router.get('/scrivi/recensione',(req,res)=>{
    if (!req.isAuthenticated()) {
        return res.redirect('/login');
    }
    try {
        res.render('scrivi_recensione', {
            isLogged: req.isAuthenticated(),
            user: req.user,
            error: null
        });
    } catch (error) {
        console.error('Errore nel caricamento della pagina scrivi recensione:', error);
        res.render('scrivi_recensione', {
            isLogged: req.isAuthenticated(),
            user: req.user,
            error: 'Errore nel caricamento della pagina'
        });
    }
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
        const isLoggedIn = req.isAuthenticated();
        res.render('recensioni', {
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

// NOTE: route '/eventi/all' already handled above by sending the SPA entrypoint. Duplicate JSON endpoint removed to avoid conflicts.

// NOTE: route '/eventi' moved to app.js to filter published events

// Route per mostrare la pagina di ricerca
router.get('/search', async (req, res) => {
    try {
        const query = req.query.q || '';
        const isLoggedIn = req.isAuthenticated && req.isAuthenticated();

        let searchResults = null;

        // Se c'è una query, fai la ricerca lato server
        if (query && query.trim().length >= 1) {
            const searchTerm = `%${query.trim()}%`;

            // Cerca in notizie
            const notizie = await daoNotizie.searchNotizie(searchTerm);

            // Cerca in eventi
            const eventi = await daoEventi.searchEventi(searchTerm);

            // Cerca in squadre
            const squadre = await daoSquadre.searchSquadre(searchTerm);

            // Cerca in campi
            const campi = await daoCampi.searchCampi(searchTerm);

            searchResults = {
                notizie: notizie || [],
                eventi: eventi || [],
                squadre: squadre || [],
                campi: campi || []
            };
        }

        res.render('search', {
            query: query,
            isLogged: req.isAuthenticated(),
            currentPath: req.path,
            searchResults: searchResults
        });
    } catch (error) {
        console.error('Errore nella ricerca:', error);
        res.render('search', {
            query: req.query.q || '',
            isLogged: req.isAuthenticated(),
            currentPath: req.path,
            searchResults: null,
            error: 'Errore nella ricerca'
        });
    }
});

// router.get('/evento/crea-evento',isLoggedIn,isDirigente,(req,res)=>{
//     try{
//         res.render('Eventi/evento_semplice.ejs',{
//         user:req.user,
//         evento: null
//         });

//    }catch(error){
//     console.error('Errore nel rendering della pagina di creazione evento:', error);
//     res.status(500).send('Internal Server Error');
//     }
// });
router.get('/notizie/crea_notizie',isLoggedIn,isDirigente,(req,res)=>{
    try{
        res.render('Notizie/notizia_semplice.ejs',{
            user:req.user,
            notizia: null
        })
    }catch(error){
        console.error('Errore nel rendering della pagina di creazione notizia:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Pagina contatti (GET) - mostra il form di contatto
router.get('/contatti', (req, res) => {
    try {
        const isLoggedIn = req.isAuthenticated ? req.isAuthenticated() : false;
        res.render('contatti', { isLoggedIn: isLoggedIn });
    } catch (error) {
        console.error('Errore nel rendering della pagina contatti:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Endpoint POST per invio contatti (API)
router.post('/contatti', async (req, res) => {
    try {
        const { name, email, message, subject } = req.body;

        // semplice validazione server-side
        if (!name || !email || !message || !subject) {
            return res.status(400).json({ error: 'Tutti i campi sono obbligatori.' });
        }

        // Invia la mail tramite il service
        await emailService.sendEmail({
            fromName: name,
            fromEmail: email,
            subject: subject,
            message: message
        });

        return res.json({ success: true, message: 'Messaggio inviato con successo.' });
    } catch (err) {
        console.error('Errore invio contatti:', err);
        return res.status(500).json({ error: 'Errore durante l\'invio del messaggio.' });
    }
});
module.exports = router;
