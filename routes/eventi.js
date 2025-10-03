const express = require('express');
const router = express.Router();
const daoEventi = require('../dao/dao-eventi');

router.get('/eventi', async (req, res) => {
  try {
    const eventi = await daoEventi.getEventi();
    res.json(eventi || []); // Restituisci array vuoto se eventi è null/undefined
  } catch (error) {
    console.error('Errore nel recupero degli eventi:', error);
    res.status(500).json({
      error: 'Errore nel caricamento degli eventi',
      details: error.message
    });
  }
});

router.get('/Evento/:id', async (req, res) => {
  try {
    const evento = await daoEventi.getEventoById(req.params.id);
    res.json(evento);
  } catch (error) {
    console.error('Errore nel recupero degli eventi:', error);
    res.status(500).json({
      error: 'Errore nel caricamento degli eventi',
      details: error.message
    });
  }
});

router.get('/eventi/all', async (req, res) => {
  try {
    const eventi = await daoEventi.getEventi();
    res.json(eventi || []);
  }
  catch (error) {
    console.error('Errore nel recupero degli eventi:', error);
    res.status(500).json({
      error: 'Errore nel caricamento degli eventi',
      details: error.message
    });
  }
});

module.exports = router;