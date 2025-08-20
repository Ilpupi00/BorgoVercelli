
const express = require('express');
const router = express.Router();
const dao = require('../dao/dao-notizie');
const daoEventi= require('../dao/dao-eventi');
const Notizia= require('../model/notizia');


// utilizzo del model di Notazia per creare un oggetto Notizia
const makeNotizia = (row)=>{
    return new Notizia(
        row.titolo,
        row.sottotitolo,
        row.immagine,
        row.contenuto,
        row.autore,
        row.data_pubblicazione || row.data
    );
}

router.get('/notizie', async (req, res) => {
  try {
    const rows = await dao.getNotizie();
    const notizie = (rows || []).map(makeNotizia);
    res.json(notizie);
  } catch (error) {
    console.error('Errore nel recupero delle notizie:', error);
    res.status(500).json({ error: 'Errore nel caricamento delle notizie' });
  }
});

router.get('/notizia/:id',async(req,res)=>{
  try {
    const notizia = await dao.getNotiziaById(req.params.id);
    res.json(notizia);
  } catch (error) {
    console.error('errore nel recupero delle notizie:', error);
    if (error && error.error === 'News not found') {
      res.status(404).json({ error: 'Notizia non trovata' });
    } else {
      res.status(500).json({ error: 'Errore nel caricamento delle notizie' });
    }
  }
});

// Gestione anche della route con N maiuscola per compatibilità frontend
router.get('/Notizia/:id', async (req, res) => {
  try {
    const notizia = await dao.getNotiziaById(req.params.id);
    res.json(notizia);
  } catch (error) {
    if (error && error.error === 'News not found') {
      // Risposta HTML user-friendly, nessun errore nel console.log del browser
      res.status(200).send(`
        <html>
          <head>
            <title>Notizia non trovata</title>
            <link rel="stylesheet" href="/stylesheet/reviews.css">
          </head>
          <body style="text-align:center; margin-top:100px;">
            <h2>Notizia non trovata</h2>
            <p>La notizia che cerchi non esiste o è stata rimossa.</p>
            <a href="/notizie/all" class="btn btn-primary">Torna alle notizie</a>
          </body>
        </html>
      `);
    } else {
      res.status(500).json({ error: 'Errore nel caricamento delle notizie' });
    }
  }
});

router.get('/notizie/all', async (req, res) => {
  try {
    const rows = await dao.getNotizie();
    const notizie = (rows || []).map(makeNotizia);
    res.json(notizie);
  } catch (error) {
    console.error('Errore nel recupero delle notizie:', error);
    res.status(500).json({ error: 'Errore nel caricamento delle notizie' });
  }
});

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

module.exports = router;