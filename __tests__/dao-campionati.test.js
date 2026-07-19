const daoCampionati = require("../src/features/campionati/services/dao-campionati");
const sqlite = require("../src/core/config/database");

jest.mock("../src/core/config/database", () => ({
  all: jest.fn(),
  get: jest.fn(),
  run: jest.fn()
}));

describe("DAO Campionati", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAllCampionati", () => {
    it("should get all campionati", async () => {
      sqlite.all.mockImplementation((sql, cb) => cb(null, [{ id: 1, nome: "Serie A" }]));
      const res = await daoCampionati.getAllCampionati();
      expect(res).toHaveLength(1);
      expect(res[0].nome).toBe("Serie A");
    });
    it("should handle error", async () => {
      sqlite.all.mockImplementation((sql, cb) => cb(new Error("err")));
      await expect(daoCampionati.getAllCampionati()).rejects.toEqual({ error: "Errore nel recupero dei campionati: err" });
    });
  });

  describe("getCampionati", () => {
    it("should get active campionati", async () => {
      sqlite.all.mockImplementation((sql, cb) => cb(null, [{ id: 1, nome: "Serie B" }]));
      const res = await daoCampionati.getCampionati();
      expect(res).toHaveLength(1);
    });
    it("should handle error", async () => {
      sqlite.all.mockImplementation((sql, cb) => cb(new Error("err")));
      await expect(daoCampionati.getCampionati()).rejects.toEqual({ error: "Errore nel recupero dei campionati: err" });
    });
  });

  describe("getCampionatoById", () => {
    it("should get by id", async () => {
      sqlite.get.mockImplementation((sql, params, cb) => cb(null, { id: 1, nome: "C1" }));
      const res = await daoCampionati.getCampionatoById(1);
      expect(res.nome).toBe("C1");
    });
    it("should return null if not found", async () => {
      sqlite.get.mockImplementation((sql, params, cb) => cb(null, null));
      const res = await daoCampionati.getCampionatoById(1);
      expect(res).toBeNull();
    });
    it("should handle error", async () => {
      sqlite.get.mockImplementation((sql, params, cb) => cb(new Error("err")));
      await expect(daoCampionati.getCampionatoById(1)).rejects.toEqual({ error: "Errore nel recupero del campionato: err" });
    });
  });

  describe("createCampionato", () => {
    it("should create campionato", async () => {
      sqlite.run.mockImplementation(function(sql, params, cb) {
        cb.call({ lastID: 3 }, null, { rows: [{ id: 3 }] });
      });
      const res = await daoCampionati.createCampionato({ nome: "N", stagione: "S" });
      expect(res.id).toBe(3);
    });
    it("should handle error", async () => {
      sqlite.run.mockImplementation((sql, params, cb) => cb(new Error("err")));
      await expect(daoCampionati.createCampionato({})).rejects.toEqual({ error: "Errore nella creazione del campionato: err" });
    });
  });

  describe("updateCampionato", () => {
    it("should update campionato", async () => {
      sqlite.run.mockImplementation(function(sql, params, cb) {
        cb.call({ changes: 1 }, null, { rowCount: 1 });
      });
      const res = await daoCampionati.updateCampionato(1, { nome: "N" });
      expect(res.message).toBe("Campionato aggiornato con successo");
    });
    it("should return error if not found", async () => {
      sqlite.run.mockImplementation(function(sql, params, cb) {
        cb.call({ changes: 0 }, null, { rowCount: 0 });
      });
      await expect(daoCampionati.updateCampionato(1, {})).rejects.toEqual({ error: "Campionato non trovato" });
    });
    it("should handle error", async () => {
      sqlite.run.mockImplementation((sql, params, cb) => cb(new Error("err")));
      await expect(daoCampionati.updateCampionato(1, {})).rejects.toEqual({ error: "Errore nell'aggiornamento del campionato: err" });
    });
  });

  describe("deleteCampionato", () => {
    it("should delete campionato", async () => {
      sqlite.run.mockImplementation(function(sql, params, cb) {
        cb.call({ changes: 1 }, null, { rowCount: 1 });
      });
      const res = await daoCampionati.deleteCampionato(1);
      expect(res.message).toBe("Campionato eliminato con successo");
    });
    it("should return error if not found", async () => {
      sqlite.run.mockImplementation(function(sql, params, cb) {
        cb.call({ changes: 0 }, null, { rowCount: 0 });
      });
      await expect(daoCampionati.deleteCampionato(1)).rejects.toEqual({ error: "Campionato non trovato" });
    });
    it("should handle error", async () => {
      sqlite.run.mockImplementation((sql, params, cb) => cb(new Error("err")));
      await expect(daoCampionati.deleteCampionato(1)).rejects.toEqual({ error: "Errore nell'eliminazione del campionato: err" });
    });
  });

  describe("toggleCampionatoStatus", () => {
    it("should toggle status", async () => {
      sqlite.run.mockImplementation(function(sql, params, cb) {
        cb.call({ changes: 1 }, null, { rowCount: 1 });
      });
      const res = await daoCampionati.toggleCampionatoStatus(1, true);
      expect(res.message).toBe("Stato del campionato aggiornato con successo");
    });
    it("should handle not found", async () => {
      sqlite.run.mockImplementation(function(sql, params, cb) {
        cb.call({ changes: 0 }, null, { rowCount: 0 });
      });
      await expect(daoCampionati.toggleCampionatoStatus(1, true)).rejects.toEqual({ error: "Campionato non trovato" });
    });
    it("should handle error", async () => {
      sqlite.run.mockImplementation((sql, params, cb) => cb(new Error("err")));
      await expect(daoCampionati.toggleCampionatoStatus(1, true)).rejects.toEqual({ error: "Errore nell'aggiornamento dello stato del campionato: err" });
    });
  });

  describe("getClassificaByCampionatoId", () => {
    it("should get classifica and map classes", async () => {
      sqlite.get.mockImplementation((sql, params, cb) => cb(null, { promozione_diretta: 1, playoff_start: 2, playoff_end: 3, playout_start: 13, playout_end: 14, retrocessione_diretta: 1 }));
      sqlite.all.mockImplementation((sql, params, cb) => cb(null, [
        { posizione: 1, nome: "A", punti: 10, nostra_squadra_id: null },
        { posizione: 2, nome: "B", punti: 9, nostra_squadra_id: null },
        { posizione: 13, nome: "C", punti: 2, nostra_squadra_id: null },
        { posizione: 16, nome: "D", punti: 0, nostra_squadra_id: null }
      ]));
      const res = await daoCampionati.getClassificaByCampionatoId(1);
      expect(res).toHaveLength(4);
      expect(res[0].classe).toBe("table-success");
      expect(res[1].classe).toBe("table-secondary");
      expect(res[2].classe).toBe("table-warning");
      expect(res[3].classe).toBe("table-danger");
    });
    it("should handle get rules error", async () => {
      sqlite.get.mockImplementation((sql, params, cb) => cb(new Error("err")));
      await expect(daoCampionati.getClassificaByCampionatoId(1)).rejects.toEqual({ error: "Error retrieving regole: err" });
    });
    it("should handle get classifica error", async () => {
      sqlite.get.mockImplementation((sql, params, cb) => cb(null, {}));
      sqlite.all.mockImplementation((sql, params, cb) => cb(new Error("err")));
      await expect(daoCampionati.getClassificaByCampionatoId(1)).rejects.toEqual({ error: "Error retrieving classifica: err" });
    });
  });

  describe("addSquadraCampionato", () => {
    it("should add squadra", async () => {
      sqlite.run.mockImplementation(function(sql, params, cb) {
        cb.call({ lastID: 10 }, null, { rows: [{ id: 10 }] });
      });
      const res = await daoCampionati.addSquadraCampionato(1, { nome: "S1" });
      expect(res.id).toBe(10);
    });
    it("should handle error", async () => {
      sqlite.run.mockImplementation((sql, params, cb) => cb(new Error("err")));
      await expect(daoCampionati.addSquadraCampionato(1, {})).rejects.toEqual({ error: "Errore nell'aggiunta della squadra: err" });
    });
  });

  describe("removeSquadraCampionato", () => {
    it("should remove squadra", async () => {
      sqlite.run.mockImplementation(function(sql, params, cb) {
        cb.call({ changes: 1 }, null, { rowCount: 1 });
      });
      const res = await daoCampionati.removeSquadraCampionato(1, "S1");
      expect(res.message).toBe("Squadra rimossa con successo");
    });
    it("should handle not found", async () => {
      sqlite.run.mockImplementation(function(sql, params, cb) {
        cb.call({ changes: 0 }, null, { rowCount: 0 });
      });
      await expect(daoCampionati.removeSquadraCampionato(1, "S1")).rejects.toEqual({ error: "Squadra non trovata" });
    });
    it("should handle error", async () => {
      sqlite.run.mockImplementation((sql, params, cb) => cb(new Error("err")));
      await expect(daoCampionati.removeSquadraCampionato(1, "S1")).rejects.toEqual({ error: "Errore nella rimozione della squadra: err" });
    });
  });

  describe("getSquadreByCampionatoId", () => {
    it("should get squadre", async () => {
      sqlite.all.mockImplementation((sql, params, cb) => cb(null, [{ id: 1, nome: "S1" }]));
      const res = await daoCampionati.getSquadreByCampionatoId(1);
      expect(res).toHaveLength(1);
    });
    it("should handle error", async () => {
      sqlite.all.mockImplementation((sql, params, cb) => cb(new Error("err")));
      await expect(daoCampionati.getSquadreByCampionatoId(1)).rejects.toEqual({ error: "Errore nel recupero delle squadre: err" });
    });
  });

  describe("updateSquadraCampionato", () => {
    it("should update squadra", async () => {
      sqlite.run.mockImplementation(function(sql, params, cb) {
        cb.call({ changes: 1 }, null, { rowCount: 1 });
      });
      const res = await daoCampionati.updateSquadraCampionato(1, "S1", { punti: 10 });
      expect(res.message).toBe("Squadra aggiornata con successo");
    });
    it("should handle not found", async () => {
      sqlite.run.mockImplementation(function(sql, params, cb) {
        cb.call({ changes: 0 }, null, { rowCount: 0 });
      });
      await expect(daoCampionati.updateSquadraCampionato(1, "S1", {})).rejects.toEqual({ error: "Squadra non trovata" });
    });
    it("should handle error", async () => {
      sqlite.run.mockImplementation((sql, params, cb) => cb(new Error("err")));
      await expect(daoCampionati.updateSquadraCampionato(1, "S1", {})).rejects.toEqual({ error: "Errore nell'aggiornamento della squadra: err" });
    });
  });
});
