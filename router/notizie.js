
const express = require('express');
const router = express.Router();
const dao = require('../dao/dao-notizie');

router.get('/notizie', async (req, res) => {
  try {
    const notizie = await dao.geNotizie();
    res.json(notizie); // <-- restituisce JSON invece di renderizzare EJS
  } catch (error) {
    console.error('Errore nel recupero delle notizie:', error);
    res.status(500).json({ error: 'Errore nel caricamento delle notizie' });
  }
});

module.exports = router;