'use strict';
const express = require('express');
const router = express.Router();
const path = require('path');
const { isLoggedIn, isAdmin, isAdminOrDirigente } = require('../middlewares/auth');
const userDao = require('../services/dao-user');
const notizieDao = require('../services/dao-notizie');
const eventiDao = require('../services/dao-eventi');
const galleriDao = require('../services/dao-galleria');
const squadreDao = require('../services/dao-squadre');
const campiDao = require('../services/dao-campi');
const recensioniDao = require('../services/dao-recensioni');
const prenotazioniDao = require('../services/dao-prenotazione');
const dirigenteDao = require('../services/dao-dirigenti-squadre');
const campionatiDao = require('../services/dao-campionati');

router.get('/admin', isLoggedIn, isAdmin, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).send('User not authenticated');
        }
        // Temporaneamente disabilitato per evitare errori di recupero squadra
        // const imageUrl = await userDao.getImmagineProfiloByUserId(req.user.id);
        const imageUrl = req.user.immagine_profilo || null;
        res.render('Admin/admin.ejs', { user: req.user, imageUrl });
    } catch (err) {
        console.error('Errore nel caricamento della pagina admin:', err);
        res.status(500).send('Errore interno del server');
    }
});

router.get('/admin/notizie', isLoggedIn, isAdmin, async (req, res) => {
    try {
        const notizie = await notizieDao.getNotizie();
        res.render('Admin/Contenuti/Gestione_Notizie.ejs', { user: req.user, notizie });
    } catch (err) {
        console.error('Errore nel caricamento delle notizie:', err);
        res.status(500).send('Errore interno del server');
    }
});

router.get('/admin/eventi', isLoggedIn, isAdmin, async (req, res) => {
    try {
        const eventi = await eventiDao.getEventi();
        res.render('Admin/Contenuti/Gestione_Eventi.ejs', { user: req.user, eventi });
    } catch (err) {
        console.error('Errore nel caricamento degli eventi:', err);
        res.status(500).send('Errore interno del server');
    }
});



// Route per aggiornare un evento
router.put('/evento/:id', isLoggedIn, isAdmin,async (req, res) => {
    try {
        const eventoData = {
            titolo: req.body.titolo,
            descrizione: req.body.descrizione,
            data_inizio: req.body.data_inizio,
            data_fine: req.body.data_fine,
            luogo: req.body.luogo,
            tipo_evento: req.body.tipo_evento,
            squadra_id: req.body.squadra_id || null,
            campo_id: req.body.campo_id || null,
            max_partecipanti: req.body.max_partecipanti || null,
            pubblicato: req.body.pubblicato === 'true' || req.body.pubblicato === true
        };

        await eventiDao.updateEvento(req.params.id, eventoData);
        res.json({ success: true, message: 'Evento aggiornato con successo' });
    } catch (error) {
        console.error('Errore nell\'aggiornamento dell\'evento:', error);
        res.status(500).json({ success: false, error: 'Errore nell\'aggiornamento dell\'evento' });
    }
});

// Route per eliminare un evento
router.delete('/evento/:id', isLoggedIn, isAdmin, async (req, res) => {
    try {
        await eventiDao.deleteEventoById(req.params.id);
        res.json({ success: true, message: 'Evento eliminato con successo' });
    } catch (error) {
        console.error('Errore nell\'eliminazione dell\'evento:', error);
        res.status(500).json({ success: false, error: 'Errore nell\'eliminazione dell\'evento' });
    }
});

// Route per pubblicare/sospendere un evento
router.put('/evento/:id/publish', isLoggedIn, isAdmin, async (req, res) => {
    try {
        await eventiDao.togglePubblicazioneEvento(req.params.id);
        const evento = await eventiDao.getEventoById(req.params.id);
        const isPubblicato = evento.pubblicato;
        const message = isPubblicato ? 'Evento pubblicato con successo' : 'Evento sospeso con successo';
        res.json({ success: true, message, pubblicato: isPubblicato });
    } catch (error) {
        console.error('Errore nel toggle pubblicazione evento:', error);
        res.status(500).json({ success: false, error: 'Errore nel cambio stato pubblicazione' });
    }
});


