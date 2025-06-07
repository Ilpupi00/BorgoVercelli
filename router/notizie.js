
const express = require('express');
const router = express.Router();
const dao = require('../dao/dao-notizie');
const daoEventi= require('../dao/dao-eventi')

router.get('/notizie', async (req, res) => {
  try {
    const notizie = await dao.getNotizie();
    res.json(notizie); // <-- restituisce JSON invece di renderizzare EJS
  } catch (error) {
    console.error('Errore nel recupero delle notizie:', error);
    res.status(500).json({ error: 'Errore nel caricamento delle notizie' });
  }
});

router.get('/eventi', async (req, res) => {
  try {
    console.log('Richiesta eventi ricevuta');
    const eventi = await daoEventi.getEventi();
    console.log('Eventi recuperati:', eventi);
    res.json(eventi || []); // Restituisci array vuoto se eventi è null/undefined
  } catch (error) {
    console.error('Errore nel recupero degli eventi:', error);
    res.status(500).json({ 
      error: 'Errore nel caricamento degli eventi',
      details: error.message 
    });
  }
});

module.exports = router;