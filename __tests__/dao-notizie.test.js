const dao = require("../src/features/notizie/services/dao-notizie");
const sqlite = require("../src/core/config/database");

jest.mock("../src/core/config/database", () => ({
  run: jest.fn(),
  get: jest.fn(),
  all: jest.fn()
}));

const mockRow = { id: 1, N_id: 1, N_titolo: "Test", autore_nome: "A", autore_cognome: "B" };

describe("DAO Notizie", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("getNotizie", async () => {
    sqlite.all.mockImplementation((sql, cb) => cb(null, [mockRow, { missing: "id" }]));
    const res = await dao.getNotizie();
    expect(res).toHaveLength(1);
    
    sqlite.all.mockImplementation((sql, cb) => cb(new Error("err")));
    await expect(dao.getNotizie()).rejects.toEqual({ error: "Error retrieving news: err" });
  });

  it("getNotiziePaginated", async () => {
    sqlite.all.mockImplementation((sql, params, cb) => cb(null, [mockRow]));
    const res = await dao.getNotiziePaginated();
    expect(res).toHaveLength(1);

    sqlite.all.mockImplementation((sql, params, cb) => cb(new Error("err")));
    await expect(dao.getNotiziePaginated()).rejects.toEqual({ error: "Error retrieving news: err" });
  });

  it("getNotiziaById", async () => {
    sqlite.get.mockImplementation((sql, params, cb) => cb(null, mockRow));
    const res = await dao.getNotiziaById(1);
    expect(res.titolo).toBe("Test");

    sqlite.get.mockImplementation((sql, params, cb) => cb(null, null));
    await expect(dao.getNotiziaById(1)).resolves.toBeNull();

    sqlite.get.mockImplementation((sql, params, cb) => cb(new Error("err")));
    await expect(dao.getNotiziaById(1)).rejects.toEqual({ error: "Error retrieving news: err" });
  });

  it("incrementVisualizzazioni", async () => {
    sqlite.run.mockImplementation((sql, params, cb) => cb(null));
    sqlite.get.mockImplementation((sql, params, cb) => cb(null, { visualizzazioni: 2 }));
    await expect(dao.incrementVisualizzazioni(1)).resolves.toEqual({ success: true, visualizzazioni: 2 });

    sqlite.run.mockImplementation((sql, params, cb) => cb(new Error("err")));
    await expect(dao.incrementVisualizzazioni(1)).rejects.toEqual({ error: "Error incrementing views: err" });
  });

  it("deleteNotiziaById", async () => {
    sqlite.run.mockImplementation(function(sql, params, cb) { cb.call(null, null, { rowCount: 1 }) });
    await expect(dao.deleteNotiziaById(1)).resolves.toEqual({ success: true, deleted: 1 });

    sqlite.run.mockImplementation(function(sql, params, cb) { cb.call(null, null, { rowCount: 0 }) });
    await expect(dao.deleteNotiziaById(1)).resolves.toEqual({ success: false, deleted: 0 });

    sqlite.run.mockImplementation((sql, params, cb) => cb(new Error("err")));
    await expect(dao.deleteNotiziaById(1)).rejects.toEqual({ error: "Error deleting news: err" });
  });

  it("createNotizia", async () => {
    sqlite.run.mockImplementation(function(sql, params, cb) { cb.call(null, null, { rows: [{ id: 1 }] }) });
    await expect(dao.createNotizia({ titolo: "A", pubblicata: true })).resolves.toEqual({ success: true, id: 1 });

    sqlite.run.mockImplementation((sql, params, cb) => cb(new Error("err")));
    await expect(dao.createNotizia({})).rejects.toEqual({ error: "Error creating news: err" });
  });

  it("updateNotizia", async () => {
    sqlite.run.mockImplementation(function(sql, params, cb) { cb.call(null, null, { rowCount: 1 }) });
    await expect(dao.updateNotizia(1, { titolo: "A", pubblicata: false })).resolves.toEqual({ success: true, changes: 1 });

    sqlite.run.mockImplementation((sql, params, cb) => cb(new Error("err")));
    await expect(dao.updateNotizia(1, {})).rejects.toEqual({ error: "Error updating news: err" });
  });

  it("setImmagineNotizia", async () => {
    sqlite.run.mockImplementation(function(sql, params, cb) { cb.call(null, null, { rowCount: 1 }) });
    await expect(dao.setImmagineNotizia(1, 2)).resolves.toEqual({ success: true, changes: 1 });

    sqlite.run.mockImplementation((sql, params, cb) => cb(new Error("err")));
    await expect(dao.setImmagineNotizia(1, 2)).rejects.toEqual({ error: "Error setting news image: err" });
  });

  it("togglePubblicazioneNotizia", async () => {
    sqlite.run.mockImplementation(function(sql, params, cb) { cb.call(null, null, { rowCount: 1 }) });
    await expect(dao.togglePubblicazioneNotizia(1)).resolves.toEqual({ success: true, changes: 1 });

    sqlite.run.mockImplementation((sql, params, cb) => cb(new Error("err")));
    await expect(dao.togglePubblicazioneNotizia(1)).rejects.toEqual({ error: "Error toggling news publication: err" });
  });

  it("searchNotizie", async () => {
    sqlite.all.mockImplementation((sql, params, cb) => cb(null, [mockRow, { missing: "id" }]));
    await expect(dao.searchNotizie("test")).resolves.toHaveLength(1);

    sqlite.all.mockImplementation((sql, params, cb) => cb(new Error("err")));
    await expect(dao.searchNotizie("test")).rejects.toEqual({ error: "Error searching news: err" });
  });

  it("getNotizieFiltered", async () => {
    sqlite.all.mockImplementation((sql, params, cb) => cb(null, [mockRow]));
    await expect(dao.getNotizieFiltered({ search: "a", author: "b", dateFrom: "c", dateTo: "d" })).resolves.toHaveLength(1);

    sqlite.all.mockImplementation((sql, params, cb) => cb(new Error("err")));
    await expect(dao.getNotizieFiltered({})).rejects.toEqual({ error: "Error retrieving filtered news: err" });
  });

  it("getNotizieAuthors", async () => {
    sqlite.all.mockImplementation((sql, cb) => cb(null, [{ nome_completo: "A" }, { nome_completo: "" }]));
    await expect(dao.getNotizieAuthors()).resolves.toEqual(["A"]);

    sqlite.all.mockImplementation((sql, cb) => cb(new Error("err")));
    await expect(dao.getNotizieAuthors()).rejects.toEqual({ error: "Error retrieving authors: err" });
  });

  it("getNotiziePersonali", async () => {
    sqlite.all.mockImplementation((sql, params, cb) => cb(null, [mockRow]));
    await expect(dao.getNotiziePersonali(1)).resolves.toHaveLength(1);

    sqlite.all.mockImplementation((sql, params, cb) => cb(new Error("err")));
    await expect(dao.getNotiziePersonali(1)).rejects.toEqual({ error: "Error retrieving personal news: err" });
  });
});
