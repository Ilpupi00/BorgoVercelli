'use strict';
const express = require('express');
const path = require('path');
const router = express.Router();
const daoNotizie = require('../../features/notizie/services/dao-notizie');
const daoEventi = require('../../features/eventi/services/dao-eventi');
const daoRecensioni = require('../../features/recensioni/services/dao-recensioni');
const daoMembriSocieta = require('../../features/squadre/services/dao-membri-societa');
const daoSquadre = require('../../features/squadre/services/dao-squadre');
const daoCampi = require('../../features/prenotazioni/services/dao-campi');
const { isLoggedIn, isDirigente, isAdminOrDirigente, isStaffOrAdmin, canManageCampi } = require('../../core/middlewares/auth');
const emailService = require('../services/email-service');
const daoCampionati = require('../../features/campionati/services/dao-campionati');

// Admin-only endpoint to verify SMTP connectivity from the running environment.
// Protected by ADMIN_VERIFY_TOKEN env var. Use either query ?token=... or header 'x-admin-token'.
router.get('/admin/verify-smtp', async (req, res) => {
    const token = req.query.token || req.get('x-admin-token');
    const expected = process.env.ADMIN_VERIFY_TOKEN;
    if (!expected) return res.status(400).json({ error: 'ADMIN_VERIFY_TOKEN not configured on server' });
    if (!token || token !== expected) return res.status(403).json({ error: 'Forbidden' });

    try {
        const ok = await emailService.verifyTransporter();
        return res.json({ ok: !!ok, message: 'SMTP verify succeeded' });
    } catch (err) {
        // Return sanitized error info
        const safe = {
            message: err && err.message ? err.message : 'Unknown error',
            code: err && err.code ? err.code : undefined,
            responseCode: err && err.responseCode ? err.responseCode : undefined
        };
        return res.status(500).json({ ok: false, error: safe });
    }
});

// Admin-only endpoint to send a quick test via Resend API (if configured)
// Protected by ADMIN_VERIFY_TOKEN env var. Use query ?token=... and ?to=recipient
router.get('/admin/send-test-resend', async (req, res) => {
    const token = req.query.token || req.get('x-admin-token');
    const expected = process.env.ADMIN_VERIFY_TOKEN;
    if (!expected) return res.status(400).json({ error: 'ADMIN_VERIFY_TOKEN not configured on server' });
    if (!token || token !== expected) return res.status(403).json({ error: 'Forbidden' });

    if (!process.env.RESEND_API_KEY) {
        return res.status(400).json({ error: 'RESEND_API_KEY not configured on server' });
    }

    const to = req.query.to;
    if (!to) return res.status(400).json({ error: 'Missing required query param: to' });

    try {
        const result = await emailService.sendTestViaResend(to);
        return res.json({ ok: true, result });
    } catch (err) {
        const safe = {
            message: err && err.message ? err.message : 'Unknown error',
            code: err && err.code ? err.code : undefined
        };
        console.error('Admin send-test-resend failed:', err);
        return res.status(500).json({ ok: false, error: safe });
    }
});


