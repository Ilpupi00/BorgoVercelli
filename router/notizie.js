
const express = require('express');
const router = express.Router();
const dao = require('../dao/dao_notizie');

router.get('/notizie', async (req, res) => {
  try {
    const notizie = await dao.geNotizie();
    res.render('notizie', { notizie });
  } catch (error) {
    console.error('Errore nel recupero delle notizie:', error);
    res.status(500).render('error', { error: { message: 'Errore nel caricamento delle notizie' } });
  }
});

module.exports = router;