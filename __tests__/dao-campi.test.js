"use strict";

process.env.DATABASE_URL = 'postgres://u:p@h:5432/d';
const db = require('../src/core/config/database');
const daoCampi = require('../src/features/prenotazioni/services/dao-campi');

jest.mock('../src/core/config/database');

describe('DAO Campi', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('getCampi should return fields with image fallback', async () => {
        db.all.mockImplementation((sql, cb) => cb(null, [{ id: 1, nome: 'A', immagine_url: null }]));
        const res = await daoCampi.getCampi();
        expect(res[0].immagine).toBe('/assets/images/Campo.png');
    });

    it('getCampoById should reject if not found', async () => {
        db.get.mockImplementation((sql, params, cb) => cb(null, null));
        await expect(daoCampi.getCampoById(1)).rejects.toEqual({ error: 'Field not found' });
    });

    it('getOrariCampo should handle specific day and default fallback SQL', async () => {
        db.all.mockImplementation((sql, params, cb) => {
            expect(sql).toContain('EXISTS');
            cb(null, []);
        });
        await daoCampi.getOrariCampo(1, 2);
    });

    it('addOrarioCampo should return new id', async () => {
        db.run.mockImplementation((sql, params, cb) => cb(null, { rows: [{ id: 99 }] }));
        const res = await daoCampi.addOrarioCampo(1, 0, '10:00', '11:00');
        expect(res.id).toBe(99);
    });

    it('updateOrarioCampoPartial should build dynamic query', async () => {
        db.run.mockImplementation((sql, params, cb) => cb(null, { rowCount: 1 }));
        const res = await daoCampi.updateOrarioCampoPartial(1, { ora_inizio: '11:00', attivo: true });
        expect(res.changes).toBe(1);
        expect(db.run).toHaveBeenCalledWith(expect.stringContaining('ora_inizio = ?, attivo = ?'), expect.arrayContaining(['11:00', true]), expect.any(Function));
    });

    it('updateCampo should handle boolean conversion', async () => {
        db.run.mockImplementation((sql, params, cb) => cb(null, { rowCount: 1 }));
        const res = await daoCampi.updateCampo(1, { attivo: true, illuminazione: false });
        expect(res.success).toBe(true);
        expect(db.run).toHaveBeenCalledWith(expect.stringContaining('SET attivo = ?, illuminazione = ?'), expect.arrayContaining([true, false]), expect.any(Function));
    });

    it('searchCampi should use LIKE with searchTerm', async () => {
        db.all.mockImplementation((sql, params, cb) => cb(null, []));
        await daoCampi.searchCampi('%test%');
        expect(db.all).toHaveBeenCalledWith(expect.stringContaining('LIKE ?'), ['%test%', '%test%', '%test%'], expect.any(Function));
    });
});
