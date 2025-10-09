'use strict';

const express = require('express');
const router = express.Router();
const daoSquadre = require('../services/dao-squadre');
const { isLoggedIn, isAdmin } = require('../middlewares/auth');

router.get('/GetSquadre', async (req, res) => {
    try {
        const squadre = await daoSquadre.getSquadre();
        res.json(squadre || []);
    } catch (err) {
        console.error('Errore nel recupero delle squadre:', err);
        res.status(500).json({ error: 'Errore nel caricamento delle squadre' });
    }
});

router.get('/GetGiocatori', (req,res)=>{
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

router.post('/CreateSquadra', isLoggedIn, isAdmin, async (req, res) => {
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

router.put('/UpdateSquadra/:id', isLoggedIn, isAdmin, async (req, res) => {
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

router.delete('/DeleteSquadra/:id', isLoggedIn, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await daoSquadre.deleteSquadra(id);
        res.json({ message: 'Squadra eliminata con successo' });
    } catch (err) {
        console.error('Errore eliminazione squadra:', err);
        res.status(500).json({ error: err.error || 'Errore durante l\'eliminazione della squadra' });
    }
});

router.get('/GetSquadra/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const squadra = await daoSquadre.getSquadraById(id);
        res.json(squadra);
    } catch (err) {
        console.error('Errore recupero squadra:', err);
        res.status(500).json({ error: err.error || 'Errore durante il recupero della squadra' });
    }
});

module.exports=router;