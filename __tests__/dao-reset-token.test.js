"use strict";

const daoResetToken = require('../src/features/users/services/dao-reset-token');
const db = require('../src/core/config/database');

jest.mock('../src/core/config/database', () => ({
    run: jest.fn(),
    get: jest.fn()
}));

describe('DAO Reset Token', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('saveResetToken should successfully save or update a token', async () => {
        db.run.mockImplementation((sql, params, cb) => cb(null));
        const res = await daoResetToken.saveResetToken(1, 'test-token', new Date());
        expect(res.message).toBe('Reset token saved successfully');
        expect(db.run).toHaveBeenCalled();
    });

    it('saveResetToken should reject on database error', async () => {
        db.run.mockImplementation((sql, params, cb) => cb(new Error('DB connection failed')));
        await expect(daoResetToken.saveResetToken(1, 'test-token', new Date())).rejects.toHaveProperty('error');
    });

    it('getUserByResetToken should return a user for a valid token', async () => {
        const mockUser = { id: 1, email: 'user@test.com', tipo_utente_id: 1 };
        db.get.mockImplementation((sql, params, cb) => cb(null, mockUser));
        
        const user = await daoResetToken.getUserByResetToken('valid-token');
        expect(user).toBeDefined();
        expect(user.id).toBe(1);
        expect(db.get).toHaveBeenCalled();
    });

    it('getUserByResetToken should return null if token is not found or expired', async () => {
        db.get.mockImplementation((sql, params, cb) => cb(null, null));
        const user = await daoResetToken.getUserByResetToken('invalid-token');
        expect(user).toBeNull();
    });

    it('getUserByResetToken should reject on database error', async () => {
        db.get.mockImplementation((sql, params, cb) => cb(new Error('Read error'), null));
        await expect(daoResetToken.getUserByResetToken('token')).rejects.toHaveProperty('error');
    });

    it('invalidateResetToken should successfully delete a token', async () => {
        db.run.mockImplementation((sql, params, cb) => cb(null));
        const res = await daoResetToken.invalidateResetToken(1);
        expect(res.message).toBe('Reset token invalidated successfully');
        expect(db.run).toHaveBeenCalled();
    });

    it('invalidateResetToken should reject on database error', async () => {
        db.run.mockImplementation((sql, params, cb) => cb(new Error('Delete fail')));
        await expect(daoResetToken.invalidateResetToken(1)).rejects.toHaveProperty('error');
    });
});
