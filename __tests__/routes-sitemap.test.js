"use strict";

const request = require('supertest');
const app = require('../src/app');

jest.mock('../src/features/notizie/services/dao-notizie', () => ({
    getNotizieFiltered: jest.fn().mockResolvedValue([{ id: 1, created_at: new Date() }])
}));

jest.mock('../src/features/eventi/services/dao-eventi', () => ({
    getEventiPubblicati: jest.fn().mockResolvedValue([{ id: 1, created_at: new Date() }])
}));

jest.mock('../src/features/squadre/services/dao-squadre', () => ({
    getSquadre: jest.fn().mockResolvedValue([{ id: 1, created_at: new Date() }])
}));

jest.mock('../src/core/config/redis', () => ({
  redisClient: {
    get: jest.fn(),
    set: jest.fn(),
    on: jest.fn(),
    connect: jest.fn()
  },
  initRedis: jest.fn()
}));

describe('Sitemap Routes', () => {
    it('GET /sitemap.xml returns XML and includes links', async () => {
        const res = await request(app).get('/sitemap.xml');
        expect(res.status).toBe(200);
        expect(res.header['content-type']).toContain('application/xml');
        expect(res.text).toContain('<urlset');
        expect(res.text).toContain('<loc>https://asdborgovercelli.app/</loc>');
        expect(res.text).toContain('/notizia/1');
        expect(res.text).toContain('/evento/1');
        expect(res.text).toContain('/getsquadra/1');
    });

    it('GET /sitemap.xml handles DAO errors gracefully', async () => {
        const daoNotizie = require('../src/features/notizie/services/dao-notizie');
        daoNotizie.getNotizieFiltered.mockRejectedValue(new Error('DB Fail'));
        
        const res = await request(app).get('/sitemap.xml');
        expect(res.status).toBe(200); // Should still return static links
        expect(res.text).toContain('<loc>https://asdborgovercelli.app/</loc>');
    });
});
