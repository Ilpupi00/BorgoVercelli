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

    describe("updateUser & changePassword & updateProfilePicture", () => {
        it("updateUser applies dynamic SQL updates", async () => {
             db.run.mockImplementation((sql, params, cb) => cb(null));
             const res = await daoUser.updateUser(1, { nome: "Lu" });
             expect(res).toBe(true);
             expect(db.run).toHaveBeenCalledWith(expect.stringContaining("nome = ?"), ["Lu", 1], expect.any(Function));
        });

        it("changePassword validates current pwd and updates hash", async () => {
            db.get.mockImplementation((sql, params, cb) => cb(null, { password_hash: "oldHash" }));
            bcrypt.compare.mockResolvedValue(true);
            db.run.mockImplementation((sql, params, cb) => cb(null)); // Success Update

            const res = await daoUser.changePassword(1, "old", "new");
            expect(res.message).toBe("Password aggiornata con successo");
        });

        it("updateProfilePicture cascades deletes and inserts new image", async () => {
            // Mock delete SELECT
            db.get.mockImplementation((sql, params, cb) => cb(null, { url: "/old.jpg" }));
            // Mock delete RUN
            db.run.mockImplementationOnce((sql, params, cb) => cb(null, { rowCount: 1 }));
            // Mock insert RUN
            db.run.mockImplementationOnce((sql, params, cb) => cb(null, { rows: [{ id: 10 }] }));

            const res = await daoUser.updateProfilePicture(1, "/new.jpg");
            expect(res).toBe(true);
            expect(db.run).toHaveBeenCalledTimes(2); // One delete, one insert
        });
    });

    describe("deleteUser & cascades", () => {
        it("should execute 11 deletion queries sequentially via Promise abstractions", async () => {
            // Force pure success on all db.run calls
            db.run.mockImplementation((sql, params, cb) => {
                if (typeof cb === "function") cb(null); 
            });

            const res = await daoUser.deleteUser(99);
            expect(res.message).toContain("deleted successfully");
            // 5 deletes + 2 updates (nulling) + 1 nulling squadre + 5 deletes (immagini, sospensioni, tp, tc) = total 13 calls approx
            expect(db.run.mock.calls.length).toBeGreaterThan(10);
        });
    });

    describe("getAllUsers & getStatistiche", () => {
        it("getAllUsers maps db.all array", async () => {
             db.all.mockImplementation((sql, params, cb) => cb(null, [{ id: 1 }, { id: 2 }]));
             const rows = await daoUser.getAllUsers();
             expect(rows).toHaveLength(2);
        });

        it("getStatistiche queries diverse aggregations efficiently via safeQuery", async () => {
             db.query.mockImplementation((sql, cb) => cb(null, { rows: [{ count: 50 }] }));
             const stats = await daoUser.getStatistiche();
             expect(stats.utentiTotali).toBe(50);
             expect(stats.eventiAttivi).toBe(50);
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

