process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/db';
const daoSquadre = require('../src/features/squadre/services/dao-squadre');
const db = require('../src/core/config/database');

jest.mock('../src/core/config/database', () => ({
  all: jest.fn(),
  get: jest.fn(),
  run: jest.fn(),
  query: jest.fn()
}));

describe('DAO Squadre', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSquadre', () => {
    it('should return all squadre', async () => {
      db.all.mockImplementation((sql, cb) => cb(null, [{ id: 1, nome: 'Vercelli' }]));
      const result = await daoSquadre.getSquadre();
      expect(result).toHaveLength(1);
    });

    it('should handle errors', async () => {
      db.all.mockImplementation((sql, cb) => cb(new Error('err')));
      await expect(daoSquadre.getSquadre()).rejects.toEqual({error: 'Error retrieving teams: err'});
    });
  });

  describe('getSquadraById', () => {
    it('should return a squadra with its info', async () => {
      db.get.mockImplementation((sql, params, cb) => cb(null, { id: 1, nome: 'Vercelli' }));
      db.all.mockImplementation((sql, params, cb) => cb(null, []));
      const result = await daoSquadre.getSquadraById(1);
      expect(result.id).toBe(1);
    });

    it('should return null if not found', async () => {
      db.get.mockImplementation((sql, params, cb) => cb(null, null));
      const result = await daoSquadre.getSquadraById(1);
      expect(result).toBeNull();
    });

    it('should handle db error', async () => {
      db.get.mockImplementation((sql, params, cb) => cb(new Error('DB err')));
      await expect(daoSquadre.getSquadraById(1)).rejects.toEqual({ error: 'Errore nel recupero della squadra: DB err' });
    });
  });

  describe('createSquadra', () => {
    it('should create and return id', async () => {
      db.run.mockImplementation(function (sql, params, cb) {
        cb.call({ lastID: 10 }, null, { rows: [{ id: 10 }] });
      });
      const result = await daoSquadre.createSquadra('Nome', 2000);
      // in case postgres results are returned, or fallback to this.lastID
      expect(result.id).toBe(10);
    });
    
    it('should handle error', async () => {
      db.run.mockImplementation((sql, params, cb) => cb(new Error('err')));
      await expect(daoSquadre.createSquadra('Nome', 2000)).rejects.toEqual({error: 'Errore nella creazione della squadra: err'});
    });
  });

  describe('updateSquadra', () => {
    it('should return success true', async () => {
      db.run.mockImplementation(function (sql, params, cb) {
        cb.call({ changes: 1 }, null, { rowCount: 1 });
      });
      const result = await daoSquadre.updateSquadra(1, 'Nuovo Nome', 2005);
      expect(result.success).toBe(true);
    });
    
    it('should handle error', async () => {
      db.run.mockImplementation((sql, params, cb) => cb(new Error('err')));
      await expect(daoSquadre.updateSquadra(1, 'A', 2000)).rejects.toEqual({ error: 'Errore nell\'aggiornamento della squadra: err' });
    });
  });

  describe('deleteSquadra', () => {
    it('should return success', async () => {
      db.run.mockImplementation(function (sql, params, cb) {
        cb.call({ changes: 1 }, null, { rowCount: 1 });
      });
      const result = await daoSquadre.deleteSquadra(1);
      expect(result.success).toBe(true);
    });
    
    it('should handle error', async () => {
      db.run.mockImplementation((sql, params, cb) => cb(new Error('err')));
      await expect(daoSquadre.deleteSquadra(1)).rejects.toEqual({ error: 'Errore nella cancellazione della squadra: err' });
    });
  });

  describe('getGiocatori', () => {
    it('should return giocatori', async () => {
      db.all.mockImplementation((sql, cb) => cb(null, [{ id: 1, nome: 'Mario', cognome: 'Rossi' }]));
      const result = await daoSquadre.getGiocatori();
      expect(result).toHaveLength(1);
    });

    it('should handle errors', async () => {
      db.all.mockImplementation((sql, cb) => cb(new Error('err')));
      await expect(daoSquadre.getGiocatori()).rejects.toEqual({ error: 'Error retrieving players: err' });
    });
  });
});
