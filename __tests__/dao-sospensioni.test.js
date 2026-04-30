"use strict";

const daoSospensioni = require('../src/features/users/services/dao-sospensioni');
const db = require('../src/core/config/database');

jest.mock('../src/core/config/database', () => ({
    run: jest.fn(),
    get: jest.fn(),
    all: jest.fn()
}));

describe('DAO Sospensioni', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('getByUtenteId should return suspension details', async () => {
        db.get.mockImplementation((sql, params, cb) => cb(null, { utente_id: 1, motivo: 'Test' }));
        const res = await daoSospensioni.getByUtenteId(1);
        expect(res.motivo).toBe('Test');
    });

    it('getStatoUtente should return full status info', async () => {
        db.get.mockImplementation((sql, params, cb) => cb(null, { stato: 'sospeso', motivo: 'M', admin_id: 99 }));
        const res = await daoSospensioni.getStatoUtente(1);
        expect(res.stato).toBe('sospeso');
        expect(res.admin_sospensione_id).toBe(99);
    });

    it('getStatoUtente should reject if user not found', async () => {
        db.get.mockImplementation((sql, params, cb) => cb(null, null));
        await expect(daoSospensioni.getStatoUtente(999)).rejects.toHaveProperty('error', 'Utente non trovato');
    });

    it('sospendiUtente should successfully suspend a user', async () => {
        // First run (UPDATE UTENTI)
        db.run.mockImplementationOnce((sql, params, cb) => cb(null, { rowCount: 1 }));
        // Second run (INSERT UTENTI_SOSPENSIONI)
        db.run.mockImplementationOnce((sql, params, cb) => cb(null));
        
        const res = await daoSospensioni.sospendiUtente(1, 2, 'Reason', '2026-12-31');
        expect(res.message).toBe('Utente sospeso con successo');
    });

    it('sospendiUtente should reject if update fails', async () => {
        db.run.mockImplementationOnce((sql, params, cb) => cb(new Error('Update error')));
        await expect(daoSospensioni.sospendiUtente(1, 2, 'R', null)).rejects.toHaveProperty('error');
    });

    it('bannaUtente should successfully ban a user', async () => {
        db.run.mockImplementationOnce((sql, params, cb) => cb(null, { rowCount: 1 }));
        db.run.mockImplementationOnce((sql, params, cb) => cb(null));
        
        const res = await daoSospensioni.bannaUtente(1, 2, 'Ban reason');
        expect(res.message).toBe('Utente bannato con successo');
    });

    it('revocaSospensioneBan should successfully reactivate user', async () => {
        db.run.mockImplementationOnce((sql, params, cb) => cb(null, { rowCount: 1 }));
        db.run.mockImplementationOnce((sql, params, cb) => cb(null));
        
        const res = await daoSospensioni.revocaSospensioneBan(1);
        expect(res.message).toBe('Sospensione/Ban revocato con successo');
    });

    it('verificaSospensioniScadute should process expired suspensions', async () => {
        db.all.mockImplementation((sql, params, cb) => cb(null, [{ utente_id: 10 }, { utente_id: 11 }]));
        db.run.mockImplementation((sql, params, cb) => cb(null));
        
        const res = await daoSospensioni.verificaSospensioniScadute();
        expect(res.aggiornati).toBe(2);
        expect(db.run).toHaveBeenCalledTimes(2); // One for UPDATE UTENTI, one for DELETE SOSPENSIONI
    });

    it('verificaSospensioniScadute should do nothing if no expired ones', async () => {
        db.all.mockImplementation((sql, params, cb) => cb(null, []));
        const res = await daoSospensioni.verificaSospensioniScadute();
        expect(res.aggiornati).toBe(0);
        expect(db.run).not.toHaveBeenCalled();
    });
});
