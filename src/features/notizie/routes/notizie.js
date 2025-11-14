const express = require('express');
const router = express.Router();
const dao = require('../services/dao-notizie');
const daoGalleria = require('../../galleria/services/dao-galleria');
const { isLoggedIn, isAdminOrDirigente, isAdmin, canEditNotizia } = require('../../../core/middlewares/auth');
const multer = require('multer');
const { upload } = require('../../../core/config/multer');

function parseIdParam(param) {
  const id = parseInt(param, 10);
  return Number.isInteger(id) ? id : null;
}

// HTML: render list of news
router.get('/notizie/all', async (req, res) => {
  try {
    const rows = await dao.getNotiziePaginated(0, 6);
    const notizie = rows || [];
    res.render('notizie', { user: req.user, notizie });
  } catch (error) {
    console.error('Errore nel recupero delle notizie:', error);
    res.status(500).render('error', { message: 'Errore interno del server', error: {} });
  }
});

// API: paginated list with filters
router.get('/api/notizie', async (req, res) => {

  try {
    const rows = await dao.getNotizieFiltered({}, 0, 1000);
    res.json({ notizie: rows || [] });
  } catch (error) {
    console.error('Errore nel recupero delle notizie filtrate:', error);
    res.status(500).json({ error: 'Errore nel caricamento delle notizie' });
  }
});

// API: get authors list
router.get('/api/notizie/authors', async (req, res) => {
  try {
    const authors = await dao.getNotizieAuthors();
    res.json({ authors: authors || [] });
  } catch (error) {
    console.error('Errore nel recupero degli autori:', error);
    res.status(500).json({ error: 'Errore nel caricamento degli autori' });
  }
});

// API: all as JSON
router.get('/notizie', async (req, res) => {
  try {
    const rows = await dao.getNotizieFiltered({}, 0, 1000);
    res.json(rows || []);
  } catch (error) {
    console.error('Errore nel recupero delle notizie:', error);
    res.status(500).json({ error: 'Errore nel caricamento delle notizie' });
  }
});

// HTML: view a single news
router.get('/notizia/:id', async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    if (!id) return res.status(400).render('error', { message: 'ID notizia non valido', error: { status: 400 } });

    const notizia = await dao.getNotiziaById(id);
    if (!notizia) {
      return res.status(404).render('error', { message: 'Notizia non trovata', error: { status: 404 } });
    }
    
    // Incrementa il contatore delle visualizzazioni
    try {
      await dao.incrementVisualizzazioni(id);
    } catch (viewError) {
      // Non bloccare il rendering se l'incremento fallisce
      console.warn('Errore incremento visualizzazioni notizia:', viewError);
    }
    
    res.render('visualizza_notizia', { notizia });
  } catch (error) {
    console.error('Errore nel caricamento della notizia:', error);
    res.status(500).render('error', { message: 'Errore nel caricamento della notizia', error: { status: 500 } });
  }
});

// API: get single news JSON
router.get('/api/notizia/:id', async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    if (!id) return res.status(400).json({ error: 'ID notizia non valido' });

    const notizia = await dao.getNotiziaById(id);
    if (!notizia) return res.status(404).json({ error: 'Notizia non trovata' });
    res.json(notizia);
  } catch (error) {
    console.error('Errore nel recupero della notizia:', error);
    res.status(500).json({ error: 'Errore nel caricamento della notizia' });
  }
});

// Personal news for the authenticated user
router.get('/notizie/mie', isLoggedIn, async (req, res) => {
  try {
    const notizie = await dao.getNotiziePersonali(req.user.id);
    res.json({ success: true, notizie: notizie || [] });
  } catch (error) {
    console.error('Errore nel recupero delle notizie personali:', error);
    res.status(500).json({ success: false, error: 'Errore nel caricamento delle notizie' });
  }
});

// Forms: create/edit
router.get('/crea-notizie', isAdminOrDirigente, async (req, res) => {
  try {
    const id = req.query.id;
    let notizia = null;
    if (id) notizia = await dao.getNotiziaById(id);
    res.render('notizia', { user: req.user, notizia, error: null });
  } catch (error) {
    console.error('Errore nel caricamento del form notizia:', error);
    res.render('notizia', { user: req.user, notizia: null, error: 'Errore nel caricamento della notizia' });
  }
});

// Create new news
router.post('/notizie/nuova', isAdminOrDirigente, isLoggedIn, upload.single('immagine_principale'), async (req, res) => {
  try {
    const { titolo, contenuto, sottotitolo, immagine_principale_id, pubblicata, template } = req.body;
    const templateName = template === 'semplice' ? 'Notizie/notizia_semplice' : 'Notizie/notizia';

    if (!titolo || !contenuto) {
      return res.render(templateName, { user: req.user, notizia: null, error: 'Titolo e contenuto sono obbligatori' });
    }

    if (contenuto && Buffer.byteLength(contenuto, 'utf8') > 5 * 1024 * 1024) {
      return res.render(templateName, { user: req.user, notizia: null, error: 'Il contenuto della notizia è troppo grande (max 5MB).' });
    }

    const textContent = contenuto.replace(/<[^>]*>/g, '').trim();
    if (textContent.length < 1) {
      return res.render(templateName, { user: req.user, notizia: null, error: 'Il contenuto della notizia deve contenere del testo effettivo' });
    }

    let immagineId = immagine_principale_id || null;
    if (req.file) {
      const url = '/uploads/' + req.file.filename;
      const result = await daoGalleria.insertImmagineNotizia(url, null, 1); // entita_id sarà null per ora
      immagineId = result.id;
    }

    const notiziaData = {
      titolo,
      contenuto,
      sottotitolo: sottotitolo || '',
      immagine_principale_id: immagineId,
      autore_id: req.user ? req.user.id : 1, // default to user 1 if not logged in
      pubblicata: pubblicata ? true : false
    };

    const result = await dao.createNotizia(notiziaData);

    // Se abbiamo caricato un'immagine, aggiorniamo entita_id
    if (req.file && immagineId) {
      await daoGalleria.updateImmagineEntitaId(immagineId, result.id);
    }

    if(req.user.tipo_utente_id === 1){
      res.redirect('/admin/notizie');
    }
    else{
      res.redirect('/profilo');
    }

  } catch (error) {
    console.error('Errore nella creazione della notizia:', error);
    res.status(500).render('error', { message: 'Errore nella creazione della notizia', error: {} });
  }
});

