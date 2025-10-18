const express = require('express');
const router = express.Router();
const dao = require('../services/dao-eventi');
const { isLoggedIn, isAdminOrDirigente } = require('../middlewares/auth');

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

router.post('/evento/nuovo', isLoggedIn, isAdminOrDirigente, async (req, res) => {
    try {
        const eventoData = {
            titolo: req.body.titolo,
            descrizione: req.body.descrizione,
            data_inizio: req.body.data_inizio,
            data_fine: req.body.data_fine,
            luogo: req.body.luogo,
            tipo_evento: req.body.tipo_evento,
            squadra_id: req.body.squadra_id || null,
            campo_id: req.body.campo_id || null,
            max_partecipanti: req.body.max_partecipanti || null,
            pubblicato: req.body.pubblicato === 'true' || req.body.pubblicato === true
        };

        const result = await eventiDao.createEvento(eventoData);
        res.json({ success: true, message: 'Evento creato con successo', id: result.id });
    } catch (error) {
        console.error('Errore nella creazione dell\'evento:', error);
        res.status(500).json({ success: false, error: 'Errore nella creazione dell\'evento' });
    }
});

router.get('/eventi/miei', isLoggedIn, async (req,res)=>
{
    try{
        const eventi= await dao.getEventiPersonali(req.user.id);
        res.json({eventi:eventi || []});
    }catch(error){
        console.error('Errore nel recupero degli eventi personali:', error);
        res.status(500).json({ error: 'Errore interno del server' });
    }
});



module.exports = router;