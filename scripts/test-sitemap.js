(async () => {
  // Test script per sitemap dinamica con DAOs mockati
  const express = require('express');
  const axios = require('axios');
  const path = require('path');

  // Mock dei moduli DAO prima di richiedere la route
  function mockModule(modulePath, exportsObj) {
    // Risolvi percorso assoluto relativo alla root del repo (uno sopra scripts)
    const absolute = path.resolve(__dirname, '..', modulePath);
    const absoluteJs = absolute.endsWith('.js') ? absolute : absolute + '.js';
    // Inserisci entrambe le chiavi (con e senza .js) per coprire risoluzioni diverse
    [absolute, absoluteJs].forEach(key => {
      try {
        require.cache[key] = {
          id: key,
          filename: key,
          loaded: true,
          exports: exportsObj
        };
      } catch (e) {
        // ignore
      }
    });
  }

  // Mock data
  const mockNotizie = [
    { id: 101, data_pubblicazione: '2025-11-01T12:00:00Z', data_modifica: '2025-11-10T12:00:00Z', created_at: '2025-11-01T12:00:00Z' },
    { id: 102, data_pubblicazione: '2025-10-15T12:00:00Z', data_modifica: null, created_at: '2025-10-15T12:00:00Z' }
  ];
  const mockEventi = [
    { id: 201, updated_at: '2025-11-12T09:00:00Z', created_at: '2025-11-01T09:00:00Z' }
  ];
  const mockSquadre = [
    { id: 301, updated_at: '2025-10-30T08:00:00Z', created_at: '2025-10-01T08:00:00Z' }
  ];

  // Inserisci i mock nella cache dei require per i percorsi usati dalla route
  mockModule('src/features/notizie/services/dao-notizie', {
    getNotizieFiltered: async () => mockNotizie
  });
  mockModule('src/features/eventi/services/dao-eventi', {
    getEventiPubblicati: async () => mockEventi
  });
  mockModule('src/features/squadre/services/dao-squadre', {
    getSquadre: async () => mockSquadre
  });

  // Ora richiedi la route della sitemap
  let sitemapRouter;
  try {
    const sitemapPath = path.resolve(__dirname, '..', 'src', 'shared', 'routes', 'sitemap');
    sitemapRouter = require(sitemapPath);
  } catch (err) {
    console.error('Errore nel require della route sitemap:', err);
    process.exit(1);
  }

  const app = express();
  app.use('/', sitemapRouter);

  const port = 3010;
  const server = app.listen(port, async () => {
    console.log('Test server avviato su http://localhost:' + port);
    try {
      const res = await axios.get(`http://localhost:${port}/sitemap.xml`, { responseType: 'text' });
      const text = res.data;
      console.log('--- Response headers ---');
      console.log(`Status: ${res.status}`);
      console.log(`Content-Type: ${res.headers['content-type']}`);
      console.log('--- Sitemap XML ---');
      console.log(text.substring(0, 3200)); // stampa fino a 3200 caratteri
    } catch (err) {
      console.error('Errore durante la richiesta /sitemap.xml:', err);
    } finally {
      server.close(() => {
        console.log('Server di test chiuso');
        process.exit(0);
      });
    }
  });
})();
