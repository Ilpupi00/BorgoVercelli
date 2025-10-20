'use strict';

const express = require('express');
const router = express.Router();
const daoCampionati = require('../services/dao-campionati');

// GET /campionati - Mostra la pagina campionato con lista campionati e classifica del primo
router.get('/', async (req, res) => {
    try {
        const campionati = await daoCampionati.getCampionati();
        let classifica = [];

        if (campionati.length > 0) {
            // Carica la classifica del primo campionato
            classifica = await daoCampionati.getClassificaByCampionatoId(campionati[0].id);
        }

        res.render('campionato', {
            campionati: campionati,
            classifica: classifica,
            selectedCampionato: campionati.length > 0 ? campionati[0].id : null
        });
    } catch (error) {
        console.error('Errore nel caricamento della pagina campionato:', error);
        res.status(500).render('error', { message: 'Errore interno del server' });
    }
});

// GET /campionati/classifica/:id - API per ottenere la classifica di un campionato specifico (per AJAX)
router.get('/classifica/:id', async (req, res) => {
    try {
        const campionatoId = parseInt(req.params.id);
        if (isNaN(campionatoId)) {
            return res.status(400).json({ error: 'ID campionato non valido' });
        }

        const classifica = await daoCampionati.getClassificaByCampionatoId(campionatoId);
        // Recupera regole per la legenda dinamica
        const regoleCampionato = await daoCampionati.getCampionatoById(campionatoId);
        const regole = regoleCampionato ? {
            promozione_diretta: regoleCampionato.promozione_diretta,
            playoff_start: regoleCampionato.playoff_start,
            playoff_end: regoleCampionato.playoff_end,
            playout_start: regoleCampionato.playout_start,
            playout_end: regoleCampionato.playout_end,
            retrocessione_diretta: regoleCampionato.retrocessione_diretta
        } : {};
        res.json({ classifica: classifica, regole: regole });
    } catch (error) {
        console.error('Errore nel recupero della classifica:', error);
        res.status(500).json({ error: 'Errore interno del server' });
    }
});

module.exports = router;