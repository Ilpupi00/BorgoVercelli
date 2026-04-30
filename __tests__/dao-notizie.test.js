process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/db';
const daoNotizie = require('../src/features/notizie/services/dao-notizie');
const db = require('../src/core/config/database');

jest.mock('../src/core/config/database', () => ({
  all: jest.fn(),
  get: jest.fn(),
  run: jest.fn(),
}));

describe('DAO Notizie', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getNotizie', () => {
    it('should return notizie', async () => {
      db.all.mockImplementation((sql, cb) => {
        cb(null, [{ id: 1, titolo: 'Test Notizia' }]);
      });
      const result = await daoNotizie.getNotizie();
      expect(result).toHaveLength(1);
    });

    it('should handle db error', async () => {
      db.all.mockImplementation((sql, cb) => {
        cb(new Error('DB error'));
      });
      await expect(daoNotizie.getNotizie()).rejects.toEqual({ error: "Error retrieving news: DB error" });
    });
  });

  describe('getNotiziePaginated', () => {
    it('should format notizie complete', async () => {
      db.all.mockImplementation((sql, params, cb) => {
        cb(null, [{ id: 1, titolo: 'N1' }]);
      });
      const result = await daoNotizie.getNotiziePaginated(0, 6);
      expect(result).toHaveLength(1);
    });

    it('should handle db error in getNotiziePaginated', async () => {
      db.all.mockImplementation((sql, params, cb) => {
        cb(new Error('DB err'));
      });
      await expect(daoNotizie.getNotiziePaginated(0, 6)).rejects.toEqual({ error: "Error retrieving news: DB err" });
    });
  });

  describe('getNotiziaById', () => {
    it('should return notizia by id', async () => {
      db.get.mockImplementation((sql, params, cb) => {
        cb(null, { id: 1, titolo: 'Test' });
      });
      const result = await daoNotizie.getNotiziaById(1);
      expect(result.id).toBe(1);
    });

    it('should return null if not found', async () => {
      db.get.mockImplementation((sql, params, cb) => {
        cb(null, null);
      });
      const result = await daoNotizie.getNotiziaById(1);
      expect(result).toBeNull();
    });

    it('should handle db error', async () => {
      db.get.mockImplementation((sql, params, cb) => {
        cb(new Error('DB error'));
      });
      await expect(daoNotizie.getNotiziaById(1)).rejects.toEqual({ error: "Error retrieving news: DB error" });
    });
  });

  describe('createNotizia', () => {
    const data = {titolo: 'T', sottotitolo: 'S', contenuto: 'C', immagine_principale_id: 1, autore_id: 1, pubblicata: true};
    it('should insert and return id', async () => {
      db.run.mockImplementation((sql, params, cb) => cb(null, { rows: [{ id: 42 }] }));
      const result = await daoNotizie.createNotizia(data);
      expect(result.success).toBe(true);
      expect(result.id).toBe(42);
    });
    
    it('should handle db error', async () => {
      db.run.mockImplementation((sql, params, cb) => cb(new Error('err')));
      await expect(daoNotizie.createNotizia(data)).rejects.toEqual({ error: "Error creating news: err" });
    });
  });

  describe('updateNotizia', () => {
    const data = {titolo: 'T', sottotitolo: 'S', contenuto: 'C', immagine_principale_id: 1, pubblicata: true};
    it('should update and return changes', async () => {
      db.run.mockImplementation((sql, params, cb) => cb(null, {rowCount: 1}));
      const result = await daoNotizie.updateNotizia(1, data);
      expect(result.success).toBe(true);
      expect(result.changes).toBe(1);
    });
    
    it('should handle error', async () => {
      db.run.mockImplementation((sql, params, cb) => cb(new Error('err')));
      await expect(daoNotizie.updateNotizia(1, data)).rejects.toEqual({ error: "Error updating news: err" });
    });
  });

  describe('deleteNotiziaById', () => {
    it('should delete and return success', async () => {
      db.run.mockImplementation((sql, params, cb) => cb(null, {rowCount: 1}));
      const result = await daoNotizie.deleteNotiziaById(1);
      expect(result.success).toBe(true);
      expect(result.deleted).toBe(1);
    });
    
    it('should return success false if rowCount is 0', async () => {
      db.run.mockImplementation((sql, params, cb) => cb(null, {rowCount: 0}));
      const result = await daoNotizie.deleteNotiziaById(1);
      expect(result.success).toBe(false);
      expect(result.deleted).toBe(0);
    });

    it('should handle db error', async () => {
      db.run.mockImplementation((sql, params, cb) => cb(new Error('err')));
      await expect(daoNotizie.deleteNotiziaById(1)).rejects.toEqual({ error: "Error deleting news: err" });
    });
  });
});
