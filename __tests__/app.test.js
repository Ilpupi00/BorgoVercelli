"use strict";

process.env.DATABASE_URL = 'postgres://u:p@h:5432/d';
process.env.VAPID_PUBLIC_KEY = 'BNEZ_559m_X66rN3j5K6vFzR4o4e7yX9G6m1G6m1G6m1G6m1G6m1G6m1G6m1G6m1G6m1G6m1G6m1G6m1G6m1G6m1G6m1';
process.env.VAPID_PRIVATE_KEY = 'test-private-key';
process.env.VAPID_EMAIL = 'test@test.com';

const request = require('supertest');

// Mock external services before requiring app
jest.mock('web-push');
jest.mock('../src/core/config/database');
jest.mock('../src/core/config/redis', () => ({
    redisClient: {
        on: jest.fn(),
        connect: jest.fn().mockResolvedValue(),
    },
    initRedis: jest.fn().mockResolvedValue(),
}));
jest.mock('../src/server/workers/notifications-worker', () => ({
    startWorker: jest.fn().mockResolvedValue(),
    stopWorker: jest.fn().mockResolvedValue(),
}));
jest.mock('connect-redis', () => {
    return {
        RedisStore: jest.fn().mockImplementation(() => {
            return { on: jest.fn(), emit: jest.fn() };
        })
    };
});

const app = require('../src/app');

describe('App.js', () => {
    it('GET / should redirect to /homepage', async () => {
        const res = await request(app).get('/');
        expect(res.status).toBe(302);
        expect(res.header.location).toBe('/homepage');
    });

    it('GET /favicon.ico should return Logo.png', async () => {
        const res = await request(app).get('/favicon.ico');
        expect(res.status).toBe(200);
        expect(res.header['content-type']).toContain('image/png');
    });

    it('GET /api/proxy-image should block unallowed domains', async () => {
        const res = await request(app).get('/api/proxy-image?url=https://malicious.com/img.jpg');
        expect(res.status).toBe(403);
    });

    it('GET /api/proxy-image should allow whitelisted domains (Google)', async () => {
        // This will attempt an actual https request if not mocked
        // But since it's a proxy, we can just check it doesn't return 403 immediately
        const res = await request(app).get('/api/proxy-image?url=https://lh3.googleusercontent.com/abc');
        // It might fail with 500 or timeout because we didn't mock https.get, but not 403
        expect(res.status).not.toBe(403);
    });

    it('GET /non-existent-page should return 404', async () => {
        const res = await request(app).get('/non-existent-page');
        expect(res.status).toBe(404);
    });

    it('EJS locals should be configured', () => {
        expect(app.locals.formatDate).toBeDefined();
        expect(app.locals.formatDateTime).toBeDefined();
        expect(app.locals.formatDate(new Date('2026-01-01'))).toContain('2026');
    });
});
