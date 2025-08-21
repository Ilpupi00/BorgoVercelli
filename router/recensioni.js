'use strict';

const express = require('express');
const router = express.Router();
const dao = require('../dao/dao-recensioni');

router.get('/recensioni', async (req, res) => {
    try {
        const recensioni = await dao.getRecensioni();
        res.json(recensioni);
    } catch (error) {
        console.error('Errore nel recupero delle recensioni:', error);
        res.status(500).json({ error: 'Errore nel caricamento delle recensioni' });
    }
});

router.get('/recensioni/all', async (req, res) => {
    try {
        const recensioni = await dao.getRecensioni();

        // Calcola le statistiche dalle recensioni
        const totaleRecensioni = recensioni.length;
        const mediaValutazioni = await dao.getValutaMediaRecensioni();
        const conteggioValutazioni = {
            1: 0, 2: 0, 3: 0, 4: 0, 5: 0
        };
        recensioni.forEach(rec => {
            conteggioValutazioni[rec.valutazione]++;
        });
        res.render('reviews', {
            reviews: recensioni,
            averageRating: mediaValutazioni,
            ratingCounts: conteggioValutazioni,
            totalReviews: totaleRecensioni,
            isLogged: req.isAuthenticated ? req.isAuthenticated() : false,
            error: null
        });
    } catch (error) {
        console.error('Errore nel recupero delle recensioni:', error);
        res.render('reviews', { 
            error: 'Errore nel recupero delle recensioni. Riprova più tardi.',
            isLogged: req.isAuthenticated ? req.isAuthenticated() : false,
            reviews: [],
            averageRating: 0,
            ratingCounts: {},
            totalReviews: 0
        });
    }
});

// Salva una nuova recensione
router.post('/recensione', async (req, res) => {
    try {
        const { valutazione, titolo, contenuto, entita_tipo, entita_id } = req.body;
        if (!valutazione || !titolo || !contenuto || !entita_tipo || !entita_id) {
            return res.json({ success: false, error: 'Dati mancanti' });
        }
        // Salva la recensione tramite DAO
        const result = await dao.inserisciRecensione({ valutazione, titolo, contenuto, entita_tipo, entita_id });
        if (result) {
            res.json({ success: true });
        } else {
            res.json({ success: false, error: 'Errore salvataggio recensione' });
        }
    } catch (error) {
        console.error('Errore salvataggio recensione:', error);
        res.json({ success: false, error: 'Errore server' });
    }
});

// Salva una nuova recensione
router.post('/recensioni', async (req, res) => {
    try {
        const { valutazione, titolo, contenuto, entita_tipo, entita_id } = req.body;
        // Validazione base
        if (!valutazione || !titolo || !contenuto || !entita_tipo || !entita_id) {
            return res.status(400).json({ success: false, error: 'Tutti i campi sono obbligatori.' });
        }
        // Salva la recensione tramite DAO
        const result = await dao.inserisciRecensione({
            valutazione,
            titolo,
            contenuto,
            entita_tipo,
            entita_id,
            // puoi aggiungere userId se serve
        });
        if (result && result.success) {
            res.json({ success: true });
        } else {
            res.status(500).json({ success: false, error: 'Errore salvataggio recensione.' });
        }
    } catch (error) {
        console.error('Errore salvataggio recensione:', error);
        res.status(500).json({ success: false, error: 'Errore server.' });
    }
});

module.exports = router;