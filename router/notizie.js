
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

router.get('/Notizia/:id',async(req,res)=>{
  try{
    const notizia= await dao.getNotiziaById(req.params.id);
    res.json(notizia);
  }catch(error){
    console.error('errore nel recupero delle notizie:', error);
    res.status.json({ error: 'Errore nel caricamento delle notizie' });
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