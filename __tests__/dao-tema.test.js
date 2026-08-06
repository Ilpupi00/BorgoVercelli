process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/db';
const daoTema = require('../src/features/temi/services/dao-tema');
const db = require('../src/core/config/database');

jest.mock('../src/core/config/database');

describe('DAO Tema', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getTemaAttivo', () => {
    it('should return default light theme when table is empty', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });
      const result = await daoTema.getTemaAttivo();
      expect(result).toEqual({ tema_attivo: 'light', custom_colori: null, data_aggiornamento: null });
    });

    it('should return current theme when table has row', async () => {
      db.query.mockResolvedValueOnce({
        rows: [{ tema_attivo: 'dark', custom_colori: '{"bg":"#000"}', data_aggiornamento: '2023-01-01' }]
      });
      const result = await daoTema.getTemaAttivo();
      expect(result).toEqual({ tema_attivo: 'dark', custom_colori: { bg: '#000' }, data_aggiornamento: '2023-01-01' });
    });

    it('should handle db error gracefully and return fallback', async () => {
      db.query.mockRejectedValueOnce(new Error('DB connection failed'));
      const result = await daoTema.getTemaAttivo();
      expect(result).toEqual({ tema_attivo: 'light', custom_colori: null, data_aggiornamento: null });
    });
  });

  describe('setTemaAttivo', () => {
    it('should update theme properly', async () => {
      db.query.mockResolvedValueOnce({
        rows: [{ tema_attivo: 'sport', data_aggiornamento: '2023-01-02' }]
      });
      const result = await daoTema.setTemaAttivo('sport', { bg: '#111' });
      expect(result).toEqual({ tema_attivo: 'sport', data_aggiornamento: '2023-01-02' });
      expect(db.query).toHaveBeenCalledTimes(1);
    });

    it('should throw error if temaId is missing', async () => {
      await expect(daoTema.setTemaAttivo(null)).rejects.toThrow('temaId è obbligatorio e deve essere una stringa');
    });

    it('should throw error if db fails', async () => {
      db.query.mockRejectedValueOnce(new Error('DB fails'));
      await expect(daoTema.setTemaAttivo('dark')).rejects.toThrow('DB fails');
    });
  });

  describe('creaTemasPersonalizzato', () => {
    it('should create custom theme correctly', async () => {
      db.query.mockResolvedValueOnce({
        rows: [{ id: 1, nome: 'Mio Tema', slug: 'mio-tema', colori: '{"bg":"#222"}' }]
      });
      const result = await daoTema.creaTemasPersonalizzato('Mio Tema', 'mio tema', 'desc', { bg: '#222' }, 1);
      expect(result).toEqual({ id: 1, nome: 'Mio Tema', slug: 'mio-tema', colori: { bg: '#222' } });
    });

    it('should throw validation error on missing inputs', async () => {
      await expect(daoTema.creaTemasPersonalizzato(null, 'slug', 'desc', {})).rejects.toThrow('nome, slug e colori sono obbligatori per creare un tema');
    });

    it('should handle unique constraint error', async () => {
      const dbError = new Error('duplicate key');
      dbError.code = '23505';
      db.query.mockRejectedValueOnce(dbError);
      await expect(daoTema.creaTemasPersonalizzato('Test', 'test', 'desc', {}, 1)).rejects.toThrow('Esiste già un tema con nome "Test" o slug "test"');
    });
  });

  describe('getTemasPersonalizzato', () => {
    it('should return theme when found', async () => {
      db.query.mockResolvedValueOnce({
        rows: [{ id: 1, nome: 'Test', colori: '{"col":"#fff"}' }]
      });
      const result = await daoTema.getTemasPersonalizzato(1);
      expect(result).toEqual({ id: 1, nome: 'Test', colori: { col: '#fff' } });
    });

    it('should return null when not found', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });
      const result = await daoTema.getTemasPersonalizzato(999);
      expect(result).toBeNull();
    });
  });

  describe('getTemaPersonalizzatoBySlug', () => {
    it('should return theme when found by slug', async () => {
      db.query.mockResolvedValueOnce({
        rows: [{ id: 1, slug: 'test', colori: '{"col":"#000"}' }]
      });
      const result = await daoTema.getTemaPersonalizzatoBySlug('test');
      expect(result).toEqual({ id: 1, slug: 'test', colori: { col: '#000' } });
    });

    it('should return null if slug is empty', async () => {
      const result = await daoTema.getTemaPersonalizzatoBySlug(null);
      expect(result).toBeNull();
    });
  });

  describe('getTemiPersonalizzati', () => {
    it('should return array of themes', async () => {
      db.query.mockResolvedValueOnce({
        rows: [{ id: 1, colori: '{"c":1}' }, { id: 2, colori: '{"c":2}' }]
      });
      const result = await daoTema.getTemiPersonalizzati(true);
      expect(result).toHaveLength(2);
      expect(result[0].colori).toEqual({ c: 1 });
    });

    it('should query without active filter when false', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });
      await daoTema.getTemiPersonalizzati(false);
      expect(db.query.mock.calls[0][0]).not.toContain('WHERE tp.attivo = true');
    });
  });

  describe('aggiornaTemaPersonalizzato', () => {
    it('should update and return theme', async () => {
      db.query.mockResolvedValueOnce({
        rows: [{ id: 1, nome: 'Updated', colori: '{}' }]
      });
      const result = await daoTema.aggiornaTemaPersonalizzato(1, { nome: 'Updated', attivo: false });
      expect(result.nome).toBe('Updated');
    });

    it('should throw error when no updates provided', async () => {
      await expect(daoTema.aggiornaTemaPersonalizzato(1, {})).rejects.toThrow('Nessun campo da aggiornare fornito');
    });

    it('should throw error when theme not found', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });
      await expect(daoTema.aggiornaTemaPersonalizzato(99, { nome: 'a' })).rejects.toThrow('Tema con ID 99 non trovato');
    });
  });

  describe('eliminaTemasPersonalizzato', () => {
    it('should delete theme and related preferences', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ slug: 'test-slug' }] }); // First select
      db.query.mockResolvedValueOnce({}); // Delete preferences
      db.query.mockResolvedValueOnce({ rows: [{ id: 1 }] }); // Delete theme
      
      const result = await daoTema.eliminaTemasPersonalizzato(1);
      expect(result).toBe(true);
    });

    it('should throw error when theme not found on delete', async () => {
      db.query.mockResolvedValueOnce({ rows: [] }); // First select
      await expect(daoTema.eliminaTemasPersonalizzato(99)).rejects.toThrow('Tema con ID 99 non trovato');
    });
  });

  describe('setPreferenzaTema', () => {
    it('should set user theme preference', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ utente_id: 1, tema_id: 'dark' }] });
      const result = await daoTema.setPreferenzaTema(1, 'dark');
      expect(result).toEqual({ utente_id: 1, tema_id: 'dark' });
    });

    it('should throw error if parameters missing', async () => {
      await expect(daoTema.setPreferenzaTema(1, null)).rejects.toThrow('utenteId e temaId sono obbligatori');
    });
  });

  describe('getPreferenzaTema', () => {
    it('should return user preference', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ tema_id: 'sport' }] });
      const result = await daoTema.getPreferenzaTema(1);
      expect(result).toEqual({ tema_id: 'sport' });
    });

    it('should return null when no parameter provided', async () => {
      const result = await daoTema.getPreferenzaTema(null);
      expect(result).toBeNull();
    });
  });

  describe('deletePreferenzaTema', () => {
    it('should delete preference and return true', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ utente_id: 1 }] });
      const result = await daoTema.deletePreferenzaTema(1);
      expect(result).toBe(true);
    });
  });

  describe('getStatisticaTemi', () => {
    it('should return stats properly', async () => {
      db.query.mockResolvedValueOnce({
        rows: [{ tema_id: 'dark', count: 10 }, { tema_id: 'light', count: 10 }]
      }); // get stats
      db.query.mockResolvedValueOnce({
        rows: [{ tema_attivo: 'sport', custom_colori: null, data_aggiornamento: null }]
      }); // get tema attivo

      const result = await daoTema.getStatisticaTemi();
      expect(result.totaleUtentiConPreferenza).toBe(20);
      expect(result.distribuzionePreferenze[0].percentuale).toBe(50);
      expect(result.temaGlobaleAttivo).toBe('sport');
    });
  });
});
