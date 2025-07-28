'use strict';

const express = require('express');
const router = express.Router();
const daoSquadre = require('../dao/dao-squadre');

router.get('/GetSquadre', (req,res)=>{
    daoSquadre.getSquadre()
        .then((squadre) => {
            console.log('Squadre recuperate con successo:', squadre);
            if (!squadre || squadre.length === 0) {
                console.warn('Nessuna squadra trovata');
                return res.status(404).json({ error: 'Nessuna squadra trovata' });
            }
            res.json({ squadre: squadre });
        })
        .catch((err) => {
            console.error('Errore nel recupero delle squadre:', err);
            res.status(500).json({ error: 'Errore nel caricamento delle squadre' });
        });
});

router.get('/GetGiocatori', (req,res)=>{
    daoSquadre.getGiocatori()
        .then((giocatori) => {
            console.log('Giocatori recuperati con successo:', giocatori);
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

module.exports=router;