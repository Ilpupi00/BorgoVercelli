'use strict';
const express = require('express');
const router = express.Router();
const daoNotizie = require('../services/dao-notizie');
const daoEventi = require('../services/dao-eventi');
const daoSquadre = require('../services/dao-squadre');
const daoCampi = require('../services/dao-campi');

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