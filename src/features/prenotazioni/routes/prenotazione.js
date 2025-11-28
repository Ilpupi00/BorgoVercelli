const express = require('express');
const router = express.Router();
const daoPrenotazione = require('../services/dao-prenotazione');
const daoCampi = require('../services/dao-campi');
const db = require('../../../core/config/database');
const { isLoggedIn } = require('../../../core/middlewares/auth');
const pushService = require('../../../shared/services/webpush');

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
        
        // Invia notifica push agli admin per nuova prenotazione
        try {
            const campo = await daoCampi.getCampoById(campo_id);
            const campoNome = campo ? campo.nome : `Campo ${campo_id}`;
            const dataFormatted = new Date(data_prenotazione).toLocaleDateString('it-IT');
            
            await pushService.sendNotificationToAdmins({
                title: '🔔 Nuova Prenotazione',
                body: `${campoNome} - ${dataFormatted} dalle ${ora_inizio} alle ${ora_fine}`,
                icon: '/assets/images/Logo.png',
                url: '/admin',
                tag: `prenotazione-${result.id}`,
                requireInteraction: true
            });
            console.log('[PUSH] Notifica nuova prenotazione inviata agli admin');
            // Invia anche una notifica di conferma all'utente che ha effettuato la prenotazione
            try {
                const bookingUserId = utente_id || (req.user && req.user.id) || result.utente_id;
                if (bookingUserId) {
                    await pushService.sendNotificationToUsers([bookingUserId], {
                        title: '✅ Prenotazione Effettuata',
                        body: `Hai prenotato: ${campoNome} - ${dataFormatted} dalle ${ora_inizio} alle ${ora_fine}`,
                        icon: '/assets/images/Logo.png',
                        url: '/prenotazione/mie_prenotazioni',
                        tag: `prenotazione-${result.id}-creata`,
                        requireInteraction: true
                    });
                    console.log(`[PUSH] Notifica conferma inviata all'utente ${bookingUserId}`);
                } else {
                    console.warn('[PUSH] Impossibile inviare conferma all\'utente: userId non disponibile');
                }
            } catch (userPushErr) {
                console.error('[PUSH] Errore invio notifica conferma all\'utente:', userPushErr);
            }
        } catch (pushErr) {
            console.error('[PUSH] Errore invio notifica admin:', pushErr);
            // Non blocca la risposta se la notifica fallisce
        }
        
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DEBUG: crea una prenotazione finta e invia le notifiche (no auth)
router.post('/prenotazioni/debug-create', async (req, res) => {
    const { campo_id, utente_id, data_prenotazione, ora_inizio, ora_fine } = req.body || {};
    if (!campo_id || !data_prenotazione || !ora_inizio || !ora_fine) {
        return res.status(400).json({ error: 'Dati obbligatori mancanti' });
    }

    try {
        // Costruisci un oggetto prenotazione finto
        const fakeResult = { id: Math.floor(Math.random() * 1000000), utente_id: utente_id || null };

        // Invia notifica admin (no DB lookup to avoid failures in debug mode)
        try {
            const campoNome = `Campo ${campo_id}`;
            const dataFormatted = new Date(data_prenotazione).toLocaleDateString('it-IT');

            await pushService.sendNotificationToAdmins({
                title: '🔔 Nuova Prenotazione (debug)',
                body: `${campoNome} - ${dataFormatted} dalle ${ora_inizio} alle ${ora_fine}`,
                icon: '/assets/images/Logo.png',
                url: '/admin',
                tag: `prenotazione-${fakeResult.id}`,
                requireInteraction: true
            });
        } catch (pushErr) {
            console.error('[PUSH DEBUG] Errore invio notifica admin:', pushErr);
        }

        // Invia notifica utente (se presente utente_id)
        try {
            const bookingUserId = utente_id || null;
            if (bookingUserId) {
                await pushService.sendNotificationToUsers([bookingUserId], {
                    title: '✅ Prenotazione Effettuata (debug)',
                    body: `Hai prenotato: ${campo_id} - ${data_prenotazione} dalle ${ora_inizio} alle ${ora_fine}`,
                    icon: '/assets/images/Logo.png',
                    url: '/prenotazione/mie_prenotazioni',
                    tag: `prenotazione-${fakeResult.id}-creata`,
                    requireInteraction: true
                });
            }
        } catch (userPushErr) {
            console.error('[PUSH DEBUG] Errore invio notifica utente:', userPushErr);
        }

        return res.json({ success: true, created: fakeResult });
    } catch (err) {
        console.error('[DEBUG CREATE] Errore:', err);
        return res.status(500).json({ error: err.message });
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
router.patch('/prenotazioni/:id/stato', isLoggedIn, async (req, res) => {
    const id = req.params.id;
    const { stato } = req.body;
    if (!stato) return res.status(400).json({ error: 'Stato richiesto' });
    
    console.log(`[ROUTE] PATCH /prenotazioni/${id}/stato - stato richiesto: ${stato}`);
    console.log(`[ROUTE] User:`, req.user ? `id=${req.user.id}, tipo=${req.user.tipo_utente_id}` : 'NON AUTENTICATO');
    
    try {
        // Recupera la prenotazione prima di modificarla
        const prenotazione = await daoPrenotazione.getPrenotazioneById(id);
        console.log(`[ROUTE] Prenotazione attuale:`, prenotazione);
        
        if (!prenotazione) {
            return res.status(404).json({ error: 'Prenotazione non trovata' });
        }
        
        // Verifica permessi per riattivazione
        if (stato === 'in_attesa' || stato === 'confermata') {
            if (prenotazione && prenotazione.stato === 'annullata' && prenotazione.annullata_da === 'admin') {
                // Solo gli admin possono riattivare prenotazioni annullate da admin
                const isAdmin = req.user && req.user.tipo_utente_id === 1;
                console.log(`[ROUTE] Tentativo riattivazione prenotazione annullata da admin. isAdmin=${isAdmin}`);
                if (!isAdmin) {
                    return res.status(403).json({ 
                        error: 'Non autorizzato', 
                        message: 'Non puoi riattivare una prenotazione annullata dall\'amministratore' 
                    });
                }
            }
        }
        
        // Determina chi sta annullando (se applicabile)
        let annullata_da = null;
        if (stato === 'annullata') {
            const isAdmin = req.user && req.user.tipo_utente_id === 1;
            annullata_da = isAdmin ? 'admin' : 'user';
            console.log(`[ROUTE] Annullamento da: ${annullata_da} (isAdmin=${isAdmin})`);
        }
        
        console.log(`[ROUTE] Chiamata DAO con: id=${id}, stato=${stato}, annullata_da=${annullata_da}`);
        const result = await daoPrenotazione.updateStatoPrenotazione(id, stato, annullata_da);
        console.log(`[ROUTE] Risultato DAO:`, result);
        
        // Invia notifiche push in base al cambio di stato
        try {
            const campo = await daoCampi.getCampoById(prenotazione.campo_id);
            const campoNome = campo ? campo.nome : `Campo ${prenotazione.campo_id}`;
            const dataFormatted = new Date(prenotazione.data_prenotazione).toLocaleDateString('it-IT');
            const oraInfo = `${prenotazione.ora_inizio} - ${prenotazione.ora_fine}`;
            
            if (stato === 'confermata') {
                // Notifica all'utente che la prenotazione è stata confermata
                await pushService.sendNotificationToUsers([prenotazione.utente_id], {
                    title: '✅ Prenotazione Confermata',
                    body: `${campoNome} - ${dataFormatted} ${oraInfo}`,
                    icon: '/assets/images/Logo.png',
                    url: '/prenotazione/mie_prenotazioni',
                    tag: `prenotazione-${id}-confermata`,
                    requireInteraction: true
                });
                console.log(`[PUSH] Notifica confermata inviata all'utente ${prenotazione.utente_id}`);
            } else if (stato === 'annullata') {
                if (annullata_da === 'user') {
                    // Notifica agli admin che l'utente ha annullato
                                        const resAdmins = await pushService.sendNotificationToAdmins({
                                                title: '❌ Prenotazione Annullata',
                                                body: `${campoNome} - ${dataFormatted} ${oraInfo}`,
                                                icon: '/assets/images/Logo.png',
                                                url: '/admin',
                                                tag: `prenotazione-${id}-annullata-user`
                                        });
                                        console.log('[PUSH] Notifica annullamento utente inviata agli admin', resAdmins);

                                        // Invia anche una notifica di conferma all'utente che ha annullato
                                        try {
                                            const resUser = await pushService.sendNotificationToUsers([prenotazione.utente_id], {
                                                title: '❌ Prenotazione Annullata',
                                                body: `Hai annullato: ${campoNome} - ${dataFormatted} ${oraInfo}`,
                                                icon: '/assets/images/Logo.png',
                                                url: '/prenotazione/mie_prenotazioni',
                                                tag: `prenotazione-${id}-annullata-user`
                                            });
                                            console.log(`[PUSH] Notifica annullamento inviata all'utente ${prenotazione.utente_id}`, resUser);
                                        } catch(eUserPush) {
                                            console.error('[PUSH] Errore invio notifica all\'utente che ha annullato:', eUserPush);
                                        }
                } else if (annullata_da === 'admin') {
                    // Notifica all'utente che l'admin ha annullato
                    await pushService.sendNotificationToUsers([prenotazione.utente_id], {
                        title: '❌ Prenotazione Annullata',
                        body: `L'amministratore ha annullato: ${campoNome} - ${dataFormatted} ${oraInfo}`,
                        icon: '/assets/images/Logo.png',
                        url: '/prenotazione/mie_prenotazioni',
                        tag: `prenotazione-${id}-annullata-admin`,
                        requireInteraction: true
                    });
                    console.log(`[PUSH] Notifica annullamento admin inviata all'utente ${prenotazione.utente_id}`);
                }
            }
        } catch (pushErr) {
            console.error('[PUSH] Errore invio notifica cambio stato:', pushErr);
            // Non blocca la risposta se la notifica fallisce
        }
        
        res.json(result);
    } catch (err) {
        console.error(`[ROUTE] Errore:`, err);
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
