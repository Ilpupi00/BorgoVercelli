"use strict";

const request = require('supertest');
process.env.DATABASE_URL = 'postgres://u:p@h:5432/d';
const app = require('../src/app');

jest.mock('../src/shared/services/webpush', () => ({
    loadSubscriptions: jest.fn().mockResolvedValue([]),
    addSubscription: jest.fn().mockResolvedValue(true),
    getSubscriptionByEndpoint: jest.fn().mockResolvedValue(null),
    removeSubscription: jest.fn().mockResolvedValue(true),
    sendNotificationToUsers: jest.fn().mockResolvedValue({ success: true }),
    sendNotificationToAdmins: jest.fn().mockResolvedValue({ success: true }),
    sendNotificationToAll: jest.fn().mockResolvedValue({ success: true })
}));

describe('Push Routes', () => {
    it('GET /push/vapidPublicKey should return public key', async () => {
        const res = await request(app).get('/push/vapidPublicKey');
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('publicKey');
    });

    it('POST /push/subscribe should return 401 if not logged', async () => {
        const res = await request(app).post('/push/subscribe').send({});
        expect(res.status).toBe(401);
    });

    it('POST /push/subscribe-anon should return 201 if not in production', async () => {
        const res = await request(app).post('/push/subscribe-anon').send({ endpoint: 'test' });
        expect(res.status).toBe(201);
    });

    it('POST /push/subscribe-error should return 200', async () => {
        const res = await request(app).post('/push/subscribe-error').send({ error: 'test' });
        expect(res.status).toBe(200);
    });

    it('GET /push/test should redirect to login if not logged', async () => {
        const res = await request(app).get('/push/test');
        expect(res.status).toBe(302);
        expect(res.header.location).toBe('/login');
    });

    it('GET /push/debug should return 401 if not logged', async () => {
        const res = await request(app).get('/push/debug');
        expect(res.status).toBe(401);
    });
});
