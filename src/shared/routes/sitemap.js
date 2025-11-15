/**
 * @fileoverview Route per generare sitemap.xml dinamica
 * @description Genera sitemap XML "al volo" includendo pagine statiche e contenuti dinamici dal database
 */

'use strict';

const express = require('express');
const router = express.Router();
const { SitemapStream, streamToPromise } = require('sitemap');
const { Readable } = require('stream');

// Import DAO per contenuti dinamici
const daoNotizie = require('../../features/notizie/services/dao-notizie');
const daoEventi = require('../../features/eventi/services/dao-eventi');
const daoSquadre = require('../../features/squadre/services/dao-squadre');

/**
 * Route GET /sitemap.xml
 * Genera dinamicamente la sitemap XML interrogando il database
 */
router.get('/sitemap.xml', async (req, res) => {
    try {
        // Imposta header corretto per XML
        res.header('Content-Type', 'application/xml');

        // URL base del sito
        const hostname = 'https://asdborgovercelli.app';

        // Array di link per la sitemap
        const links = [];

        // ==================== PAGINE STATICHE ====================
        // Pagine principali con priorità e frequenza di aggiornamento
        const staticPages = [
            { url: '/', changefreq: 'daily', priority: 1.0 },
            { url: '/homepage', changefreq: 'daily', priority: 1.0 },
            { url: '/notizie/all', changefreq: 'daily', priority: 0.9 },
            { url: '/eventi', changefreq: 'daily', priority: 0.9 },
            { url: '/squadre', changefreq: 'weekly', priority: 0.8 },
            { url: '/campionato', changefreq: 'weekly', priority: 0.8 },
            { url: '/galleria', changefreq: 'weekly', priority: 0.7 },
            { url: '/societa', changefreq: 'monthly', priority: 0.7 },
            { url: '/prenotazione', changefreq: 'daily', priority: 0.8 },
            { url: '/recensioni/all', changefreq: 'weekly', priority: 0.7 },
            { url: '/contatti', changefreq: 'monthly', priority: 0.7 },
            { url: '/privacy', changefreq: 'yearly', priority: 0.5 },
            { url: '/regolamento', changefreq: 'yearly', priority: 0.5 },
            { url: '/search', changefreq: 'monthly', priority: 0.6 },
            // Pagine autenticazione (opzionali, possono essere escluse)
            { url: '/login', changefreq: 'monthly', priority: 0.5 },
            { url: '/registrazione', changefreq: 'monthly', priority: 0.5 }
        ];

        // Aggiungi pagine statiche all'array
        staticPages.forEach(page => {
            links.push({
                url: page.url,
                changefreq: page.changefreq,
                priority: page.priority
            });
        });

        // ==================== CONTENUTI DINAMICI DAL DATABASE ====================
        
        // 1. NOTIZIE PUBBLICATE
        // Query al database per ottenere tutte le notizie pubblicate
        try {
            const notizie = await daoNotizie.getNotizieFiltered({ pubblicata: true }, 0, 10000);
            
            if (notizie && Array.isArray(notizie)) {
                notizie.forEach(notizia => {
                    links.push({
                        url: `/notizia/${notizia.id}`,
                        changefreq: 'monthly',
                        priority: 0.8,
                        // Usa la data di ultima modifica se disponibile, altrimenti la data di pubblicazione
                        lastmod: notizia.data_modifica || notizia.data_pubblicazione || notizia.created_at
                    });
                });
            }
        } catch (notizieError) {
            console.error('[SITEMAP] Errore recupero notizie:', notizieError);
        }

        // 2. EVENTI PUBBLICATI
        // Query al database per ottenere tutti gli eventi pubblicati
        try {
            const eventi = await daoEventi.getEventiPubblicati();
            
            if (eventi && Array.isArray(eventi)) {
                eventi.forEach(evento => {
                    links.push({
                        url: `/evento/${evento.id}`,
                        changefreq: 'weekly',
                        priority: 0.7,
                        lastmod: evento.updated_at || evento.created_at
                    });
                });
            }
        } catch (eventiError) {
            console.error('[SITEMAP] Errore recupero eventi:', eventiError);
        }

        // 3. SQUADRE
        // Query al database per ottenere tutte le squadre
        try {
            const squadre = await daoSquadre.getSquadre();
            
            if (squadre && Array.isArray(squadre)) {
                squadre.forEach(squadra => {
                    links.push({
                        url: `/getsquadra/${squadra.id}`,
                        changefreq: 'monthly',
                        priority: 0.6,
                        lastmod: squadra.updated_at || squadra.created_at
                    });
                });
            }
        } catch (squadreError) {
            console.error('[SITEMAP] Errore recupero squadre:', squadreError);
        }

        // ==================== PLACEHOLDER PER ALTRI CONTENUTI DINAMICI ====================
        /*
         * ESEMPIO: Come aggiungere altre query al database
         * 
         * const daoProdotti = require('../../features/prodotti/services/dao-prodotti');
         * const prodotti = await daoProdotti.getProdottiPubblicati();
         * 
         * prodotti.forEach(prodotto => {
         *     links.push({
         *         url: `/prodotto/${prodotto.slug}`,
         *         changefreq: 'weekly',
         *         priority: 0.7,
         *         lastmod: prodotto.updatedAt
         *     });
         * });
         */

        // ==================== GENERAZIONE SITEMAP XML ====================
        
        // Crea stream della sitemap
        const stream = new SitemapStream({ hostname });

        // Converti l'array di links in stream leggibile
        const linkStream = Readable.from(links);

        // Pipe i links nello stream della sitemap e poi nella response
        linkStream.pipe(stream).pipe(res);

        // Alternativa con streamToPromise (se serve buffer completo prima di inviare)
        // const xmlBuffer = await streamToPromise(linkStream.pipe(stream));
        // res.send(xmlBuffer);

    } catch (error) {
        console.error('[SITEMAP] Errore nella generazione della sitemap:', error);
        res.status(500).send('Errore nella generazione della sitemap');
    }
});

module.exports = router;
