'use strict';

const express = require('express');
const router = express.Router();
const daoSquadre = require('../services/dao-squadre');
const daoUser = require('../../users/services/dao-user');
const daoDirigenti = require('../services/dao-dirigenti-squadre');
const daoGalleria = require('../../galleria/services/dao-galleria');
const sqlite = require('../../../core/config/database');
const multer = require('multer');
const { isLoggedIn, isAdmin, isDirigente, isSquadraDirigente, isAdminOrDirigente } = require('../../../core/middlewares/auth');
const { uploadSquadra: upload } = require('../../../core/config/multer');

router.get('/getsquadre', async (req, res) => {
    try {
        const squadre = await daoSquadre.getSquadre();
        res.json(squadre || []);
    } catch (err) {
        console.error('Errore nel recupero delle squadre:', err);
        res.status(500).json({ error: 'Errore nel caricamento delle squadre' });
    }
});

router.get('/getgiocatori', (req,res)=>{
    daoSquadre.getGiocatori()
        .then((giocatori) => {
            if (!giocatori || giocatori.length === 0) {
                console.warn('Nessun giocatore trovato');
                return res.json({ giocatori: [] });
            }
            res.json({ giocatori: giocatori });
        })
        .catch((err) => {
            console.error('Errore nel recupero dei giocatori:', err);
            res.status(500).json({ error: 'Errore nel caricamento dei giocatori' });
        });
});

router.post('/createsquadra', isLoggedIn, isAdmin, async (req, res) => {
    try {
        const { nome, annoFondazione } = req.body;
        if (!nome || !annoFondazione) {
            return res.status(400).json({ error: 'Nome e anno fondazione sono obbligatori' });
        }
        const result = await daoSquadre.createSquadra(nome, parseInt(annoFondazione));
        res.status(201).json(result);
    } catch (err) {
        console.error('Errore creazione squadra:', err);
        res.status(500).json({ error: err.error || 'Errore durante la creazione della squadra' });
    }
});

router.put('/updatesquadra/:id', isLoggedIn, isAdmin, upload.single('foto'), async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, annoFondazione } = req.body;
        if (!nome || !annoFondazione) {
            return res.status(400).json({ error: 'Nome e anno fondazione sono obbligatori' });
        }

        let id_immagine = null;
        if (req.file) {
            id_immagine = await daoGalleria.uploadImmagine(req.file, 'squadra');
        }

        await daoSquadre.updateSquadra(id, nome, parseInt(annoFondazione), id_immagine);
        res.json({ message: 'Squadra aggiornata con successo' });
    } catch (err) {
        console.error('Errore aggiornamento squadra:', err);
        res.status(500).json({ error: err.error || 'Errore durante l\'aggiornamento della squadra' });
    }
});

router.delete('/deletesquadra/:id', isLoggedIn, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await daoSquadre.deleteSquadra(id);
        res.json({ message: 'Squadra eliminata con successo' });
    } catch (err) {
        console.error('Errore eliminazione squadra:', err);
        res.status(500).json({ error: err.error || 'Errore durante l\'eliminazione della squadra' });
    }
});

// NOTE: endpoint GET /getsquadra/:id is defined later without auth to allow public access

// API per giocatori
router.post('/creategiocatore', isLoggedIn, isAdmin, upload.single('foto'), async (req, res) => {
    try {
        const { nome, cognome, ruolo, numero_maglia, data_nascita, nazionalita, squadra_id } = req.body;
        let immagineId = null;
        if (req.file) {
            immagineId = await daoGalleria.uploadImmagine(req.file, 'giocatore');
        }
        const giocatore = await daoSquadre.createGiocatore({
            nome, cognome, ruolo, numero_maglia: parseInt(numero_maglia), data_nascita, nazionalita, squadra_id: parseInt(squadra_id), id_immagine: immagineId
        });
        res.status(201).json(giocatore);
    } catch (err) {
        console.error('Errore creazione giocatore:', err);
        res.status(500).json({ error: 'Errore durante la creazione del giocatore' });
    }
});

