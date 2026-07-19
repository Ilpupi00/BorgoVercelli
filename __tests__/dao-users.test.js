const db = require("../src/core/config/database");
const daoUser = require("../src/features/users/services/dao-user");
const bcrypt = require("bcrypt");

jest.mock("../src/core/config/database", () => ({
  query: jest.fn(),
  get: jest.fn(),
  all: jest.fn(),
  run: jest.fn()
}));

jest.mock("bcrypt", () => ({
  hash: jest.fn().mockResolvedValue("hashedPwd"),
  compare: jest.fn()
}));

describe("DAO: Users (dao-user.js)", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("searchUsers", () => {
        it("should return users matching query (onlyDirigenti=false)", async () => {
            db.all.mockImplementation((sql, params, cb) => cb(null, [{ id: 1, nome: "Mario", cognome: "Rossi" }]));
            const res = await daoUser.searchUsers("mar", false);
            expect(res).toHaveLength(1);
        });

        it("should return users matching query (onlyDirigenti=true)", async () => {
            db.all.mockImplementation((sql, params, cb) => cb(null, [{ id: 1, nome: "Mario", cognome: "Rossi" }]));
            const res = await daoUser.searchUsers("mar", true);
            expect(res).toHaveLength(1);
        });

        it("should handle error (onlyDirigenti=false)", async () => {
            db.all.mockImplementation((sql, params, cb) => cb(new Error("err")));
            await expect(daoUser.searchUsers("mar", false)).rejects.toEqual({ error: "Error searching users: err" });
        });

        it("should handle error (onlyDirigenti=true)", async () => {
            db.all.mockImplementation((sql, params, cb) => cb(new Error("err")));
            await expect(daoUser.searchUsers("mar", true)).rejects.toEqual({ error: "Error searching users: err" });
        });
    });

    describe("deleteUser errors", () => {
        const deleteSteps = [
            "RECENSIONI", "PRENOTAZIONI", "PARTECIPAZIONI_EVENTI", "GIOCATORI",
            "DIRIGENTI_SQUADRE", "NOTIZIE", "EVENTI", "SQUADRE", "IMMAGINI",
            "UTENTI_SOSPENSIONI", "UTENTI_RESET_TOKEN", "UTENTI_PREFERENZE",
            "UTENTI_DATI_PERSONALI", "UTENTI WHERE id"
        ];
        
        deleteSteps.forEach(step => {
            it(`should reject when deleting ${step} fails`, async () => {
                db.run.mockImplementation((sql, params, cb) => {
                    const callback = typeof params === 'function' ? params : cb;
                    if (sql.includes(step)) {
                        callback(new Error(`err ${step}`));
                    } else {
                        callback(null);
                    }
                });
                await expect(daoUser.deleteUser(1)).rejects.toEqual({ error: `Error deleting user: err ${step}` });
            });
        });
    });
    
    describe("getStatistiche", () => {
        it("should calculate correct stats on success", async () => {
             db.query.mockImplementation((sql, cb) => {
                 cb(null, { rows: [{ count: 10 }] });
             });
             const stats = await daoUser.getStatistiche();
             expect(Number(stats.utentiTotali)).toBe(10);
        });

        it("should handle error in specific query and fallback to 0", async () => {
             db.query.mockImplementation((sql, cb) => {
                 if(sql.includes("nuovi_utenti")) {
                     cb(new Error("query err"));
                 } else {
                     cb(null, { rows: [{ count: 5 }] });
                 }
             });
             const stats = await daoUser.getStatistiche();
             expect(Number(stats.utentiTotali)).toBe(5);
        });

        it("should handle fatal error", async () => {
             db.query.mockImplementation(() => { throw new Error("fatal"); });
             const stats = await daoUser.getStatistiche();
             expect(stats.utentiTotali).toBe(0);
        });
    });

    describe("createUser", () => {
        it("should successfully insert a user and hash password", async () => {
            db.run.mockImplementation((sql, params, cb) => cb(null)); // Success

            const res = await daoUser.createUser({
                email: "test@domain.com",
                password: "123",
                nome: "A",
                cognome: "B"
            });
            expect(res.message).toContain("successfully");
            expect(bcrypt.hash).toHaveBeenCalledWith("123", 10);
        });

        it("should reject on duplicate email constraint", async () => {
            db.run.mockImplementation((sql, params, cb) => cb(new Error("UNIQUE constraint failed: UTENTI.email")));
            await expect(daoUser.createUser({ email: "A", password: "1" }))
                .rejects.toEqual({ error: "Email già registrata" });
        });
    });

    describe("getUserById & getUserByEmail & getUser", () => {
        const fakeUserRow = { id: 1, email: "ok@ok", tipo_utente_nome: "admin" };

        it("getUserById resolves User model", async () => {
            db.get.mockImplementation((sql, params, cb) => cb(null, fakeUserRow));
            const user = await daoUser.getUserById(1);
            expect(user.id).toBe(1);
        });

        it("getUserByEmail returns null if not found", async () => {
            db.get.mockImplementation((sql, params, cb) => cb(null, null));
            const user = await daoUser.getUserByEmail("nessuno");
            expect(user).toBeNull();
        });

        it("getUser verifies password hash successfully", async () => {
            db.get.mockImplementation((sql, params, cb) => cb(null, { ...fakeUserRow, password_hash: "hash" }));
            bcrypt.compare.mockResolvedValue(true);

            const user = await daoUser.getUser("ok@ok", "123");
            expect(user.id).toBe(1);
            expect(bcrypt.compare).toHaveBeenCalledWith("123", "hash");
        });

        it("getUser rejects on wrong password", async () => {
            db.get.mockImplementation((sql, params, cb) => cb(null, { ...fakeUserRow, password_hash: "hash" }));
            bcrypt.compare.mockResolvedValue(false);

            await expect(daoUser.getUser("ok@ok", "xxx")).rejects.toEqual({ error: "Invalid password" });
        });
    });

    describe("getImmagineProfiloByUserId", () => {
        it("returns URL from IMMAGINI if exists", async () => {
            db.query.mockResolvedValueOnce({ rows: [{ url: "http://example.com/img.jpg" }] });
            const url = await daoUser.getImmagineProfiloByUserId(1);
            expect(url).toBe("/api/proxy-image?url=http%3A%2F%2Fexample.com%2Fimg.jpg");
        });

        it("returns fallback foto_oauth if IMMAGINI is empty", async () => {
            db.query.mockResolvedValueOnce({ rows: [] }); // IMMAGINI
            db.query.mockResolvedValueOnce({ rows: [{ foto_oauth: "http://example.com/oauth.jpg" }] }); // UTENTI
            const url = await daoUser.getImmagineProfiloByUserId(1);
            expect(url).toBe("/api/proxy-image?url=http%3A%2F%2Fexample.com%2Foauth.jpg");
        });

        it("returns local url without proxying", async () => {
            db.query.mockResolvedValueOnce({ rows: [{ url: "/local.jpg" }] });
            const url = await daoUser.getImmagineProfiloByUserId(1);
            expect(url).toBe("/local.jpg");
        });

        it("returns null if neither exists", async () => {
            db.query.mockResolvedValueOnce({ rows: [] });
            db.query.mockResolvedValueOnce({ rows: [] });
            const url = await daoUser.getImmagineProfiloByUserId(1);
            expect(url).toBeNull();
        });

        it("returns null on db error", async () => {
            db.query.mockRejectedValueOnce(new Error("DB Error"));
            const url = await daoUser.getImmagineProfiloByUserId(1);
            expect(url).toBeNull();
        });
    });

    describe("updateUser", () => {
        it("updateUser applies dynamic SQL updates for all fields", async () => {
             db.run.mockImplementation((sql, params, cb) => cb(null));
             const res = await daoUser.updateUser(1, { nome: "Lu", cognome: "B", email: "a@a", telefono: "1", tipo_utente_id: 1 });
             expect(res).toBe(true);
             expect(db.run).toHaveBeenCalledWith(expect.stringContaining("nome = ?"), ["Lu", "B", "a@a", "1", 1, 1], expect.any(Function));
        });

        it("returns false if no fields", async () => {
             const res = await daoUser.updateUser(1, {});
             expect(res).toBe(false);
        });

        it("rejects on db error", async () => {
             db.run.mockImplementation((sql, params, cb) => cb(new Error("DB Err")));
             await expect(daoUser.updateUser(1, { nome: "Lu" })).rejects.toEqual({ error: "Errore aggiornamento: DB Err" });
        });
    });

    describe("updateProfilePicture", () => {
        it("returns false if missing params", async () => {
             expect(await daoUser.updateProfilePicture(null, null)).toBe(false);
        });

        it("rejects if delete fails", async () => {
            db.get.mockImplementation((sql, params, cb) => cb(null, { url: "/old.jpg" }));
            db.run.mockImplementationOnce((sql, params, cb) => cb(new Error("Del error")));
            await expect(daoUser.updateProfilePicture(1, "/new.jpg")).rejects.toEqual({ error: expect.stringContaining("Errore eliminazione") });
        });

        it("rejects if insert fails", async () => {
            db.get.mockImplementation((sql, params, cb) => cb(null, { url: "/old.jpg" }));
            db.run.mockImplementationOnce((sql, params, cb) => cb(null, { rowCount: 1 }));
            db.run.mockImplementationOnce((sql, params, cb) => cb(new Error("Ins error")));
            await expect(daoUser.updateProfilePicture(1, "/new.jpg")).rejects.toEqual({ error: expect.stringContaining("Errore inserimento") });
        });
    });

    describe("getGiocatoreByUserId", () => {
        it("resolves giocatore", async () => {
             db.get.mockImplementation((sql, params, cb) => cb(null, { id: 1 }));
             const res = await daoUser.getGiocatoreByUserId(1);
             expect(res.id).toBe(1);
        });
        it("resolves null if not found", async () => {
             db.get.mockImplementation((sql, params, cb) => cb(null, null));
             const res = await daoUser.getGiocatoreByUserId(1);
             expect(res).toBeNull();
        });
        it("rejects on db error", async () => {
             db.get.mockImplementation((sql, params, cb) => cb(new Error("err")));
             await expect(daoUser.getGiocatoreByUserId(1)).rejects.toEqual({ error: expect.stringContaining("err") });
        });
    });

    describe("getTipiUtente", () => {
        it("resolves array", async () => {
             db.all.mockImplementation((sql, params, cb) => cb(null, [{ id: 1 }]));
             const res = await daoUser.getTipiUtente();
             expect(res).toHaveLength(1);
        });
        it("rejects on db error", async () => {
             db.all.mockImplementation((sql, params, cb) => cb(new Error("err")));
             await expect(daoUser.getTipiUtente()).rejects.toEqual({ error: expect.stringContaining("err") });
        });
    });

    describe("getUserStats & getUserRecentActivity", () => {
        it("resolves stats", async () => {
             db.get.mockImplementation((sql, params, cb) => cb(null, { prenotazioni_totali: 5 }));
             const res = await daoUser.getUserStats(1);
             expect(res.prenotazioni_totali).toBe(5);
        });
        it("rejects stats on error", async () => {
             db.get.mockImplementation((sql, params, cb) => cb(new Error("err")));
             await expect(daoUser.getUserStats(1)).rejects.toEqual({ error: expect.stringContaining("err") });
        });
        it("resolves default stats if null", async () => {
             db.get.mockImplementation((sql, params, cb) => cb(null, null));
             const res = await daoUser.getUserStats(1);
             expect(res.prenotazioni_totali).toBe(0);
        });

        it("resolves recent activity", async () => {
             db.all.mockImplementation((sql, params, cb) => cb(null, [{ id: 1 }]));
             const res = await daoUser.getUserRecentActivity(1);
             expect(res.prenotazioni).toHaveLength(1);
             expect(res.recensioni).toHaveLength(1);
        });
        it("rejects recent activity on error", async () => {
             db.all.mockImplementation((sql, params, cb) => cb(new Error("err")));
             await expect(daoUser.getUserRecentActivity(1)).rejects.toThrow();
        });
    });

    describe("Error branches", () => {
        it("createUser db error", async () => {
            db.run.mockImplementation((sql, params, cb) => cb(new Error("Other db error")));
            await expect(daoUser.createUser({ email: "A", password: "1" })).rejects.toEqual({ error: "Error creating user: Other db error" });
        });
        it("createUser bcrypt error", async () => {
            bcrypt.hash.mockRejectedValueOnce(new Error("hash error"));
            await expect(daoUser.createUser({ email: "A", password: "1" })).rejects.toEqual({ error: "Error hashing password: hash error" });
        });
        it("getUserById db error", async () => {
            db.get.mockImplementation((sql, params, cb) => cb(new Error("err")));
            await expect(daoUser.getUserById(1)).rejects.toEqual({ error: "Error retrieving user: err" });
        });
        it("getUserById not found", async () => {
            db.get.mockImplementation((sql, params, cb) => cb(null, null));
            await expect(daoUser.getUserById(1)).rejects.toEqual({ error: "User not found" });
        });
        it("getUser db error", async () => {
            db.get.mockImplementation((sql, params, cb) => cb(new Error("err")));
            await expect(daoUser.getUser("a@a", "1")).rejects.toEqual({ error: "Error retrieving user: err" });
        });
        it("getUser not found", async () => {
            db.get.mockImplementation((sql, params, cb) => cb(null, null));
            await expect(daoUser.getUser("a@a", "1")).rejects.toEqual({ error: "User not found" });
        });
        it("getUser bcrypt error", async () => {
            db.get.mockImplementation((sql, params, cb) => cb(null, { password_hash: "hash" }));
            bcrypt.compare.mockRejectedValueOnce(new Error("cmp err"));
            await expect(daoUser.getUser("a@a", "1")).rejects.toEqual({ error: "Error comparing passwords: cmp err" });
        });
        it("getUserByEmail db error", async () => {
            db.get.mockImplementation((sql, params, cb) => cb(new Error("err")));
            await expect(daoUser.getUserByEmail("a@a")).rejects.toEqual({ error: "Error retrieving user: err" });
        });
        it("changePassword db get error", async () => {
            db.get.mockImplementation((sql, params, cb) => cb(new Error("err")));
            await expect(daoUser.changePassword(1, "old", "new")).rejects.toEqual({ error: "Error retrieving user: err" });
        });
        it("changePassword user not found", async () => {
            db.get.mockImplementation((sql, params, cb) => cb(null, null));
            await expect(daoUser.changePassword(1, "old", "new")).rejects.toEqual({ error: "User not found" });
        });
        it("changePassword wrong current password", async () => {
            db.get.mockImplementation((sql, params, cb) => cb(null, { password_hash: "hash" }));
            bcrypt.compare.mockResolvedValueOnce(false);
            await expect(daoUser.changePassword(1, "old", "new")).rejects.toEqual({ error: "Password attuale non corretta" });
        });
        it("changePassword db update error", async () => {
            db.get.mockImplementation((sql, params, cb) => cb(null, { password_hash: "hash" }));
            bcrypt.compare.mockResolvedValueOnce(true);
            db.run.mockImplementation((sql, params, cb) => cb(new Error("err")));
            await expect(daoUser.changePassword(1, "old", "new")).rejects.toEqual({ error: "Error updating password: err" });
        });
        it("getAllUsers db error", async () => {
            db.all.mockImplementation((sql, params, cb) => cb(new Error("err")));
            await expect(daoUser.getAllUsers()).rejects.toEqual({ error: "Error retrieving users: err" });
        });
    });

    describe("deleteUser & getStatistiche errors", () => {
        it("deleteUser handles errors from run", async () => {
            db.run.mockImplementation((sql, params, cb) => cb(new Error("del err")));
            await expect(daoUser.deleteUser(1)).rejects.toEqual({ error: "Error deleting user: del err" });
        });
        it("getStatistiche fallback", async () => {
            db.query.mockImplementation((sql, cb) => cb(new Error("err")));
            const stats = await daoUser.getStatistiche();
            expect(stats.utentiTotali).toBe(0);
        });
    });
});