router.get('/crea-evento', isLoggedIn, isAdmin, async (req, res) => {
    try {
        res.render('Eventi/evento_semplice.ejs', {
            user: req.user,
            evento: null,
            squadre: [],
            campi: []
        });
    } catch (error) {
        console.error('Errore nel caricamento della pagina crea evento:', error);
        res.status(500).send('Errore interno del server');
    }
});
router.get('/crea-evento/:id', isLoggedIn, isAdmin, async (req, res) => {
    try {
        const evento = await eventiDao.getEventoById(req.params.id);
        res.render('Eventi/evento_semplice.ejs', {
            user: req.user,
            evento: evento,
            squadre: [],
            campi: []
        });
    } catch (error) {
        console.error('Errore nel caricamento della pagina modifica evento:', error);
        res.status(500).send('Errore interno del server');
    }
});


router.get('/crea-evento', isLoggedIn, isAdmin, async (req, res) => {
    try {
        res.render('Eventi/evento_semplice.ejs', {
            user: req.user,
            evento: null,
            squadre: [],
            campi: []
        });
    } catch (error) {
        console.error('Errore nel caricamento della pagina crea evento:', error);
        res.status(500).send('Errore interno del server');
    }
});
router.get('/crea-evento/:id', isLoggedIn, isAdmin, async (req, res) => {
    try {
        const evento = await eventiDao.getEventoById(req.params.id);
        res.render('Eventi/evento_semplice.ejs', {
            user: req.user,
            evento: evento,
            squadre: [],
            campi: []
        });
    } catch (error) {
        console.error('Errore nel caricamento della pagina modifica evento:', error);
        res.status(500).send('Errore interno del server');
    }
});

// Route per creare una nuova notizia
/*router.post('/notizia/nuova', isLoggedIn, isAdmin, async (req, res) => {
    try {
        const pubblicata = req.body.pubblicato === 'true' || req.body.pubblicato === true;
        const notiziaData = {
            titolo: req.body.titolo,
            sottotitolo: req.body.sottotitolo || null,
            contenuto: req.body.contenuto,
            immagine_principale_id: req.body.immagine_principale_id || null,
            autore_id: req.user.id,
            pubblicata: pubblicata,
            data_pubblicazione: pubblicata ? new Date().toISOString() : null
        };

        const result = await notizieDao.createNotizia(notiziaData);
        res.json({ success: true, message: 'Notizia creata con successo', id: result.id });
    } catch (error) {
        console.error('Errore nella creazione della notizia:', error);
        res.status(500).json({ success: false, error: 'Errore nella creazione della notizia' });
    }
});*/

// Route per aggiornare una notizia
router.put('/notizia/:id', isLoggedIn, isAdmin, async (req, res) => {
    try {
        const pubblicata = req.body.pubblicato === 'true' || req.body.pubblicato === true;
        const notiziaData = {
            titolo: req.body.titolo,
            sottotitolo: req.body.sottotitolo || null,
            contenuto: req.body.contenuto,
            immagine_principale_id: req.body.immagine_principale_id || null,
            autore_id: req.user.id,
            pubblicata: pubblicata ? 1 : 0,
            data_pubblicazione: pubblicata ? new Date().toISOString() : null
        };

        await notizieDao.updateNotizia(req.params.id, notiziaData);
        res.json({ success: true, message: 'Notizia aggiornata con successo' });
    } catch (error) {
        console.error('Errore nell\'aggiornamento della notizia:', error);
        res.status(500).json({ success: false, error: 'Errore nell\'aggiornamento della notizia' });
    }
});

// Route per eliminare una notizia
router.delete('/notizia/:id', isLoggedIn, isAdmin, async (req, res) => {
    try {
        await notizieDao.deleteNotiziaById(req.params.id);
        res.json({ success: true, message: 'Notizia eliminata con successo' });
    } catch (error) {
        console.error('Errore nell\'eliminazione della notizia:', error);
        res.status(500).json({ success: false, error: 'Errore nell\'eliminazione della notizia' });
    }
});