router.put('/updategiocatore/:id', isLoggedIn, isAdmin, upload.single('foto'), async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, cognome, ruolo, numero_maglia, data_nascita, nazionalita } = req.body;
        let immagineId = null;
        if (req.file) {
            immagineId = await daoGalleria.uploadImmagine(req.file, 'giocatore');
        }
        await daoSquadre.updateGiocatore(id, {
            nome, cognome, ruolo, numero_maglia: parseInt(numero_maglia), data_nascita, nazionalita, id_immagine: immagineId
        });
        res.json({ message: 'Giocatore aggiornato con successo' });
    } catch (err) {
        console.error('Errore aggiornamento giocatore:', err);
        res.status(500).json({ error: 'Errore durante l\'aggiornamento del giocatore' });
    }
});

router.delete('/deletegiocatore/:id', isLoggedIn, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await daoSquadre.deleteGiocatore(id);
        res.json({ message: 'Giocatore eliminato con successo' });
    } catch (err) {
        console.error('Errore eliminazione giocatore:', err);
        res.status(500).json({ error: 'Errore durante l\'eliminazione del giocatore' });
    }
});

// API per dirigenti
router.post('/createdirigente', isLoggedIn, isAdmin, async (req, res) => {
    try {
        const { utente_id, ruolo, data_nomina, data_scadenza, squadra_id } = req.body;
        const dirigente = await daoDirigenti.createDirigente({
            utente_id: parseInt(utente_id), ruolo, data_nomina, data_scadenza, squadra_id: parseInt(squadra_id)
        });
        res.status(201).json(dirigente);
    } catch (err) {
        console.error('Errore creazione dirigente:', err);
        res.status(500).json({ error: 'Errore durante la creazione del dirigente' });
    }
});

router.put('/updatedirigente/:id', isLoggedIn, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { utente_id, ruolo, data_nomina, data_scadenza } = req.body;
        const updateData = { ruolo, data_nomina, data_scadenza };
        if (utente_id) updateData.utente_id = parseInt(utente_id);
        await daoDirigenti.updateDirigente(id, updateData);
        res.json({ message: 'Dirigente aggiornato con successo' });
    } catch (err) {
        console.error('Errore aggiornamento dirigente:', err);
        res.status(500).json({ error: 'Errore durante l\'aggiornamento del dirigente' });
    }
});

router.delete('/deletedirigente/:id', isLoggedIn, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await daoDirigenti.deleteDirigente(id);
        res.json({ message: 'Dirigente eliminato con successo' });
    } catch (err) {
        console.error('Errore eliminazione dirigente:', err);
        res.status(500).json({ error: 'Errore durante l\'eliminazione del dirigente' });
    }
});

router.put('/squadre/:id', isLoggedIn, isAdmin, upload.single('logo'), async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, anno } = req.body;
        if (!nome || !anno) {
            return res.status(400).json({ error: 'Nome e anno fondazione sono obbligatori' });
        }
        let id_immagine = null;
        if (req.file) {
            id_immagine = await daoGalleria.uploadImmagine(req.file, 'squadra');
        }
        await daoSquadre.updateSquadra(id, nome, parseInt(anno), id_immagine);
        res.json({ success: true, message: 'Squadra aggiornata con successo' });
    } catch (err) {
        console.error('Errore aggiornamento squadra:', err);
        res.status(500).json({ error: err.error || 'Errore durante l\'aggiornamento della squadra' });
    }
});

router.delete('/squadre/:id', isLoggedIn, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await daoSquadre.deleteSquadra(id);
        res.json({ success: true, message: 'Squadra eliminata con successo' });
    } catch (err) {
        console.error('Errore eliminazione squadra:', err);
        res.status(500).json({ error: err.error || 'Errore durante l\'eliminazione della squadra' });
    }
});

router.get('/getsquadra/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const squadra = await daoSquadre.getSquadraById(id);
        res.json(squadra);
    } catch (err) {
        console.error('Errore recupero squadra:', err);
        res.status(500).json({ error: err.error || 'Errore durante il recupero della squadra' });
    }
});

