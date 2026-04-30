process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/db';
const daoAdmin = require('../src/features/admin/services/dao-admin');
const db = require('../src/core/config/database');

jest.mock('../src/core/config/database');

describe('DAO Admin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCount', () => {
    it('should return count correctly and convert ? to $1 $2', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ count: 10 }] });
      const sql = 'SELECT COUNT(*) as count FROM TEST WHERE a = ? AND b = ?';
      const params = [1, 2];
      const result = await daoAdmin.getCount(sql, params);
      
      expect(result).toBe(10);
      expect(db.query).toHaveBeenCalledWith('SELECT COUNT(*) as count FROM TEST WHERE a = $1 AND b = $2', params);
    });

    it('should return 0 if no count row', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });
      const result = await daoAdmin.getCount('SELECT COUNT(*) as count FROM TEST', []);
      expect(result).toBe(0);
    });

    it('should throw error if db.query fails', async () => {
      db.query.mockRejectedValueOnce(new Error('DB Error'));
      await expect(daoAdmin.getCount('SELECT * FROM TEST', [])).rejects.toThrow('DB Error');
    });
  });

  describe('insertImmagine', () => {
    it('should insert image successfully', async () => {
      db.query.mockResolvedValueOnce({
        rows: [{ id: 1 }],
        rowCount: 1
      });
      const result = await daoAdmin.insertImmagine('url', 'Campo', 'Riferimento', 1, 2);
      expect(result).toEqual({ success: true, id: 1, rowCount: 1 });
      expect(db.query).toHaveBeenCalled();
      const args = db.query.mock.calls[0][1];
      expect(args[0]).toBe('url');
      expect(args[1]).toBe('Campo');
      expect(args[2]).toBe('Riferimento');
      expect(args[3]).toBe(1);
      expect(args[4]).toBe(2);
    });

    it('should handle insert image error', async () => {
      db.query.mockRejectedValueOnce(new Error('Insert Error'));
      await expect(daoAdmin.insertImmagine('url', 'Campo', 'Riferimento', 1)).rejects.toThrow('Insert Error');
    });
  });

  describe('deleteImmaginiByEntita', () => {
    it('should delete images successfully', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ url: 'test.jpg' }] });
      db.query.mockResolvedValueOnce({ rowCount: 1 });
      jest.mock('../src/shared/utils/file-helper', () => ({
        deleteImageFile: jest.fn()
      }));
      const fileHelper = require('../src/shared/utils/file-helper');
      fileHelper.deleteImageFile = jest.fn();

      const result = await daoAdmin.deleteImmaginiByEntita('Riferimento', 1);
      expect(result).toEqual({ success: true, rowCount: 1 });
      expect(db.query).toHaveBeenCalledTimes(2);
    });

    it('should handle delete image error', async () => {
      db.query.mockRejectedValueOnce(new Error('Delete Error'));
      await expect(daoAdmin.deleteImmaginiByEntita('Riferimento', 1)).rejects.toThrow('Delete Error');
    });
  });

  describe('countSquadreByCampionato', () => {
    it('should return count of squadre', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ count: 5 }] });
      const result = await daoAdmin.countSquadreByCampionato(1);
      expect(result).toBe(5);
    });
    it('should handle error', async () => {
      db.query.mockRejectedValueOnce(new Error('Count Error'));
      await expect(daoAdmin.countSquadreByCampionato(1)).rejects.toThrow('Count Error');
    });
  });

  describe('countNotiziePubblicate', () => {
    it('should return count of notizie', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ count: 3 }] });
      const result = await daoAdmin.countNotiziePubblicate('2023-01-01', '2023-12-31');
      expect(result).toBe(3);
    });
    it('should handle error', async () => {
      db.query.mockRejectedValueOnce(new Error('Count Error'));
      await expect(daoAdmin.countNotiziePubblicate('2023-01-01', '2023-12-31')).rejects.toThrow('Count Error');
    });
  });

  describe('countEventiPubblicati', () => {
    it('should return count of eventi', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ count: 2 }] });
      const result = await daoAdmin.countEventiPubblicati('2023-01-01', '2023-12-31');
      expect(result).toBe(2);
    });
    it('should handle error', async () => {
      db.query.mockRejectedValueOnce(new Error('Count Error'));
      await expect(daoAdmin.countEventiPubblicati('2023-01-01', '2023-12-31')).rejects.toThrow('Count Error');
    });
  });
});