// Update existing news
router.post('/notizie/:id', canEditNotizia, upload.single('immagine_principale'), async (req, res) => {
  try {
    // Check if this is actually a PUT request (method override)
    if (req.body._method !== 'PUT') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    const id = parseIdParam(req.params.id);
    if (!id) return res.status(400).render('error', { message: 'ID notizia non valido', error: { status: 400 } });
    const { titolo, contenuto, sottotitolo, immagine_principale_id, pubblicata, template } = req.body;
    const templateName = template === 'semplice' ? 'Notizie/notizia_semplice' : 'Notizie/notizia';

    if (!titolo || !contenuto) {
      const notizia = await dao.getNotiziaById(id);
      return res.render(templateName, { user: req.user, notizia, error: 'Titolo e contenuto sono obbligatori' });
    }

    if (contenuto && Buffer.byteLength(contenuto, 'utf8') > 5 * 1024 * 1024) {
      const notizia = await dao.getNotiziaById(id);
      return res.render(templateName, { user: req.user, notizia, error: 'Il contenuto della notizia è troppo grande (max 5MB).' });
    }

    const textContent = contenuto.replace(/<[^>]*>/g, '').trim();
    if (textContent.length < 1) {
      const notizia = await dao.getNotiziaById(id);
      return res.render(templateName, { user: req.user, notizia, error: 'Il contenuto della notizia deve contenere del testo effettivo' });
    }

    let immagineId = immagine_principale_id || null;
    if (req.file) {
      // Se c'è una nuova immagine, elimina il file della vecchia
      if (immagine_principale_id) {
        const { deleteImageFile } = require('../../../shared/utils/file-helper');
        const oldNotizia = await dao.getNotiziaById(id);
        if (oldNotizia && oldNotizia.immagine_url) {
          console.log('[updateNotizia] Eliminazione file vecchio:', oldNotizia.immagine_url);
          deleteImageFile(oldNotizia.immagine_url);
        }
      }
      
      const url = '/uploads/' + req.file.filename;
      const result = await daoGalleria.insertImmagineNotizia(url, id, 1);
      immagineId = result.id;
    }

    const notiziaData = {
      titolo,
      contenuto,
      sottotitolo: sottotitolo || '',
      immagine_principale_id: immagineId,
      pubblicata: pubblicata ? true : false
    };

    await dao.updateNotizia(id, notiziaData);
    if(req.user.tipo_utente_id === 1){
      res.redirect('/admin/notizie');
    }
    else{
      res.redirect('/profilo');
    }
  } catch (error) {
    console.error('Errore nell\'aggiornamento della notizia:', error);
    res.status(500).render('error', { message: 'Errore nell\'aggiornamento della notizia', error: {} });
  }
});

// Publish/unpublish
router.post('/notizia/:id/publish', isLoggedIn, isAdmin, async (req, res) => {
  try {
    // Check if this is actually a PUT request (method override)
    if (req.body._method !== 'PUT') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    const id = parseIdParam(req.params.id);
    if (!id) return res.status(400).json({ success: false, error: 'ID notizia non valido' });
    const { pubblicata } = req.body;
    const updateData = {
      pubblicata: pubblicata ? true : false
    };
    await dao.updateNotizia(id, updateData);
    res.json({ success: true, message: pubblicata ? 'Notizia pubblicata' : 'Notizia sospesa' });
  } catch (error) {
    console.error('Errore nella pubblicazione/sospensione della notizia:', error);
    res.status(500).json({ success: false, error: 'Errore nell\'operazione' });
  }
});

// Delete
router.delete('/notizia/:id', isLoggedIn, isAdmin, async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    if (!id) return res.status(400).json({ success: false, error: 'ID notizia non valido' });

    const result = await dao.deleteNotiziaById(id);
    if (!result || !result.success) {
      return res.status(404).json({ success: false, error: 'Notizia non trovata' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Errore nell\'eliminazione della notizia:', error);
    res.status(500).json({ success: false, error: 'Errore interno del server' });
  }
});

// Edit news - redirect to create form with id
router.get('/notizie/edit/:id', canEditNotizia, async (req, res) => {
  const id = parseIdParam(req.params.id);
  if (!id) return res.status(400).render('error', { message: 'ID notizia non valido', error: { status: 400 } });
  res.redirect(`/crea-notizie?id=${id}`);
});

module.exports = router;