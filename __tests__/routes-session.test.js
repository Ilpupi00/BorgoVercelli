"use strict";

const request = require('supertest');
process.env.DATABASE_URL = 'postgres://u:p@h:5432/d';
const app = require('../src/app');

jest.mock('../src/core/config/redis', () => ({
    redisClient: {
        keys: jest.fn().mockResolvedValue(['sess:1', 'sess:2']),
        get: jest.fn().mockResolvedValue(JSON.stringify({ passport: { user: 1 }, cookie: {} })),
        set: jest.fn().mockResolvedValue('OK'),
        del: jest.fn().mockResolvedValue(1),
        on: jest.fn(),
        connect: jest.fn().mockResolvedValue(true),
        isOpen: true,
        ping: jest.fn().mockResolvedValue('PONG'),
        quit: jest.fn().mockResolvedValue(true)
    },
    redisPubSubClient: {
        on: jest.fn(),
        connect: jest.fn().mockResolvedValue(true),
        status: 'ready',
        quit: jest.fn().mockResolvedValue(true)
    },
    redisQueueClient: {
        on: jest.fn(),
        connect: jest.fn().mockResolvedValue(true),
        status: 'ready',
        quit: jest.fn().mockResolvedValue(true)
    },
    initRedis: jest.fn().mockResolvedValue(true),
    closeRedis: jest.fn().mockResolvedValue(true)
}));

describe('Session Routes', () => {
    it('GET /session/user should return unauthorized if not logged', async () => {
        const res = await request(app).get('/session/user');
        expect(res.status).toBe(401);
    });

    it('POST /session should return 401 on invalid credentials', async () => {
        const res = await request(app)
            .post('/session')
            .send({ email: 'wrong@test.com', password: 'wrong' });
        expect(res.status).toBe(401);
    });

    it('GET /session should return 405 Method Not Allowed', async () => {
        const res = await request(app).get('/session');
        expect(res.status).toBe(405);
    });

    it('DELETE /session should perform logout', async () => {
        const res = await request(app).delete('/session');
        if (res.status === 500) console.log('LOGOUT ERROR:', res.text.substring(0, 500));
        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Logout effettuato');
    });

    describe('Admin operations', () => {
        it('GET /session/stats/redis should require admin', async () => {
            const res = await request(app).get('/session/stats/redis');
            expect(res.status).toBe(403);
        });

        it('DELETE /session/admin/clear-all should require admin', async () => {
            const res = await request(app).delete('/session/admin/clear-all');
            expect(res.status).toBe(403);
        });
    });
});
