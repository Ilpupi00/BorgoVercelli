const daoCampi = require("../src/features/prenotazioni/services/dao-campi");
const sqlite = require("../src/core/config/database");

jest.mock("../src/core/config/database", () => ({
  all: jest.fn(),
  get: jest.fn(),
  run: jest.fn()
}));

describe("DAO Campi", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getCampi", () => {
    it("should get active campi", async () => {
      sqlite.all.mockImplementation((sql, cb) => cb(null, [{ id: 1, nome: "C1" }]));
      const res = await daoCampi.getCampi(true);
      expect(res).toHaveLength(1);
    });
    it("should handle error", async () => {
      sqlite.all.mockImplementation((sql, cb) => cb(new Error("err")));
      await expect(daoCampi.getCampi()).rejects.toEqual({ error: "Error retrieving fields: err" });
    });
  });

  describe("getCampoById", () => {
    it("should get by id", async () => {
      sqlite.get.mockImplementation((sql, params, cb) => cb(null, { id: 1, nome: "C1" }));
      const res = await daoCampi.getCampoById(1);
      expect(res.nome).toBe("C1");
    });
    it("should handle not found", async () => {
      sqlite.get.mockImplementation((sql, params, cb) => cb(null, null));
      await expect(daoCampi.getCampoById(1)).rejects.toEqual({ error: "Field not found" });
    });
    it("should handle error", async () => {
      sqlite.get.mockImplementation((sql, params, cb) => cb(new Error("err")));
      await expect(daoCampi.getCampoById(1)).rejects.toEqual({ error: "Error retrieving field: err" });
    });
  });

  describe("getOrariCampo", () => {
    it("should get orari with giornoSettimana", async () => {
      sqlite.all.mockImplementation((sql, params, cb) => cb(null, [{ id: 1 }]));
      const res = await daoCampi.getOrariCampo(1, 2);
      expect(res).toHaveLength(1);
    });
    it("should get orari without giornoSettimana", async () => {
      sqlite.all.mockImplementation((sql, params, cb) => cb(null, [{ id: 1 }]));
      const res = await daoCampi.getOrariCampo(1);
      expect(res).toHaveLength(1);
    });
    it("should handle error", async () => {
      sqlite.all.mockImplementation((sql, params, cb) => cb(new Error("err")));
      await expect(daoCampi.getOrariCampo(1)).rejects.toEqual({ error: "Error retrieving orari: err" });
    });
  });

  describe("addOrarioCampo", () => {
    it("should add orario", async () => {
      sqlite.run.mockImplementation(function(sql, params, cb) {
        cb.call({ lastID: 1 }, null, { rows: [{ id: 1 }] });
      });
      const res = await daoCampi.addOrarioCampo(1, 1, "10", "11");
      expect(res.id).toBe(1);
    });
    it("should handle error", async () => {
      sqlite.run.mockImplementation((sql, params, cb) => cb(new Error("err")));
      await expect(daoCampi.addOrarioCampo(1, 1, "10", "11")).rejects.toThrow("Error adding orario: err");
    });
  });

  describe("updateOrarioCampo", () => {
    it("should update orario", async () => {
      sqlite.run.mockImplementation(function(sql, params, cb) {
        cb.call({ changes: 1 }, null, { rowCount: 1 });
      });
      const res = await daoCampi.updateOrarioCampo(1, "10", "11", true);
      expect(res.success).toBe(true);
    });
    it("should handle error", async () => {
      sqlite.run.mockImplementation((sql, params, cb) => cb(new Error("err")));
      await expect(daoCampi.updateOrarioCampo(1, "10", "11", true)).rejects.toEqual({ error: "Error updating orario: err" });
    });
  });

  describe("updateOrarioCampoPartial", () => {
    it("should update partial", async () => {
      sqlite.run.mockImplementation(function(sql, params, cb) {
        cb.call({ changes: 1 }, null, { rowCount: 1 });
      });
      const res = await daoCampi.updateOrarioCampoPartial(1, { ora_inizio: "10", attivo: true });
      expect(res.success).toBe(true);
    });
    it("should handle empty fields", async () => {
      await expect(daoCampi.updateOrarioCampoPartial(1, {})).rejects.toEqual({ error: "No fields to update" });
    });
    it("should handle error", async () => {
      sqlite.run.mockImplementation((sql, params, cb) => cb(new Error("err")));
      await expect(daoCampi.updateOrarioCampoPartial(1, { ora_inizio: "10" })).rejects.toEqual({ error: "Error updating orario: err" });
    });
  });

  describe("deleteOrarioCampo", () => {
    it("should delete", async () => {
      sqlite.run.mockImplementation(function(sql, params, cb) {
        cb.call({ changes: 1 }, null, { rowCount: 1 });
      });
      const res = await daoCampi.deleteOrarioCampo(1);
      expect(res.success).toBe(true);
    });
    it("should handle error", async () => {
      sqlite.run.mockImplementation((sql, params, cb) => cb(new Error("err")));
      await expect(daoCampi.deleteOrarioCampo(1)).rejects.toEqual({ error: "Error deleting orario: err" });
    });
  });

  describe("createCampo", () => {
    it("should create", async () => {
      sqlite.run.mockImplementation(function(sql, params, cb) {
        cb.call({ lastID: 1 }, null, { rows: [{ id: 1 }] });
      });
      const res = await daoCampi.createCampo({ nome: "C1" });
      expect(res.id).toBe(1);
    });
    it("should handle error", async () => {
      sqlite.run.mockImplementation((sql, params, cb) => cb(new Error("err")));
      await expect(daoCampi.createCampo({})).rejects.toEqual({ error: "Error creating campo: err" });
    });
  });

  describe("updateCampo", () => {
    it("should return early if no fields", async () => {
      const res = await daoCampi.updateCampo(1, {});
      expect(res.success).toBe(true);
      expect(res.changes).toBe(0);
    });
    it("should update", async () => {
      sqlite.run.mockImplementation(function(sql, params, cb) {
        cb.call({ changes: 1 }, null, { rowCount: 1 });
      });
      const res = await daoCampi.updateCampo(1, { nome: "C1", attivo: true });
      expect(res.success).toBe(true);
    });
    it("should handle error", async () => {
      sqlite.run.mockImplementation((sql, params, cb) => cb(new Error("err")));
      await expect(daoCampi.updateCampo(1, { nome: "C1" })).rejects.toEqual({ error: "Error updating campo: err" });
    });
  });

  describe("deleteCampo", () => {
    it("should delete", async () => {
      sqlite.run.mockImplementation(function(sql, params, cb) {
        cb.call({ changes: 1 }, null, { rowCount: 1 });
      });
      const res = await daoCampi.deleteCampo(1);
      expect(res.success).toBe(true);
    });
    it("should handle error", async () => {
      sqlite.run.mockImplementation((sql, params, cb) => cb(new Error("err")));
      await expect(daoCampi.deleteCampo(1)).rejects.toEqual({ error: "Error deleting campo: err" });
    });
  });

  describe("searchCampi", () => {
    it("should search", async () => {
      sqlite.all.mockImplementation((sql, params, cb) => cb(null, [{ id: 1, nome: "C1" }]));
      const res = await daoCampi.searchCampi("term");
      expect(res).toHaveLength(1);
    });
    it("should handle error", async () => {
      sqlite.all.mockImplementation((sql, params, cb) => cb(new Error("err")));
      await expect(daoCampi.searchCampi("term")).rejects.toEqual({ error: "Error searching fields: err" });
    });
  });
});
