"use strict";

process.env.DATABASE_URL = 'postgres://u:p@h:5432/d';
const db = require('../src/core/config/database');
const daoGalleria = require('../src/features/galleria/services/dao-galleria');

jest.mock('../src/core/config/database');
jest.mock('../src/shared/utils/file-helper', () => ({
    deleteImageFile: jest.fn()
}), { virtual: true });

describe('DAO Galleria', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('getImmagini should return only gallery uploads', async () => {
        db.all.mockImplementation((sql, cb) => cb(null, [{ id: 1, url: 'img1.jpg', tipo: 'upload della Galleria' }]));
        const res = await daoGalleria.getImmagini();
        expect(res).toHaveLength(1);
        expect(res[0].id).toBe(1);
    });

    it('getImmagineById should return a single image', async () => {
        db.get.mockImplementation((sql, params, cb) => cb(null, { id: 5, url: 'img5.jpg' }));
        const res = await daoGalleria.getImmagineById(5);
        expect(res.id).toBe(5);
        expect(res.url).toBe('/img5.jpg');
    });

    it('insertImmagine should return new ID', async () => {
        db.run.mockImplementation((sql, params, cb) => cb(null, { rows: [{ id: 10 }] }));
        const res = await daoGalleria.insertImmagine('test.jpg', 'now', 'now', 'desc');
        expect(res.id).toBe(10);
    });

    it('updateImmagine should succeed if record exists', async () => {
        db.run.mockImplementation((sql, params, cb) => cb(null, { rowCount: 1 }));
        const res = await daoGalleria.updateImmagine(1, 'New Desc');
        expect(res.message).toContain('successo');
    });

    it('deleteImmagine should handle missing record', async () => {
        db.get.mockImplementation((sql, params, cb) => cb(null, null));
        await expect(daoGalleria.deleteImmagine(999)).rejects.toEqual({ error: 'Immagine non trovata' });
    });

    it('uploadImmagine should return new ID', async () => {
        db.run.mockImplementation((sql, params, cb) => cb(null, { rows: [{ id: 20 }] }));
        const res = await daoGalleria.uploadImmagine({ filename: 'new.jpg' }, 'test');
        expect(res).toBe(20);
    });

    it('updateImmagineEntitaId should update relation', async () => {
        db.run.mockImplementation((sql, params, cb) => cb(null));
        const res = await daoGalleria.updateImmagineEntitaId(1, 100);
        expect(res.success).toBe(true);
    });

    it('insertImmagineNotizia should return new ID', async () => {
        db.run.mockImplementation((sql, params, cb) => cb(null, { rows: [{ id: 30 }] }));
        const res = await daoGalleria.insertImmagineNotizia('news.jpg', 50, 1);
        expect(res.id).toBe(30);
    });
});
