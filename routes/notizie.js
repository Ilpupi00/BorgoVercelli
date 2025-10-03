
const express = require('express');
const router = express.Router();
const dao = require('../dao/dao-notizie');
const { isLoggedIn,isAdmin} = require('../middleware/auth');




router.get('/notizie', async (req, res) => {
  try {
    const rows = await dao.getNotizie();
    res.json(rows || []); // Restituisce un array vuoto se rows è null/undefined
  } catch (error) {
    console.error('Errore nel recupero delle notizie:', error);
    res.status(500).json({ error: 'Errore nel caricamento delle notizie' });
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
            <link rel="stylesheet" href="/stylesheets/reviews.css">
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

router.get('/all', async (req, res) => {
  try {
    const rows = await dao.getNotizie();
    const notizie = (rows || []);
    res.json(notizie);
  } catch (error) {
    console.error('Errore nel recupero delle notizie:', error);
    res.status(500).json({ error: 'Errore nel caricamento delle notizie' });
  }
});

router.delete('/notizia/:id', isLoggedIn, isAdmin, async (req, res) => {
  try {
    const result = await dao.deleteNotiziaById(req.params.id);
    res.json(result);
  } catch (error) {
    console.error('Errore nel recupero delle notizie:', error);
    res.status(500).json({ error: 'Errore nel caricamento delle notizie' });
  }
});

module.exports = router;