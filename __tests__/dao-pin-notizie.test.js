const dao = require("../src/features/notizie/services/dao-pin-notizie");
const sqlite = require("../src/core/config/database");

jest.mock("../src/core/config/database", () => ({
  run: jest.fn(),
  get: jest.fn(),
  all: jest.fn()
}));

describe("DAO Pin Notizie", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("addPin", async () => {
    sqlite.run.mockImplementation((sql, params, cb) => cb(null));
    await expect(dao.addPin(1, 1)).resolves.toEqual({ success: true, added: true });

    sqlite.run.mockImplementation((sql, params, cb) => cb(new Error("err")));
    await expect(dao.addPin(1, 1)).rejects.toThrow("err");
    
    sqlite.run.mockImplementation(() => { throw new Error("throw"); });
    await expect(dao.addPin(1, 1)).rejects.toThrow("throw");
  });

  it("removePin", async () => {
    sqlite.run.mockImplementation((sql, params, cb) => cb(null));
    await expect(dao.removePin(1, 1)).resolves.toEqual({ success: true, removed: true });

    sqlite.run.mockImplementation((sql, params, cb) => cb(new Error("err")));
    await expect(dao.removePin(1, 1)).rejects.toThrow("err");
  });

  it("isPinned", async () => {
    sqlite.get.mockImplementation((sql, params, cb) => cb(null, { is_pinned: true }));
    await expect(dao.isPinned(1, 1)).resolves.toBe(true);

    sqlite.get.mockImplementation((sql, params, cb) => cb(new Error("err")));
    await expect(dao.isPinned(1, 1)).resolves.toBe(false);
    
    sqlite.get.mockImplementation(() => { throw new Error("throw"); });
    await expect(dao.isPinned(1, 1)).rejects.toThrow("throw");
  });

  it("togglePin", async () => {
    sqlite.get.mockImplementation((sql, params, cb) => cb(null, { is_pinned: true }));
    sqlite.run.mockImplementation((sql, params, cb) => cb(null));
    await expect(dao.togglePin(1, 1)).resolves.toEqual({ success: true, pinned: false });

    sqlite.get.mockImplementation((sql, params, cb) => cb(null, { is_pinned: false }));
    sqlite.run.mockImplementation((sql, params, cb) => cb(null));
    await expect(dao.togglePin(1, 1)).resolves.toEqual({ success: true, pinned: true });
    
    sqlite.get.mockImplementation(() => { throw new Error("throw"); });
    await expect(dao.togglePin(1, 1)).rejects.toThrow("throw");
  });

  it("getPinnedIds", async () => {
    sqlite.all.mockImplementation((sql, params, cb) => cb(null, [{ id: 1 }]));
    await expect(dao.getPinnedIds(1)).resolves.toEqual(["1"]);

    sqlite.all.mockImplementation((sql, params, cb) => cb(new Error("err")));
    await expect(dao.getPinnedIds(1)).resolves.toEqual([]);
    
    sqlite.all.mockImplementation(() => { throw new Error("throw"); });
    await expect(dao.getPinnedIds(1)).rejects.toThrow("throw");
  });

  it("getPinCount", async () => {
    sqlite.all.mockImplementation((sql, params, cb) => cb(null, [{ id: 1 }]));
    await expect(dao.getPinCount(1)).resolves.toBe(1);

    sqlite.all.mockImplementation(() => { throw new Error("throw"); });
    await expect(dao.getPinCount(1)).resolves.toBe(0);
  });

  it("getNotiziaGlobalPins", async () => {
    sqlite.get.mockImplementation((sql, params, cb) => cb(null, { is_pinned: true }));
    await expect(dao.getNotiziaGlobalPins(1)).resolves.toBe(1);

    sqlite.get.mockImplementation(() => { throw new Error("throw"); });
    await expect(dao.getNotiziaGlobalPins(1)).resolves.toBe(0);
  });

  it("removeAllPinsForNotizia", async () => {
    sqlite.run.mockImplementation((sql, params, cb) => cb(null));
    await expect(dao.removeAllPinsForNotizia(1)).resolves.toBeUndefined();

    sqlite.run.mockImplementation(() => { throw new Error("throw"); });
    await expect(dao.removeAllPinsForNotizia(1)).resolves.toBeUndefined(); // Caught internally
  });
});
