process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/db';
const daoGalleria = require('../src/features/galleria/services/dao-galleria');
const db = require('../src/core/config/database');

jest.mock('../src/core/config/database', () => ({
  all: jest.fn(),
  get: jest.fn(),
  run: jest.fn(),
}));

describe('DAO Galleria', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getImmagini', () => {
    it('should return images', async () => {
      db.all.mockImplementation((sql, cb) => {
        cb(null, [{ id: 1, url: 'img1.png', tipo: 'upload della Galleria' }]);
      });
      const result = await daoGalleria.getImmagini();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });

    it('should handle error', async () => {
      db.all.mockImplementation((sql, cb) => {
        cb(new Error('DB Error'));
      });
      await expect(daoGalleria.getImmagini()).rejects.toEqual({ error: "Errore nel recupero delle immagini: DB Error" });
    });
  });

  describe('getImmagineById', () => {
    it('should return image by id', async () => {
      db.get.mockImplementation((sql, params, cb) => {
        cb(null, { id: 1, url: 'img1.png' });
      });
      const result = await daoGalleria.getImmagineById(1);
      expect(result.id).toBe(1);
    });

    it('should handle not found', async () => {
      db.get.mockImplementation((sql, params, cb) => {
        cb(null, null);
      });
      const result = await daoGalleria.getImmagineById(1);
      expect(result).toBeNull();
    });

    it('should handle error', async () => {
      db.get.mockImplementation((sql, params, cb) => {
        cb(new Error('DB Error'));
      });
      await expect(daoGalleria.getImmagineById(1)).rejects.toEqual({ error: "Errore nel recupero dell'immagine: DB Error" });
    });
  });

  describe('insertImmagine', () => {
    it('should insert image and return id', async () => {
      db.run.mockImplementation((sql, params, cb) => {
        cb(null, { rows: [{ id: 1 }] });
      });
      const result = await daoGalleria.insertImmagine('url', 'created', 'updated', 'desc');
      expect(result.id).toBe(1);
    });

    it('should handle error', async () => {
      db.run.mockImplementation((sql, params, cb) => {
        cb(new Error('DB Error'));
      });
      await expect(daoGalleria.insertImmagine('url', 'created', 'updated')).rejects.toEqual({ error: "Errore nell'inserimento dell'immagine: DB Error" });
    });
  });

  describe('updateImmagine', () => {
    it('should update image desc', async () => {
      db.run.mockImplementation((sql, params, cb) => {
        cb(null, { rowCount: 1 });
      });
      const result = await daoGalleria.updateImmagine(1, 'desc');
      expect(result.message).toBe("Immagine aggiornata con successo");
    });

    it('should handle not found', async () => {
      db.run.mockImplementation((sql, params, cb) => {
        cb(null, { rowCount: 0 });
      });
      await expect(daoGalleria.updateImmagine(1, 'desc')).rejects.toEqual({ error: "Immagine non trovata" });
    });

    it('should handle error', async () => {
      db.run.mockImplementation((sql, params, cb) => {
        cb(new Error('DB Error'));
      });
      await expect(daoGalleria.updateImmagine(1, 'desc')).rejects.toEqual({ error: "Errore nell'aggiornamento dell'immagine: DB Error" });
    });
  });

  describe('deleteImmagine', () => {
    it('should delete image successfully', async () => {
      db.get.mockImplementation((sql, params, cb) => {
        cb(null, { url: 'url.jpg' });
      });
      db.run.mockImplementation((sql, params, cb) => {
        cb(null, { rowCount: 1 });
      });
      jest.mock('../src/shared/utils/file-helper', () => ({
        deleteImageFile: jest.fn()
      }));

      const result = await daoGalleria.deleteImmagine(1);
      expect(result.message).toBe("Immagine cancellata con successo");
    });

    it('should handle db get error', async () => {
      db.get.mockImplementation((sql, params, cb) => {
        cb(new Error('DB Error'));
      });
      await expect(daoGalleria.deleteImmagine(1)).rejects.toEqual({ error: "Errore nel recupero dell'immagine: DB Error" });
    });

    it('should handle not found', async () => {
      db.get.mockImplementation((sql, params, cb) => {
        cb(null, null);
      });
      await expect(daoGalleria.deleteImmagine(1)).rejects.toEqual({ error: "Immagine non trovata" });
    });

    it('should handle run error', async () => {
      db.get.mockImplementation((sql, params, cb) => {
        cb(null, { url: 'url.jpg' });
      });
      db.run.mockImplementation((sql, params, cb) => {
        cb(new Error('DB Error'));
      });
      jest.mock('../src/shared/utils/file-helper', () => ({
        deleteImageFile: jest.fn()
      }));
      await expect(daoGalleria.deleteImmagine(1)).rejects.toEqual({ error: "Errore nella cancellazione dell'immagine: DB Error" });
    });

    it('should handle rowcount 0', async () => {
      db.get.mockImplementation((sql, params, cb) => {
        cb(null, { url: 'url.jpg' });
      });
      db.run.mockImplementation((sql, params, cb) => {
        cb(null, { rowCount: 0 });
      });
      jest.mock('../src/shared/utils/file-helper', () => ({
        deleteImageFile: jest.fn()
      }));
      await expect(daoGalleria.deleteImmagine(1)).rejects.toEqual({ error: "Immagine non trovata" });
    });
  });

  describe('uploadImmagine', () => {
    it('should upload and return id', async () => {
      db.run.mockImplementation((sql, params, cb) => {
        cb(null, { rows: [{ id: 5 }] });
      });
      const file = { filename: 'test.jpg' };
      const result = await daoGalleria.uploadImmagine(file, 'tipo');
      expect(result).toBe(5);
    });

    it('should handle run error for upload', async () => {
      db.run.mockImplementation((sql, params, cb) => {
        cb(new Error('DB error'));
      });
      const file = { filename: 'test.jpg' };
      await expect(daoGalleria.uploadImmagine(file, 'tipo')).rejects.toEqual({ error: "Errore nell'inserimento dell'immagine: DB error" });
    });
  });

  describe('getAllImmagini', () => {
    it('should call getImmagini', async () => {
      db.all.mockImplementation((sql, cb) => cb(null, []));
      await daoGalleria.getAllImmagini();
      expect(db.all).toHaveBeenCalled();
    });
  });

  describe('updateImmagineEntitaId', () => {
    it('should update entita id', async () => {
      db.run.mockImplementation((sql, params, cb) => cb(null, {}));
      await daoGalleria.updateImmagineEntitaId(1, 2);
      expect(db.run).toHaveBeenCalled();
    });
    it('should handle error', async () => {
      db.run.mockImplementation((sql, params, cb) => cb(new Error('DB err')));
      await expect(daoGalleria.updateImmagineEntitaId(1, 2)).rejects.toEqual({ error: "Errore nell'aggiornamento dell'immagine: DB err" });
    });
  });

  describe('insertImmagineNotizia', () => {
    it('should insert and return id', async () => {
      db.run.mockImplementation((sql, params, cb) => cb(null, { rows: [{ id: 10 }] }));
      const result = await daoGalleria.insertImmagineNotizia('url', 2, 1);
      expect(result.id).toBe(10);
    });
    it('should handle error', async () => {
      db.run.mockImplementation((sql, params, cb) => cb(new Error('DB err')));
      await expect(daoGalleria.insertImmagineNotizia('url', 2, 1)).rejects.toEqual({ error: "Errore nell'inserimento dell'immagine notizia: DB err" });
    });
  });
});
