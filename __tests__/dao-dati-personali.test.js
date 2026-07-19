const db = require("../src/core/config/database");
const daoDatiPersonali = require("../src/features/users/services/dao-dati-personali");

jest.mock("../src/core/config/database", () => ({
  run: jest.fn(),
  get: jest.fn(),
}));

describe("DAO Dati Personali", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("getByUtenteId should resolve with data", async () => {
    const mockData = { data_nascita: "1990-01-01", codice_fiscale: "CF123" };
    db.get.mockImplementation((sql, params, cb) => cb(null, mockData));
    await expect(daoDatiPersonali.getByUtenteId(1)).resolves.toEqual(mockData);
  });

  it("getByUtenteId should resolve with null if no data", async () => {
    db.get.mockImplementation((sql, params, cb) => cb(null, undefined));
    await expect(daoDatiPersonali.getByUtenteId(1)).resolves.toBeNull();
  });

  it("getByUtenteId should reject on error", async () => {
    db.get.mockImplementation((sql, params, cb) => cb(new Error("db error")));
    await expect(daoDatiPersonali.getByUtenteId(1)).rejects.toEqual({ error: "Errore recupero dati personali: db error" });
  });

  it("upsert should resolve with true on success", async () => {
    db.run.mockImplementation((sql, params, cb) => cb(null));
    await expect(daoDatiPersonali.upsert(1, { data_nascita: "1990-01-01" })).resolves.toBe(true);
  });

  it("upsert should reject on error", async () => {
    db.run.mockImplementation((sql, params, cb) => cb(new Error("db error")));
    await expect(daoDatiPersonali.upsert(1, {})).rejects.toEqual({ error: "Errore aggiornamento dati personali: db error" });
  });

  it("deleteByUtenteId should resolve with true on success", async () => {
    db.run.mockImplementation((sql, params, cb) => cb(null));
    await expect(daoDatiPersonali.deleteByUtenteId(1)).resolves.toBe(true);
  });

  it("deleteByUtenteId should reject on error", async () => {
    db.run.mockImplementation((sql, params, cb) => cb(new Error("db error")));
    await expect(daoDatiPersonali.deleteByUtenteId(1)).rejects.toEqual({ error: "Errore eliminazione dati personali: db error" });
  });
});
