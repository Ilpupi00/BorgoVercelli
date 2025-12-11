const express = require('express');
const router = express.Router();
const dao = require('../services/dao-eventi');
const daoSquadre = require('../../squadre/services/dao-squadre');
const daoCampi = require('../../prenotazioni/services/dao-campi');
const daoAdmin = require('../../admin/services/dao-admin');
const { isLoggedIn, isAdminOrDirigente } = require('../../../core/middlewares/auth');
const multer = require('multer');
const { upload } = require('../../../core/config/multer');

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
// Route per creare/modificare un evento
router.get('/evento/crea-evento', isLoggedIn, isAdminOrDirigente, async (req, res) => {
  try {
    const squadre = await daoSquadre.getSquadre();
    const campi = await daoCampi.getCampi();
    
  res.render('evento', { user: req.user, evento: null, squadre, campi, error: null });
  } catch (error) {
    console.error('Errore nel caricamento del form evento:', error);
  res.render('evento', { user: req.user, evento: null, squadre: [], campi: [], error: 'Errore nel caricamento dell\'evento' });
  }
});

// Edit event - redirect to create form with id
router.get('/evento/crea-evento/:id', isLoggedIn, isAdminOrDirigente, async (req, res) => {
    try {
        const evento = await dao.getEventoById(req.params.id);
        const squadre = await daoSquadre.getSquadre();
        const campi = await daoCampi.getCampi();
        
        res.render('evento', {
            user: req.user,
            evento: evento,
            squadre,
            campi
        });
    } catch (error) {
        console.error('Errore nel caricamento della pagina modifica evento:', error);
        res.status(500).json({ error: 'Errore interno del server' });
    }
});

router.post('/evento/nuovo', isLoggedIn, isAdminOrDirigente, async (req, res) => {
  try{
    const eventoData = {
      titolo: req.body.titolo,
      descrizione: req.body.descrizione,
      data_inizio: req.body.data_inizio,
      data_fine: req.body.data_fine,
      luogo: req.body.luogo,
      tipo_evento: req.body.tipo_evento,
      autore_id: req.user.id,
      squadra_id: req.body.squadra_id || null,
      campo_id: req.body.campo_id || null,
      max_partecipanti: req.body.max_partecipanti || null,
      pubblicato: req.body.pubblicato === 'true' || req.body.pubblicato === true
    };

    const nuovoEvento = await dao.createEvento(eventoData);
    const user = req.user;
    const redirectUrl = user.tipo_utente_id === 1 ? '/admin/eventi' : '/profilo';
    // If request comes from AJAX/fetch (expects JSON), return JSON so client can handle redirect
    if (req.xhr || (req.headers && req.headers['x-requested-with'] === 'XMLHttpRequest') || (req.headers.accept && req.headers.accept.includes('application/json'))) {
      return res.json({ success: true, redirectUrl, eventoId: nuovoEvento.id });
    }
    return res.redirect(redirectUrl);
  } catch (error) {
    console.error('Errore nella creazione dell\'evento:', error);
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
    
    res.render('visualizza_evento', { evento: evento });
  } catch (error) {
    console.error('Errore nel recupero dell\'evento:', error);
    res.status(500).render('error', { 
      message: 'Errore interno del server', 
      error: { status: 500 } 
    });
  }
});

// Route per creare/modificare un evento
router.get('/evento/crea-evento', isLoggedIn, isAdminOrDirigente, async (req, res) => {
  try {
    const squadre = await daoSquadre.getSquadre();
    const campi = await daoCampi.getCampi();
    
  res.render('evento', { user: req.user, evento: null, squadre, campi, error: null });
  } catch (error) {
    console.error('Errore nel caricamento del form evento:', error);
  res.render('evento', { user: req.user, evento: null, squadre: [], campi: [], error: 'Errore nel caricamento dell\'evento' });
  }
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
      autore_id: req.user.id,
      squadra_id: req.body.squadra_id || null,
      campo_id: req.body.campo_id || null,
      max_partecipanti: req.body.max_partecipanti || null,
      pubblicato: req.body.pubblicato === 'true' || req.body.pubblicato === true
    };

    await dao.updateEvento(id, eventoData);
    const user = req.user;
    const redirectUrl = user.tipo_utente_id === 1 ? '/admin/eventi' : '/profilo';
    if (req.xhr || (req.headers && req.headers['x-requested-with'] === 'XMLHttpRequest') || (req.headers.accept && req.headers.accept.includes('application/json'))) {
      return res.json({ success: true, redirectUrl });
    }
    return res.redirect(redirectUrl);
  } catch (error) {
    console.error('Errore nell\'aggiornamento dell\'evento:', error);
    res.status(500).render('error', { message: 'Errore nell\'aggiornamento dell\'evento', error: {} });
  }
});

// Route per eliminare un evento
router.delete('/evento/:id', isLoggedIn, isAdminOrDirigente, async (req, res) => {
    try {
    await dao.deleteEventoById(req.params.id);
        res.json({ success: true, message: 'Evento eliminato con successo' });
    } catch (error) {
        console.error('Errore nell\'eliminazione dell\'evento:', error);
        res.status(500).json({ success: false, error: 'Errore nell\'eliminazione dell\'evento' });
    }
});


router.get('/eventi/miei', isLoggedIn, async (req,res)=>
{
    try{
        const eventi= await dao.getEventiPersonali(req.user.id);
        res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');
        res.json({eventi:eventi || []});
    }catch(error){
        console.error('Errore nel recupero degli eventi personali:', error);
        res.status(500).json({ error: 'Errore interno del server' });
    }
});

// Upload immagine per evento
router.post('/evento/:id/upload-immagine', isLoggedIn, isAdminOrDirigente, (req, res, next) => {
  upload.single('immagine')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File troppo grande. Dimensione massima: 5MB' });
      }
    } else if (err) {
      return res.status(400).json({ error: err.message || 'Errore durante il caricamento del file' });
    }
    next();
  });
}, async (req, res) => {
  try {
    const eventoId = req.params.id;
    
    if (!req.file) {
      return res.status(400).json({ error: 'Nessun file caricato' });
    }

    // Verifica che l'evento esista
    const evento = await dao.getEventoById(eventoId);
    if (!evento) {
      return res.status(404).json({ error: 'Evento non trovato' });
    }

    // Crea il path dell'immagine
    const imageUrl = '/uploads/' + req.file.filename;
    
    // Inserisci l'immagine nella tabella IMMAGINI
    await daoAdmin.insertImmagine(imageUrl, 'evento', 'evento', eventoId, 1);
    
    res.json({ 
      success: true, 
      message: 'Immagine caricata con successo',
      imageUrl: imageUrl
    });
  } catch (error) {
    console.error('Errore upload immagine evento:', error);
    res.status(500).json({ error: 'Errore durante il caricamento dell\'immagine' });
  }
});

// Elimina immagine evento
router.delete('/evento/:id/immagine', isLoggedIn, isAdminOrDirigente, async (req, res) => {
  try {
    const eventoId = req.params.id;
    
    // Elimina tutte le immagini associate all'evento
    await daoAdmin.deleteImmaginiByEntita('evento', eventoId);
    
    res.json({ 
      success: true, 
      message: 'Immagine eliminata con successo'
    });
  } catch (error) {
    console.error('Errore eliminazione immagine evento:', error);
    res.status(500).json({ error: 'Errore durante l\'eliminazione dell\'immagine' });
  }
});

module.exports = router;