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
router.get('/eventi', async (req, res) => {
  try {
    const eventi = await dao.getEventiPubblicati();
    res.render('eventi', { eventi: eventi || [] });
  } catch (error) {
    console.error('Errore nel recupero degli eventi pubblicati:', error);
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

// Route per creare/modificare un evento
router.get('/crea-evento', isLoggedIn, isAdminOrDirigente, async (req, res) => {
  try {
    const id = req.query.id;
    let evento = null;
    if (id) evento = await dao.getEventoById(id);
    res.render('Eventi/evento', { user: req.user, evento, error: null });
  } catch (error) {
    console.error('Errore nel caricamento del form evento:', error);
    res.render('Eventi/evento', { user: req.user, evento: null, error: 'Errore nel caricamento dell\'evento' });
  }
});

// Route per creare un nuovo evento
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

        const result = await dao.createEvento(eventoData);
        res.json({ success: true, message: 'Evento creato con successo', id: result.id });
        if(req.user.tipo_utente_id === 1){
            //redirect alla admin page
            res.redirect('/admin/eventi');
        }
        else{
            res.redirect('/profilo');
        }
    } catch (error) {
        console.error('Errore nella creazione dell\'evento:', error);
        res.status(500).json({ success: false, error: 'Errore nella creazione dell\'evento' });
    }
});

// Edit event - redirect to create form with id
router.get('/evento/edit/:id', isLoggedIn, isAdminOrDirigente, async (req, res) => {
  res.redirect(`/crea-evento?id=${req.params.id}`);
});

// Update existing event
router.put('/evento/:id', isLoggedIn, isAdminOrDirigente, async (req, res) => {
  try {
    const id = req.params.id;
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

    await dao.updateEvento(id, eventoData);
    if(req.user.tipo_utente_id === 1){
      res.redirect('/admin/eventi');
    } else {
      res.redirect('/profilo');
    }
  } catch (error) {
    console.error('Errore nell\'aggiornamento dell\'evento:', error);
    res.status(500).render('error', { message: 'Errore nell\'aggiornamento dell\'evento', error: {} });
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