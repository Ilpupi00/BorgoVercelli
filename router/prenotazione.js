const express = require('express');
const router = express.Router();
const daoPrenotazione = require('../dao/dao-prenotazione');

// 1. Lista campi attivi
router.get('/campi', (req, res) => {
    daoPrenotazione.getCampiAttivi((err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// 2. Orari disponibili per un campo in una data
router.get('/campi/:id/disponibilita', (req, res) => {
    const campoId = req.params.id;
    const data = req.query.data;
    if (!data) return res.status(400).json({ error: 'Data richiesta' });
    daoPrenotazione.getDisponibilitaCampo(campoId, data, (err, disponibili) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(disponibili);
    });
});

// 3. Prenota un campo
router.post('/prenotazioni', (req, res) => {
    const { campo_id, utente_id, squadra_id, data_prenotazione, ora_inizio, ora_fine, tipo_attivita, note } = req.body;
    if (!campo_id || !data_prenotazione || !ora_inizio || !ora_fine) {
        return res.status(400).json({ error: 'Dati obbligatori mancanti' });
    }
    daoPrenotazione.prenotaCampo({ campo_id, utente_id, squadra_id, data_prenotazione, ora_inizio, ora_fine, tipo_attivita, note }, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result && result.error) return res.status(409).json(result);
        res.json(result);
    });
});

module.exports = router;
