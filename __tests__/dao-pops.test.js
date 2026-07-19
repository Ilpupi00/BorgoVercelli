const dao = require("../src/features/admin/services/dao-pops");
const sqlite = require("../src/core/config/database");

jest.mock("../src/core/config/database", () => ({
  run: jest.fn(),
  get: jest.fn(),
  all: jest.fn()
}));

describe("DAO Pops", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("getAllPops", async () => {
    sqlite.all.mockImplementation((sql, cb) => cb(null, [{ id: 1 }]));
    await expect(dao.getAllPops()).resolves.toHaveLength(1);
    sqlite.all.mockImplementation((sql, cb) => cb(new Error("err")));
    await expect(dao.getAllPops()).rejects.toEqual({ error: "Errore nel recupero dei POPS: err" });
  });

  it("getPopsAttivi", async () => {
    const today = new Date();
    sqlite.all.mockImplementation((sql, cb) => cb(null, [
      { id: 1, tipo: "default", mese_inizio: 1, giorno_inizio: 1, mese_fine: 12, giorno_fine: 31, attivo: true },
      { id: 2, tipo: "custom", data_inizio: new Date(today.getTime() - 86400000), data_fine: new Date(today.getTime() + 86400000), attivo: true },
      { id: 3, tipo: "default", mese_inizio: 6, giorno_inizio: 1, mese_fine: 8, giorno_fine: 31, attivo: true } // Summer (includes July)
    ]));
    await expect(dao.getPopsAttivi()).resolves.toHaveLength(3);
    sqlite.all.mockImplementation((sql, cb) => cb(new Error("err")));
    await expect(dao.getPopsAttivi()).rejects.toEqual({ error: "Errore nel recupero POPS attivi: err" });
  });

  it("createPop", async () => {
    sqlite.run.mockImplementation(function(sql, params, cb) { cb.call(null, null, { rows: [{ id: 1 }] }) });
    await expect(dao.createPop({ titolo: "A" })).resolves.toEqual({ success: true, id: 1 });
    sqlite.run.mockImplementation(function(sql, params, cb) { cb(new Error("err")) });
    await expect(dao.createPop({ titolo: "A" })).rejects.toEqual({ error: "Errore nella creazione del POP: err" });
  });

  it("updatePop", async () => {
    sqlite.get.mockImplementation((sql, params, cb) => cb(null, { is_system: false }));
    sqlite.run.mockImplementation(function(sql, params, cb) { cb.call(null, null, { rowCount: 1 }) });
    await expect(dao.updatePop(1, { titolo: "B" })).resolves.toEqual({ success: true, changes: 1 });

    sqlite.get.mockImplementation((sql, params, cb) => cb(null, null));
    await expect(dao.updatePop(1, {})).rejects.toEqual({ error: "POP non trovato" });

    sqlite.get.mockImplementation((sql, params, cb) => cb(null, { is_system: true }));
    await expect(dao.updatePop(1, {})).rejects.toEqual({ error: "I POPS di sistema non sono modificabili" });

    sqlite.get.mockImplementation((sql, params, cb) => cb(new Error("err")));
    await expect(dao.updatePop(1, {})).rejects.toEqual({ error: "Errore verifica POP: err" });

    sqlite.get.mockImplementation((sql, params, cb) => cb(null, { is_system: false }));
    sqlite.run.mockImplementation((sql, params, cb) => cb(new Error("err")));
    await expect(dao.updatePop(1, {})).rejects.toEqual({ error: "Errore nell'aggiornamento del POP: err" });
  });

  it("deletePop", async () => {
    sqlite.get.mockImplementation((sql, params, cb) => cb(null, { is_system: false }));
    sqlite.run.mockImplementation(function(sql, params, cb) { cb.call(null, null, { rowCount: 1 }) });
    await expect(dao.deletePop(1)).resolves.toEqual({ success: true, deleted: 1 });

    sqlite.get.mockImplementation((sql, params, cb) => cb(null, null));
    await expect(dao.deletePop(1)).rejects.toEqual({ error: "POP non trovato" });

    sqlite.get.mockImplementation((sql, params, cb) => cb(null, { is_system: true }));
    await expect(dao.deletePop(1)).rejects.toEqual({ error: "I POPS di sistema non possono essere eliminati" });

    sqlite.get.mockImplementation((sql, params, cb) => cb(new Error("err")));
    await expect(dao.deletePop(1)).rejects.toEqual({ error: "Errore verifica POP: err" });

    sqlite.get.mockImplementation((sql, params, cb) => cb(null, { is_system: false }));
    sqlite.run.mockImplementation((sql, params, cb) => cb(new Error("err")));
    await expect(dao.deletePop(1)).rejects.toEqual({ error: "Errore nell'eliminazione del POP: err" });
  });

  it("togglePop", async () => {
    sqlite.run.mockImplementation(function(sql, params, cb) { cb.call(null, null, { rows: [{ attivo: true }] }) });
    await expect(dao.togglePop(1)).resolves.toEqual({ success: true, attivo: true });

    sqlite.run.mockImplementation(function(sql, params, cb) { cb(new Error("err")) });
    await expect(dao.togglePop(1)).rejects.toEqual({ error: "Errore nel toggle del POP: err" });
  });
});
