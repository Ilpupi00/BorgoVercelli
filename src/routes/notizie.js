const express = require('express');
const router = express.Router();
const dao = require('../services/dao-notizie');
const daoGalleria = require('../services/dao-galleria');
const { isLoggedIn, isAdminOrDirigente, isAdmin, canEditNotizia } = require('../middlewares/auth');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'src/public/uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Solo file immagine sono permessi'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  }
});

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
    const notizia = await dao.getNotiziaById(req.params.id);
    if (!notizia) {
      return res.status(404).render('error', { message: 'Notizia non trovata', error: { status: 404 } });
    }
    res.render('Notizie/visualizza_notizia', { notizia });
  } catch (error) {
    console.error('Errore nel caricamento della notizia:', error);
    res.status(500).render('error', { message: 'Errore nel caricamento della notizia', error: { status: 500 } });
  }
});

// API: get single news JSON
router.get('/api/notizia/:id', async (req, res) => {
  try {
    const notizia = await dao.getNotiziaById(req.params.id);
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
    res.render('Notizie/notizia', { user: req.user, notizia, error: null });
  } catch (error) {
    console.error('Errore nel caricamento del form notizia:', error);
    res.render('Notizie/notizia', { user: req.user, notizia: null, error: 'Errore nel caricamento della notizia' });
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
      pubblicata: pubblicata ? 1 : 0
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

    const id = req.params.id;
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
      const url = '/uploads/' + req.file.filename;
      const result = await daoGalleria.insertImmagineNotizia(url, id, 1);
      immagineId = result.id;
    }

    const notiziaData = {
      titolo,
      contenuto,
      sottotitolo: sottotitolo || '',
      immagine_principale_id: immagineId,
      pubblicata: pubblicata ? 1 : 0
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

    const id = req.params.id;
    const { pubblicata } = req.body;
    const updateData = {
      pubblicata: pubblicata ? 1 : 0
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
    await dao.deleteNotiziaById(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Errore nell\'eliminazione della notizia:', error);
    res.status(500).json({ success: false, error: 'Errore interno del server' });
  }
});

// Edit news - redirect to create form with id
router.get('/notizie/edit/:id', canEditNotizia, async (req, res) => {
  res.redirect(`/crea-notizie?id=${req.params.id}`);
});

module.exports = router;