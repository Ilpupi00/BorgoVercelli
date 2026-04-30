"use strict";

process.env.DATABASE_URL = 'postgres://u:p@h:5432/d';
const db = require('../src/core/config/database');
const daoPrenotazione = require('../src/features/prenotazioni/services/dao-prenotazione');
const campiDao = require('../src/features/prenotazioni/services/dao-campi');

jest.mock('../src/core/config/database');
jest.mock('../src/features/prenotazioni/services/dao-campi');

describe('DAO Prenotazione', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('getCampiAttivi should return fields with nested images', async () => {
        db.all.mockImplementation((sql, params, cb) => {
            if (typeof params === 'function') cb = params;
            if (sql.includes('CAMPI')) {
                cb(null, [{ id: 1, nome: 'Campo 1' }]);
            } else if (sql.includes('IMMAGINI')) {
                cb(null, [{ id: 10, url: '/img.jpg', tipo: 'Campo' }]);
            }
        });

        const res = await daoPrenotazione.getCampiAttivi();
        expect(res).toHaveLength(1);
        expect(res[0].immagini).toHaveLength(1);
        expect(res[0].immagini[0].url).toBe('/img.jpg');
    });

    it('getDisponibilitaCampo should filter occupied slots', async () => {
        campiDao.getOrariCampo.mockResolvedValue([
            { ora_inizio: '08:00', ora_fine: '09:00' },
            { ora_inizio: '09:00', ora_fine: '10:00' }
        ]);
        db.all.mockImplementation((sql, params, cb) => {
            cb(null, [{ id: 1, ora_inizio: '08:00', ora_fine: '09:00' }]);
        });

        const res = await daoPrenotazione.getDisponibilitaCampo(1, '2026-12-01');
        expect(res).toHaveLength(1);
        expect(res[0].inizio).toBe('09:00');
    });

    it('prenotaCampo should handle overlap errors from DB', async () => {
        db.get.mockImplementation((sql, params, cb) => cb(null, null));
        db.run.mockImplementation((sql, params, cb) => {
            const err = new Error('exclusion constraint "prenotazioni_no_overlap"');
            err.code = '23P01';
            cb(err);
        });

        const res = await daoPrenotazione.prenotaCampo({ 
            campo_id: 1, 
            data_prenotazione: '2026-12-01', 
            ora_inizio: '08:00', 
            ora_fine: '09:00' 
        });
        expect(res.error).toContain('sovrappone');
    });

    it('updateStatoPrenotazione should handle annullata_da', async () => {
        db.run.mockImplementation((sql, params, cb) => cb(null, { rowCount: 1 }));
        const res = await daoPrenotazione.updateStatoPrenotazione(1, 'annullata', 'admin');
        expect(res.success).toBe(true);
        expect(db.run).toHaveBeenCalledWith(expect.stringContaining('annullata_da = ?'), expect.arrayContaining(['admin']), expect.any(Function));
    });

    it('checkAndUpdateScadute should log and update', async () => {
        db.get.mockImplementation((sql, params, cb) => cb(null, { cnt: 3 }));
        db.run.mockImplementation((sql, params, cb) => cb(null, { rowCount: 3 }));
        const res = await daoPrenotazione.checkAndUpdateScadute();
        expect(res.updated).toBe(3);
    });

    it('deleteScaduteOlderThanDays should use default retention', async () => {
        db.get.mockImplementation((sql, params, cb) => cb(null, { cnt: 2 }));
        db.run.mockImplementation((sql, params, cb) => cb(null, { rowCount: 2 }));
        const res = await daoPrenotazione.deleteScaduteOlderThanDays();
        expect(res.deleted).toBe(2);
        expect(db.run).toHaveBeenCalledWith(expect.any(String), [14], expect.any(Function));
    });

    it('autoAcceptPendingBookings should handle multiple IDs', async () => {
        db.all.mockImplementation((sql, params, cb) => cb(null, [{ id: 1 }, { id: 2 }]));
        db.run.mockImplementation((sql, params, cb) => cb(null, { rowCount: 2 }));
        const res = await daoPrenotazione.autoAcceptPendingBookings();
        expect(res.accepted).toBe(2);
        expect(db.run).toHaveBeenCalledWith(expect.stringContaining('IN (?,?)'), [1, 2], expect.any(Function));
    });

    it('getAllPrenotazioni should return all bookings', async () => {
        db.all.mockImplementation((sql, params, cb) => {
            if (typeof params === 'function') cb = params;
            cb(null, [{ id: 1, campo_id: 1 }]);
        });
        const res = await daoPrenotazione.getAllPrenotazioni();
        expect(res).toHaveLength(1);
    });

    it('getPrenotazioneById should return booking', async () => {
        db.get.mockImplementation((sql, params, cb) => cb(null, { id: 5, campo_id: 1 }));
        const res = await daoPrenotazione.getPrenotazioneById(5);
        expect(res.id).toBe(5);
    });

    it('getPrenotazioneById should return null if not found', async () => {
        db.get.mockImplementation((sql, params, cb) => cb(null, null));
        const res = await daoPrenotazione.getPrenotazioneById(999);
        expect(res).toBeNull();
    });

    it('deletePrenotazione should remove booking', async () => {
        db.run.mockImplementation((sql, params, cb) => cb(null, { rowCount: 1 }));
        const res = await daoPrenotazione.deletePrenotazione(1);
        expect(res.success).toBe(true);
    });

    it('getPrenotazioniByUserId should return user bookings', async () => {
        db.all.mockImplementation((sql, params, cb) => cb(null, [{ id: 1 }, { id: 2 }]));
        const res = await daoPrenotazione.getPrenotazioniByUserId(5);
        expect(res).toHaveLength(2);
    });

    it('updatePrenotazione should update booking fields', async () => {
        db.run.mockImplementation((sql, params, cb) => cb(null, { rowCount: 1 }));
        const res = await daoPrenotazione.updatePrenotazione(1, { nota: 'Updated note', stato: 'confermata' });
        expect(res.success).toBe(true);
    });

    it('deleteScadute should return deleted count', async () => {
        // deleteScadute calls db.get(sql, [], cb) and db.run(sql, cb)
        db.get.mockImplementation((sql, params, cb) => {
            if (typeof params === 'function') cb = params;
            cb(null, { cnt: 5 });
        });
        db.run.mockImplementation((sql, cb) => cb(null, { rowCount: 5 }));
        const res = await daoPrenotazione.deleteScadute();
        expect(res.deleted).toBe(5);
    });

    it('confermaPrenotazione should call updateStatoPrenotazione with confermata', async () => {
        db.run.mockImplementation((sql, params, cb) => cb(null, { rowCount: 1 }));
        const res = await daoPrenotazione.confermaPrenotazione(1);
        expect(res.success).toBe(true);
    });
});