router.get('/homepage', async (req, res) => {
    try {
        // Temporaneamente senza dao per evitare errori
        const notizie = await daoNotizie.getNotiziePaginated(0,3) || [];
    const eventi = await daoEventi.getEventiPubblicati() || [];
        const recensioni = await daoRecensioni.getRecensioni() || [];
        const isLoggedIn = req.isAuthenticated ? req.isAuthenticated() : false;
        res.render('homepage', {
            notizie: notizie,
            eventi: eventi,
            recensioni: recensioni,
            isLoggedIn: isLoggedIn
        });
    } catch (error) {
        console.error('Errore nel caricamento della homepage:', error);
        res.render('homepage', {
            notizie: [],
            eventi: [],
            recensioni: [],
            isLoggedIn: false
        });
    }
});
router.get('/campionato', async (req, res) => {
    try {
        const campionati = await daoCampionati.getCampionati() || [];
        let classifica = [];
        let selectedCampionato = null;
        let regole = {};

        if (campionati.length > 0) {
            selectedCampionato = campionati[0];
            classifica = await daoCampionati.getClassificaByCampionatoId(selectedCampionato.id) || [];
            regole = {
                promozione_diretta: selectedCampionato.promozione_diretta,
                playoff_start: selectedCampionato.playoff_start,
                playoff_end: selectedCampionato.playoff_end,
                playout_start: selectedCampionato.playout_start,
                playout_end: selectedCampionato.playout_end,
                retrocessione_diretta: selectedCampionato.retrocessione_diretta
            };
        }

        const isLoggedIn = req.isAuthenticated ? req.isAuthenticated() : false;
        res.render('campionato', { campionati, classifica, isLoggedIn, selectedCampionato: selectedCampionato ? selectedCampionato.id : null, regole });
    } catch (error) {
        console.error('Errore nel caricamento del campionato:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/squadre', async (req, res) => {
    try {
        const squadre = await daoSquadre.getSquadre() || [];
        const isLoggedIn = req.isAuthenticated();
        const errorMessage = req.session ? req.session.errorMessage : null;
        if (req.session) {
            req.session.errorMessage = null; // Cancella il messaggio dopo averlo mostrato
        }
        res.render('squadre', {
            squadre: squadre,
            isLoggedIn: isLoggedIn,
            errorMessage: errorMessage
        });
    } catch (error) {
        console.error('Errore nel caricamento delle squadre:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/galleria', async (req, res) => {
    try {
        const daoGalleria = require('../../features/galleria/services/dao-galleria');
        const immagini = await daoGalleria.getImmagini() || [];
        const isLoggedIn = req.isAuthenticated();
        res.render('galleria', {
            immagini: immagini,
            isLoggedIn: isLoggedIn
        });
    } catch (error) {
        console.error('Errore nel caricamento delle immagini:', error);
        res.status(500).send('Internal Server Error');
    }
});
router.get('/societa', async (req, res) => {
    try {
        const daoDirigenti = require('../../features/squadre/services/dao-dirigenti-squadre');
        const daoSquadre = require('../../features/squadre/services/dao-squadre');
        const { imageFileExists } = require('../utils/file-helper');
        
        // Membri società (ruoli da TIPI_UTENTE)
        const membriSocieta = await daoMembriSocieta.getMembriSocieta() || [];
        
        // Dirigenti squadre attivi (dalla tabella DIRIGENTI_SQUADRE)
        const dirigentiSquadre = await new Promise((resolve, reject) => {
            const db = require('../../core/config/database');
            // Aliasamo esplicitamente le colonne per evitare ambiguità nei nomi
            const sql = `
                SELECT
                    ds.id AS ds_id,
                    ds.utente_id AS ds_utente_id,
                    ds.squadra_id AS ds_squadra_id,
                    ds.ruolo AS ds_ruolo,
                    ds.attivo AS ds_attivo,
                    u.nome AS utente_nome,
                    u.cognome AS utente_cognome,
                    u.email AS utente_email,
                    i.url AS immagine_profilo,
                    s.nome AS squadra_nome
                FROM DIRIGENTI_SQUADRE ds
                JOIN UTENTI u ON ds.utente_id = u.id
                LEFT JOIN SQUADRE s ON ds.squadra_id = s.id
                LEFT JOIN IMMAGINI i ON i.entita_riferimento = 'utente'
                    AND i.entita_id = u.id
                    AND (i.ordine = 1 OR i.ordine IS NULL)
                WHERE ds.attivo = true
                ORDER BY ds.squadra_id, ds.ruolo
            `;
            db.all(sql, [], (err, rows) => {
                if (err) {
                    console.error('[route /societa] Errore query dirigenti squadre:', err);
                    return resolve([]);
                }
                resolve(rows || []);
            });
        });
        
        // Debug: log delle righe raw provenienti da DIRIGENTI_SQUADRE join UTENTI
        if (process.env.NODE_ENV === 'development') {
            console.log('[route /societa] Dirigenti raw rows:', JSON.stringify(dirigentiSquadre, null, 2));
        }
        // Unisci membri società e dirigenti, mappando i campi
        // Rendiamo la mappatura robusta ad alias di colonne e campi mancanti
        const tuttiMembri = [
            ...membriSocieta,
            ...dirigentiSquadre.map(d => ({
                id: d.ds_utente_id || d.utente_id,
                // Usiamo gli alias della query per nome e cognome
                nome: d.utente_nome || d.nome || '',
                cognome: d.utente_cognome || d.cognome || '',
                email: d.utente_email || d.email || '',
                // ruolo proviene da DIRIGENTI_SQUADRE.ds_ruolo
                ruolo: d.ds_ruolo || d.ruolo || 'Dirigente',
                immagine_profilo: d.immagine_profilo || null,
                squadra_nome: d.squadra_nome || null,
                // conserva origine per debug
                _from: 'dirigenti_squadre',
                _ds_id: d.ds_id || null
            }))
        ];

        // Evita richieste a file mancanti: se l'immagine non esiste, non renderizzare l'URL
        // (riduce 404 e fallback lato client più pulito)
        const tuttiMembriSafe = (tuttiMembri || []).map(m => {
            const url = m.immagine_profilo;
            return {
                ...m,
                immagine_profilo: url && imageFileExists(url) ? url : null
            };
        });
        
        if (process.env.NODE_ENV === 'development') {
            console.log('[route /societa] Totale membri:', tuttiMembriSafe.length, '(società:', membriSocieta.length, ', dirigenti:', dirigentiSquadre.length, ')');
        }
        
        const isLoggedIn = req.isAuthenticated();
        res.render('societa', {
            membriSocieta: tuttiMembriSafe,
            isLoggedIn: isLoggedIn
        });
    } catch (error) {
        console.error('Errore nel caricamento della pagina società:', error);
        res.status(500).send('Internal Server Error');
    }
});
router.get('/prenotazione', async (req, res) => {
    try {
        const daoPrenotazione = require('../../features/prenotazioni/services/dao-prenotazione');
        const campi = await daoPrenotazione.getCampiAttivi() || [];
        const oggi = new Date().toISOString().slice(0, 10);
        const orariDisponibili = {};
        for (const campo of campi) {
            try {
                const orari = await daoPrenotazione.getDisponibilitaCampo(campo.id, oggi);
                orariDisponibili[campo.id] = orari || [];
            } catch (e) {
                orariDisponibili[campo.id] = [];
            }
        }
        const isLoggedIn = req.isAuthenticated();
        res.render('prenotazione', {
            campi: campi,
            orariDisponibili: orariDisponibili,
            oggi: oggi,
            isLoggedIn: isLoggedIn
        });
    } catch (error) {
        console.error('Errore nel caricamento della prenotazione:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/login',(req,res)=>{
    res.render('Login');
});

router.get('/registrazione',(req,res)=>{
    res.render('Registrazione');
});

router.get('/scrivi/recensione',(req,res)=>{
    if (!req.isAuthenticated()) {
        return res.redirect('/login');
    }
    try {
        res.render('scrivi_recensione', {
            isLogged: req.isAuthenticated(),
            user: req.user,
            error: null
        });
    } catch (error) {
        console.error('Errore nel caricamento della pagina scrivi recensione:', error);
        res.render('scrivi_recensione', {
            isLogged: req.isAuthenticated(),
            user: req.user,
            error: 'Errore nel caricamento della pagina'
        });
    }
});

router.get('/recensioni/all', async (req, res) => {
    try {
        const recensioni = await daoRecensioni.getRecensioni() || [];
        const totalReviews = recensioni.length;
        const averageRating = totalReviews > 0 ? recensioni.reduce((sum, r) => sum + r.valutazione, 0) / totalReviews : 0;
        const ratingCounts = {};
        for (let i = 1; i <= 5; i++) {
            ratingCounts[i] = recensioni.filter(r => r.valutazione === i).length;
        }
        const isLoggedIn = req.isAuthenticated();
        res.render('recensioni', {
            reviews: recensioni,
            averageRating: averageRating,
            ratingCounts: ratingCounts,
            totalReviews: totalReviews,
            isLoggedIn: isLoggedIn
        });
    } catch (error) {
        console.error('Errore nel caricamento delle recensioni:', error);
        res.status(500).send('Internal Server Error');
    }
});

// NOTE: route '/eventi/all' already handled above by sending the SPA entrypoint. Duplicate JSON endpoint removed to avoid conflicts.

// NOTE: route '/eventi' moved to app.js to filter published events

// Route per mostrare la pagina di ricerca
router.get('/search', async (req, res) => {
    try {
        const query = req.query.q || '';
        const isLoggedIn = req.isAuthenticated && req.isAuthenticated();

        let searchResults = null;

        // Se c'è una query, fai la ricerca lato server
        if (query && query.trim().length >= 1) {
            const searchTerm = `%${query.trim()}%`;

            // Cerca in notizie
            const notizie = await daoNotizie.searchNotizie(searchTerm);

            // Cerca in eventi
            const eventi = await daoEventi.searchEventi(searchTerm);

            // Cerca in squadre
            const squadre = await daoSquadre.searchSquadre(searchTerm);

            // Cerca in campi
            const campi = await daoCampi.searchCampi(searchTerm);

            searchResults = {
                notizie: notizie || [],
                eventi: eventi || [],
                squadre: squadre || [],
                campi: campi || []
            };
        }

        res.render('search', {
            query: query,
            isLogged: req.isAuthenticated(),
            currentPath: req.path,
            searchResults: searchResults
        });
    } catch (error) {
        console.error('Errore nella ricerca:', error);
        res.render('search', {
            query: req.query.q || '',
            isLogged: req.isAuthenticated(),
            currentPath: req.path,
            searchResults: null,
            error: 'Errore nella ricerca'
        });
    }
});

router.get('/notizie/crea_notizie',isLoggedIn,isAdminOrDirigente,(req,res)=>{
    try{
        // render the notizia form view
        res.render('notizia',{ 
            user:req.user,
            notizia: null
        })
    }catch(error){
        console.error('Errore nel rendering della pagina di creazione notizia:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Pagina contatti (GET) - mostra il form di contatto
router.get('/contatti', (req, res) => {
    try {
        const isLoggedIn = req.isAuthenticated ? req.isAuthenticated() : false;
        res.render('contatti', { isLoggedIn: isLoggedIn });
    } catch (error) {
        console.error('Errore nel rendering della pagina contatti:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Pagina Privacy Policy
router.get('/privacy', (req, res) => {
    try {
        const isLoggedIn = req.isAuthenticated ? req.isAuthenticated() : false;
        res.render('privacy', { isLoggedIn: isLoggedIn });
    } catch (error) {
        console.error('Errore nel rendering della pagina privacy:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Pagina Regolamento
router.get('/regolamento', (req, res) => {
    try {
        const isLoggedIn = req.isAuthenticated ? req.isAuthenticated() : false;
        res.render('regolamento', { isLoggedIn: isLoggedIn });
    } catch (error) {
        console.error('Errore nel rendering della pagina regolamento:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Endpoint POST per invio contatti (API)
router.post('/contatti', async (req, res) => {
    try {
        const { name, email, message, subject, phone } = req.body;
        // Log incoming contact payload for debugging (will appear in server logs)
        console.log('[POST /contatti] payload:', { name, email, subject, phone, hasMessage: !!message });

        // semplice validazione server-side
        if (!name || !email || !message || !subject) {
            return res.status(400).json({ error: 'Tutti i campi sono obbligatori.' });
        }

        // Invia la mail tramite il service e logga il risultato
        const info = await emailService.sendEmail({
            fromName: name,
            fromEmail: email,
            subject: subject,
            message: message,
            phone: phone
        });
        if (process.env.EMAIL_DEBUG) console.log('[POST /contatti] sendEmail result:', info);

        return res.json({ success: true, message: 'Messaggio inviato con successo.' });
    } catch (err) {
        console.error('Errore invio contatti:', err);
        // In ambiente di debug forniamo qualche dettaglio in più per aiutare il troubleshooting
        if (process.env.EMAIL_DEBUG) {
            const safe = {
                message: err && err.message ? err.message : 'Unknown error',
                code: err && err.code ? err.code : undefined
            };
            return res.status(500).json({ error: 'Errore durante l\'invio del messaggio.', details: safe });
        }
        return res.status(500).json({ error: 'Errore durante l\'invio del messaggio.' });
    }
});


module.exports = router;