// Route per pubblicare/sospendere una notizia
router.put('/notizia/:id/publish', isLoggedIn, isAdmin, async (req, res) => {
    try {
        await notizieDao.togglePubblicazioneNotizia(req.params.id);
        const notizia = await notizieDao.getNotiziaById(req.params.id);
        const isPubblicato = notizia.pubblicato;
        const message = isPubblicato ? 'Notizia pubblicata con successo' : 'Notizia sospesa con successo';
        res.json({ success: true, message, pubblicato: isPubblicato });
    } catch (error) {
        console.error('Errore nel toggle pubblicazione notizia:', error);
        res.status(500).json({ success: false, error: 'Errore nel cambio stato pubblicazione' });
    }
});


router.get('/admin/galleria', isLoggedIn, isAdmin, async (req, res) => {
    try{
        const immagini = await galleriDao.getImmagini();
        res.render('Admin/Contenuti/Gestione_Galleria.ejs', { user: req.user, immagini });
    } catch (err) {
        console.error('Errore nel caricamento della galleria:', err);
        res.status(500).send('Errore interno del server');
    }
});

router.get('/admin/squadre', isLoggedIn, isAdmin, async (req, res) => {
    try{
        const squadre = await squadreDao.getSquadre();
        res.render('Admin/Contenuti/Gestione_Squadre.ejs', { user: req.user, squadre });
    } catch (err) {
        console.error('Errore nel caricamento delle squadre:', err);
        res.status(500).send('Errore interno del server');
    }
});

router.get('/admin/utenti', isLoggedIn, isAdmin, async (req, res) => {
    try {
        const utenti = await userDao.getAllUsers();
        res.render('Admin/Contenuti/Gestore_Utenti.ejs', { user: req.user, utenti });
    } catch (err) {
        console.error('Errore nel caricamento degli utenti:', err);
        res.status(500).send('Errore interno del server');
    }
});

router.get('/admin/recensioni', isLoggedIn, isAdmin, async (req, res) => {
    try{
        const recensioni = await recensioniDao.getAllRecensioni();
        res.render('Admin/Contenuti/Gestione_Recensioni.ejs', { user: req.user, recensioni });
    } catch (err) {
        console.error('Errore nel caricamento delle recensioni:', err);
        res.status(500).send('Errore interno del server');
    }
});

router.get('/admin/recensioni/:id', isLoggedIn, isAdmin, async (req, res) => {
    try {
        const recensione = await recensioniDao.getRecensioneById(req.params.id);
        if (!recensione) {
            return res.status(404).json({ error: 'Recensione non trovata' });
        }
        res.json(recensione);
    } catch (err) {
        console.error('Errore nel caricamento della recensione:', err);
        res.status(500).json({ error: 'Errore interno del server' });
    }
});

router.put('/admin/recensioni/:id/toggle', isLoggedIn, isAdmin, async (req, res) => {
    try {
        const { visibile } = req.body;
        await recensioniDao.updateRecensioneVisibile(req.params.id, visibile);
        res.json({ success: true });
    } catch (err) {
        console.error('Errore nell\'aggiornamento della visibilità:', err);
        res.status(500).json({ error: 'Errore interno del server' });
    }
});

router.delete('/admin/recensioni/:id', isLoggedIn, isAdmin, async (req, res) => {
    try {
        await recensioniDao.deleteRecensioneAdmin(req.params.id);
        res.json({ success: true });
    } catch (err) {
        console.error('Errore nell\'eliminazione della recensione:', err);
        res.status(500).json({ error: 'Errore interno del server' });
    }
});

// Route per ottenere i dettagli di un utente
router.get('/admin/utenti/:id', isLoggedIn, isAdmin, async (req, res) => {
    try {
        const userId = req.params.id;
        const utente = await userDao.getUserById(userId);
        const imageUrl = await userDao.getImmagineProfiloByUserId(userId);
        utente.immagine_profilo = imageUrl;
        res.json(utente);
    } catch (err) {
        console.error('Errore nel caricamento dei dettagli utente:', err);
        res.status(500).json({ error: 'Errore interno del server' });
    }
});

