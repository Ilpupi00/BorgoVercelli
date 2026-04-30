process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/db';
const daoEventi = require('../src/features/eventi/services/dao-eventi');
const db = require('../src/core/config/database');

jest.mock('../src/core/config/database', () => ({
  all: jest.fn(),
  get: jest.fn(),
  run: jest.fn(),
}));

describe('DAO Eventi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getEventi', () => {
    it('should return eventi', async () => {
      db.all.mockImplementation((sql, cb) => {
        cb(null, [{ id: 1, titolo: 'Test Evento' }]);
      });
      const result = await daoEventi.getEventi();
      expect(result).toHaveLength(1);
    });

    it('should handle db error', async () => {
      db.all.mockImplementation((sql, cb) => {
        cb(new Error('DB error'));
      });
      await expect(daoEventi.getEventi()).rejects.toEqual({ error: "Error retrieving events: DB error" });
    });
  });

  describe('getEventoById', () => {
    it('should handle not found error', async () => {
      db.get.mockImplementation((sql, params, cb) => {
        cb(null, null);
      });
      db.all.mockImplementation((sql, params, cb) => {
        cb(null, []);
      });
      await expect(daoEventi.getEventoById(1)).rejects.toEqual({ error: "Event not found" });
    });

    it('should handle db error', async () => {
      db.get.mockImplementation((sql, params, cb) => {
        cb(new Error('DB error'));
      });
      await expect(daoEventi.getEventoById(1)).rejects.toEqual({ error: "Error retrieving event: DB error" });
    });
  });

  describe('createEvento', () => {
    const data = {titolo: 'T', descrizione: 'D', data_inizio: '2020-01-01', data_fine: '2020-01-02', ora_inizio: '10:00', ora_fine: '12:00', orari_flessibili: false, luogo: 'L', creatore_id: 1, max_partecipanti: 10, prezzo: 0, pubblicato: true};
    it('should insert and return id', async () => {
      db.run.mockImplementation((sql, params, cb) => {
        cb(null, { rows: [{ id: 42 }] });
      });
      const result = await daoEventi.createEvento(data);
      expect(result.id).toBe(42);
    });
    
    it('should handle db error', async () => {
      db.run.mockImplementation((sql, params, cb) => cb(new Error('err')));
      await expect(daoEventi.createEvento(data)).rejects.toEqual({ error: "Error creating event: err" });
    });
  });

  describe('updateEvento', () => {
    const updateData = {titolo: 'T', descrizione: 'D', data_inizio: '2020-01-01', data_fine: '2020-01-02', ora_inizio: '10:00', ora_fine: '12:00', orari_flessibili: false, luogo: 'L', pubblicato: true, max_partecipanti: 10, prezzo: 0};
    it('should update and return changes', async () => {
      db.run.mockImplementation((sql, params, cb) => cb(null, {rowCount: 1}));
      const result = await daoEventi.updateEvento(1, updateData);
      expect(result.changes).toBe(1);
    });
    
    it('should handle db error', async () => {
      db.run.mockImplementation((sql, params, cb) => cb(new Error('err')));
      await expect(daoEventi.updateEvento(1, updateData)).rejects.toEqual({ error: "Error updating event: err" });
    });
  });

  describe('deleteEventoById', () => {
    it('should delete and return', async () => {
      db.run.mockImplementation((sql, params, cb) => cb(null, {rowCount: 1}));
      const result = await daoEventi.deleteEventoById(1);
      expect(result.success).toBe(true);
    });
    
    it('should handle db error', async () => {
      db.run.mockImplementation((sql, params, cb) => cb(new Error('err')));
      await expect(daoEventi.deleteEventoById(1)).rejects.toEqual({ error: "Error deleting event: err" });
    });
  });
});
