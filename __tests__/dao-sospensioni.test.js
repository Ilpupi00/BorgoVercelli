const db = require("../src/core/config/database");
const daoSospensioni = require("../src/features/users/services/dao-sospensioni");

jest.mock("../src/core/config/database", () => ({
  run: jest.fn(),
  get: jest.fn(),
  all: jest.fn(),
}));

describe("DAO Sospensioni", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("getByUtenteId should resolve with data", async () => {
    const mockData = { id: 1, motivo: "test" };
    db.get.mockImplementation((sql, params, cb) => cb(null, mockData));
    await expect(daoSospensioni.getByUtenteId(1)).resolves.toEqual(mockData);
  });

  it("getStatoUtente should resolve with data", async () => {
    const mockData = { stato: "sospeso", motivo: "test" };
    db.get.mockImplementation((sql, params, cb) => cb(null, mockData));
    await expect(daoSospensioni.getStatoUtente(1)).resolves.toEqual({
      stato: "sospeso",
      motivo_sospensione: "test",
      data_inizio_sospensione: null,
      data_fine_sospensione: null,
      admin_sospensione_id: null
    });
  });

  it("getStatoUtente should reject if not found", async () => {
    db.get.mockImplementation((sql, params, cb) => cb(null, null));
    await expect(daoSospensioni.getStatoUtente(1)).rejects.toEqual({ error: "Utente non trovato" });
  });

  it("sospendiUtente should resolve on success", async () => {
    db.run.mockImplementation((sql, params, cb) => cb(null, { rowCount: 1 }));
    await expect(daoSospensioni.sospendiUtente(1, 2, "motivo", null)).resolves.toEqual({
      message: "Utente sospeso con successo",
      userId: 1,
      dataFine: null
    });
  });

  it("bannaUtente should resolve on success", async () => {
    db.run.mockImplementation((sql, params, cb) => cb(null, { rowCount: 1 }));
    await expect(daoSospensioni.bannaUtente(1, 2, "motivo")).resolves.toEqual({
      message: "Utente bannato con successo",
      userId: 1
    });
  });

  it("revocaSospensioneBan should resolve on success", async () => {
    db.run.mockImplementation((sql, params, cb) => cb(null, { rowCount: 1 }));
    await expect(daoSospensioni.revocaSospensioneBan(1)).resolves.toEqual({
      message: "Sospensione/Ban revocato con successo",
      userId: 1
    });
  });

  describe("Error branches", () => {
      it("sospendiUtente db error", async () => {
          db.run.mockImplementationOnce((sql, params, cb) => cb(new Error("err")));
          await expect(daoSospensioni.sospendiUtente(1, 2, "motivo", null)).rejects.toEqual({ error: "Errore nella sospensione dell'utente: err" });
      });
      it("bannaUtente db error", async () => {
          db.run.mockImplementationOnce((sql, params, cb) => cb(new Error("err")));
          await expect(daoSospensioni.bannaUtente(1, 2, "motivo")).rejects.toEqual({ error: "Errore nel ban dell'utente: err" });
      });
      it("revocaSospensioneBan db error", async () => {
          db.run.mockImplementationOnce((sql, params, cb) => cb(new Error("err")));
          await expect(daoSospensioni.revocaSospensioneBan(1)).rejects.toEqual({ error: "Errore nella revoca: err" });
      });
      it("verificaSospensioniScadute db all error", async () => {
          db.all.mockImplementationOnce((sql, params, cb) => cb(new Error("err")));
          await expect(daoSospensioni.verificaSospensioniScadute()).rejects.toEqual({ error: "Errore nella verifica sospensioni: err" });
      });
  });

  it("verificaSospensioniScadute should resolve with 0 if none", async () => {
    db.all.mockImplementation((sql, params, cb) => cb(null, []));
    await expect(daoSospensioni.verificaSospensioniScadute()).resolves.toEqual({
      message: "Verifica completata",
      aggiornati: 0
    });
  });

  it("verificaSospensioniScadute should resolve with updated count", async () => {
    db.all.mockImplementation((sql, params, cb) => cb(null, [{ utente_id: 1 }]));
    db.run.mockImplementation((sql, params, cb) => cb(null, { rowCount: 1 }));
    await expect(daoSospensioni.verificaSospensioniScadute()).resolves.toEqual({
      message: "Verifica completata",
      aggiornati: 1
    });
  });
});
