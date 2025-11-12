'use strict';
const express = require('express');
const router = express.Router();
const daoNotizie = require('../../features/notizie/services/dao-notizie');
const daoEventi = require('../../features/eventi/services/dao-eventi');
const daoSquadre = require('../../features/squadre/services/dao-squadre');
const daoCampi = require('../../features/prenotazioni/services/dao-campi');

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
            console.log('[SEARCH] Notizie trovate:', notizie ? notizie.length : 0);
            if (notizie && notizie.length > 0) {
                console.log('[SEARCH] Prima notizia:', JSON.stringify({
                    id: notizie[0].id,
                    titolo: notizie[0].titolo,
                    immagine_url: notizie[0].immagine_url,
                    autore: notizie[0].autore
                }, null, 2));
            }

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
            isLogged: isLoggedIn,
            currentPath: req.path,
            searchResults: searchResults
        });
    } catch (error) {
        console.error('Errore nella ricerca:', error);
        res.render('search', {
            query: req.query.q || '',
            isLogged: req.isAuthenticated && req.isAuthenticated(),
            currentPath: req.path,
            searchResults: null,
            error: 'Errore nella ricerca'
        });
    }
});
module.exports = router;