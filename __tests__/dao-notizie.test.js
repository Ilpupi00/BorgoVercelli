"use strict";

process.env.DATABASE_URL = 'postgres://u:p@h:5432/d';
const db = require('../src/core/config/database');
const daoNotizie = require('../src/features/notizie/services/dao-notizie');

jest.mock('../src/core/config/database');

describe('DAO Notizie', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('getNotizie should return mapped news with author full name', async () => {
        const mockRows = [{
            N_id: 1,
            N_titolo: 'Titolo Notizia',
            autore_nome: 'Mario',
            autore_cognome: 'Rossi',
            immagine_url: '/img.jpg'
        }];
        db.all.mockImplementation((sql, cb) => cb(null, mockRows));
        
        const res = await daoNotizie.getNotizie();
        expect(res).toHaveLength(1);
        expect(res[0].autore).toBe('Mario Rossi');
        expect(res[0].immagine.url).toBe('/img.jpg');
    });

    it('getNotiziePaginated should respect limit and offset', async () => {
        db.all.mockImplementation((sql, params, cb) => {
            expect(params).toEqual([6, 0]);
            cb(null, [{ N_id: 1, N_titolo: 'Paginata' }]);
        });
        const res = await daoNotizie.getNotiziePaginated(0, 6);
        expect(res).toHaveLength(1);
    });

    it('getNotiziaById should return null if not found', async () => {
        db.get.mockImplementation((sql, params, cb) => cb(null, null));
        const res = await daoNotizie.getNotiziaById(999);
        expect(res).toBeNull();
    });

    it('incrementVisualizzazioni should update and return new count', async () => {
        db.run.mockImplementation((sql, params, cb) => cb(null));
        db.get.mockImplementation((sql, params, cb) => cb(null, { visualizzazioni: 10 }));
        const res = await daoNotizie.incrementVisualizzazioni(1);
        expect(res.visualizzazioni).toBe(10);
    });

    it('deleteNotiziaById should handle zero deletions', async () => {
        db.run.mockImplementation((sql, params, cb) => cb(null, { rowCount: 0 }));
        const res = await daoNotizie.deleteNotiziaById(1);
        expect(res.success).toBe(false);
    });

    it('createNotizia should handle Postgres RETURNING id', async () => {
        db.run.mockImplementation((sql, params, cb) => cb(null, { rows: [{ id: 100 }] }));
        const res = await daoNotizie.createNotizia({ titolo: 'Nuova' });
        expect(res.id).toBe(100);
    });

    it('getNotizieFiltered should apply search filter', async () => {
        db.all.mockImplementation((sql, params, cb) => {
            expect(sql).toContain('LIKE ?');
            cb(null, []);
        });
        await daoNotizie.getNotizieFiltered({ search: 'test' });
    });

    it('getNotizieAuthors should return unique names', async () => {
        db.all.mockImplementation((sql, cb) => cb(null, [{ nome_completo: 'A B' }, { nome_completo: 'C D' }]));
        const res = await daoNotizie.getNotizieAuthors();
        expect(res).toEqual(['A B', 'C D']);
    });

    it('updateNotizia should update fields', async () => {
        db.run.mockImplementation((sql, params, cb) => cb(null, { rowCount: 1 }));
        const res = await daoNotizie.updateNotizia(1, { titolo: 'Updated', contenuto: 'New content' });
        expect(res.changes).toBe(1);
    });

    it('setImmagineNotizia should set image', async () => {
        db.run.mockImplementation((sql, params, cb) => cb(null, { rowCount: 1 }));
        const res = await daoNotizie.setImmagineNotizia(1, 10);
        expect(res.changes).toBe(1);
    });

    it('togglePubblicazioneNotizia should toggle status', async () => {
        db.run.mockImplementation((sql, params, cb) => cb(null, { rowCount: 1 }));
        const res = await daoNotizie.togglePubblicazioneNotizia(1);
        expect(res.changes).toBe(1);
    });

    it('searchNotizie should return matching news', async () => {
        db.all.mockImplementation((sql, params, cb) => cb(null, [{ N_id: 1, N_titolo: 'Result' }]));
        const res = await daoNotizie.searchNotizie('%test%');
        expect(res).toHaveLength(1);
    });

    it('getNotiziePersonali should filter by user', async () => {
        db.all.mockImplementation((sql, params, cb) => cb(null, [{ N_id: 1, N_titolo: 'Mine' }]));
        const res = await daoNotizie.getNotiziePersonali(5);
        expect(res).toHaveLength(1);
    });

    it('getNotizieFiltered without search should not add LIKE clause', async () => {
        db.all.mockImplementation((sql, params, cb) => {
            expect(sql).not.toContain('LIKE ?');
            cb(null, []);
        });
        await daoNotizie.getNotizieFiltered({});
    });

    it('getNotizie should return all news', async () => {
        db.all.mockImplementation((sql, cb) => cb(null, [{ N_id: 1, N_titolo: 'News', autore_nome: 'X', autore_cognome: 'Y' }]));
        const res = await daoNotizie.getNotizie();
        expect(res).toHaveLength(1);
        expect(res[0].autore).toBe('X Y');
    });
});
