const daoEventi = require("../src/features/eventi/services/dao-eventi");
const sqlite = require("../src/core/config/database");

jest.mock("../src/core/config/database", () => ({
  all: jest.fn(),
  get: jest.fn(),
  run: jest.fn()
}));

describe("DAO Eventi", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getEventi", () => {
    it("should return published eventi with images", async () => {
      sqlite.all.mockImplementation((sql, cb) => cb(null, [{ id: 1, titolo: "Ev1", immagine_url: "url1" }]));
      const res = await daoEventi.getEventi();
      expect(res).toHaveLength(1);
      expect(res[0].immagine_url).toBe("url1");
    });
    it("should handle error", async () => {
      sqlite.all.mockImplementation((sql, cb) => cb(new Error("err")));
      await expect(daoEventi.getEventi()).rejects.toEqual({ error: "Error retrieving events: err" });
    });
  });

  describe("getEventiPubblicati", () => {
    it("should return published eventi", async () => {
      sqlite.all.mockImplementation((sql, cb) => cb(null, [{ id: 1, titolo: "Ev1" }]));
      const res = await daoEventi.getEventiPubblicati();
      expect(res).toHaveLength(1);
    });
    it("should handle error", async () => {
      sqlite.all.mockImplementation((sql, cb) => cb(new Error("err")));
      await expect(daoEventi.getEventiPubblicati()).rejects.toEqual({ error: "Error retrieving published events: err" });
    });
  });

  describe("getEventoById", () => {
    it("should return evento with immagini array", async () => {
      sqlite.get.mockImplementation((sql, params, cb) => cb(null, { id: 1, titolo: "Ev1", immagine_url: "main.jpg" }));
      sqlite.all.mockImplementation((sql, params, cb) => cb(null, [{ url: "img1.jpg" }]));
      const res = await daoEventi.getEventoById(1);
      expect(res.id).toBe(1);
      expect(res.immagine_url).toBe("main.jpg");
      expect(res.immagini).toHaveLength(1);
    });
    it("should return not found", async () => {
      sqlite.get.mockImplementation((sql, params, cb) => cb(null, null));
      await expect(daoEventi.getEventoById(1)).rejects.toEqual({ error: "Event not found" });
    });
    it("should handle get error", async () => {
      sqlite.get.mockImplementation((sql, params, cb) => cb(new Error("err")));
      await expect(daoEventi.getEventoById(1)).rejects.toEqual({ error: "Error retrieving event: err" });
    });
    it("should handle immagini array error gracefully", async () => {
      sqlite.get.mockImplementation((sql, params, cb) => cb(null, { id: 1, titolo: "Ev1" }));
      sqlite.all.mockImplementation((sql, params, cb) => cb(new Error("err")));
      const res = await daoEventi.getEventoById(1);
      expect(res.id).toBe(1);
      expect(res.immagini).toEqual([]);
    });
  });

  describe("createEvento", () => {
    it("should create evento", async () => {
      sqlite.run.mockImplementation(function(sql, params, cb) {
        cb.call({ lastID: 5 }, null, { rows: [{ id: 5 }] });
      });
      const res = await daoEventi.createEvento({ titolo: "A", pubblicato: true });
      expect(res.id).toBe(5);
    });
    it("should handle error", async () => {
      sqlite.run.mockImplementation((sql, params, cb) => cb(new Error("err")));
      await expect(daoEventi.createEvento({})).rejects.toEqual({ error: "Error creating event: err" });
    });
  });

  describe("updateEvento", () => {
    it("should update evento", async () => {
      sqlite.run.mockImplementation(function(sql, params, cb) {
        cb.call({ changes: 1 }, null, { rowCount: 1 });
      });
      const res = await daoEventi.updateEvento(1, { titolo: "B", pubblicato: false });
      expect(res.success).toBe(true);
    });
    it("should handle not found", async () => {
      sqlite.run.mockImplementation(function(sql, params, cb) {
        cb.call({ changes: 0 }, null, { rowCount: 0 });
      });
      await expect(daoEventi.updateEvento(1, {})).rejects.toEqual({ error: "Event not found" });
    });
    it("should handle error", async () => {
      sqlite.run.mockImplementation((sql, params, cb) => cb(new Error("err")));
      await expect(daoEventi.updateEvento(1, {})).rejects.toEqual({ error: "Error updating event: err" });
    });
  });

  describe("deleteEventoById", () => {
    it("should delete evento", async () => {
      sqlite.run.mockImplementation(function(sql, params, cb) {
        cb.call(this, null, { rowCount: 1 });
      });
      const res = await daoEventi.deleteEventoById(1);
      expect(res.success).toBe(true);
    });
    it("should handle not found", async () => {
      sqlite.run.mockImplementation(function(sql, params, cb) {
        cb.call(this, null, { rowCount: 0 });
      });
      await expect(daoEventi.deleteEventoById(1)).rejects.toEqual({ error: "Event not found" });
    });
    it("should handle error", async () => {
      sqlite.run.mockImplementation((sql, params, cb) => cb(new Error("err")));
      await expect(daoEventi.deleteEventoById(1)).rejects.toEqual({ error: "Error deleting event: err" });
    });
  });

  describe("togglePubblicazioneEvento", () => {
    it("should toggle", async () => {
      sqlite.run.mockImplementation(function(sql, params, cb) {
        cb.call({ changes: 1 }, null, { rowCount: 1 });
      });
      const res = await daoEventi.togglePubblicazioneEvento(1);
      expect(res.success).toBe(true);
    });
    it("should handle not found", async () => {
      sqlite.run.mockImplementation(function(sql, params, cb) {
        cb.call({ changes: 0 }, null, { rowCount: 0 });
      });
      await expect(daoEventi.togglePubblicazioneEvento(1)).rejects.toEqual({ error: "Event not found" });
    });
    it("should handle error", async () => {
      sqlite.run.mockImplementation((sql, params, cb) => cb(new Error("err")));
      await expect(daoEventi.togglePubblicazioneEvento(1)).rejects.toEqual({ error: "Error toggling event publication: err" });
    });
  });

  describe("setImmagineEvento", () => {
    it("should set image", async () => {
      sqlite.run.mockImplementation(function(sql, params, cb) {
        cb.call({ changes: 1 }, null, { rowCount: 1 });
      });
      const res = await daoEventi.setImmagineEvento(1, 2);
      expect(res.success).toBe(true);
    });
    it("should handle error", async () => {
      sqlite.run.mockImplementation((sql, params, cb) => cb(new Error("err")));
      await expect(daoEventi.setImmagineEvento(1, 2)).rejects.toEqual({ error: "Error setting event image: err" });
    });
  });

  describe("searchEventi", () => {
    it("should search eventi", async () => {
      sqlite.all.mockImplementation((sql, params, cb) => cb(null, [{ id: 1, titolo: "C" }]));
      const res = await daoEventi.searchEventi("term");
      expect(res).toHaveLength(1);
    });
    it("should handle error", async () => {
      sqlite.all.mockImplementation((sql, params, cb) => cb(new Error("err")));
      await expect(daoEventi.searchEventi("term")).rejects.toEqual({ error: "Error searching events: err" });
    });
  });

  describe("getEventiPersonali", () => {
    it("should get personal events", async () => {
      sqlite.all.mockImplementation((sql, params, cb) => cb(null, [{ id: 1, titolo: "C" }]));
      const res = await daoEventi.getEventiPersonali(1);
      expect(res).toHaveLength(1);
    });
    it("should handle error", async () => {
      sqlite.all.mockImplementation((sql, params, cb) => cb(new Error("err")));
      await expect(daoEventi.getEventiPersonali(1)).rejects.toEqual({ error: "Error getting personal events: err" });
    });
  });

  describe("getEventiAll", () => {
    it("should get all events including drafts", async () => {
      sqlite.all.mockImplementation((sql, cb) => cb(null, [{ id: 1, titolo: "C", immagine_url: "url" }]));
      const res = await daoEventi.getEventiAll();
      expect(res).toHaveLength(1);
    });
    it("should handle error", async () => {
      sqlite.all.mockImplementation((sql, cb) => cb(new Error("err")));
      await expect(daoEventi.getEventiAll()).rejects.toEqual({ error: "Error getting all events: err" });
    });
  });
});
