const express = require('express');
const router = express.Router();
const dao = require('../services/dao-eventi');

// Route per eventi/all gestita dal router
router.get('/all', async (req, res) => {
  try {
    const eventi = await dao.getEventi();
    res.json({ eventi: eventi || [] });
  } catch (error) {
    console.error('Errore nel recupero degli eventi:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Route per visualizzare un singolo evento
router.get('/evento/:id', async (req, res) => {
  try {
    const eventoId = req.params.id;
    const evento = await dao.getEventoById(eventoId);
    
    if (!evento) {
      return res.status(404).render('error', { 
        message: 'Evento non trovato', 
        error: { status: 404 } 
      });
    }
    
    res.render('Eventi/visualizza_evento', { evento: evento });
  } catch (error) {
    console.error('Errore nel recupero dell\'evento:', error);
    res.status(500).render('error', { 
      message: 'Errore interno del server', 
      error: { status: 500 } 
    });
  }
});

// Route per /eventi gestita direttamente in app.js
// Route per /api/eventi gestita direttamente in app.js

module.exports = router;