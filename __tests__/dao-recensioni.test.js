"use strict";

process.env.DATABASE_URL = 'postgres://u:p@h:5432/d';
const db = require('../src/core/config/database');
const daoRecensioni = require('../src/features/recensioni/services/dao-recensioni');

jest.mock('../src/core/config/database');

describe('DAO Recensioni', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('getRecensioni should return reviews with user info', async () => {
        db.all.mockImplementation((sql, cb) => cb(null, [{ id: 1, titolo: 'Bello', nome_utente: 'Luca' }]));
        const res = await daoRecensioni.getRecensioni();
        expect(res).toHaveLength(1);
        expect(res[0].nome_utente).toBe('Luca');
    });

    it('getValutaMediaRecensioni should return average', async () => {
        db.get.mockImplementation((sql, cb) => cb(null, { media: 4.2 }));
        const res = await daoRecensioni.getValutaMediaRecensioni();
        expect(res).toBe(4.2);
    });

    it('inserisciRecensione should return id on success', async () => {
        db.run.mockImplementation((sql, params, cb) => cb(null, { rows: [{ id: 7 }] }));
        const res = await daoRecensioni.inserisciRecensione({
            utente_id: 1,
            entita_tipo: 'campo',
            entita_id: 1,
            valutazione: 5,
            titolo: 'Top',
            contenuto: 'Consigliato'
        });
        expect(res.success).toBe(true);
        expect(res.id).toBe(7);
    });

    it('getRecensioniByUserId should filter by user', async () => {
        db.all.mockImplementation((sql, params, cb) => cb(null, [{ id: 1, utente_id: 1 }]));
        const res = await daoRecensioni.getRecensioniByUserId(1);
        expect(res).toHaveLength(1);
    });

    it('updateRecensione should handle rowCount', async () => {
        db.run.mockImplementation((sql, params, cb) => cb(null, { rowCount: 1 }));
        const res = await daoRecensioni.updateRecensione(1, 1, { valutazione: 4 });
        expect(res.changes).toBe(1);
    });

    it('deleteRecensione should perform soft delete', async () => {
        db.run.mockImplementation((sql, params, cb) => cb(null, { rowCount: 1 }));
        const res = await daoRecensioni.deleteRecensione(1, 1);
        expect(res.success).toBe(true);
        expect(res.changes).toBe(1);
    });

    it('getRecensioneById should return single review', async () => {
        db.get.mockImplementation((sql, params, cb) => cb(null, { id: 1, titolo: 'A' }));
        const res = await daoRecensioni.getRecensioneById(1);
        expect(res.id).toBe(1);
    });

    it('updateRecensioneVisibile should update flag', async () => {
        db.run.mockImplementation((sql, params, cb) => cb(null, { rowCount: 1 }));
        const res = await daoRecensioni.updateRecensioneVisibile(1, false);
        expect(res.changes).toBe(1);
    });

    it('deleteRecensioneAdmin should perform hard delete', async () => {
        db.run.mockImplementation((sql, params, cb) => cb(null, { rowCount: 1 }));
        const res = await daoRecensioni.deleteRecensioneAdmin(1);
        expect(res.success).toBe(true);
    });
});
