"use strict";

process.env.DATABASE_URL = 'postgres://u:p@h:5432/d';

const request = require('supertest');
const app = require('../src/app');
const dao = require('../src/features/notizie/services/dao-notizie');

jest.mock('../src/features/notizie/services/dao-notizie');
jest.mock('../src/features/galleria/services/dao-galleria');
jest.mock('../src/features/admin/services/dao-admin');
jest.mock('../src/core/config/database');
jest.mock('../src/core/config/redis', () => ({
  redisClient: {
    get: jest.fn(),
    set: jest.fn(),
    on: jest.fn(),
    connect: jest.fn()
  },
  initRedis: jest.fn()
}));

describe('Notizie Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('GET /notizie/all should render list of news', async () => {
        dao.getNotiziePaginated.mockResolvedValue([{ id: 1, titolo: 'News 1' }]);
        const res = await request(app).get('/notizie/all');
        expect(res.status).toBe(200);
        expect(res.text).toContain('News 1');
    });

    it('GET /api/notizie should return JSON news', async () => {
        dao.getNotizieFiltered.mockResolvedValue([{ id: 1, titolo: 'News 1' }]);
        const res = await request(app).get('/api/notizie');
        expect(res.status).toBe(200);
        expect(res.body.notizie).toBeDefined();
    });

    it('GET /notizia/:id should render detail page', async () => {
        dao.getNotiziaById.mockResolvedValue({ id: 1, titolo: 'Detailed News' });
        const res = await request(app).get('/notizia/1');
        expect(res.status).toBe(200);
        expect(res.text).toContain('Detailed News');
    });

    it('GET /notizia/:id should return 404 if news not found', async () => {
        dao.getNotiziaById.mockResolvedValue(null);
        const res = await request(app).get('/notizia/999');
        expect(res.status).toBe(404);
    });

    it('GET /api/notizia/:id should return JSON detail', async () => {
        dao.getNotiziaById.mockResolvedValue({ id: 1, titolo: 'API Detail' });
        const res = await request(app).get('/api/notizia/1');
        expect(res.status).toBe(200);
        expect(res.body.titolo).toBe('API Detail');
    });

    it('GET /notizie/mie should return 401 if not logged in', async () => {
        const res = await request(app).get('/notizie/mie');
        expect(res.status).toBe(401);
    });

    it('GET /crea-notizie should return 403 if not admin/dirigente', async () => {
        const res = await request(app).get('/crea-notizie');
        expect(res.status).toBe(403);
    });

    it('GET /api/notizie/authors should return authors list', async () => {
        dao.getNotizieAuthors.mockResolvedValue([{ id: 1, nome: 'Author' }]);
        const res = await request(app).get('/api/notizie/authors');
        expect(res.status).toBe(200);
        expect(res.body.authors).toBeDefined();
    });

    it('GET /notizie should return JSON list', async () => {
        dao.getNotizieFiltered.mockResolvedValue([{ id: 1, titolo: 'N' }]);
        const res = await request(app).get('/notizie');
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    it('POST /notizie/nuova should return 403 if not logged in', async () => {
        const res = await request(app).post('/notizie/nuova').send({ titolo: 'T' });
        expect(res.status).toBe(403);
    });

    it('DELETE /notizia/:id should return 401 if not logged in', async () => {
        const res = await request(app).delete('/notizia/1');
        expect(res.status).toBe(401);
    });

    it('GET /notizie/edit/:id should return 401 if not logged in', async () => {
        const res = await request(app).get('/notizie/edit/1');
        expect(res.status).toBe(401);
    });
});
