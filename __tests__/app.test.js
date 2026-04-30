const request = require('supertest');
const app = require('../src/app');

// Mock delle dipendenze complesse per non dipendere da DB veri se non disponibili
jest.mock('../src/core/config/redis', () => ({
  redisClient: {
    get: jest.fn(),
    set: jest.fn(),
    on: jest.fn(),
    connect: jest.fn()
  },
  initRedis: jest.fn()
}));

jest.mock('../src/features/users/services/dao-user', () => ({
  getUser: jest.fn(),
  getUserById: jest.fn().mockResolvedValue({ id: 1, email: 'test@test.com' }),
  getImmagineProfiloByUserId: jest.fn().mockResolvedValue(null)
}));

jest.mock('../src/features/prenotazioni/services/dao-prenotazione', () => ({
  checkAndUpdateScadute: jest.fn().mockResolvedValue(true),
  autoAcceptPendingBookings: jest.fn().mockResolvedValue(true),
  deleteScaduteOlderThanDays: jest.fn().mockResolvedValue({ deleted: 0 })
}));

describe('App Server', () => {
  it('GET / should redirect to /homepage', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/homepage');
  });

  it('GET /api/proxy-image should reject missing url', async () => {
    const response = await request(app).get('/api/proxy-image');
    expect(response.status).toBe(400);
  });
});
