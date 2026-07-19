const daoDirigenti = require('../src/features/squadre/services/dao-dirigenti-squadre');
const db = require('../src/core/config/database');

jest.mock('../src/core/config/database', () => ({
  all: jest.fn(),
  get: jest.fn(),
  run: jest.fn(),
  query: jest.fn()
}));

describe('DAO Dirigenti Squadre', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDirigentiBySquadra', () => {
    it('should return active dirigenti for a team', async () => {
      db.all.mockImplementation((sql, params, cb) => cb(null, [{ id: 1, ruolo: 'Dirigente', nome: 'Pippo' }]));
      const result = await daoDirigenti.getDirigentiBySquadra(1);
      expect(result).toHaveLength(1);
      expect(result[0].nome).toBe('Pippo');
    });

    it('should handle errors', async () => {
      db.all.mockImplementation((sql, params, cb) => {
        if (params.length > 0) cb(new Error('err'));
        else cb(null, []); // for debug query
      });
      await expect(daoDirigenti.getDirigentiBySquadra(1)).rejects.toEqual({ error: 'Error retrieving dirigenti: err' });
    });
  });

  describe('getDirigentiBySquadraAll', () => {
    it('should return all dirigenti for a team', async () => {
      db.all.mockImplementation((sql, params, cb) => cb(null, [{ id: 1, ruolo: 'Dirigente', nome: 'Pippo' }]));
      const result = await daoDirigenti.getDirigentiBySquadraAll(1);
      expect(result).toHaveLength(1);
    });
    
    it('should handle errors', async () => {
      db.all.mockImplementation((sql, params, cb) => cb(new Error('err')));
      await expect(daoDirigenti.getDirigentiBySquadraAll(1)).rejects.toEqual({ error: 'Error retrieving dirigenti: err' });
    });
  });

  describe('getDirigentiSocietari', () => {
    it('should return societari', async () => {
      db.all.mockImplementation((sql, params, cb) => cb(null, [{ id: 1, ruolo: 'Presidente' }]));
      const result = await daoDirigenti.getDirigentiSocietari();
      expect(result).toHaveLength(1);
    });
  });

  describe('addDirigente', () => {
    it('should reject if utente_id invalid', async () => {
      await expect(daoDirigenti.addDirigente({ })).rejects.toEqual({ error: 'utente_id non valido' });
    });

    it('should reject if active dirigente exists', async () => {
      db.get.mockImplementation((sql, params, cb) => cb(null, { id: 1, attivo: true }));
      await expect(daoDirigenti.addDirigente({ utente_id: 1, squadra_id: 1, ruolo: 'D' })).rejects.toEqual({ error: 'Questo utente è già dirigente attivo per questa squadra con lo stesso ruolo' });
    });

    it('should reactivate if inactive dirigente exists', async () => {
      db.get.mockImplementation((sql, params, cb) => cb(null, { id: 1, attivo: false }));
      db.run.mockImplementation(function(sql, params, cb) {
        cb.call({ changes: 1 }, null, { rows: [{ id: 1 }] });
      });
      const result = await daoDirigenti.addDirigente({ utente_id: 1, squadra_id: 1, ruolo: 'D' });
      expect(result.id).toBe(1);
      expect(result.message).toBe('Dirigente riattivato con successo');
    });

    it('should insert new if not exists', async () => {
      db.get.mockImplementation((sql, params, cb) => cb(null, null));
      db.run.mockImplementation(function(sql, params, cb) {
        cb.call({ lastID: 2 }, null, { rows: [{ id: 2 }] });
      });
      const result = await daoDirigenti.addDirigente({ utente_id: 1, squadra_id: 1, ruolo: 'D' });
      expect(result.id).toBe(2);
      expect(result.message).toBe('Dirigente added successfully');
    });
    
    it('should handle insert duplicate key error', async () => {
      db.get.mockImplementation((sql, params, cb) => cb(null, null));
      db.run.mockImplementation((sql, params, cb) => cb({ code: '23505' }));
      await expect(daoDirigenti.addDirigente({ utente_id: 1, squadra_id: 1, ruolo: 'D' })).rejects.toEqual({ error: 'Questo utente è già dirigente per questa squadra con lo stesso ruolo' });
    });
  });

  describe('removeDirigente', () => {
    it('should soft delete', async () => {
      db.run.mockImplementation(function(sql, params, cb) {
        cb.call({ changes: 1 }, null, { rowCount: 1 });
      });
      const result = await daoDirigenti.removeDirigente(1);
      expect(result.message).toBe('Dirigente removed successfully');
    });

    it('should error if not found', async () => {
      db.run.mockImplementation(function(sql, params, cb) {
        cb.call({ changes: 0 }, null, { rowCount: 0 });
      });
      await expect(daoDirigenti.removeDirigente(1)).rejects.toEqual({ error: 'Dirigente non trovato' });
    });
  });

  describe('getDirigenteByUserId', () => {
    it('should return array', async () => {
      db.all.mockImplementation((sql, params, cb) => cb(null, [{ id: 1 }]));
      const result = await daoDirigenti.getDirigenteByUserId(1);
      expect(result).toHaveLength(1);
    });
  });

  describe('createDirigente', () => {
    it('should create returning id', async () => {
      db.run.mockImplementation(function(sql, params, cb) {
        cb.call({ lastID: 3 }, null, { rows: [{ id: 3 }] });
      });
      const result = await daoDirigenti.createDirigente({ utente_id: 1, squadra_id: 1, ruolo: 'D' });
      expect(result.id).toBe(3);
    });
  });

  describe('updateDirigente', () => {
    it('should update', async () => {
      db.run.mockImplementation(function(sql, params, cb) {
        cb.call({ changes: 1 }, null, { rowCount: 1 });
      });
      const result = await daoDirigenti.updateDirigente(1, { ruolo: 'P' });
      expect(result.message).toBe('Dirigente aggiornato');
    });

    it('should update with utente_id', async () => {
      db.run.mockImplementation(function(sql, params, cb) {
        cb.call({ changes: 1 }, null, { rowCount: 1 });
      });
      const result = await daoDirigenti.updateDirigente(1, { ruolo: 'P', utente_id: 2 });
      expect(result.message).toBe('Dirigente aggiornato');
    });
  });

  describe('restoreDirigente', () => {
    it('should restore', async () => {
      db.run.mockImplementation(function(sql, params, cb) {
        cb.call({ changes: 1 }, null, { rowCount: 1 });
      });
      const result = await daoDirigenti.restoreDirigente(1);
      expect(result.message).toBe('Dirigente ripristinato');
    });
  });

  describe('restoreAllDirigenti', () => {
    it('should restore all', async () => {
      db.run.mockImplementation(function(sql, params, cb) {
        cb.call({ changes: 5 }, null, { rowCount: 5 });
      });
      const result = await daoDirigenti.restoreAllDirigenti();
      expect(result.changes).toBe(5);
    });
  });
});
