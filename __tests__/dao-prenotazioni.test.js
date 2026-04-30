const db = require("../src/core/config/database");
const daoPrenotazione = require("../src/features/prenotazioni/services/dao-prenotazione");

jest.mock("../src/core/config/database", () => ({
  query: jest.fn(),
  get: jest.fn(),
  all: jest.fn(),
  run: jest.fn()
}));

jest.mock("../src/features/prenotazioni/services/dao-campi", () => ({
    getOrariCampo: jest.fn().mockResolvedValue([
        { ora_inizio: "10:00", ora_fine: "12:00" },
        { ora_inizio: "14:00", ora_fine: "16:00" }
    ])
}));

describe("DAO: Prenotazioni (dao-prenotazione.js)", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("getCampiAttivi & getDisponibilitaCampo", () => {
        it("getCampiAttivi assembles records and attached images", async () => {
            // Mock campi
            db.all.mockImplementationOnce((sql, params, cb) => cb(null, [{ id: 1, nome: "Campo 1" }]));
            // Mock immagini relative al campo
            db.all.mockImplementationOnce((sql, params, cb) => cb(null, [{ id: 10, url: "/img.jpg" }]));

            const campi = await daoPrenotazione.getCampiAttivi();
            expect(campi[0].nome).toBe("Campo 1");
            expect(campi[0].immagini[0].url).toBe("/img.jpg");
        });

        it("getDisponibilitaCampo removes busy timeslots comparing overlap queries", async () => {
            // daoCampi already returns 10-12, 14-16 in mock above
            // db.all returning occupied reservation
            db.all.mockImplementation((sql, params, cb) => cb(null, [
                 { ora_inizio: "10:30", ora_fine: "11:30" } // Clashes with 10:00-12:00
            ]));

            // Tomorrow date to bypass "today 2h delta" block
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            const disponibili = await daoPrenotazione.getDisponibilitaCampo(1, tomorrow);
            
            // Should exclude the 10-12 slot because 10:30-11:30 is busy
            expect(disponibili).toHaveLength(1);
            expect(disponibili[0].inizio).toBe("14:00");
        });
    });

    describe("prenotaCampo", () => {
        it("detects exact duplicate via db.get block before inserting", async () => {
            // Mock db.get to return a valid row -> Means exact conflict exists
            db.get.mockImplementation((sql, params, cb) => cb(null, { id: 55 }));

            const result = await daoPrenotazione.prenotaCampo({ 
                campo_id: 1, data_prenotazione: "2026-05-05", ora_inizio: "10:00", ora_fine: "11:00" 
            });

            expect(result.error).toContain("duplicato esatto");
        });

        it("handles PG exclusive overlaps natively triggered", async () => {
            // Empty GET (no perfect dup) -> Proceed to RUN
            db.get.mockImplementation((sql, params, cb) => cb(null, null));
            // Simulate PostgreSQL Error 23P01 (Exclusion Constraint Overlap)
            const overlapErr = new Error("PG 23P01 Exclusion");
            overlapErr.code = "23P01";
            db.run.mockImplementation((sql, params, cb) => cb(overlapErr));

            const result = await daoPrenotazione.prenotaCampo({ 
                campo_id: 1, data_prenotazione: "2026-05-05", ora_inizio: "10:00", ora_fine: "11:00" 
            });

            expect(result.error).toContain("sovrappone"); // Controlled fallback message
        });

        it("successfully inserts the booking as 'in_attesa'", async () => {
            // Empty GET
            db.get.mockImplementation((sql, params, cb) => cb(null, null));
            // Postgres RUN success returning { rows: [{ id: 99 }] } internally passed via cb callback scope logic mapping
            db.run.mockImplementation((sql, params, cb) => cb(null, { rows: [{ id: 99 }] }));

            const res = await daoPrenotazione.prenotaCampo({ 
                campo_id: 1, data_prenotazione: "2026-05-05", ora_inizio: "10:00", ora_fine: "11:00" 
            });

            expect(res.success).toBe(true);
            expect(res.id).toBe(99);
            expect(db.run.mock.calls[0][0]).toContain("'in_attesa'");
        });
    });

    describe("updateStatoPrenotazione", () => {
        it("traces 'annullata_da' properly when switching to annullata", async () => {
            db.run.mockImplementation((sql, params, cb) => cb(null, { rowCount: 1 }));

            await daoPrenotazione.updateStatoPrenotazione(10, "annullata", "user");
            
            expect(db.run.mock.calls[0][0]).toContain("annullata_da = ?");
            expect(db.run.mock.calls[0][1]).toContain("user");
        });

        it("resets 'annullata_da' properly when switching back to confermata", async () => {
             db.run.mockImplementation((sql, params, cb) => cb(null, { rowCount: 1 }));

             await daoPrenotazione.updateStatoPrenotazione(10, "confermata");
             expect(db.run.mock.calls[0][0]).toContain("annullata_da = NULL");
        });
    });

    describe("Background jobs / cleanup (deleteScadute, autoAccept)", () => {
        it("autoAcceptPendingBookings marks elements older than 3 days as confermata", async () => {
            // Select older records
            db.all.mockImplementation((sql, params, cb) => cb(null, [{ id: 1 }, { id: 2 }]));
            // Update successful
            db.run.mockImplementation((sql, params, cb) => cb(null, { rowCount: 2 }));

            const result = await daoPrenotazione.autoAcceptPendingBookings();
            
            expect(result.accepted).toBe(2);
            expect(result.success).toBe(true);
            expect(db.run.mock.calls[0][0]).toContain(",?"); // Array destructuring binding logic `ID IN (?,?)`
        });

        it("deleteScadute deletes based on prior COUNT", async () => {
             db.get.mockImplementation((sql, params, cb) => cb(null, { cnt: 5 })); // before count, then after count
             db.run.mockImplementation((sql, cb) => cb(null, { rowCount: 5 })); // The callback index relies on arity, it's run(sql, cb) in this specific call
             
             // In source code: db.run(sql, function(err, result) {}) -> params omitted if 2 args.
             // We adjust mock to handle `db.run(sql, params, cb)` vs `db.run(sql, cb)`
             db.run.mockImplementation((...args) => {
                 const cb = args[args.length - 1]; // last argument is always callback
                 cb(null, { rowCount: 4 });
             });

             const res = await daoPrenotazione.deleteScadute();
             expect(res.success).toBe(true);
             expect(res.deleted).toBe(4);
        });
    });
});
