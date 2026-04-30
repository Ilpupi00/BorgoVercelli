"use strict";

const nodemailer = require('nodemailer');

jest.mock('nodemailer', () => ({
    createTransport: jest.fn().mockReturnValue({
        sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id' }),
        verify: jest.fn().mockResolvedValue(true)
    })
}));

const emailService = require('../src/shared/services/email-service');
const { transporter } = emailService; // it is not exported, but let's see

describe('Email Service', () => {
    beforeEach(() => {
        const transport = nodemailer.createTransport();
        transport.sendMail.mockClear();
        transport.verify.mockClear();
    });

    it('verifyTransporter should call transporter.verify', async () => {
        const res = await emailService.verifyTransporter();
        expect(res).toBe(true);
    });

    it('sendEmail should call transporter.sendMail', async () => {
        const res = await emailService.sendEmail({
            fromName: 'Test',
            fromEmail: 'from@test.com',
            subject: 'Subject',
            message: 'Text',
            to: 'test@test.com'
        });
        expect(res).toHaveProperty('messageId');
    });

    it('sendResetEmail should send reset email', async () => {
        const res = await emailService.sendResetEmail('test@test.com', 'http://reset');
        expect(res).toHaveProperty('messageId');
    });

    it('sendPrenotazioneRicevutaEmail should send booking received email', async () => {
        const res = await emailService.sendPrenotazioneRicevutaEmail('test@test.com', 'User', {
            dataOra: 'Today',
            attivita: 'Calcio',
            luogo: 'Campo 1'
        });
        expect(res).toHaveProperty('messageId');
    });

    it('sendReminderEmail should send reminder email', async () => {
        const res = await emailService.sendReminderEmail('test@test.com', 'User', {
            dataOra: 'Today',
            attivita: 'Calcio',
            luogo: 'Campo 1'
        }, { isAdmin: false });
        expect(res).toHaveProperty('messageId');
    });

    it('sendWithRetry should retry on failure', async () => {
        const transport = nodemailer.createTransport();
        const transientErr = new Error('Transient error');
        transientErr.code = 'ETIMEDOUT';
        
        transport.sendMail
            .mockRejectedValueOnce(transientErr)
            .mockResolvedValueOnce({ messageId: 'retry-id' });
        
        const res = await emailService.sendWithRetry({ to: 'test@test.com' });
        expect(res.messageId).toBe('retry-id');
        expect(transport.sendMail).toHaveBeenCalledTimes(2);
    });
});
