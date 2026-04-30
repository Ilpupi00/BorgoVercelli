"use strict";

process.env.DATABASE_URL = 'postgres://u:p@h:5432/d';
const db = require('../src/core/config/database');
const daoEventi = require('../src/features/eventi/services/dao-eventi');

jest.mock('../src/core/config/database');

describe('DAO Eventi', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('getEventi should return published events', async () => {
        db.all.mockImplementation((sql, cb) => cb(null, [{ id: 1, titolo: 'Evento', pubblicato: true }]));
        const res = await daoEventi.getEventi();
        expect(res).toHaveLength(1);
    });

    it('getEventoById should handle missing event', async () => {
        db.get.mockImplementation((sql, params, cb) => cb(null, null));
        await expect(daoEventi.getEventoById(999)).rejects.toEqual({ error: 'Event not found' });
    });

    it('getEventoById should return event with images', async () => {
        db.get.mockImplementation((sql, params, cb) => cb(null, { id: 1, titolo: 'Evento' }));
        db.all.mockImplementation((sql, params, cb) => cb(null, [{ id: 10, url: 'image.jpg' }]));
        
        const res = await daoEventi.getEventoById(1);
        expect(res.id).toBe(1);
        expect(res.immagini).toHaveLength(1);
    });

    it('createEvento should return RETURNING id', async () => {
        db.run.mockImplementation((sql, params, cb) => cb(null, { rows: [{ id: 50 }] }));
        const res = await daoEventi.createEvento({ titolo: 'New Event', pubblicato: true });
        expect(res.id).toBe(50);
    });

    it('updateEvento should return success on changes', async () => {
        db.run.mockImplementation((sql, params, cb) => cb(null, { rowCount: 1 }));
        const res = await daoEventi.updateEvento(1, { titolo: 'Updated' });
        expect(res.success).toBe(true);
    });

    it('deleteEventoById should handle rowCount', async () => {
        // The implementation uses arguments[1] to get the result object
        db.run.mockImplementation((sql, params, cb) => {
            cb(null, { rowCount: 1 });
        });
        const res = await daoEventi.deleteEventoById(1);
        expect(res.changes).toBe(1);
    });

    it('togglePubblicazioneEvento should return changes', async () => {
        db.run.mockImplementation((sql, params, cb) => cb(null, { rowCount: 1 }));
        const res = await daoEventi.togglePubblicazioneEvento(1);
        expect(res.changes).toBe(1);
    });

    it('searchEventi should return matches', async () => {
        db.all.mockImplementation((sql, params, cb) => cb(null, [{ id: 1, titolo: 'Match' }]));
        const res = await daoEventi.searchEventi('test');
        expect(res).toHaveLength(1);
        expect(res[0].titolo).toBe('Match');
    });

    it('getEventiPersonali should filter by user', async () => {
        db.all.mockImplementation((sql, params, cb) => cb(null, [{ id: 1, autore_id: 10 }]));
        const res = await daoEventi.getEventiPersonali(10);
        expect(res).toHaveLength(1);
    });

    it('getEventiAll should return all events including drafts', async () => {
        db.all.mockImplementation((sql, cb) => cb(null, [{ id: 1 }, { id: 2 }]));
        const res = await daoEventi.getEventiAll();
        expect(res).toHaveLength(2);
    });

    it('setImmagineEvento should return changes', async () => {
        db.run.mockImplementation((sql, params, cb) => cb(null, { rowCount: 1 }));
        const res = await daoEventi.setImmagineEvento(1, 10);
        expect(res.changes).toBe(1);
    });
});
