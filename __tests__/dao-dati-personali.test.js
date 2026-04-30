"use strict";

process.env.DATABASE_URL = 'postgres://u:p@h:5432/d';
const db = require('../src/core/config/database');
const daoDatiPersonali = require('../src/features/users/services/dao-dati-personali');

jest.mock('../src/core/config/database');

describe('DAO Dati Personali', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('getByUtenteId should return personal data', async () => {
        db.get.mockImplementation((sql, params, cb) => cb(null, { data_nascita: '1990-01-01', codice_fiscale: 'XYZ' }));
        const res = await daoDatiPersonali.getByUtenteId(1);
        expect(res.data_nascita).toBe('1990-01-01');
    });

    it('upsert should call db.run with correct params', async () => {
        db.run.mockImplementation((sql, params, cb) => cb(null));
        const res = await daoDatiPersonali.upsert(1, { data_nascita: '1990-01-01', codice_fiscale: 'ABC' });
        expect(res).toBe(true);
        expect(db.run).toHaveBeenCalledWith(expect.any(String), [1, '1990-01-01', 'ABC'], expect.any(Function));
    });

    it('deleteByUtenteId should call db.run', async () => {
        db.run.mockImplementation((sql, params, cb) => cb(null));
        const res = await daoDatiPersonali.deleteByUtenteId(1);
        expect(res).toBe(true);
    });
});
