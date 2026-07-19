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
      db.all.mockImplementation((sql, params, cb) => {
        const callback = typeof params === 'function' ? params : cb;
        callback(null, [{ id: 1, nome: 'Vercelli' }]);
      });
      const result = await daoSquadre.getSquadre();
      expect(result).toHaveLength(1);
    });

    it('should handle errors', async () => {
      db.all.mockImplementation((sql, params, cb) => {
        const callback = typeof params === 'function' ? params : cb;
        callback(new Error('err'));
      });
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
      expect(result.message).toBe('Squadra aggiornata con successo');
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
      expect(result.message).toBe('Squadra cancellata con successo');
    });
    
    it('should handle error', async () => {
      db.run.mockImplementation((sql, params, cb) => cb(new Error('err')));
      await expect(daoSquadre.deleteSquadra(1)).rejects.toEqual({ error: 'Errore nella cancellazione della squadra: err' });
    });
  });

  describe('getGiocatori', () => {
    it('should return giocatori', async () => {
      db.all.mockImplementation((sql, params, cb) => {
        const callback = typeof params === 'function' ? params : cb;
        callback(null, [{ id: 1, nome: 'Mario', cognome: 'Rossi' }]);
      });
      const result = await daoSquadre.getGiocatori();
      expect(result).toHaveLength(1);
    });

    it('should handle errors', async () => {
      db.all.mockImplementation((sql, params, cb) => {
        const callback = typeof params === 'function' ? params : cb;
        callback(new Error('err'));
      });
      await expect(daoSquadre.getGiocatori()).rejects.toEqual({ error: 'Error retrieving players: err' });
    });
  });
  describe('searchSquadre', () => {
    it('should search squadre and map dirigenti', async () => {
      db.all.mockImplementation((sql, params, cb) => cb(null, [{ id: 1, nome: 'Vercelli' }]));
      const result = await daoSquadre.searchSquadre('Ver');
      expect(result).toHaveLength(1);
    });
    it('should handle errors', async () => {
      db.all.mockImplementation((sql, params, cb) => cb(new Error('err')));
      await expect(daoSquadre.searchSquadre('V')).rejects.toEqual({ error: 'Error searching teams: err' });
    });
  });

  describe('getGiocatoriBySquadra', () => {
    it('should return players for a team', async () => {
      db.all.mockImplementation((sql, params, cb) => cb(null, [{ id: 1, nome: 'Player' }]));
      const result = await daoSquadre.getGiocatoriBySquadra(1);
      expect(result).toHaveLength(1);
    });
    it('should handle errors', async () => {
      db.all.mockImplementation((sql, params, cb) => cb(new Error('err')));
      await expect(daoSquadre.getGiocatoriBySquadra(1)).rejects.toEqual({ error: 'Errore nel recupero dei giocatori: err' });
    });
  });

  describe('createGiocatore', () => {
    it('should create and return id', async () => {
      db.run.mockImplementation(function (sql, params, cb) {
        cb.call({ lastID: 5 }, null, { rows: [{ id: 5 }] });
      });
      const result = await daoSquadre.createGiocatore({ nome: 'N', cognome: 'C', squadra_id: 1 });
      expect(result.id).toBe(5);
    });
    it('should handle error', async () => {
      db.run.mockImplementation((sql, params, cb) => cb(new Error('err')));
      await expect(daoSquadre.createGiocatore({ squadra_id: 1 })).rejects.toEqual({ error: 'Errore nella creazione del giocatore: err' });
    });
  });

  describe('updateGiocatore', () => {
    it('should update player', async () => {
      db.run.mockImplementation(function (sql, params, cb) {
        cb.call({ changes: 1 }, null, { rowCount: 1 });
      });
      const result = await daoSquadre.updateGiocatore(1, { nome: 'N2' });
      expect(result.message).toBe('Giocatore aggiornato');
    });
    it('should handle not found', async () => {
      db.run.mockImplementation(function (sql, params, cb) {
        cb.call({ changes: 0 }, null, { rowCount: 0 });
      });
      await expect(daoSquadre.updateGiocatore(99, {})).rejects.toEqual({ error: 'Giocatore non trovato' });
    });
  });

  describe('deleteGiocatore', () => {
    it('should soft delete player', async () => {
      db.run.mockImplementation(function (sql, params, cb) {
        cb.call({ changes: 1 }, null, { rowCount: 1 });
      });
      const result = await daoSquadre.deleteGiocatore(1);
      expect(result.message).toBe('Giocatore rimosso con successo');
    });
    it('should handle error', async () => {
      db.run.mockImplementation((sql, params, cb) => cb(new Error('err')));
      await expect(daoSquadre.deleteGiocatore(1)).rejects.toEqual({ error: 'Errore nella rimozione del giocatore: err' });
    });
  });

  describe('getGiocatoreById', () => {
    it('should return player', async () => {
      db.get.mockImplementation((sql, params, cb) => cb(null, { id: 1, nome: 'P' }));
      const result = await daoSquadre.getGiocatoreById(1);
      expect(result.id).toBe(1);
    });
    it('should return error if not found', async () => {
      db.get.mockImplementation((sql, params, cb) => cb(null, null));
      await expect(daoSquadre.getGiocatoreById(1)).rejects.toEqual({ error: 'Giocatore non trovato' });
    });
  });

  describe('addGiocatore', () => {
    it('should add and return player', async () => {
      db.run.mockImplementation(function (sql, params, cb) {
        cb.call({ lastID: 10 }, null, { rows: [{ id: 10 }] });
      });
      db.get.mockImplementation((sql, params, cb) => cb(null, { id: 10, nome: 'New' }));
      const result = await daoSquadre.addGiocatore(1, { nome: 'New' });
      expect(result.id).toBe(10);
    });
  });

  describe('removeGiocatore', () => {
    it('should soft remove player', async () => {
      db.run.mockImplementation(function (sql, params, cb) {
        cb.call({ changes: 1 }, null, {});
      });
      const result = await daoSquadre.removeGiocatore(1);
      expect(result.message).toBe('Giocatore rimosso con successo');
    });
  });

  describe('addDirigente', () => {
    it('should add dirigente if user exists and not already dirigente', async () => {
      db.get
        .mockImplementationOnce((sql, params, cb) => cb(null, { id: 2 })) // getUser
        .mockImplementationOnce((sql, params, cb) => cb(null, null)) // check existing
        .mockImplementationOnce((sql, params, cb) => cb(null, { id: 5, email: 'a@a' })); // get created

      db.run.mockImplementation(function(sql, params, cb) {
        cb.call({ lastID: 5 }, null, { rows: [{ id: 5 }] });
      });

      const result = await daoSquadre.addDirigente(1, 'test@test.com');
      expect(result.email).toBe('a@a');
    });
    
    it('should reject if user not found', async () => {
      db.get.mockImplementationOnce((sql, params, cb) => cb(null, null));
      await expect(daoSquadre.addDirigente(1, 'no@no')).rejects.toEqual({ error: 'Utente con questa email non trovato' });
    });
  });

  describe('removeDirigente', () => {
    it('should remove dirigente', async () => {
      db.run.mockImplementation(function(sql, params, cb) {
        cb.call({ changes: 1 }, null, { rowCount: 1 });
      });
      const result = await daoSquadre.removeDirigente(1, 1);
      expect(result.message).toBe('Dirigente rimosso con successo');
    });
  });
});
