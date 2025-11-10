'use strict';

const express = require('express');
const router = express.Router();
const daoCampionati = require('../services/dao-campionati');

// GET /campionati - Mostra la pagina campionato con lista campionati e classifica 
router.get('/', async (req, res) => {
    try {
        const campionati = await daoCampionati.getCampionati();
        let classifica = [];
        let selectedCampionato = null;
        let regole = {};

        // Se viene passato un ID specifico, usa quello
        if (req.query.id) {
            const campionatoId = parseInt(req.query.id);
            if (!isNaN(campionatoId)) {
                // Verifica che il campionato esista E sia nella lista dei campionati attivi
                const campionato = campionati.find(c => c.id === campionatoId);
                if (campionato) {
                    selectedCampionato = campionatoId;
                    classifica = await daoCampionati.getClassificaByCampionatoId(campionatoId);
                    // Estrai le regole dal campionato selezionato
                    regole = {
                        promozione_diretta: campionato.promozione_diretta,
                        playoff_start: campionato.playoff_start,
                        playoff_end: campionato.playoff_end,
                        playout_start: campionato.playout_start,
                        playout_end: campionato.playout_end,
                        retrocessione_diretta: campionato.retrocessione_diretta
                    };
                }
            }
        }

        // Se non c'è un ID valido, usa il primo campionato disponibile
        if (!selectedCampionato && campionati.length > 0) {
            selectedCampionato = campionati[0].id;
            classifica = await daoCampionati.getClassificaByCampionatoId(campionati[0].id);
            // Carica anche le regole del primo campionato
            const primoCampionato = await daoCampionati.getCampionatoById(campionati[0].id);
            if (primoCampionato) {
                regole = {
                    promozione_diretta: primoCampionato.promozione_diretta,
                    playoff_start: primoCampionato.playoff_start,
                    playoff_end: primoCampionato.playoff_end,
                    playout_start: primoCampionato.playout_start,
                    playout_end: primoCampionato.playout_end,
                    retrocessione_diretta: primoCampionato.retrocessione_diretta
                };
            }
        }

        res.render('campionato', {
            campionati: campionati,
            classifica: classifica,
            selectedCampionato: selectedCampionato,
            regole: regole
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