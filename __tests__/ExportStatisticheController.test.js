const ExportStatisticheController = require("../src/features/admin/controllers/ExportStatisticheController");
const ExcelJS = require("exceljs");

// Mock database BEFORE requiring DAOs so their internal requires don't throw
jest.mock("../src/core/config/database", () => ({
  query: jest.fn(),
  get: jest.fn(),
  all: jest.fn(),
  run: jest.fn()
}));

const userDao = require("../src/features/users/services/dao-user");
const adminDao = require("../src/features/admin/services/dao-admin");
const prenotazioneDao = require("../src/features/prenotazioni/services/dao-prenotazione");
const daoPreferenze = require("../src/features/users/services/dao-preferenze");
const daoDatiPersonali = require("../src/features/users/services/dao-dati-personali");

jest.mock("../src/features/users/services/dao-user");
jest.mock("../src/features/admin/services/dao-admin");
jest.mock("../src/features/prenotazioni/services/dao-prenotazione");
jest.mock("../src/features/users/services/dao-preferenze");
jest.mock("../src/features/users/services/dao-dati-personali");

describe("Controller: ExportStatisticheController (Heavy File)", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("esportaExcel generates a buffer and pushes it to response", async () => {
        const mockStats = {
           utentiTotali: 100,
           utentiAttivi30gg: 50,
           nuoviUtenti30gg: 10,
           utentiBannati: 2,
           utentiSospesi: 1,
           prenotazioniTotali: 500,
           prenotazioniAttive: 20,
           prenotazioniConfermate: 400,
           prenotazioniAnnullate: 80,
           prenotazioniOggi: 5,
           mediaPrenotazioniGiornaliere: 10,
           tassoConferma: 80,
           tassoAnnullamento: 16,
           campoPopolare: { nome: "A", count: 200 },
           notiziePubblicate: 30,
           notizie7gg: 2,
           eventiAttivi: 5,
           eventiTotaliStorico: 50,
           eventiProssimi7gg: 1,
           fotoGalleria: 100,
           campiTotali: 4,
           campiAttivi: 4,
           squadreTotali: 10,
           recensioniTotali: 50,
           mediaRecensioni: 4.5,
           prenotazioniConNote: 20,
           distribuzioneUtenti: [{ruolo: "Giocatore", count: 10}],
           tendenzeMensili: [{mese: "Gen", count: 10}],
           attivitaRecenti: [{entita: "Utente", id: 1}]
        };

        userDao.getStatistiche.mockResolvedValue(mockStats);
        adminDao.countNotiziePubblicate.mockResolvedValue(10);
        adminDao.countEventiPubblicati.mockResolvedValue(5);
        
        userDao.getAllUsersWithDetails = jest.fn().mockResolvedValue([
             { id: 1, nome: "A", cognome: "B", email: "a@b.com", tipo_utente_nome: "Admin" }
        ]);
        
        userDao.getAllUsers = jest.fn().mockResolvedValue([{ id: 1 }]);
        userDao.getUserById = jest.fn().mockResolvedValue({ id: 1, nome: "Test" });

        daoPreferenze.getByUtenteId.mockResolvedValue({ruolo_preferito: "a"});
        daoDatiPersonali.getByUtenteId.mockResolvedValue({data_nascita: "1990-01-01"});
        prenotazioneDao.getPrenotazioniByUserId.mockResolvedValue([{}, {}]);
        
        const req = {};
        const res = {
            setHeader: jest.fn(),
            end: jest.fn(),
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        // We also need to mock `write` on response object 
        // to pretend it's a stream, or mock ExcelJS entirely.
        // Actually since we pass `res`, ExcelJS checks if it has `write` or `writeHead` maybe, but it's streamish.
        // ExcelJS writes using internal streaming. Let's just mock `workbook.xlsx.write` 
        // or provide minimal methods on res: `write`, `once`, `on`, `emit`.
        Object.assign(res, {
            write: jest.fn(),
            on: jest.fn(),
            emit: jest.fn(),
            once: jest.fn(),
            removeListener: jest.fn()
        });

        await ExportStatisticheController.esportaExcel(req, res);

        expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        expect(res.setHeader).toHaveBeenCalledWith(expect.anything(), expect.stringContaining("Statistiche"));
    });

    it("esportaExcel handles errors gracefully", async () => {
         userDao.getStatistiche.mockRejectedValue(new Error("Fake Error"));
         const req = {};
         const res = {
             status: jest.fn().mockReturnThis(),
             json: jest.fn()
         };
         
         await ExportStatisticheController.esportaExcel(req, res);
         expect(res.status).toHaveBeenCalledWith(500);
         expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });
});
