"use strict";

const sqlite = require("../src/core/config/database");
const daoMembri = require("../src/features/squadre/services/dao-membri-societa");

jest.mock("../src/core/config/database", () => ({
  all: jest.fn(),
  get: jest.fn()
}));

describe("DAO: Membri Societa", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("getMembriSocieta returns list", async () => {
        sqlite.all.mockImplementation((sql, cb) => cb(null, [{ id: 1, ruolo: "Presidente" }]));
        const res = await daoMembri.getMembriSocieta();
        expect(res).toHaveLength(1);
        expect(res[0].ruolo).toBe("Presidente");
    });

    it("getMembroById returns row", async () => {
        sqlite.get.mockImplementation((sql, params, cb) => cb(null, { id: 1 }));
        const res = await daoMembri.getMembroById(1);
        expect(res.id).toBe(1);
    });

    it("getMembriSocieta handles error", async () => {
        sqlite.all.mockImplementation((sql, cb) => cb(new Error("Err")));
        await expect(daoMembri.getMembriSocieta()).rejects.toThrow("Err");
    });

    it("getMembroById returns null if not found", async () => {
        sqlite.get.mockImplementation((sql, params, cb) => cb(null, null));
        const res = await daoMembri.getMembroById(99);
        expect(res).toBeNull();
    });
});
