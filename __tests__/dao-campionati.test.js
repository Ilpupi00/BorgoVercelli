"use strict";

process.env.DATABASE_URL = 'postgres://u:p@h:5432/d';
const db = require('../src/core/config/database');
const daoCampionati = require('../src/features/campionati/services/dao-campionati');

jest.mock('../src/core/config/database');

describe('DAO Campionati', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('getAllCampionati should return all records', async () => {
        db.all.mockImplementation((sql, cb) => cb(null, [{ id: 1, nome: 'A' }, { id: 2, nome: 'B' }]));
        const res = await daoCampionati.getAllCampionati();
        expect(res).toHaveLength(2);
    });

    it('getAllCampionati should reject on DB error', async () => {
        db.all.mockImplementation((sql, cb) => cb(new Error('DB error')));
        await expect(daoCampionati.getAllCampionati()).rejects.toHaveProperty('error');
    });

    it('getCampionati should return active records', async () => {
        db.all.mockImplementation((sql, cb) => cb(null, [{ id: 1, nome: 'A', attivo: true }]));
        const res = await daoCampionati.getCampionati();
        expect(res).toHaveLength(1);
    });

    it('getCampionati should reject on DB error', async () => {
        db.all.mockImplementation((sql, cb) => cb(new Error('DB error')));
        await expect(daoCampionati.getCampionati()).rejects.toHaveProperty('error');
    });

    it('getCampionatoById should return single record', async () => {
        db.get.mockImplementation((sql, params, cb) => cb(null, { id: 1, nome: 'A' }));
        const res = await daoCampionati.getCampionatoById(1);
        expect(res.id).toBe(1);
    });

    it('getCampionatoById should return null if not found', async () => {
        db.get.mockImplementation((sql, params, cb) => cb(null, null));
        const res = await daoCampionati.getCampionatoById(999);
        expect(res).toBeNull();
    });

    it('getCampionatoById should reject on DB error', async () => {
        db.get.mockImplementation((sql, params, cb) => cb(new Error('DB error')));
        await expect(daoCampionati.getCampionatoById(1)).rejects.toHaveProperty('error');
    });

    it('getClassificaByCampionatoId should apply table-success to top positions', async () => {
        db.get.mockImplementation((sql, params, cb) => cb(null, { promozione_diretta: 2, playoff_start: 3, playoff_end: 5, playout_start: 6, playout_end: 8, retrocessione_diretta: 2 }));
        db.all.mockImplementation((sql, params, cb) => cb(null, [
            { posizione: 1, squadra_nome: 'Team A', punti: 10 },
            { posizione: 3, squadra_nome: 'Team B', punti: 5 }
        ]));
        
        const res = await daoCampionati.getClassificaByCampionatoId(1);
        expect(res[0].classe).toBe('table-success');
        expect(res[1].classe).not.toBe('table-success');
    });

    it('getClassificaByCampionatoId should return empty array if campionato not found', async () => {
        db.get.mockImplementation((sql, params, cb) => cb(null, null));
        db.all.mockImplementation((sql, params, cb) => cb(null, []));
        const res = await daoCampionati.getClassificaByCampionatoId(999);
        expect(res).toHaveLength(0);
    });

    it('getClassificaByCampionatoId should reject on DB error', async () => {
        db.get.mockImplementation((sql, params, cb) => cb(new Error('DB error')));
        await expect(daoCampionati.getClassificaByCampionatoId(1)).rejects.toHaveProperty('error');
    });

    it('createCampionato should use default values', async () => {
        db.run.mockImplementation((sql, params, cb) => cb(null, { rows: [{ id: 123 }] }));
        const res = await daoCampionati.createCampionato({ nome: 'Test', stagione: '2024' });
        expect(res.id).toBe(123);
    });

    it('createCampionato should reject on DB error', async () => {
        db.run.mockImplementation((sql, params, cb) => cb(new Error('Insert error')));
        await expect(daoCampionati.createCampionato({ nome: 'Test' })).rejects.toHaveProperty('error');
    });

    it('updateCampionato should return changes', async () => {
        db.run.mockImplementation((sql, params, cb) => cb(null, { rowCount: 1 }));
        const res = await daoCampionati.updateCampionato(1, { nome: 'Updated' });
        expect(res.changes).toBe(1);
    });

    it('updateCampionato should reject on DB error', async () => {
        db.run.mockImplementation((sql, params, cb) => cb(new Error('Update error')));
        await expect(daoCampionati.updateCampionato(1, { nome: 'Fail' })).rejects.toHaveProperty('error');
    });

    it('deleteCampionato should return changes', async () => {
        db.run.mockImplementation((sql, params, cb) => cb(null, { rowCount: 1 }));
        const res = await daoCampionati.deleteCampionato(1);
        expect(res.changes).toBeDefined();
    });

    it('toggleCampionatoStatus should update attivo', async () => {
        db.run.mockImplementation((sql, params, cb) => cb(null, { rowCount: 1 }));
        const res = await daoCampionati.toggleCampionatoStatus(1, true);
        expect(res.changes).toBeDefined();
    });

    it('addSquadraCampionato should handle name/squadra_nome alias', async () => {
        db.run.mockImplementation((sql, params, cb) => cb(null, { rows: [{ id: 1 }] }));
        await daoCampionati.addSquadraCampionato(1, { nome: 'Team' });
        expect(db.run).toHaveBeenCalledWith(expect.any(String), expect.arrayContaining(['Team']), expect.any(Function));
    });

    it('removeSquadraCampionato should return changes', async () => {
        db.run.mockImplementation((sql, params, cb) => cb(null, { rowCount: 1 }));
        const res = await daoCampionati.removeSquadraCampionato(1, 'Team A');
        expect(res.changes).toBeDefined();
    });

    it('getSquadreByCampionatoId should return squadre list', async () => {
        db.all.mockImplementation((sql, params, cb) => cb(null, [{ id: 1, squadra_nome: 'Team A' }]));
        const res = await daoCampionati.getSquadreByCampionatoId(1);
        expect(res).toHaveLength(1);
    });

    it('updateSquadraCampionato should update row', async () => {
        db.run.mockImplementation((sql, params, cb) => cb(null, { rowCount: 1 }));
        const res = await daoCampionati.updateSquadraCampionato(1, 'Team A', { punti: 5, vittorie: 2, pareggi: 1, sconfitte: 0, gol_fatti: 3, gol_subiti: 1, differenza_reti: 2, posizione: 1 });
        expect(res.changes).toBeDefined();
    });
});