// Route per creare un nuovo utente
router.post('/admin/utenti', isLoggedIn, isAdmin, async (req, res) => {
    try {
        const { nome, cognome, email, telefono, tipo_utente_id, password } = req.body;
        if (!nome || !cognome || !email || !password) {
            return res.status(400).json({ error: 'Nome, cognome, email e password sono obbligatori' });
        }
        const user = { nome, cognome, email, telefono, password, tipo_utente_id: tipo_utente_id || 3 };
        await userDao.createUser(user);
        res.json({ message: 'Utente creato con successo' });
    } catch (err) {
        console.error('Errore nella creazione dell\'utente:', err);
        res.status(500).json({ error: 'Errore interno del server' });
    }
});

// Route per modificare un utente
router.put('/admin/utenti/:id', isLoggedIn, isAdmin, async (req, res) => {
    try {
        const userId = req.params.id;
        const { nome, cognome, email, telefono, tipo_utente_id } = req.body;
        const fields = { nome, cognome, email, telefono, tipo_utente_id };
        await userDao.updateUser(userId, fields);
        res.json({ message: 'Utente aggiornato con successo' });
    } catch (err) {
        console.error('Errore nell\'aggiornamento dell\'utente:', err);
        res.status(500).json({ error: 'Errore interno del server' });
    }
});

// Route per eliminare un utente
router.delete('/admin/utenti/:id', isLoggedIn, isAdmin, async (req, res) => {
    try {
        const userId = req.params.id;
        await userDao.deleteUser(userId);
        res.json({ message: 'Utente eliminato con successo' });
    } catch (err) {
        console.error('Errore nell\'eliminazione dell\'utente:', err);
        res.status(500).json({ error: 'Errore interno del server' });
    }
});

router.get('/admin/statistiche', isLoggedIn, isAdmin, async (req, res) => {
    try{
        const statistiche = await userDao.getStatistiche();
        res.render('Admin/Contenuti/Statistiche.ejs', { user: req.user, statistiche });
    } catch (err) {
        console.error('Errore nel caricamento delle statistiche:', err);
        res.status(500).send('Errore interno del server');
    }
});

// Route per la gestione prenotazioni
router.get('/admin/prenotazioni', isLoggedIn, isAdmin, async (req, res) => {
    try {
        const prenotazioni = await prenotazioniDao.getAllPrenotazioni();
        res.render('Admin/Contenuti/Gestione_Prenotazione.ejs', { user: req.user, prenotazioni });
    } catch (err) {
        console.error('Errore nel caricamento delle prenotazioni:', err);
        res.status(500).send('Errore interno del server');
    }
});

// Endpoint per refresh dati statistiche (JSON)
router.get('/admin/statistiche/data', isLoggedIn, isAdmin, async (req, res) => {
    try {
        const statistiche = await userDao.getStatistiche();
        res.json(statistiche);
    } catch (err) {
        console.error('Errore nel refresh delle statistiche:', err);
        res.status(500).json({ error: 'Errore interno del server' });
    }
});

// Route per gestire orari campi
router.get('/admin/campi/:id/orari', isLoggedIn, isAdmin, async (req, res) => {
    try {
        const campoId = req.params.id;
        const orariDefault = await campiDao.getOrariCampo(campoId, null);
        const giorniSettimana = [];
        for (let i = 0; i < 7; i++) {
            const orariGiorno = await campiDao.getOrariCampo(campoId, i);
            giorniSettimana.push({
                giorno: i,
                nome: ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'][i],
                orari: orariGiorno
            });
        }
        const campo = await campiDao.getCampoById(campoId);
        res.render('Admin/Contenuti/Gestione_Orari_Campi.ejs', { 
            user: req.user, 
            campo, 
            orariDefault, 
            giorniSettimana 
        });
    } catch (err) {
        console.error('Errore nel caricamento degli orari campi:', err);
        res.status(500).send('Errore interno del server');
    }
});

