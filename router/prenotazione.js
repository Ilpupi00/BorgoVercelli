const express = require('express');
const router = express.Router();
const db = require('../db');

// 1. Lista campi attivi
router.get('/campi', (req, res) => {
    db.all('SELECT * FROM CAMPI WHERE attivo = 1', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// 2. Orari disponibili per un campo in una data
router.get('/campi/:id/disponibilita', (req, res) => {
    const campoId = req.params.id;
    const data = req.query.data;
    if (!data) return res.status(400).json({ error: 'Data richiesta' });
    // Orari fissi esempio
    const orariPossibili = [
        { inizio: '16:00', fine: '17:00' },
        { inizio: '18:00', fine: '19:00' },
        { inizio: '20:00', fine: '21:00' },
        { inizio: '21:00', fine: '22:00' }
    ];
    db.all(`SELECT ora_inizio, ora_fine FROM PRENOTAZIONI WHERE campo_id = ? AND data_prenotazione = ?`, [campoId, data], (err, prenotazioni) => {
        if (err) return res.status(500).json({ error: err.message });
        // Filtra orari già prenotati
        const disponibili = orariPossibili.filter(orario => {
            return !prenotazioni.some(p => p.ora_inizio === orario.inizio && p.ora_fine === orario.fine);
        });
        res.json(disponibili);
    });
});

// 3. Prenota un campo
router.post('/prenotazioni', (req, res) => {
    const { campo_id, utente_id, squadra_id, data_prenotazione, ora_inizio, ora_fine, tipo_attivita, note } = req.body;
    if (!campo_id || !data_prenotazione || !ora_inizio || !ora_fine) {
        return res.status(400).json({ error: 'Dati obbligatori mancanti' });
    }
    // Controlla se già prenotato
    db.get(`SELECT * FROM PRENOTAZIONI WHERE campo_id = ? AND data_prenotazione = ? AND ora_inizio = ? AND ora_fine = ?`, [campo_id, data_prenotazione, ora_inizio, ora_fine], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (row) return res.status(409).json({ error: 'Orario già prenotato' });
        db.run(`INSERT INTO PRENOTAZIONI (campo_id, utente_id, squadra_id, data_prenotazione, ora_inizio, ora_fine, tipo_attivita, note, stato, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'confermata', datetime('now'), datetime('now'))`,
            [campo_id, utente_id || null, squadra_id || null, data_prenotazione, ora_inizio, ora_fine, tipo_attivita || null, note || null],
            function (err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ success: true, id: this.lastID });
            }
        );
    });
});

module.exports = router;
