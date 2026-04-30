// Configurazione globale per i test
process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = 'test-secret';
process.env.RAILWAY_ENVIRONMENT = '';
process.env.TZ = 'Europe/Rome';

// Mocks globali per log (opzionale: decommentare per nascondere info/errori console durante i test)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   error: jest.fn(),
//   warn: jest.fn(),
//   info: jest.fn(),
// };

// Global teardown to prevent worker leaks
afterAll(async () => {
    // Chiudi connessioni DB se il modulo è stato caricato
    try {
        if (require.cache[require.resolve('./src/core/config/database')]) {
            const db = require('./src/core/config/database');
            if (db && db.close) {
                await db.close();
            }
        }
    } catch (e) {
        // Silenzioso
    }

    // Chiudi client Redis se il modulo è stato caricato
    try {
        if (require.cache[require.resolve('./src/core/config/redis')]) {
            const { redisClient } = require('./src/core/config/redis');
            if (redisClient && redisClient.quit) {
                await redisClient.quit();
            } else if (redisClient && redisClient.disconnect) {
                await redisClient.disconnect();
            }
        }
    } catch (e) {
        // Silenzioso
    }
});
