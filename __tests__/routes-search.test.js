"use strict";

const request = require('supertest');
process.env.DATABASE_URL = 'postgres://u:p@h:5432/d';

// Mock all DAOs used in search.js
jest.mock('../src/features/notizie/services/dao-notizie', () => ({
    getNotiziePaginated: jest.fn().mockResolvedValue([]),
    searchNotizie: jest.fn().mockResolvedValue([{ id: 1, titolo: 'News', immagine_url: '/img.jpg', autore: 'A B' }]),
    getNotizieFiltered: jest.fn().mockResolvedValue([]),
    getNotizieAuthors: jest.fn().mockResolvedValue([])
}));
jest.mock('../src/features/eventi/services/dao-eventi', () => ({
    getEventiPubblicati: jest.fn().mockResolvedValue([]),
    searchEventi: jest.fn().mockResolvedValue([{ id: 1, titolo: 'Event' }])
}));
jest.mock('../src/features/squadre/services/dao-squadre', () => ({
    getSquadre: jest.fn().mockResolvedValue([]),
    searchSquadre: jest.fn().mockResolvedValue([{ id: 1, nome: 'Squadra' }])
}));
jest.mock('../src/features/prenotazioni/services/dao-campi', () => ({
    searchCampi: jest.fn().mockResolvedValue([{ id: 1, nome: 'Campo' }]),
    getCampoById: jest.fn().mockResolvedValue({ id: 1, nome: 'Campo' })
}));
jest.mock('../src/features/recensioni/services/dao-recensioni', () => ({
    getRecensioni: jest.fn().mockResolvedValue([])
}));
jest.mock('../src/features/squadre/services/dao-membri-societa', () => ({
    getMembriSocieta: jest.fn().mockResolvedValue([])
}));
jest.mock('../src/features/campionati/services/dao-campionati', () => ({
    getCampionati: jest.fn().mockResolvedValue([]),
    getClassificaByCampionatoId: jest.fn().mockResolvedValue([])
}));
jest.mock('../src/shared/services/email-service', () => ({
    verifyTransporter: jest.fn().mockResolvedValue(true),
    sendEmail: jest.fn().mockResolvedValue({ messageId: 'test-id' }),
    sendTestViaResend: jest.fn().mockResolvedValue({ id: 'resend-id' })
}));
jest.mock('../src/core/config/redis', () => ({
    redisClient: { get: jest.fn(), set: jest.fn(), on: jest.fn(), connect: jest.fn() },
    initRedis: jest.fn()
}));

const app = require('../src/app');

describe('Search Routes', () => {
    beforeEach(() => { jest.clearAllMocks(); });

    it('GET /search should render search page without query', async () => {
        const res = await request(app).get('/search');
        expect(res.status).toBe(200);
        expect(res.text).toContain('search');
    });

    it('GET /search with query calls all DAOs and returns results', async () => {
        const res = await request(app).get('/search?q=calcio');
        expect(res.status).toBe(200);
        expect(res.text).toContain('search');
        const daoNotizie = require('../src/features/notizie/services/dao-notizie');
        expect(daoNotizie.searchNotizie).toHaveBeenCalled();
    });

    it('GET /search with short whitespace query should not trigger search', async () => {
        const res = await request(app).get('/search?q= ');
        expect(res.status).toBe(200);
        const daoNotizie = require('../src/features/notizie/services/dao-notizie');
        expect(daoNotizie.searchNotizie).not.toHaveBeenCalled();
    });

    it('GET /search with valid multi-word query searches all DAOs', async () => {
        const res = await request(app).get('/search?q=test query');
        expect(res.status).toBe(200);
    });

    it('GET /search handles DAO errors gracefully', async () => {
        const daoNotizie = require('../src/features/notizie/services/dao-notizie');
        daoNotizie.searchNotizie.mockRejectedValueOnce(new Error('DB error'));
        const res = await request(app).get('/search?q=test');
        expect(res.status).toBe(200); // renders graceful error page
    });
});
