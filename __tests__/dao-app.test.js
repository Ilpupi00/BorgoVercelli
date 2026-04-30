const db = require("../src/core/config/database");
const daoRecensioni = require("../src/features/recensioni/services/dao-recensioni");

jest.mock("../src/core/config/database", () => ({
  query: jest.fn(),
  get: jest.fn(),
  all: jest.fn(),
  run: jest.fn()
}));

describe("DAO: App Complementary Entities", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("DAO Recensioni", () => {
        it("getRecensioni queries visibile = true and resolves", async () => {
             db.all.mockImplementation((sql, cb) => cb(null, [{ id: 1 }, { id: 2 }]));
             const rows = await daoRecensioni.getRecensioni();
             expect(rows).toHaveLength(2);
        });

        it("inserisciRecensione resolves new ID on success", async () => {
             // Mock postgres RETURNING id format
             db.run.mockImplementation((sql, params, cb) => cb(null, { rows: [{ id: 55 }] }));
             const res = await daoRecensioni.inserisciRecensione({
                  utente_id: 1, entita_tipo: "campo", entita_id: 2, valutazione: 5, titolo: "Bello"
             });
             expect(res.success).toBe(true);
             expect(res.id).toBe(55);
             expect(db.run.mock.calls[0][1]).toEqual(expect.arrayContaining([5, "Bello"]));
        });

        it("updateRecensione restricts update to the author", async () => {
             db.run.mockImplementation((sql, params, cb) => cb(null, { rowCount: 1 }));
             const res = await daoRecensioni.updateRecensione(10, 2, { valutazione: 1, titolo: "A", contenuto: "B" });
             
             expect(res.success).toBe(true);
             expect(res.changes).toBe(1);
        });

        it("deleteRecensione sets visibility to false instead of dropping row", async () => {
             db.run.mockImplementation((sql, params, cb) => cb(null, { rowCount: 1 }));
             await daoRecensioni.deleteRecensione(10, 2);
             expect(db.run.mock.calls[0][0]).toContain("visibile = false");
        });

        it("getValutaMediaRecensioni calculates exact average via SQL", async () => {
             db.get.mockImplementation((sql, cb) => cb(null, { media: 4.5 }));
             const m = await daoRecensioni.getValutaMediaRecensioni();
             expect(m).toBe(4.5);
        });
        
        it("deleteRecensioneAdmin drops the row from the database entirely", async () => {
             db.run.mockImplementation((sql, params, cb) => cb(null, { rowCount: 1 }));
             await daoRecensioni.deleteRecensioneAdmin(99);
             expect(db.run.mock.calls[0][0]).toContain("DELETE FROM RECENSIONI");
        });
    });
});

const daoNotizie = require("../src/features/notizie/services/dao-notizie");
const daoEventi = require("../src/features/eventi/services/dao-eventi");

describe("DAO: Eventi & Notizie", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("dao-eventi", () => {
        it("getEventi fetches elements and injects mapped boolean", async () => {
            db.all.mockImplementation((sql, cb) => cb(null, [{ id: 1, pubblicato: true }]));
            const eventi = await daoEventi.getEventi();
            expect(eventi).toHaveLength(1);
        });

        it("createEvento inserts standard and returns id", async () => {
            db.run.mockImplementation((sql, params, cb) => cb(null, { rows: [{ id: 88 }] }));
            const res = await daoEventi.createEvento({ titolo: "Torneo", pubblicato: true });
            expect(res.id).toBe(88);
        });

        it("updateEvento returns success on matched row update", async () => {
            db.run.mockImplementation((sql, params, cb) => cb(null, { rowCount: 1 }));
            const res = await daoEventi.updateEvento(10, { titolo: "Mod" });
            expect(res.success).toBe(true);
        });

        it("deleteEventoById successfully deletes record", async () => {
            db.run.mockImplementation(function (sql, params, cb) {
                 cb.call(this, null, { rowCount: 1 });
            });
            const res = await daoEventi.deleteEventoById(99);
            expect(res.success).toBe(true);
        });
        
        it("getEventoById parses child query for images", async () => {
            // First query gets evento
            db.get.mockImplementation((sql, params, cb) => cb(null, { id: 7 }));
            // nested query gets immagini
            db.all.mockImplementation((sql, params, cb) => cb(null, [{ url: "img.jpg" }]));
            
            const e = await daoEventi.getEventoById(7);
            expect(e.id).toBe(7);
            expect(e.immagini).toBeDefined();
        });
    });

    describe("dao-notizie", () => {
        it("getNotizie maps rows correctly", async () => {
            db.all.mockImplementation((sql, cb) => cb(null, [{ id: 5, titolo: "News", N_id: 5 }]));
            const Notizie = await daoNotizie.getNotizie();
            expect(Notizie).toHaveLength(1);
        });

        it("incrementVisualizzazioni cascades SQL operations", async () => {
            // Primary run
            db.run.mockImplementation((sql, params, cb) => cb(null, { rowCount: 1 }));
            // Follow-up nested selection get
            db.get.mockImplementation((sql, params, cb) => cb(null, { visualizzazioni: 100 }));
            
            const res = await daoNotizie.incrementVisualizzazioni(3);
            expect(res.success).toBe(true);
            expect(res.visualizzazioni).toBe(100);
        });
        
        it("createNotizia correctly assigns conditionally handled params via database", async () => {
             db.run.mockImplementation((sql, params, cb) => cb(null, { rows: [{id: 42}] }));
             const res = await daoNotizie.createNotizia({ titolo: "Titolo", pubblicata: false });
             expect(res.id).toBe(42);
        });
    });
});

