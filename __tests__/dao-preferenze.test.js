const db = require("../src/core/config/database");
const daoPreferenze = require("../src/features/users/services/dao-preferenze");

jest.mock("../src/core/config/database", () => ({
  run: jest.fn(),
  get: jest.fn(),
}));

describe("DAO Preferenze", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("getByUtenteId should resolve with data", async () => {
    const mockData = { ruolo_preferito: "Attaccante", piede_preferito: "Destro" };
    db.get.mockImplementation((sql, params, cb) => cb(null, mockData));
    await expect(daoPreferenze.getByUtenteId(1)).resolves.toEqual(mockData);
  });

  it("getByUtenteId should resolve with null if no data", async () => {
    db.get.mockImplementation((sql, params, cb) => cb(null, undefined));
    await expect(daoPreferenze.getByUtenteId(1)).resolves.toBeNull();
  });

  it("getByUtenteId should reject on error", async () => {
    db.get.mockImplementation((sql, params, cb) => cb(new Error("db error")));
    await expect(daoPreferenze.getByUtenteId(1)).rejects.toEqual({ error: "Errore recupero preferenze: db error" });
  });

  it("upsert should resolve with true on success", async () => {
    db.run.mockImplementation((sql, params, cb) => cb(null));
    await expect(daoPreferenze.upsert(1, { ruolo_preferito: "Attaccante" })).resolves.toBe(true);
  });

  it("upsert should reject on error", async () => {
    db.run.mockImplementation((sql, params, cb) => cb(new Error("db error")));
    await expect(daoPreferenze.upsert(1, {})).rejects.toEqual({ error: "Errore aggiornamento preferenze: db error" });
  });

  it("deleteByUtenteId should resolve with true on success", async () => {
    db.run.mockImplementation((sql, params, cb) => cb(null));
    await expect(daoPreferenze.deleteByUtenteId(1)).resolves.toBe(true);
  });

  it("deleteByUtenteId should reject on error", async () => {
    db.run.mockImplementation((sql, params, cb) => cb(new Error("db error")));
    await expect(daoPreferenze.deleteByUtenteId(1)).rejects.toEqual({ error: "Errore eliminazione preferenze: db error" });
  });
});
