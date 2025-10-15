const express = require('express');
const router = express.Router();

router.get('/GetImmagini', async (req, res) => {
    try {
        res.json({ immagini: [] });
    } catch (err) {
        console.error('Errore recupero immagini:', err);
        res.status(500).json({ error: 'Errore nel recupero delle immagini' });
    }
});

module.exports = router;