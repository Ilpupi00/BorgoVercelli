"use strict";

const db = require("../src/core/config/database");
const daoDirigenti = require("../src/features/squadre/services/dao-dirigenti-squadre");

jest.mock("../src/core/config/database", () => ({
  all: jest.fn(),
  get: jest.fn(),
  run: jest.fn(),
  query: jest.fn()
}));

describe("DAO: Dirigenti Squadre", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("getDirigentiBySquadra & getDirigentiBySquadraAll", () => {
        it("getDirigentiBySquadra should return active dirigenti for a team", async () => {
            db.all.mockImplementation((sql, params, cb) => {
                const callback = typeof params === 'function' ? params : cb;
                callback(null, [{ id: 1, utente_id: 2, ruolo: "Dirigente", attivo: true }]);
            });
            const result = await daoDirigenti.getDirigentiBySquadra(1);
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe(1);
        });

        it("getDirigentiBySquadraAll should return all dirigenti for a team", async () => {
            db.all.mockImplementation((sql, params, cb) => cb(null, [{ id: 1, utente_id: 2, attivo: false }]));
            const result = await daoDirigenti.getDirigentiBySquadraAll(1);
            expect(result).toHaveLength(1);
        });

        it("should handle error", async () => {
            db.all.mockImplementation((sql, params, cb) => {
                const callback = typeof params === 'function' ? params : cb;
                callback(new Error("Query err"));
            });
            await expect(daoDirigenti.getDirigentiBySquadra(1)).rejects.toEqual({ error: "Error retrieving dirigenti: Query err" });
        });
    });

    describe("getDirigentiSocietari", () => {
        it("should return corporate managers", async () => {
            db.all.mockImplementation((sql, params, cb) => cb(null, [{ id: 1, squadra_id: null }]));
            const result = await daoDirigenti.getDirigentiSocietari();
            expect(result).toHaveLength(1);
        });
    });

    describe("addDirigente", () => {
        it("should reactivate inactive dirigente", async () => {
            db.get.mockImplementation((sql, params, cb) => cb(null, { id: 10, attivo: false }));
            db.run.mockImplementation(function(sql, params, cb) {
                cb(null, { rowCount: 1 });
            });

            const res = await daoDirigenti.addDirigente({ utente_id: 5, squadra_id: 1, ruolo: "M" });
            expect(res.message).toContain("riattivato");
        });

        it("should create new dirigente if not exists", async () => {
            db.get.mockImplementation((sql, params, cb) => cb(null, null));
            db.run.mockImplementation(function(sql, params, cb) {
                cb(null, { rows: [{ id: 15 }] });
            });

            const res = await daoDirigenti.addDirigente({ utente_id: 5, squadra_id: 1 });
            expect(res.id).toBe(15);
        });

        it("should reject if already active", async () => {
            db.get.mockImplementation((sql, params, cb) => cb(null, { id: 10, attivo: true }));
            await expect(daoDirigenti.addDirigente({ utente_id: 5, squadra_id: 1 })).rejects.toEqual({ error: expect.stringContaining("già dirigente attivo") });
        });

        it("should reject invalid utente_id", async () => {
            await expect(daoDirigenti.addDirigente({ utente_id: null })).rejects.toEqual({ error: "utente_id non valido" });
        });
    });

    describe("remove/restore/update", () => {
        it("removeDirigente sets attivo=false", async () => {
            db.run.mockImplementation((sql, params, cb) => cb(null, { rowCount: 1 }));
            const res = await daoDirigenti.removeDirigente(1);
            expect(res.message).toContain("removed");
        });

        it("restoreDirigente sets attivo=true", async () => {
            db.run.mockImplementation((sql, params, cb) => cb(null, { rowCount: 1 }));
            const res = await daoDirigenti.restoreDirigente(1);
            expect(res.message).toContain("ripristinato");
        });

        it("restoreAllDirigenti updates all inactive", async () => {
            db.run.mockImplementation((sql, params, cb) => cb(null, { rowCount: 5 }));
            const res = await daoDirigenti.restoreAllDirigenti();
            expect(res.changes).toBe(5);
        });

        it("updateDirigente applies changes", async () => {
            db.run.mockImplementation((sql, params, cb) => cb(null, { rowCount: 1 }));
            const res = await daoDirigenti.updateDirigente(1, { ruolo: "Presidente" });
            expect(res.message).toBe("Dirigente aggiornato");
        });
    });

    describe("getDirigenteByUserId", () => {
        it("should return list for a user", async () => {
            db.all.mockImplementation((sql, params, cb) => cb(null, [{ id: 1 }]));
            const res = await daoDirigenti.getDirigenteByUserId(1);
            expect(res).toHaveLength(1);
        });
    });
});