router.post('/admin/campi/:id/orari', isLoggedIn, isAdmin, async (req, res) => {
    try {
        const campoId = req.params.id;
        const { giorno_settimana, ora_inizio, ora_fine } = req.body;
        await campiDao.addOrarioCampo(campoId, giorno_settimana || null, ora_inizio, ora_fine);
        res.redirect(`/admin/campi/${campoId}/orari`);
    } catch (err) {
        console.error('Errore nell\'aggiunta orario:', err);
        res.status(500).send('Errore interno del server');
    }
});

router.put('/admin/campi/orari/:id', isLoggedIn, isAdmin, async (req, res) => {
    try {
        const orarioId = req.params.id;
        const { ora_inizio, ora_fine, attivo } = req.body;
        await campiDao.updateOrarioCampo(orarioId, ora_inizio, ora_fine, attivo ? 1 : 0);
        res.json({ success: true });
    } catch (err) {
        console.error('Errore nell\'aggiornamento orario:', err);
        res.status(500).json({ error: err.message });
    }
});

router.delete('/admin/campi/orari/:id', isLoggedIn, isAdmin, async (req, res) => {
    try {
        const orarioId = req.params.id;
        await campiDao.deleteOrarioCampo(orarioId);
        res.json({ success: true });
    } catch (err) {
        console.error('Errore nella cancellazione orario:', err);
        res.status(500).json({ error: err.message });
    }
});

// Route per la gestione campi
router.get('/admin/campi', isLoggedIn, isAdmin, async (req, res) => {
    try {
        const campi = await campiDao.getCampi();
        res.render('Admin/Contenuti/Gestione_Campi.ejs', { user: req.user, campi });
    } catch (err) {
        console.error('Errore nel caricamento dei campi:', err);
        res.status(500).send('Errore interno del server');
    }
});

// Route per creare un nuovo campo
router.post('/admin/campi', isLoggedIn, isAdmin, async (req, res) => {
    try {
        const campoData = req.body;
        const result = await campiDao.createCampo(campoData);
        // Dopo aver creato il campo, aggiungi orari di default
        const orariDefault = [
            { ora_inizio: '16:00', ora_fine: '17:00' },
            { ora_inizio: '18:00', ora_fine: '19:00' },
            { ora_inizio: '20:00', ora_fine: '21:00' },
            { ora_inizio: '21:00', ora_fine: '22:00' }
        ];
        for (const orario of orariDefault) {
            await campiDao.addOrarioCampo(result.id, null, orario.ora_inizio, orario.ora_fine);
        }
        res.redirect('/admin/campi');
    } catch (err) {
        console.error('Errore nella creazione del campo:', err);
        res.status(500).send('Errore interno del server');
    }
});

// Route per il profilo admin
router.get('/admin/profilo', isLoggedIn, isAdmin, async (req, res) => {
    try {
        const user = await userDao.getUserById(req.user.id);
        const imageUrl = await userDao.getImmagineProfiloByUserId(user.id);
        // const giocatore = await userDao.getGiocatoreByUserId(user.id);
        const giocatore = null; // Temporaneamente disabilitato per incompatibilità schema DB
        let dirigente = null;
        try {
            dirigente = await dirigenteDao.getDirigenteByUserId(user.id);
        } catch (dirErr) {
            console.error('Errore recupero dirigente:', dirErr);
        }

        // Recupera statistiche e attività recenti
        let stats = { prenotazioni_totali: 0, recensioni_totali: 0, prenotazioni_mese: 0, recensioni_mese: 0 };
        let activity = { prenotazioni: [], recensioni: [] };
        
        try {
            stats = await userDao.getUserStats(user.id) || stats;
        } catch (statsErr) {
            console.error('Errore recupero statistiche:', statsErr);
        }
        
        try {
            activity = await userDao.getUserRecentActivity(user.id) || activity;
        } catch (activityErr) {
            console.error('Errore recupero attività:', activityErr);
        }

        res.render('profilo', {
            user,
            imageUrl,
            giocatore,
            dirigente,
            stats,
            activity,
            isLogged: true
        });
    } catch (err) {
        console.error('Errore nel caricamento del profilo admin:', err);
        res.status(500).render('error', { error: { message: 'Errore nel caricamento del profilo' } });
    }
});

