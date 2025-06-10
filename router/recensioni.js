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

module.exports = router;