const express = require('express');
const router = express.Router();
const daoGalleria = require('../services/dao-galleria');
const multer = require('multer');
const { isLoggedIn, isAdmin } = require('../middlewares/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'src/public/uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    cb(null, uniqueName);
  }
});

// File filter per accettare solo immagini
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

router.get('/GetImmagini', async (req, res) => {
    try {
        const immagini = await daoGalleria.getImmagini();
        res.json({ immagini: immagini });
    } catch (err) {
        console.error('Errore recupero immagini:', err);
        res.status(500).json({ error: 'Errore nel recupero delle immagini' });
    }
});

router.post('/UploadImmagine', (req, res, next) => {
  upload.single('image')(req, res, (err) => {
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
        if (!req.file) {
            return res.status(400).json({ error: 'Nessun file caricato' });
        }
        const filePath = 'src/public/uploads/' + req.file.filename;
        const descrizione = req.body.descrizione || '';
        const now = new Date().toISOString();
        await daoGalleria.insertImmagine(filePath, now, now, descrizione);
        res.json({ message: 'Immagine caricata con successo', url: filePath });

    } catch (err) {
        console.error('Errore upload immagine:', err);
        res.status(500).json({ error: 'Errore durante il caricamento della foto' });
    }
});

router.get('/test', (req, res) => {
    console.log('Route /test chiamata');
    res.json({ immagini: [{ test: 'ok' }] });
});

router.put('/UpdateImmagine/:id', isLoggedIn, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { descrizione } = req.body;
        await daoGalleria.updateImmagine(id, descrizione);
        res.json({ message: 'Immagine aggiornata con successo' });
    } catch (err) {
        console.error('Errore aggiornamento immagine:', err);
        res.status(500).json({ error: err.error || 'Errore durante l\'aggiornamento dell\'immagine' });
    }
});

router.delete('/DeleteImmagine/:id', isLoggedIn, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await daoGalleria.deleteImmagine(id);
        res.json({ message: 'Immagine eliminata con successo' });
    } catch (err) {
        console.error('Errore eliminazione immagine:', err);
        res.status(500).json({ error: err.error || 'Errore durante l\'eliminazione dell\'immagine' });
    }
});

module.exports = router;