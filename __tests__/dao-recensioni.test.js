const daoRecensioni = require("../src/features/recensioni/services/dao-recensioni");
const sqlite = require("../src/core/config/database");

jest.mock("../src/core/config/database", () => ({
  all: jest.fn(),
  get: jest.fn(),
  run: jest.fn()
}));

describe("DAO Recensioni", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getRecensioni", () => {
    it("should return recensioni", async () => {
      sqlite.all.mockImplementation((sql, cb) => cb(null, [{ id: 1 }]));
      const res = await daoRecensioni.getRecensioni();
      expect(res).toHaveLength(1);
    });
    it("should handle error", async () => {
      sqlite.all.mockImplementation((sql, cb) => cb(new Error("err")));
      await expect(daoRecensioni.getRecensioni()).rejects.toEqual({ error: "Error retrieving reviews: err" });
    });
  });

  describe("getValutaMediaRecensioni", () => {
    it("should return media", async () => {
      sqlite.get.mockImplementation((sql, cb) => cb(null, { media: 4.5 }));
      const res = await daoRecensioni.getValutaMediaRecensioni();
      expect(res).toBe(4.5);
    });
    it("should handle error", async () => {
      sqlite.get.mockImplementation((sql, cb) => cb(new Error("err")));
      await expect(daoRecensioni.getValutaMediaRecensioni()).rejects.toEqual({ error: "Error retrieving average rating: err" });
    });
  });

  describe("inserisciRecensione", () => {
    it("should insert", async () => {
      sqlite.run.mockImplementation(function(sql, params, cb) {
        cb.call({ lastID: 1 }, null, { rows: [{ id: 1 }] });
      });
      const res = await daoRecensioni.inserisciRecensione({ utente_id: 1, entita_tipo: "evento", entita_id: 1, valutazione: 5 });
      expect(res.id).toBe(1);
    });
    it("should handle error", async () => {
      sqlite.run.mockImplementation((sql, params, cb) => cb(new Error("err")));
      const res = await daoRecensioni.inserisciRecensione({});
      expect(res.success).toBe(false);
      expect(res.error).toBe("err");
    });
  });

  describe("getRecensioniByUserId", () => {
    it("should return user reviews", async () => {
      sqlite.all.mockImplementation((sql, params, cb) => cb(null, [{ id: 1 }]));
      const res = await daoRecensioni.getRecensioniByUserId(1);
      expect(res).toHaveLength(1);
    });
    it("should handle error", async () => {
      sqlite.all.mockImplementation((sql, params, cb) => cb(new Error("err")));
      await expect(daoRecensioni.getRecensioniByUserId(1)).rejects.toEqual({ error: "Error retrieving user reviews: err" });
    });
  });

  describe("updateRecensione", () => {
    it("should update", async () => {
      sqlite.run.mockImplementation(function(sql, params, cb) {
        cb.call({ changes: 1 }, null, { rowCount: 1 });
      });
      const res = await daoRecensioni.updateRecensione(1, 1, {});
      expect(res.success).toBe(true);
    });
    it("should handle error", async () => {
      sqlite.run.mockImplementation((sql, params, cb) => cb(new Error("err")));
      await expect(daoRecensioni.updateRecensione(1, 1, {})).rejects.toEqual({ error: "Error updating review: err" });
    });
  });

  describe("deleteRecensione", () => {
    it("should soft delete", async () => {
      sqlite.run.mockImplementation(function(sql, params, cb) {
        cb.call({ changes: 1 }, null, { rowCount: 1 });
      });
      const res = await daoRecensioni.deleteRecensione(1, 1);
      expect(res.success).toBe(true);
    });
    it("should handle error", async () => {
      sqlite.run.mockImplementation((sql, params, cb) => cb(new Error("err")));
      await expect(daoRecensioni.deleteRecensione(1, 1)).rejects.toEqual({ error: "Error deleting review: err" });
    });
  });

  describe("getAllRecensioni", () => {
    it("should return all", async () => {
      sqlite.all.mockImplementation((sql, cb) => cb(null, [{ id: 1 }]));
      const res = await daoRecensioni.getAllRecensioni();
      expect(res).toHaveLength(1);
    });
    it("should handle error", async () => {
      sqlite.all.mockImplementation((sql, cb) => cb(new Error("err")));
      await expect(daoRecensioni.getAllRecensioni()).rejects.toEqual({ error: "Error retrieving reviews: err" });
    });
  });

  describe("getRecensioneById", () => {
    it("should return by id", async () => {
      sqlite.get.mockImplementation((sql, params, cb) => cb(null, { id: 1 }));
      const res = await daoRecensioni.getRecensioneById(1);
      expect(res.id).toBe(1);
    });
    it("should handle error", async () => {
      sqlite.get.mockImplementation((sql, params, cb) => cb(new Error("err")));
      await expect(daoRecensioni.getRecensioneById(1)).rejects.toEqual({ error: "Error retrieving review: err" });
    });
  });

  describe("updateRecensioneVisibile", () => {
    it("should update visibility", async () => {
      sqlite.run.mockImplementation(function(sql, params, cb) {
        cb.call({ changes: 1 }, null, { rowCount: 1 });
      });
      const res = await daoRecensioni.updateRecensioneVisibile(1, true);
      expect(res.success).toBe(true);
    });
    it("should handle error", async () => {
      sqlite.run.mockImplementation((sql, params, cb) => cb(new Error("err")));
      await expect(daoRecensioni.updateRecensioneVisibile(1, true)).rejects.toEqual({ error: "Error updating review visibility: err" });
    });
  });

  describe("deleteRecensioneAdmin", () => {
    it("should delete", async () => {
      sqlite.run.mockImplementation(function(sql, params, cb) {
        cb.call({ changes: 1 }, null, { rowCount: 1 });
      });
      const res = await daoRecensioni.deleteRecensioneAdmin(1);
      expect(res.success).toBe(true);
    });
    it("should handle error", async () => {
      sqlite.run.mockImplementation((sql, params, cb) => cb(new Error("err")));
      await expect(daoRecensioni.deleteRecensioneAdmin(1)).rejects.toEqual({ error: "Error deleting review: err" });
    });
  });
});
