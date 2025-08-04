'use strict';

const express = require('express');
const router = express.Router();
const daoSquadre = require('../dao/dao-squadre');
const SQUADRA = require('../model/squadra');

const makeSqaudra = (row) => {
    return new SQUADRA(
        row.id,
        row.nome,
        row.id_immagine,
        row.Anno
    );
}

router.get('/GetSquadre', (req,res)=>{
    daoSquadre.getSquadre()
        .then((squadre) => {
            console.log('Squadre recuperate con successo:', squadre);
            if (!squadre || squadre.length === 0) {
                console.warn('Nessuna squadra trovata');
                return res.status(404).json({ error: 'Nessuna squadra trovata' });
            }
            // Usa il model per ogni squadra
            const squadreModel = squadre.map(makeSqaudra);
            res.json({ squadre: squadreModel });
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