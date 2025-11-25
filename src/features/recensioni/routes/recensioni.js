const express = require('express');
const router = express.Router();
const dao = require('../services/dao-recensioni');
const { isLoggedIn } = require('../../../core/middlewares/auth');

router.get('/recensioni', async (req, res) => {
    try {
        const recensioni = await dao.getRecensioni();
        res.json(recensioni);
    } catch (error) {
        console.error('Errore nel recupero delle recensioni:', error);
        res.status(500).json({ error: 'Errore nel caricamento delle recensioni' });
    }
});

router.get('/recensioni/all', async (req, res) => {
    try {
        const recensioni = await dao.getRecensioni();

        // Calcola le statistiche dalle recensioni
        const totaleRecensioni = recensioni.length;
        const mediaValutazioni = await dao.getValutaMediaRecensioni();
        const conteggioValutazioni = {
            1: 0, 2: 0, 3: 0, 4: 0, 5: 0
        };
        recensioni.forEach(rec => {
            conteggioValutazioni[rec.valutazione]++;
        });
        res.render('reviews', {
            reviews: recensioni,
            averageRating: mediaValutazioni,
            ratingCounts: conteggioValutazioni,
            totalReviews: totaleRecensioni,
            isLogged: req.isAuthenticated ? req.isAuthenticated() : false,
            imageUrl: req.user?.imageUrl || null,
            error: null
        });
    } catch (error) {
        console.error('Errore nel recupero delle recensioni:', error);
        res.render('reviews', { 
            error: 'Errore nel recupero delle recensioni. Riprova più tardi.',
            isLogged: req.isAuthenticated ? req.isAuthenticated() : false,
            imageUrl: req.user?.imageUrl || null,
            reviews: [],
            averageRating: 0,
            ratingCounts: {},
            totalReviews: 0
        });
    }
});

// Salva una nuova recensione
router.post('/recensione', isLoggedIn, async (req, res) => {
    try {
        // Verifica stato utente
        if (req.user.isBannato && req.user.isBannato()) {
            return res.status(403).json({ 
                success: false,
                error: 'Account bannato', 
                type: 'banned',
                message: 'Non puoi scrivere recensioni perché il tuo account è stato bannato.' 
            });
        }
        
        if (req.user.isSospeso && req.user.isSospeso()) {
            const moment = require('moment');
            const dataFine = req.user.data_fine_sospensione 
                ? moment(req.user.data_fine_sospensione).format('DD/MM/YYYY HH:mm')
                : 'Non specificato';
            return res.status(403).json({ 
                success: false,
                error: 'Account sospeso', 
                type: 'suspended',
                message: `Non puoi scrivere recensioni perché il tuo account è sospeso fino al ${dataFine}. Motivo: ${req.user.motivo_sospensione || 'Non specificato'}`,
                dataFine: dataFine,
                motivo: req.user.motivo_sospensione || 'Non specificato'
            });
        }
        
        const { valutazione, titolo, contenuto, entita_tipo, entita_id } = req.body;
        console.log('DEBUG RECENSIONE POST: req.user =', req.user);
        const utente_id = req.user?.id;
        if (!valutazione || !titolo || !contenuto || !entita_tipo || !entita_id || !utente_id) {
            console.log('DEBUG RECENSIONE POST: dati mancanti', { valutazione, titolo, contenuto, entita_tipo, entita_id, utente_id });
            return res.json({ success: false, error: 'Dati mancanti' });
        }
        // Salva la recensione tramite DAO
        const result = await dao.inserisciRecensione({ valutazione, titolo, contenuto, entita_tipo, entita_id, utente_id });
        if (result && result.success) {
            res.json({ success: true });
        } else {
            console.log('DEBUG RECENSIONE POST: errore DAO', result);
            res.json({ success: false, error: 'Errore salvataggio recensione' });
        }
    } catch (error) {
        console.error('Errore salvataggio recensione:', error);
        res.json({ success: false, error: 'Errore server' });
    }
});

// Ottieni le recensioni dell'utente autenticato
router.get('/recensioni/mie', isLoggedIn, async (req, res) => {
    try {
        const userId = req.user.id;
        const recensioni = await dao.getRecensioniByUserId(userId);
        res.json({ success: true, recensioni });
    } catch (error) {
        console.error('Errore nel recupero delle recensioni utente:', error);
        res.status(500).json({ success: false, error: 'Errore nel recupero delle recensioni' });
    }
});

// Modifica una recensione dell'utente
router.put('/recensioni/:id', isLoggedIn, async (req, res) => {
    try {
        const recensioneId = req.params.id;
        const userId = req.user.id;
        const { valutazione, titolo, contenuto } = req.body;

        if (!valutazione || !titolo || !contenuto) {
            return res.status(400).json({ success: false, error: 'Dati mancanti' });
        }

        await dao.updateRecensione(recensioneId, userId, { valutazione, titolo, contenuto });
        res.json({ success: true, message: 'Recensione aggiornata con successo' });
    } catch (error) {
        console.error('Errore modifica recensione:', error);
        res.status(500).json({ success: false, error: 'Errore nella modifica della recensione' });
    }
});

// Elimina una recensione dell'utente
router.delete('/recensioni/:id', isLoggedIn, async (req, res) => {
    try {
        const recensioneId = req.params.id;
        const userId = req.user.id;

        await dao.deleteRecensione(recensioneId, userId);
        res.json({ success: true, message: 'Recensione eliminata con successo' });
    } catch (error) {
        console.error('Errore eliminazione recensione:', error);
        res.status(500).json({ success: false, error: 'Errore nell\'eliminazione della recensione' });
    }
});


module.exports = router;