const daoDatiPersonali = require("../src/features/users/services/dao-dati-personali");
const daoPreferenze = require("../src/features/users/services/dao-preferenze");
const daoSospensioni = require("../src/features/users/services/dao-sospensioni");

describe("DAO: Info Aggiuntive Utente", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("dao-dati-personali", () => {
        it("upsert sets personal data successfully", async () => {
             db.run.mockImplementation((sql, params, cb) => cb(null));
             const res = await daoDatiPersonali.upsert(1, { data_nascita: "1990-01-01", codice_fiscale: "ABC" });
             expect(res).toBe(true);
        });

        it("getByUtenteId retrieves safely", async () => {
             db.get.mockImplementation((sql, params, cb) => cb(null, { codice_fiscale: "XYZ" }));
             const data = await daoDatiPersonali.getByUtenteId(1);
             expect(data.codice_fiscale).toBe("XYZ");
        });
        
        it("deleteByUtenteId handles simple removal", async () => {
             db.run.mockImplementation((sql, params, cb) => cb(null));
             const res = await daoDatiPersonali.deleteByUtenteId(9);
             expect(res).toBe(true);
        });
    });

    describe("dao-preferenze", () => {
        it("upsert updates preferences cleanly", async () => {
             db.run.mockImplementation((sql, params, cb) => cb(null));
             const res = await daoPreferenze.upsert(2, { ruolo_preferito: "Attaccante", piede_preferito: "Destro" });
             expect(res).toBe(true);
        });
    });

    describe("dao-sospensioni", () => {
        it("sospendiUtente sequences two query calls cleanly", async () => {
            // First call matches update
             db.run.mockImplementationOnce((sql, params, cb) => cb(null, { rowCount: 1 }));
            // Second call matches insert/upsert
             db.run.mockImplementationOnce((sql, params, cb) => cb(null, { rowCount: 1 }));

             const res = await daoSospensioni.sospendiUtente(5, 1, "Spam", "2026-10-10");
             expect(res.message).toBe("Utente sospeso con successo");
             expect(db.run).toHaveBeenCalledTimes(2);
        });

        it("bannaUtente sets data_fine correctly to NULL", async () => {
             db.run.mockImplementation((sql, params, cb) => cb(null, { rowCount: 1 }));
             const res = await daoSospensioni.bannaUtente(10, 1, "Hack");
             expect(res.message).toBe("Utente bannato con successo");
        });

        it("verificaSospensioniScadute handles bulk unbans automatically", async () => {
             db.all.mockImplementation((sql, params, cb) => cb(null, [{ utente_id: 8 }]));
             db.run.mockImplementation((sql, params, cb) => cb(null, { rowCount: 1 }));
             
             const res = await daoSospensioni.verificaSospensioniScadute();
             expect(res.aggiornati).toBe(1);
        });
    });
});

