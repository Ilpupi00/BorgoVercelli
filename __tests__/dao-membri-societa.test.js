const dao = require("../src/features/squadre/services/dao-membri-societa");
const sqlite = require("../src/core/config/database");

jest.mock("../src/core/config/database", () => ({
  all: jest.fn(),
  get: jest.fn(),
}));

describe("DAO Membri Societa", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getMembriSocieta", () => {
    it("should get membri", async () => {
      sqlite.all.mockImplementation((sql, cb) => cb(null, [{ id: 1 }]));
      const res = await dao.getMembriSocieta();
      expect(res).toHaveLength(1);
    });
    it("should handle error", async () => {
      sqlite.all.mockImplementation((sql, cb) => cb(new Error("err")));
      await expect(dao.getMembriSocieta()).rejects.toThrow("err");
    });
    it("should handle throws", async () => {
      sqlite.all.mockImplementation(() => { throw new Error("err"); });
      await expect(dao.getMembriSocieta()).rejects.toThrow("err");
    });
  });

  describe("getMembroById", () => {
    it("should get membro by id", async () => {
      sqlite.get.mockImplementation((sql, params, cb) => cb(null, { id: 1 }));
      const res = await dao.getMembroById(1);
      expect(res.id).toBe(1);
    });
    it("should handle error", async () => {
      sqlite.get.mockImplementation((sql, params, cb) => cb(new Error("err")));
      await expect(dao.getMembroById(1)).rejects.toThrow("err");
    });
    it("should handle throws", async () => {
      sqlite.get.mockImplementation(() => { throw new Error("err"); });
      await expect(dao.getMembroById(1)).rejects.toThrow("err");
    });
  });
});
