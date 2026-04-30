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