// Route per la gestione campionati
router.get('/admin/campionati', isLoggedIn, isAdmin, async (req, res) => {
    try {
        const campionati = await campionatiDao.getCampionati();
        res.render('Admin/Contenuti/Gestione_Campionati.ejs', { user: req.user, campionati });
    } catch (err) {
        console.error('Errore nel caricamento dei campionati:', err);
        res.status(500).send('Errore interno del server');
    }
});

// API Routes per campionati
router.get('/api/admin/campionati', isLoggedIn, isAdmin, async (req, res) => {
    try {
        const campionati = await campionatiDao.getCampionati();
        // Trasforma i dati per il frontend
        const campionatiFormatted = campionati.map(c => ({
            id: c.id,
            nome: c.nome,
            stagione: c.stagione,
            categoria: c.categoria,
            fonte_esterna_id: c.fonte_esterna_id,
            url_fonte: c.url_fonte,
            is_active: c.attivo === 1,
            stato: c.attivo === 1 ? 'attivo' : 'inattivo',
            tipo: c.categoria || 'generico',
            numero_squadre: 0, // Placeholder, da implementare se necessario
            partite_programmate: 0, // Placeholder, da implementare se necessario
            data_inizio: c.created_at,
            created_at: c.created_at,
            updated_at: c.updated_at
        }));
        res.json({ campionati: campionatiFormatted });
    } catch (err) {
        console.error('Errore nel recupero dei campionati:', err);
        res.status(500).json({ error: 'Errore nel recupero dei campionati' });
    }
});

router.post('/api/admin/campionati', isLoggedIn, isAdmin, async (req, res) => {
    try {
        const campionatoData = {
            nome: req.body.nome,
            stagione: req.body.stagione || new Date().getFullYear().toString(),
            categoria: req.body.categoria,
            fonte_esterna_id: req.body.fonte_esterna_id,
            url_fonte: req.body.url_fonte,
            attivo: req.body.is_active || false
        };

        const result = await campionatiDao.createCampionato(campionatoData);
        res.status(201).json(result);
    } catch (err) {
        console.error('Errore nella creazione del campionato:', err);
        res.status(500).json({ error: err.error || 'Errore nella creazione del campionato' });
    }
});

router.put('/api/admin/campionati/:id', isLoggedIn, isAdmin, async (req, res) => {
    try {
        const id = req.params.id;
        const campionatoData = {
            nome: req.body.nome,
            stagione: req.body.stagione,
            categoria: req.body.categoria,
            fonte_esterna_id: req.body.fonte_esterna_id,
            url_fonte: req.body.url_fonte,
            attivo: req.body.is_active
        };

        const result = await campionatiDao.updateCampionato(id, campionatoData);
        res.json(result);
    } catch (err) {
        console.error('Errore nell\'aggiornamento del campionato:', err);
        res.status(500).json({ error: err.error || 'Errore nell\'aggiornamento del campionato' });
    }
});

router.delete('/api/admin/campionati/:id', isLoggedIn, isAdmin, async (req, res) => {
    try {
        const id = req.params.id;
        const result = await campionatiDao.deleteCampionato(id);
        res.json(result);
    } catch (err) {
        console.error('Errore nell\'eliminazione del campionato:', err);
        res.status(500).json({ error: err.error || 'Errore nell\'eliminazione del campionato' });
    }
});

router.patch('/api/admin/campionati/:id/toggle', isLoggedIn, isAdmin, async (req, res) => {
    try {
        const id = req.params.id;
        const isActive = req.body.is_active;
        const result = await campionatiDao.toggleCampionatoStatus(id, isActive);
        res.json(result);
    } catch (err) {
        console.error('Errore nel toggle dello stato del campionato:', err);
        res.status(500).json({ error: err.error || 'Errore nel toggle dello stato del campionato' });
    }
});

module.exports = router;
