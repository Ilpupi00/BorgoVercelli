
const express = require('express');
const router = express.Router();
const daoGalleria = require('../dao/dao-galleria');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configurazione multer per upload immagini
const uploadDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'galleria_' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

router.post('/UploadImmagine', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Nessun file caricato' });
        }
        const descrizione = req.body.descrizione || '';
        const nome = req.file.originalname;
        const url = '/uploads/' + req.file.filename;
        const now = new Date().toISOString();
        await daoGalleria.insertImmagine(url,now, now);
        res.json({ message: 'Immagine caricata con successo', url });

    } catch (err) {
        console.error('Errore upload immagine:', err);
        res.status(500).json({ error: 'Errore durante il caricamento della foto' });
    }
});

router.get('/GetImmagini', (req, res) => {
    daoGalleria.getImmagini()
        .then((immagini) => {
            console.log('Immagini recuperate con successo:', immagini);
            if (!immagini || immagini.length === 0) {
                console.warn('Nessuna immagine trovata');
                return res.status(404).json({ error: 'Nessuna immagine trovata' });
            }
            res.json({ immagini: immagini });
        })
        .catch((err) => {
            console.error('Errore nel recupero delle immagini:', err);
            res.status(500).json({ error: 'Errore nel caricamento delle immagini' });
        });
});

module.exports = router;