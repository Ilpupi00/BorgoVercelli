const express = require('express');
const router = express.Router();
const daoPrenotazione = require('../services/dao-prenotazione');
const daoCampi = require('../services/dao-campi');
const db = require('../../../core/config/database');
const { isLoggedIn } = require('../../../core/middlewares/auth');
const notifications = require('../../../shared/services/notifications');

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
    
    const { campo_id, utente_id, squadra_id, data_prenotazione, ora_inizio, ora_fine, tipo_attivita, note, telefono, codice_fiscale, tipo_documento, numero_documento } = req.body;
    console.log('[PRENOTAZIONE] Dati ricevuti:', req.body);
    if (!campo_id || !data_prenotazione || !ora_inizio || !ora_fine) {
        return res.status(400).json({ error: 'Dati obbligatori mancanti' });
    }
    
    // Validazione telefono obbligatorio
    if (!telefono || telefono.trim().length === 0) {
        return res.status(400).json({ 
            error: 'Numero di telefono obbligatorio',
            field: 'telefono',
            message: 'Devi fornire un numero di telefono per completare la prenotazione' 
        });
    }
    
    // Validazione documento di identità (se fornito)
    if (tipo_documento) {
        // Tipo documento deve essere 'CF' o 'ID'
        if (tipo_documento !== 'CF' && tipo_documento !== 'ID') {
            return res.status(400).json({
                error: 'Tipo documento non valido',
                field: 'tipo_documento',
                message: 'Il tipo documento deve essere "CF" (Codice Fiscale) o "ID" (Documento Identità)'
            });
        }
        
        // Se tipo_documento='CF', richiede codice_fiscale di 16 caratteri
        if (tipo_documento === 'CF') {
            if (!codice_fiscale || codice_fiscale.trim().length !== 16) {
                return res.status(400).json({
                    error: 'Codice fiscale non valido',
                    field: 'codice_fiscale',
                    message: 'Il codice fiscale deve essere esattamente 16 caratteri alfanumerici'
                });
            }
            // Pattern CF italiano: 6 lettere, 2 numeri, 1 lettera, 2 numeri, 1 lettera, 3 numeri, 1 lettera
            const cfPattern = /^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/i;
            if (!cfPattern.test(codice_fiscale.trim())) {
                return res.status(400).json({
                    error: 'Formato codice fiscale non valido',
                    field: 'codice_fiscale',
                    message: 'Il codice fiscale non rispetta il formato italiano standard'
                });
            }
        }
        
        // Se tipo_documento='ID', richiede numero_documento (minimo 5 caratteri)
        if (tipo_documento === 'ID') {
            if (!numero_documento || numero_documento.trim().length < 5) {
                return res.status(400).json({
                    error: 'Numero documento non valido',
                    field: 'numero_documento',
                    message: 'Il numero del documento deve contenere almeno 5 caratteri'
                });
            }
        }
    }
    
    // Validazione data e ora: deve essere almeno 2 ore nel futuro
    try {
        const [oraH, oraM] = ora_inizio.split(':').map(Number);
        const prenotazioneDate = new Date(data_prenotazione);
        prenotazioneDate.setHours(oraH, oraM, 0, 0);
        const now = new Date();
        const minTime = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 ore da adesso
        
        if (prenotazioneDate < minTime) {
            return res.status(400).json({
                error: 'Orario non valido',
                message: 'Le prenotazioni devono essere effettuate con almeno 2 ore di anticipo',
                minDateTime: minTime.toISOString()
            });
        }
    } catch (validationErr) {
        console.error('[PRENOTAZIONE] Errore validazione data/ora:', validationErr);
        return res.status(400).json({ error: 'Data o ora non valida' });
    }
    try {
        const result = await daoPrenotazione.prenotaCampo({ 
            campo_id, 
            utente_id, 
            squadra_id, 
            data_prenotazione, 
            ora_inizio, 
            ora_fine, 
            tipo_attivita, 
            note,
            telefono,
            codice_fiscale,
            tipo_documento,
            numero_documento
        });
        if (result && result.error) return res.status(409).json(result);
        
        // Invia notifica push agli admin per nuova prenotazione
        try {
            const campo = await daoCampi.getCampoById(campo_id);
            const campoNome = campo ? campo.nome : `Campo ${campo_id}`;
            const dataFormatted = new Date(data_prenotazione).toLocaleDateString('it-IT');
            
            await notifications.queueNotificationForAdmins({
                title: '🔔 Nuova Prenotazione',
                body: `${campoNome} - ${dataFormatted} dalle ${ora_inizio} alle ${ora_fine}`,
                icon: '/assets/images/Logo.png',
                url: '/admin',
                tag: `prenotazione-${result.id}`,
                requireInteraction: true
            });
            console.log('[PUSH] Notifica nuova prenotazione accodata per admin');
            // Invia anche una notifica di conferma all'utente che ha effettuato la prenotazione
            try {
                const bookingUserId = utente_id || (req.user && req.user.id) || result.utente_id;
                if (bookingUserId) {
                    await notifications.queueNotificationForUsers([bookingUserId], {
                        title: '✅ Prenotazione Effettuata',
                        body: `Hai prenotato: ${campoNome} - ${dataFormatted} dalle ${ora_inizio} alle ${ora_fine}`,
                        icon: '/assets/images/Logo.png',
                        url: '/users/mie-prenotazioni',
                        tag: `prenotazione-${result.id}-creata`,
                        requireInteraction: true
                    });
                    console.log(`[PUSH] Notifica conferma accodata per utente ${bookingUserId}`);
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

            await notifications.queueNotificationForAdmins({
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
                await notifications.queueNotificationForUsers([bookingUserId], {
                    title: '✅ Prenotazione Effettuata (debug)',
                    body: `Hai prenotato: ${campo_id} - ${data_prenotazione} dalle ${ora_inizio} alle ${ora_fine}`,
                    icon: '/assets/images/Logo.png',
                    url: '/users/mie-prenotazioni',
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

// 4. Ottieni tutte le prenotazioni di un utente
router.get('/prenotazioni/user/:userId', async (req, res) => {
    const userId = req.params.userId;
    try {
        const prenotazioni = await daoPrenotazione.getPrenotazioniByUserId(userId);
        res.json(prenotazioni);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. Ottieni prenotazione per ID
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
        
        // Se utente annulla, notifica gli admin
        if (stato === 'annullata' && annullata_da === 'user') {
            try {
                const campo = await daoCampi.getCampoById(prenotazione.campo_id);
                const campoNome = campo ? campo.nome : `Campo ${prenotazione.campo_id}`;
                const dataFormatted = new Date(prenotazione.data_prenotazione).toLocaleDateString('it-IT');
                const oraInfo = `${prenotazione.ora_inizio} - ${prenotazione.ora_fine}`;
                
                await notifications.queueNotificationForAdmins({
                    title: '❌ Prenotazione Annullata',
                    body: `Utente ha annullato: ${campoNome} - ${dataFormatted} ${oraInfo}`,
                    icon: '/assets/images/Logo.png',
                    url: '/admin/prenotazioni',
                    tag: `prenotazione-${id}-annullata-user`,
                    requireInteraction: false
                });
                console.log(`[PUSH] Notifica annullamento utente accodata per admin`);
                
                // Notifica anche l'utente di conferma annullamento
                await notifications.queueNotificationForUsers([prenotazione.utente_id], {
                    title: '❌ Prenotazione Annullata',
                    body: `Hai annullato: ${campoNome} - ${dataFormatted} ${oraInfo}`,
                    icon: '/assets/images/Logo.png',
                    url: '/users/mie-prenotazioni',
                    tag: `prenotazione-${id}-annullata-user-confirm`
                });
                console.log(`[PUSH] Notifica conferma annullamento accodata per utente ${prenotazione.utente_id}`);
            } catch (pushErr) {
                console.error('[PUSH] Errore invio notifica annullamento utente:', pushErr);
            }
        }
        
        res.json(result);
    } catch (err) {
        console.error(`[ROUTE] Errore:`, err);
        res.status(500).json({ error: err.message });
    }
});

// 6. Aggiorna prenotazione
router.put('/prenotazioni/:id', isLoggedIn, async (req, res) => {
    const id = req.params.id;
    const { campo_id, utente_id, squadra_id, data_prenotazione, ora_inizio, ora_fine, tipo_attivita, note, telefono, codice_fiscale, tipo_documento, numero_documento, modified_by_admin } = req.body;
    
    // Verifica se l'utente è admin
    const isAdmin = req.user && req.user.tipo_utente_id === 1;
    
    console.log(`[UPDATE PRENOTAZIONE] ID: ${id}, isAdmin: ${isAdmin}, modified_by_admin flag: ${modified_by_admin}`);
    
    // Validazione telefono obbligatorio
    if (!telefono || telefono.trim().length === 0) {
        return res.status(400).json({ 
            error: 'Numero di telefono obbligatorio',
            field: 'telefono',
            message: 'Devi fornire un numero di telefono' 
        });
    }
    
    // Validazione formato telefono
    const phoneRegex = /^\+39\s?[0-9]{9,10}$/;
    if (!phoneRegex.test(telefono.trim())) {
        return res.status(400).json({
            error: 'Formato telefono non valido',
            field: 'telefono',
            message: 'Il numero deve essere in formato: +39 seguito da 9-10 cifre (es: +39 3331234567)'
        });
    }
    
    // Validazione documento di identità (se fornito)
    if (tipo_documento) {
        if (tipo_documento !== 'CF' && tipo_documento !== 'ID') {
            return res.status(400).json({
                error: 'Tipo documento non valido',
                field: 'tipo_documento',
                message: 'Il tipo documento deve essere "CF" (Codice Fiscale) o "ID" (Documento Identità)'
            });
        }
        
        if (tipo_documento === 'CF') {
            if (!codice_fiscale || codice_fiscale.trim().length !== 16) {
                return res.status(400).json({
                    error: 'Codice fiscale non valido',
                    field: 'codice_fiscale',
                    message: 'Il codice fiscale deve essere esattamente 16 caratteri alfanumerici'
                });
            }
            const cfPattern = /^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/i;
            if (!cfPattern.test(codice_fiscale.trim())) {
                return res.status(400).json({
                    error: 'Formato codice fiscale non valido',
                    field: 'codice_fiscale',
                    message: 'Il codice fiscale non rispetta il formato italiano standard'
                });
            }
        }
        
        if (tipo_documento === 'ID') {
            if (!numero_documento || numero_documento.trim().length < 5) {
                return res.status(400).json({
                    error: 'Numero documento non valido',
                    field: 'numero_documento',
                    message: 'Il numero del documento deve contenere almeno 5 caratteri'
                });
            }
        }
    }
    
    try {
        // Recupera prenotazione corrente per verificare lo stato e inviare notifiche
        const prenotazioneCorrente = await daoPrenotazione.getPrenotazioneById(id);
        
        if (!prenotazioneCorrente) {
            return res.status(404).json({ error: 'Prenotazione non trovata' });
        }
        
        // Determina se cambiare lo stato
        let nuovoStato = prenotazioneCorrente.stato;
        
        // Se l'utente (non admin) modifica una prenotazione confermata, riporta in attesa
        if (!isAdmin && !modified_by_admin && prenotazioneCorrente.stato === 'confermata') {
            nuovoStato = 'in_attesa';
            console.log(`[UPDATE PRENOTAZIONE] User modifica prenotazione confermata: stato cambiato da 'confermata' a 'in_attesa'`);
        }
        
        // Admin non cambia mai lo stato automaticamente
        if (isAdmin || modified_by_admin) {
            console.log(`[UPDATE PRENOTAZIONE] Admin modifica: stato rimane '${nuovoStato}'`);
        }
        
        // Aggiorna prenotazione
        const result = await daoPrenotazione.updatePrenotazione(id, { 
            campo_id, 
            utente_id, 
            squadra_id, 
            data_prenotazione, 
            ora_inizio, 
            ora_fine, 
            tipo_attivita, 
            note,
            telefono,
            codice_fiscale,
            tipo_documento,
            numero_documento
        });
        
        // Se lo stato è cambiato (user ha modificato), aggiorna anche lo stato
        if (nuovoStato !== prenotazioneCorrente.stato) {
            await daoPrenotazione.updateStatoPrenotazione(id, nuovoStato, null);
        }
        
        // Invia notifiche
        try {
            const campo = await daoCampi.getCampoById(campo_id);
            const campoNome = campo ? campo.nome : `Campo ${campo_id}`;
            const dataFormatted = new Date(data_prenotazione).toLocaleDateString('it-IT');
            const oraInfo = `${ora_inizio} - ${ora_fine}`;
            
            if (isAdmin || modified_by_admin) {
                // Admin ha modificato: notifica utente
                await notifications.queueNotificationForUsers([utente_id], {
                    title: '✏️ Prenotazione Modificata',
                    body: `L'amministratore ha modificato la tua prenotazione: ${campoNome} - ${dataFormatted} ${oraInfo}`,
                    icon: '/assets/images/Logo.png',
                    url: '/users/mie-prenotazioni',
                    tag: `prenotazione-${id}-modified-admin`,
                    requireInteraction: true
                });
                console.log(`[PUSH] Notifica modifica admin inviata a utente ${utente_id}`);
            } else {
                // User ha modificato: notifica admin che serve nuova approvazione
                await notifications.queueNotificationForAdmins({
                    title: '🔄 Prenotazione Modificata - Richiesta Approvazione',
                    body: `Utente ha modificato prenotazione (torna in attesa): ${campoNome} - ${dataFormatted} ${oraInfo}`,
                    icon: '/assets/images/Logo.png',
                    url: '/admin/prenotazioni',
                    tag: `prenotazione-${id}-modified-user`,
                    requireInteraction: true
                });
                console.log(`[PUSH] Notifica modifica user inviata agli admin (richiesta approvazione)`);
                
                // Notifica anche l'utente che la prenotazione è tornata in attesa
                await notifications.queueNotificationForUsers([utente_id], {
                    title: '⏳ Prenotazione In Attesa di Approvazione',
                    body: `La tua modifica è stata salvata. La prenotazione è tornata in attesa di conferma: ${campoNome} - ${dataFormatted} ${oraInfo}`,
                    icon: '/assets/images/Logo.png',
                    url: '/users/mie-prenotazioni',
                    tag: `prenotazione-${id}-modified-user-confirm`
                });
                console.log(`[PUSH] Notifica conferma modifica inviata a utente ${utente_id}`);
            }
        } catch (pushErr) {
            console.error('[PUSH] Errore invio notifiche modifica prenotazione:', pushErr);
        }
        
        res.json({ ...result, stato: nuovoStato });
    } catch (err) {
        console.error('[UPDATE PRENOTAZIONE] Errore:', err);
        res.status(500).json({ error: err.message });
    }
});

// 7. Elimina prenotazione (id numerico)
// Se la prenotazione è attiva o confermata, deve prima essere annullata
router.delete('/prenotazioni/:id(\\d+)', isLoggedIn, async (req, res) => {
    const id = req.params.id;
    try {
        // Recupera la prenotazione per verificare lo stato
        const prenotazione = await daoPrenotazione.getPrenotazioneById(id);
        
        if (!prenotazione) {
            return res.status(404).json({ error: 'Prenotazione non trovata' });
        }
        
        // Se la prenotazione è attiva (in_attesa o confermata), deve prima essere annullata
        if (prenotazione.stato === 'in_attesa' || prenotazione.stato === 'confermata') {
            // Determina chi sta annullando
            const isAdmin = req.user && req.user.tipo_utente_id === 1;
            const annullata_da = isAdmin ? 'admin' : 'user';
            
            console.log(`[DELETE PRENOTAZIONE] Prenotazione ${id} attiva, annullamento automatico da ${annullata_da}`);
            
            // Annulla prima di eliminare
            await daoPrenotazione.updateStatoPrenotazione(id, 'annullata', annullata_da);
            
            // Invia notifiche di annullamento
            try {
                const campo = await daoCampi.getCampoById(prenotazione.campo_id);
                const campoNome = campo ? campo.nome : `Campo ${prenotazione.campo_id}`;
                const dataFormatted = new Date(prenotazione.data_prenotazione).toLocaleDateString('it-IT');
                const oraInfo = `${prenotazione.ora_inizio} - ${prenotazione.ora_fine}`;
                
                if (annullata_da === 'admin') {
                    // Admin ha annullato: notifica utente
                    await notifications.queueNotificationForUsers([prenotazione.utente_id], {
                        title: '❌ Prenotazione Annullata ed Eliminata',
                        body: `L'amministratore ha annullato ed eliminato: ${campoNome} - ${dataFormatted} ${oraInfo}`,
                        icon: '/assets/images/Logo.png',
                        url: '/users/mie-prenotazioni',
                        tag: `prenotazione-${id}-deleted-admin`
                    });
                } else {
                    // Utente ha annullato: notifica admin
                    await notifications.queueNotificationForAdmins({
                        title: '❌ Prenotazione Annullata ed Eliminata',
                        body: `Utente ha annullato ed eliminato: ${campoNome} - ${dataFormatted} ${oraInfo}`,
                        icon: '/assets/images/Logo.png',
                        url: '/admin/prenotazioni',
                        tag: `prenotazione-${id}-deleted-user`
                    });
                }
                
                console.log(`[PUSH] Notifiche annullamento+eliminazione inviate`);
            } catch (pushErr) {
                console.error('[PUSH] Errore invio notifica annullamento:', pushErr);
            }
        }
        
        // Ora elimina la prenotazione
        const result = await daoPrenotazione.deletePrenotazione(id);
        console.log(`[DELETE PRENOTAZIONE] Prenotazione ${id} eliminata definitivamente`);
        res.json({ ...result, annullata: (prenotazione.stato === 'in_attesa' || prenotazione.stato === 'confermata') });
    } catch (err) {
        console.error('[DELETE PRENOTAZIONE] Errore:', err);
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
