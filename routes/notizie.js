
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

// Route per mostrare il form di creazione/modifica notizia
router.get('/crea-notizie', isLoggedIn, isAdmin, async (req, res) => {
  try {
    let notizia = null;
    const id = req.query.id;

    if (id) {
      // Modifica notizia esistente
      notizia = await dao.getNotiziaById(id);
    }

    res.render('crea_notizie', {
      user: req.user,
      notizia: notizia,
      error: null
    });
  } catch (error) {
    console.error('Errore nel caricamento del form notizia:', error);
    res.render('crea_notizie', {
      user: req.user,
      notizia: null,
      error: 'Errore nel caricamento della notizia'
    });
  }
});

// Route per creare una nuova notizia
router.post('/notizie/nuova', isLoggedIn, isAdmin, async (req, res) => {
  try {
    const { titolo, contenuto, sottotitolo, immagine_principale_id, pubblicata } = req.body;

    // Validazione dimensione contenuto (max 5MB)
    if (contenuto && Buffer.byteLength(contenuto, 'utf8') > 5 * 1024 * 1024) {
      return res.render('crea_notizie', {
        user: req.user,
        notizia: null,
        error: 'Il contenuto della notizia è troppo grande (max 5MB). Riduci il contenuto.'
      });
    }

    if (!titolo || !contenuto) {
      return res.render('crea_notizie', {
        user: req.user,
        notizia: null,
        error: 'Titolo e contenuto sono obbligatori'
      });
    }

    const notiziaData = {
      titolo,
      contenuto,
      sottotitolo: sottotitolo || '',
      immagine_principale_id: immagine_principale_id || null,
      autore_id: req.user.id,
      pubblicata: pubblicata === 'on' ? 1 : 0,
      data_pubblicazione: pubblicata === 'on' ? new Date().toISOString() : null
    };

    await dao.createNotizia(notiziaData);

    res.redirect('/admin/notizie');
  } catch (error) {
    console.error('Errore nella creazione della notizia:', error);
    res.render('crea_notizie', {
      user: req.user,
      notizia: null,
      error: 'Errore nella creazione della notizia'
    });
  }
});

// Route per aggiornare una notizia esistente
router.post('/notizie/:id', isLoggedIn, isAdmin, async (req, res) => {
  try {
    const { titolo, contenuto, sottotitolo, immagine_principale_id, pubblicata } = req.body;
    const id = req.params.id;

    // Validazione dimensione contenuto (max 5MB)
    if (contenuto && Buffer.byteLength(contenuto, 'utf8') > 5 * 1024 * 1024) {
      const notizia = await dao.getNotiziaById(id);
      return res.render('crea_notizie', {
        user: req.user,
        notizia: notizia,
        error: 'Il contenuto della notizia è troppo grande (max 5MB). Riduci il contenuto.'
      });
    }

    if (!titolo || !contenuto) {
      const notizia = await dao.getNotiziaById(id);
      return res.render('crea_notizie', {
        user: req.user,
        notizia: notizia,
        error: 'Titolo e contenuto sono obbligatori'
      });
    }

    const notiziaData = {
      titolo,
      contenuto,
      sottotitolo: sottotitolo || '',
      immagine_principale_id: immagine_principale_id || null,
      pubblicata: pubblicata === 'on' ? 1 : 0,
      data_pubblicazione: pubblicata === 'on' ? new Date().toISOString() : null
    };

    await dao.updateNotizia(id, notiziaData);

    res.redirect('/admin/notizie');
  } catch (error) {
    console.error('Errore nell\'aggiornamento della notizia:', error);
    const notizia = await dao.getNotiziaById(req.params.id);
    res.render('crea_notizie', {
      user: req.user,
      notizia: notizia,
      error: 'Errore nell\'aggiornamento della notizia'
    });
  }
});

// Route per pubblicare/sospendere una notizia
router.put('/notizia/:id/publish', isLoggedIn, isAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    const { pubblicata } = req.body;

    const updateData = {
      pubblicata: pubblicata ? 1 : 0,
      data_pubblicazione: pubblicata ? new Date().toISOString() : null
    };

    await dao.updateNotizia(id, updateData);

    res.json({ success: true, message: pubblicata ? 'Notizia pubblicata' : 'Notizia sospesa' });
  } catch (error) {
    console.error('Errore nella pubblicazione/sospensione della notizia:', error);
    res.status(500).json({ success: false, error: 'Errore nell\'operazione' });
  }
});

module.exports = router;