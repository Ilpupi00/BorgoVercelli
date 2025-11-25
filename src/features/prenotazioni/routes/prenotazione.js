const express = require('express');
const router = express.Router();
const daoPrenotazione = require('../services/dao-prenotazione');
const db = require('../../../core/config/database');
const { isLoggedIn } = require('../../../core/middlewares/auth');

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
    // Verifica stato utente
    if (req.user.isBannato && req.user.isBannato()) {
        return res.status(403).json({ 
            error: 'Account bannato', 
            type: 'banned',
            message: 'Non puoi effettuare prenotazioni perché il tuo account è stato bannato.' 
        });
    }
    
    if (req.user.isSospeso && req.user.isSospeso()) {
        const moment = require('moment');
        const dataFine = req.user.data_fine_sospensione 
            ? moment(req.user.data_fine_sospensione).format('DD/MM/YYYY HH:mm')
            : 'Non specificato';
        return res.status(403).json({ 
            error: 'Account sospeso', 
            type: 'suspended',
            message: `Non puoi effettuare prenotazioni perché il tuo account è sospeso fino al ${dataFine}. Motivo: ${req.user.motivo_sospensione || 'Non specificato'}`,
            dataFine: dataFine,
            motivo: req.user.motivo_sospensione || 'Non specificato'
        });
    }
    
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

// 7. Elimina prenotazione (id numerico)
// Restringiamo :id a valori numerici per evitare che percorsi come
// '/prenotazioni/scadute' vengano intercettati dalla route generica.
router.delete('/prenotazioni/:id(\\d+)', async (req, res) => {
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
        console.error('[route prenotazioni] DELETE /prenotazioni/scadute invoked (route PID:', process.pid, ')');

        // helper to run db.get with Promise
        const getCount = (sql) => new Promise((resolve, reject) => {
            db.get(sql, [], (err, row) => {
                if (err) return reject(err);
                resolve((row && row.cnt) || 0);
            });
        });

        const before = await getCount("SELECT COUNT(*) as cnt FROM PRENOTAZIONI WHERE stato = 'scaduta'");
        console.error(`[route:${process.pid}] count scadute before route action: ${before}`);

        // Ensure scadute are marked first
        try {
            await daoPrenotazione.checkAndUpdateScadute();
        } catch (e) {
            console.error('[route] checkAndUpdateScadute error', e);
        }

        // Call DAO deletion (DAO logs internal before/after)
        let result;
        try {
            result = await daoPrenotazione.deleteScadute();
        } catch (e) {
            console.error('[route] dao.deleteScadute error', e);
            return res.status(500).json({ success: false, error: e.message });
        }

        console.error(`[route:${process.pid}] dao.deleteScadute returned: ${JSON.stringify(result)}`);

        const after = await getCount("SELECT COUNT(*) as cnt FROM PRENOTAZIONI WHERE stato = 'scaduta'");
        console.error(`[route:${process.pid}] count scadute after dao action: ${after}`);

        const count = result && (result.deleted || result.changes || 0);
        return res.json({ success: !!(result && result.success), deleted: count, changes: count, before, after });
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
