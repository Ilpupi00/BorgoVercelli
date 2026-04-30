"use strict";

process.env.DATABASE_URL = 'postgres://u:p@h:5432/d';
const db = require('../src/core/config/database');
const daoSquadre = require('../src/features/squadre/services/dao-squadre');
const daoDirigenti = require('../src/features/squadre/services/dao-dirigenti-squadre');

jest.mock('../src/core/config/database');
jest.mock('../src/features/squadre/services/dao-dirigenti-squadre');

describe('DAO Squadre', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('getSquadre should combine team data with dirigentes', async () => {
        db.all.mockImplementation((sql, cb) => cb(null, [{ id: 1, nome: 'Squadra A', anno_fondazione: 2000 }]));
        daoDirigenti.getDirigentiBySquadra.mockResolvedValue([{ id: 10, nome: 'Dirigente 1' }]);
        
        const res = await daoSquadre.getSquadre();
        expect(res).toHaveLength(1);
        expect(res[0].nome).toBe('Squadra A');
        expect(res[0].dirigenti).toHaveLength(1);
    });

    it('getGiocatori should return Giocatore instances', async () => {
        db.all.mockImplementation((sql, cb) => cb(null, [{ id: 1, nome: 'Luca', cognome: 'Lupi', squadra_id: 1 }]));
        const res = await daoSquadre.getGiocatori();
        expect(res).toHaveLength(1);
        expect(res[0].nome).toBe('Luca');
    });

    it('updateSquadra should handle image deletion', async () => {
        db.get.mockImplementation((sql, params, cb) => cb(null, { url: '/old_logo.png' }));
        db.run.mockImplementation((sql, params, cb) => cb(null, { rowCount: 1 }));
        
        // Mocking file-helper which is required inside updateSquadra
        jest.mock('../src/shared/utils/file-helper', () => ({
            deleteImageFile: jest.fn()
        }), { virtual: true });

        const res = await daoSquadre.updateSquadra(1, 'New Name', 2021, 50);
        expect(res.message).toContain('successo');
    });

    it('getSquadraById should return null if missing', async () => {
        db.get.mockImplementation((sql, params, cb) => cb(null, null));
        const res = await daoSquadre.getSquadraById(999);
        expect(res).toBeNull();
    });

    it('createGiocatore should return RETURNING id', async () => {
        db.run.mockImplementation((sql, params, cb) => cb(null, { rows: [{ id: 500 }] }));
        const res = await daoSquadre.createGiocatore({ nome: 'Mario', squadra_id: 1 });
        expect(res.id).toBe(500);
    });

    it('addDirigente should check for existing and insert', async () => {
        db.get.mockImplementationOnce((sql, params, cb) => cb(null, { id: 1 })) // User exists
              .mockImplementationOnce((sql, params, cb) => cb(null, null)) // Not already dirigente
              .mockImplementationOnce((sql, params, cb) => cb(null, { id: 1, nome: 'Mario' })); // Final get
        db.run.mockImplementation((sql, params, cb) => cb(null, { rows: [{ id: 200 }] }));
        
        const res = await daoSquadre.addDirigente(1, 'test@test.com');
        expect(res.id).toBe(1);
    });

    it('removeDirigente should delete from join table', async () => {
        db.run.mockImplementation((sql, params, cb) => cb(null, { rowCount: 1 }));
        const res = await daoSquadre.removeDirigente(1, 10);
        expect(res.message).toContain('successo');
    });

    it('createSquadra should insert and return id', async () => {
        db.run.mockImplementation((sql, params, cb) => cb(null, { rows: [{ id: 42 }] }));
        const res = await daoSquadre.createSquadra('Team A', 2000);
        expect(res.id).toBe(42);
    });

    it('deleteSquadra should delete and return message', async () => {
        db.run.mockImplementation((sql, params, cb) => cb(null, { rowCount: 1 }));
        const res = await daoSquadre.deleteSquadra(1);
        expect(res.message).toContain('successo');
    });

    it('searchSquadre should return matching teams', async () => {
        db.all.mockImplementation((sql, params, cb) => cb(null, [{ id: 1, nome: 'FC Test' }]));
        const res = await daoSquadre.searchSquadre('%test%');
        expect(res).toHaveLength(1);
    });

    it('getGiocatoriBySquadra should return players list', async () => {
        db.all.mockImplementation((sql, params, cb) => cb(null, [{ id: 1, nome: 'Player' }]));
        const res = await daoSquadre.getGiocatoriBySquadra(1);
        expect(res).toHaveLength(1);
    });

    it('deleteGiocatore should deactivate player', async () => {
        db.run.mockImplementation((sql, params, cb) => cb(null, { rowCount: 1 }));
        const res = await daoSquadre.deleteGiocatore(1);
        expect(res.message).toContain('successo');
    });

    it('getGiocatoreById should return player', async () => {
        db.get.mockImplementation((sql, params, cb) => cb(null, { id: 1, nome: 'Player' }));
        const res = await daoSquadre.getGiocatoreById(1);
        expect(res.nome).toBe('Player');
    });

    it('addGiocatore should insert and then retrieve the player', async () => {
        db.run.mockImplementation((sql, params, cb) => cb(null, { rows: [{ id: 99 }] }));
        // mock getGiocatoreById too
        db.get.mockImplementation((sql, params, cb) => cb(null, { id: 99, Nome: 'New', Cognome: 'P', ruolo: 'attaccante', numero_maglia: 9, squadra_id: 1 }));
        const res = await daoSquadre.addGiocatore(1, { nome: 'New', cognome: 'P', ruolo: 'attaccante', numero_maglia: 9 });
        expect(res).toBeDefined();
    });

    it('removeGiocatore should remove player from team', async () => {
        // removeGiocatore uses `this.changes` so we need a function mock
        db.run.mockImplementation((sql, params, cb) => {
            // simulate `this.changes = 1`
            cb.call({ changes: 1 }, null);
        });
        const res = await daoSquadre.removeGiocatore(1);
        expect(res.message).toContain('successo');
    });

    it('updateGiocatore should update player data', async () => {
        db.run.mockImplementation((sql, params, cb) => cb(null, { rowCount: 1 }));
        db.get.mockImplementation((sql, params, cb) => cb(null, { id: 1, Nome: 'Updated', Cognome: 'P', ruolo: 'portiere', numero_maglia: 1, squadra_id: 1 }));
        const res = await daoSquadre.updateGiocatore(1, { nome: 'Updated', ruolo: 'portiere' });
        expect(res).toBeDefined();
    });
});
