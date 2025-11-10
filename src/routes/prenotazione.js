const express = require('express');
const router = express.Router();
const daoPrenotazione = require('../services/dao-prenotazione');
const db = require('../config/database');
const { isLoggedIn } = require('../middlewares/auth');

// 1. Lista campi attivi
router.get('/campi', async (req, res) => {
    try {
        const campi = await daoPrenotazione.getCampiAttivi();
        res.json(campi);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Orari disponibili per un campo in una data
router.get('/campi/:id/disponibilita', async (req, res) => {
    const campoId = req.params.id;
    const data = req.query.data;
    if (!data) return res.status(400).json({ error: 'Data richiesta' });
    try {
        const disponibili = await daoPrenotazione.getDisponibilitaCampo(campoId, data);
        res.json(disponibili);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Prenota un campo
router.post('/prenotazioni', isLoggedIn, async (req, res) => {
    const { campo_id, utente_id, squadra_id, data_prenotazione, ora_inizio, ora_fine, tipo_attivita, note } = req.body;
    console.log('[PRENOTAZIONE] Dati ricevuti:', req.body);
    if (!campo_id || !data_prenotazione || !ora_inizio || !ora_fine) {
        return res.status(400).json({ error: 'Dati obbligatori mancanti' });
    }
    try {
        const result = await daoPrenotazione.prenotaCampo({ campo_id, utente_id, squadra_id, data_prenotazione, ora_inizio, ora_fine, tipo_attivita, note });
        if (result && result.error) return res.status(409).json(result);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. Ottieni prenotazione per ID
router.get('/prenotazioni/:id', async (req, res) => {
    const id = req.params.id;
    try {
        const prenotazione = await daoPrenotazione.getPrenotazioneById(id);
        if (!prenotazione) return res.status(404).json({ error: 'Prenotazione non trovata' });
        res.json(prenotazione);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. Aggiorna stato prenotazione
router.patch('/prenotazioni/:id/stato', async (req, res) => {
    const id = req.params.id;
    const { stato } = req.body;
    if (!stato) return res.status(400).json({ error: 'Stato richiesto' });
    try {
        const result = await daoPrenotazione.updateStatoPrenotazione(id, stato);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 6. Aggiorna prenotazione
router.put('/prenotazioni/:id', async (req, res) => {
    const id = req.params.id;
    const { campo_id, utente_id, squadra_id, data_prenotazione, ora_inizio, ora_fine, tipo_attivita, note } = req.body;
    try {
        const result = await daoPrenotazione.updatePrenotazione(id, { campo_id, utente_id, squadra_id, data_prenotazione, ora_inizio, ora_fine, tipo_attivita, note });
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 7. Elimina prenotazione
router.delete('/prenotazioni/:id', async (req, res) => {
    const id = req.params.id;
    try {
        const result = await daoPrenotazione.deletePrenotazione(id);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 8. Controlla e aggiorna scadute
router.post('/prenotazioni/check-scadute', async (req, res) => {
    try {
        const result = await daoPrenotazione.checkAndUpdateScadute();
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 9. Elimina tutte le scadute
router.delete('/prenotazioni/scadute', async (req, res) => {
    try {
        console.error('[route prenotazioni] DELETE /prenotazioni/scadute invoked');
        // Prima di cancellare, assicurati di marcare come 'scaduta' tutte le prenotazioni già passate
        try {
            await daoPrenotazione.checkAndUpdateScadute();
        } catch (e) {
            // Se fallisce il controllo, logga ma procedi con la cancellazione comunque
            console.error('Errore durante il check delle scadute prima della cancellazione:', e);
        }
        
    // call DAO to delete scadute and normalize the response so the front-end
    // can read either `deleted`, `changes` or `actualChanges` depending on
    // historical variations.
    const result = await daoPrenotazione.deleteScadute();
    console.error(`[route prenotazioni] deleteScadute dao result: ${JSON.stringify(result)}`);
    const count = result.deleted || result.actualChanges || result.changes || 0;
    res.json({ success: !!result.success, deleted: count, changes: count });
    } catch (err) {
        console.error('[route prenotazioni] Error in DELETE /prenotazioni/scadute:', err);
        res.status(500).json({ error: err.message });
    }
});

// 10. Ottieni prenotazioni per utente
router.get('/user/:userId', async (req, res) => {
    const userId = req.params.userId;
    try {
        const prenotazioni = await daoPrenotazione.getPrenotazioniByUserId(userId);
        res.json(prenotazioni);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DEBUG route (temporary) - list all prenotazioni
router.get('/prenotazioni/debug-list', async (req, res) => {
    db.all(`SELECT id, campo_id, data_prenotazione, ora_inizio, ora_fine, stato FROM PRENOTAZIONI ORDER BY id DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows || []);
    });
});

// 11. Accetta automaticamente prenotazioni in attesa da più di 3 giorni
router.post('/prenotazioni/auto-accept', async (req, res) => {
    try {
        const result = await daoPrenotazione.autoAcceptPendingBookings();
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
