"use strict";

const daoPreferenze = require('../src/features/users/services/dao-preferenze');
const db = require('../src/core/config/database');

jest.mock('../src/core/config/database', () => ({
    run: jest.fn(),
    get: jest.fn()
}));

describe('DAO Preferenze', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('getByUtenteId should return user preferences', async () => {
        const mockPrefs = { ruolo_preferito: 'Attaccante', piede_preferito: 'Destro' };
        db.get.mockImplementation((sql, params, cb) => cb(null, mockPrefs));
        
        const res = await daoPreferenze.getByUtenteId(1);
        expect(res).toEqual(mockPrefs);
        expect(db.get).toHaveBeenCalled();
    });

    it('getByUtenteId should return null if no preferences found', async () => {
        db.get.mockImplementation((sql, params, cb) => cb(null, null));
        const res = await daoPreferenze.getByUtenteId(1);
        expect(res).toBeNull();
    });

    it('getByUtenteId should reject on error', async () => {
        db.get.mockImplementation((sql, params, cb) => cb(new Error('DB error')));
        await expect(daoPreferenze.getByUtenteId(1)).rejects.toHaveProperty('error');
    });

    it('upsert should successfully save preferences', async () => {
        db.run.mockImplementation((sql, params, cb) => cb(null));
        const res = await daoPreferenze.upsert(1, { ruolo_preferito: 'Portiere' });
        expect(res).toBe(true);
        expect(db.run).toHaveBeenCalled();
    });

    it('upsert should handle missing optional fields', async () => {
        db.run.mockImplementation((sql, params, cb) => cb(null));
        await daoPreferenze.upsert(1, {});
        expect(db.run).toHaveBeenCalledWith(expect.any(String), [1, null, null], expect.any(Function));
    });

    it('upsert should reject on error', async () => {
        db.run.mockImplementation((sql, params, cb) => cb(new Error('Upsert error')));
        await expect(daoPreferenze.upsert(1, {})).rejects.toHaveProperty('error');
    });

    it('deleteByUtenteId should successfully remove preferences', async () => {
        db.run.mockImplementation((sql, params, cb) => cb(null));
        const res = await daoPreferenze.deleteByUtenteId(1);
        expect(res).toBe(true);
    });

    it('deleteByUtenteId should reject on error', async () => {
        db.run.mockImplementation((sql, params, cb) => cb(new Error('Delete error')));
        await expect(daoPreferenze.deleteByUtenteId(1)).rejects.toHaveProperty('error');
    });
});