// Route per apertura pagina di gestione squadra
router.get('/squadre/gestione/:id', isAdminOrDirigente, async (req, res) => {
    try {
        const squadra = await daoSquadre.getSquadraById(req.params.id);
        if (!squadra) {
            return res.status(404).render('error', { 
                message: 'Squadra non trovata', 
                error: { status: 404 } 
            });
        }

        // Verifica che l'utente sia admin o dirigente della squadra
        if (req.user.tipo_utente_id === 2) { // dirigente
            const dirigenti = await daoDirigenti.getDirigenteByUserId(req.user.id);
            const gestisce = Array.isArray(dirigenti) && dirigenti.some(d => String(d.squadra_id) === String(req.params.id));
            if (!gestisce) {
                return res.status(403).render('error', { 
                    message: 'Accesso negato: non sei dirigente di questa squadra', 
                    error: { status: 403 } 
                });
            }
        }

        // Carica giocatori e dirigenti
        try {
            squadra.giocatori = await daoSquadre.getGiocatoriBySquadra(req.params.id);
        } catch (err) {
            console.error('Errore caricamento giocatori:', err);
            squadra.giocatori = [];
        }
        
        try {
            squadra.dirigenti = await daoDirigenti.getDirigentiBySquadra(req.params.id);
        } catch (err) {
            console.error('Errore caricamento dirigenti:', err);
            squadra.dirigenti = [];
        }

        // Carica immagini se presenti
        if (squadra.id_immagine) {
            squadra.immagine = await daoGalleria.getImmagineById(squadra.id_immagine);
        }

        // Carica immagini per giocatori
        for (let giocatore of squadra.giocatori) {
            if (giocatore.id_immagine) {
                giocatore.immagine = await daoGalleria.getImmagineById(giocatore.id_immagine);
            }
        }

        // Carica immagini per dirigenti
        for (let dirigente of squadra.dirigenti) {
            if (!dirigente) continue;
            // Normalizza il campo immagine: può essere una stringa (path), un oggetto {url},
            // oppure essere presente come immagine_id (stringa/numero). Rendiamo sempre
            // `dirigente.immagine` un oggetto { url: '...' } o null.
            if (typeof dirigente.immagine === 'string') {
                dirigente.immagine = { url: dirigente.immagine };
            } else if (dirigente.immagine && typeof dirigente.immagine === 'object' && dirigente.immagine.url) {
                // già nella forma corretta
            } else if (dirigente.immagine_id && (typeof dirigente.immagine_id === 'string' || typeof dirigente.immagine_id === 'number')) {
                dirigente.immagine = { url: String(dirigente.immagine_id) };
            } else {
                dirigente.immagine = null;
            }
        }

        const isLoggedIn = req.isAuthenticated && req.isAuthenticated();
        res.render('modifica_squadra', { squadra, isLoggedIn, user: req.user });
    } catch (error) {
        console.error('Errore nel caricamento della pagina modifica squadra:', error);
        res.status(500).render('error', {
            message: 'Errore nel caricamento della pagina modifica squadra',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

router.post('/squadre/:id/dirigenti', isSquadraDirigente, async (req, res) => {
    try {
        const { id: squadraIdParam } = req.params;
        // Log request for debugging (will appear in server logs on Railway)
        console.debug('[POST /squadre/:id/dirigenti] user=', req.user && req.user.id, 'params=', req.params, 'body=', req.body);

        // Support multiple possible field names and ensure numeric ids
        const rawUserId = req.body.userId || req.body.user_id || req.body.selectedUtenteId;
        const userId = rawUserId ? parseInt(rawUserId, 10) : null;
        const ruolo = req.body.ruolo || req.body.role;
        const data_nomina = req.body.data_nomina;
        const data_scadenza = req.body.data_scadenza;
        const squadra_id = squadraIdParam ? parseInt(squadraIdParam, 10) : null;

        if (!userId || !Number.isInteger(userId)) {
            console.warn('[POST /squadre/:id/dirigenti] Missing or invalid userId:', rawUserId);
            return res.status(400).json({ error: 'ID utente è obbligatorio e deve essere numerico' });
        }
        if (!squadra_id || !Number.isInteger(squadra_id)) {
            console.warn('[POST /squadre/:id/dirigenti] Missing or invalid squadra id:', squadraIdParam);
            return res.status(400).json({ error: 'ID squadra non valido' });
        }

        // Verifica che l'utente esista (daoUser.getUserById può lanciare)
        let user;
        try {
            user = await daoUser.getUserById(userId);
        } catch (e) {
            console.warn('[POST /squadre/:id/dirigenti] utente non trovato:', userId, e && e.error ? e.error : e);
            return res.status(404).json({ error: 'Utente non trovato' });
        }

        // Aggiungi come dirigente
        try {
            const addResult = await daoDirigenti.addDirigente({
                utente_id: userId,
                squadra_id: squadra_id,
                ruolo: ruolo || 'Dirigente',
                data_nomina: data_nomina,
                data_scadenza: data_scadenza
            });

            // Recupera il dirigente completo per ritorno al client
            try {
                const sqlGetDir = `
                    SELECT ds.id, ds.utente_id, ds.squadra_id, ds.ruolo, ds.data_nomina, ds.data_scadenza, ds.attivo,
                           u.nome, u.cognome, u.email, i.url AS immagine
                    FROM DIRIGENTI_SQUADRE ds
                    JOIN UTENTI u ON ds.utente_id = u.id
                    LEFT JOIN IMMAGINI i ON i.entita_riferimento = 'utente' AND i.entita_id = u.id AND (i.ordine = 1 OR i.ordine IS NULL)
                    WHERE ds.id = ?
                `;
                sqlite.get(sqlGetDir, [addResult.id], (err2, dirigenteRow) => {
                    if (err2) {
                        console.error('[POST /squadre/:id/dirigenti] Errore recupero dirigente creato:', err2);
                        return res.json({ success: true, message: 'Dirigente aggiunto con successo' });
                    }
                    console.log('[POST /squadre/:id/dirigenti] Dirigente DB row:', JSON.stringify(dirigenteRow, null, 2));
                    // Assicuriamoci di includere lo stato 'attivo' nella risposta
                    const attivo = dirigenteRow && (typeof dirigenteRow.attivo !== 'undefined') ? dirigenteRow.attivo : null;
                    return res.json({ success: true, message: 'Dirigente aggiunto con successo', dirigente: dirigenteRow, attivo });
                });
            } catch (e) {
                // se fallisce il recupero, ritorna comunque successo
                console.error('[POST /squadre/:id/dirigenti] Errore imprevisto recupero dirigente dopo add:', e);
                // Fallback: cerca per utente + squadra per verificare stato
                const fallbackSql = `SELECT * FROM DIRIGENTI_SQUADRE WHERE utente_id = ? AND squadra_id = ? AND ruolo = ? LIMIT 1`;
                sqlite.get(fallbackSql, [userId, squadra_id, ruolo || 'Dirigente'], (fbErr, fbRow) => {
                    if (fbErr) {
                        console.error('[POST /squadre/:id/dirigenti] Fallback query error:', fbErr);
                        return res.json({ success: true, message: 'Dirigente aggiunto con successo' });
                    }
                    console.log('[POST /squadre/:id/dirigenti] Fallback dirigente row:', JSON.stringify(fbRow, null, 2));
                    const attivo = fbRow && (typeof fbRow.attivo !== 'undefined') ? fbRow.attivo : null;
                    return res.json({ success: true, message: 'Dirigente aggiunto con successo', dirigente: fbRow, attivo });
                });
            }
        } catch (err) {
            console.error('[POST /squadre/:id/dirigenti] Errore DB aggiunta dirigente:', err);
            return res.status(500).json({ error: err && err.error ? err.error : 'Errore durante l\'aggiunta del dirigente' });
        }
    } catch (err) {
        console.error('[POST /squadre/:id/dirigenti] Unexpected error:', err);
        res.status(500).json({ error: err && err.error ? err.error : 'Errore durante l\'aggiunta del dirigente' });
    }
});

router.put('/squadre/:id/dirigenti/:managerId', isSquadraDirigente, async (req, res) => {
    try {
        const { managerId } = req.params;
        const { ruolo, data_nomina, data_scadenza } = req.body;
        
        if (!ruolo) {
            return res.status(400).json({ error: 'Il ruolo è obbligatorio' });
        }

        await daoDirigenti.updateDirigente(managerId, {
            ruolo: ruolo,
            data_nomina: data_nomina,
            data_scadenza: data_scadenza
        });
        
        res.json({ success: true, message: 'Dirigente aggiornato con successo' });
    } catch (err) {
        console.error('Errore aggiornamento dirigente:', err);
        res.status(500).json({ error: err.error || 'Errore durante l\'aggiornamento del dirigente' });
    }
});

router.delete('/squadre/:id/dirigenti/:managerId', isSquadraDirigente, async (req, res) => {
    try {
        const { managerId } = req.params;
        await daoDirigenti.removeDirigente(managerId);
        res.json({ success: true, message: 'Dirigente rimosso con successo' });
    } catch (err) {
        console.error('Errore rimozione dirigente:', err);
        res.status(500).json({ error: err.error || 'Errore durante la rimozione del dirigente' });
    }
});

// Ripristina un dirigente (annulla soft-delete)
router.post('/squadre/:id/dirigenti/:managerId/restore', isSquadraDirigente, async (req, res) => {
    try {
        const { managerId } = req.params;
        await daoDirigenti.restoreDirigente(managerId);
        res.json({ success: true, message: 'Dirigente ripristinato con successo' });
    } catch (err) {
        console.error('Errore ripristino dirigente:', err);
        res.status(500).json({ error: err.error || 'Errore durante il ripristino del dirigente' });
    }
});

// Route admin: ripristina TUTTI i dirigenti (setta attivo = 1 dove attivo = 0)
router.post('/admin/dirigenti/restore-all', isLoggedIn, isAdmin, async (req, res) => {
    try {
        const result = await daoDirigenti.restoreAllDirigenti();
        res.json({ success: true, message: result.message, restored: result.changes });
    } catch (err) {
        console.error('Errore ripristino massivo dirigenti:', err);
        res.status(500).json({ error: err.error || 'Errore durante il ripristino massivo dei dirigenti' });
    }
});

router.post('/squadre/:id/giocatori', isSquadraDirigente, upload.single('foto'), async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, cognome, ruolo, numero_maglia, data_nascita, piede_preferito, nazionalita } = req.body;

        if (!nome || !cognome) {
            return res.status(400).json({ error: 'Nome e cognome sono obbligatori' });
        }

        let immagini_id = null;
        if (req.file) {
            immagini_id = await daoGalleria.uploadImmagine(req.file, 'giocatore');
        }

        const giocatoreData = {
            nome,
            cognome,
            ruolo,
            numero_maglia: numero_maglia ? parseInt(numero_maglia) : null,
            data_nascita,
            piede_preferito,
            nazionalita,
            squadra_id: parseInt(id),
            immagini_id
        };

        await daoSquadre.createGiocatore(giocatoreData);
        res.json({ success: true, message: 'Giocatore aggiunto con successo' });
    } catch (err) {
        console.error('Errore aggiunta giocatore:', err);
        res.status(500).json({ error: err.error || 'Errore durante l\'aggiunta del giocatore' });
    }
});

router.put('/squadre/:id/giocatori/:playerId', isSquadraDirigente, upload.single('foto'), async (req, res) => {
    try {
        const { playerId } = req.params;
        const { nome, cognome, ruolo, numero_maglia, data_nascita, piede_preferito, nazionalita } = req.body;

        if (!nome || !cognome) {
            return res.status(400).json({ error: 'Nome e cognome sono obbligatori' });
        }

        let immagini_id = null;
        if (req.file) {
            immagini_id = await daoGalleria.uploadImmagine(req.file, 'giocatore');
        }

        const giocatoreData = {
            nome,
            cognome,
            ruolo,
            numero_maglia: numero_maglia ? parseInt(numero_maglia) : null,
            data_nascita,
            piede_preferito,
            nazionalita,
            immagini_id
        };

        await daoSquadre.updateGiocatore(playerId, giocatoreData);
        res.json({ success: true, message: 'Giocatore aggiornato con successo' });
    } catch (err) {
        console.error('Errore aggiornamento giocatore:', err);
        res.status(500).json({ error: err.error || 'Errore durante l\'aggiornamento del giocatore' });
    }
});

router.delete('/squadre/:id/giocatori/:playerId', isSquadraDirigente, async (req, res) => {
    try {
        const { playerId } = req.params;
        await daoSquadre.deleteGiocatore(playerId);
        res.json({ success: true, message: 'Giocatore rimosso con successo' });
    } catch (err) {
        console.error('Errore rimozione giocatore:', err);
        res.status(500).json({ error: err.error || 'Errore durante la rimozione del giocatore' });
    }
});

// API per ricerca utenti (per autocomplete dirigenti)
// Nota: permettiamo agli utenti autenticati la ricerca; il client può richiedere solo 'dirigenti' con il param role=dirigente
router.get('/api/search-users', isLoggedIn, async (req, res) => {
    try {
        const { q, role } = req.query;
        if (!q || q.length < 2) {
            return res.json({ users: [] });
        }

        // Quando cerchiamo dirigenti da assegnare, vogliamo utenti che NON sono già dirigenti
        const onlyDirigenti = role !== 'dirigente';
        const users = await daoUser.searchUsers(q, onlyDirigenti);
        res.json({ users: users || [] });
    } catch (err) {
        console.error('Errore ricerca utenti:', err);
        res.status(500).json({ error: 'Errore durante la ricerca degli utenti' });
    }
});

// Pagina modifica squadra
router.get('/modifica_squadra', isLoggedIn, isAdmin, async (req, res) => {
    try {
        const { id } = req.query;
        if (!id) {
            return res.status(400).send('ID squadra richiesto');
        }

        const squadra = await daoSquadre.getSquadraById(id);
        if (!squadra) {
            return res.status(404).send('Squadra non trovata');
        }

        // Carica giocatori e dirigenti
        try {
            squadra.giocatori = await daoSquadre.getGiocatoriBySquadra(id);
            console.log('Giocatori caricati per squadra', id, ':', squadra.giocatori ? squadra.giocatori.length : 'undefined');
        } catch (err) {
            console.error('Errore caricamento giocatori:', err);
            squadra.giocatori = [];
        }
        
        try {
            // Per la view di modifica vogliamo mostrare anche i dirigenti inattivi (admin)
            squadra.dirigenti = await daoDirigenti.getDirigentiBySquadraAll(id);
            console.log('[GET /modifica_squadra] Dirigenti (inclusi inattivi) caricati per squadra', id, ':', squadra.dirigenti ? squadra.dirigenti.length : 'undefined');
            if (squadra.dirigenti && squadra.dirigenti.length > 0) {
                console.log('[GET /modifica_squadra] Primo dirigente:', JSON.stringify(squadra.dirigenti[0], null, 2));
            }
        } catch (err) {
            console.error('Errore caricamento dirigenti:', err);
            squadra.dirigenti = [];
        }

        // Carica immagini se presenti
        if (squadra.id_immagine) {
            squadra.immagine = await daoGalleria.getImmagineById(squadra.id_immagine);
        }

        // Carica immagini per giocatori e dirigenti
        for (let giocatore of squadra.giocatori) {
            if (giocatore.id_immagine) {
                giocatore.immagine = await daoGalleria.getImmagineById(giocatore.id_immagine);
            }
        }

        for (let dirigente of squadra.dirigenti) {
            if (dirigente.immagine) {
                dirigente.immagine = { url: dirigente.immagine };
            }
        }

        const isLoggedIn = req.isAuthenticated && req.isAuthenticated();
        res.render('modifica_squadra', { squadra, isLoggedIn });
    } catch (err) {
        console.error('Errore caricamento pagina modifica squadra:', err);
        res.status(500).send('Errore interno del server');
    }
});

// Route per mostrare le squadre gestibili dal dirigente
router.get('/mie-squadre', isLoggedIn, isDirigente, async (req, res) => {
    try {
        const dirigenti = await daoDirigenti.getDirigenteByUserId(req.user.id);
        if (!Array.isArray(dirigenti) || dirigenti.length === 0) {
            return res.render('error', { message: 'Non sei un dirigente di nessuna squadra', error: { status: 403 } });
        }
        // Se gestisce più squadre, reindirizza alla prima (puoi cambiare per mostrare una lista)
        const prima = dirigenti[0];
        const squadra = await daoSquadre.getSquadraById(prima.squadra_id);
        return res.redirect(`/squadre/gestione/${squadra.id}`);
    } catch (error) {
        console.error('Errore nel recupero delle squadre del dirigente:', error);
        res.status(500).render('error', {
            message: 'Errore nel caricamento delle tue squadre',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

// Esporta il router per essere usato dall'app principale
module.exports = router;