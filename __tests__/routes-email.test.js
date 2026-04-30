"use strict";

const request = require('supertest');
const app = require('../src/app');

jest.mock('../src/shared/services/email-service', () => ({
    sendEmail: jest.fn().mockResolvedValue({ messageId: '123' }),
    verifyTransporter: jest.fn().mockResolvedValue(true)
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

describe('Email Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('POST /send-email success', async () => {
        const res = await request(app)
            .post('/send-email')
            .send({ name: 'Luca', email: 'luca@test.com', subject: 'Test', message: 'Hello' });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('POST /send-email returns 500 on error', async () => {
        const emailService = require('../src/shared/services/email-service');
        emailService.sendEmail.mockRejectedValue(new Error('SMTP Error'));
        const res = await request(app)
            .post('/send-email')
            .send({ name: 'Luca', email: 'luca@test.com', subject: 'Test', message: 'Hello' });
        expect(res.status).toBe(500);
        expect(res.body.error).toBe("Errore durante l'invio della mail.");
    });

    it('POST /send-email validation error', async () => {
        const res = await request(app)
            .post('/send-email')
            .send({ name: 'Luca' }); // missing fields
        expect(res.status).toBe(400);
    });
});
