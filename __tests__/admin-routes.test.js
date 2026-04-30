const express = require("express");
const request = require("supertest");

// Mock database FIRST!
jest.mock("../src/core/config/database", () => ({
  query: jest.fn(),
  get: jest.fn(),
  all: jest.fn(),
  run: jest.fn()
}));

jest.mock("../src/shared/services/notifications", () => ({
  queueNotificationForUsers: jest.fn(),
  queueNotificationForAdmins: jest.fn(),
  queueNotificationToAll: jest.fn()
}));
jest.mock("../src/shared/services/email-service", () => ({
  sendEmail: jest.fn(),
  SendPrenotazioneConfermataEmail: jest.fn()
}));

const adminRouter = require("../src/features/admin/routes/admin");
const notizieDao = require("../src/features/notizie/services/dao-notizie");
const eventiDao = require("../src/features/eventi/services/dao-eventi");
const userDao = require("../src/features/users/services/dao-user");
const recensioniDao = require("../src/features/recensioni/services/dao-recensioni");
const squadreDao = require("../src/features/squadre/services/dao-squadre");

jest.mock("../src/core/middlewares/auth", () => ({
  isLoggedIn: (req, res, next) => {
    req.user = { id: 1, email: "admin@test.com", ruolo: "admin" };
    next();
  },
  isAdmin: (req, res, next) => next(),
  isAdminOrDirigente: (req, res, next) => next(),
  isStaffOrAdmin: (req, res, next) => next(),
  canManageCampi: (req, res, next) => next(),
  canEditNotizia: (req, res, next) => next(),
}));

jest.mock("../src/core/middlewares/validators", () => ({
  validateAdminCreateUser: (req, res, next) => next(),
  validateAdminUpdateUser: (req, res, next) => next(),
  validateSospendiUtente: (req, res, next) => next(),
  validateBannaUtente: (req, res, next) => next(),
  validateAddOrario: (req, res, next) => next(),
  validateCampoModifica: (req, res, next) => next(),
  validateCampionato: (req, res, next) => next(),
}));

jest.mock("../src/features/notizie/services/dao-notizie");
jest.mock("../src/features/eventi/services/dao-eventi");
jest.mock("../src/features/users/services/dao-user");
jest.mock("../src/features/users/services/dao-sospensioni");
jest.mock("../src/features/users/services/dao-preferenze");
jest.mock("../src/features/users/services/dao-dati-personali");
jest.mock("../src/features/recensioni/services/dao-recensioni");
jest.mock("../src/features/squadre/services/dao-squadre");
jest.mock("../src/features/galleria/services/dao-galleria", () => ({
   getImmagini: jest.fn().mockResolvedValue([])
}));
jest.mock("../src/features/admin/services/dao-admin");
jest.mock("../src/features/prenotazioni/services/dao-prenotazione", () => ({
   getAllPrenotazioni: jest.fn().mockResolvedValue([]),
   checkAndUpdateScadute: jest.fn().mockResolvedValue({}),
   deleteScaduteOlderThanDays: jest.fn().mockResolvedValue({deleted: 1})
}));

const app = express();
app.use(express.json());
// mock render method
app.use((req, res, next) => {
  res.render = jest.fn((view, opts) => res.json({ view, opts }));
  next();
});
app.use("/", adminRouter);

describe("Routes: Admin", () => {
   beforeEach(() => {
     jest.clearAllMocks();
   });

   it("GET /admin loads admin dashboard", async () => {
       const res = await request(app).get("/admin");
       expect(res.status).toBe(200);
       expect(res.body.view).toBe("admin.ejs");
   });

   it("GET /admin/notizie", async () => {
       notizieDao.getNotizie.mockResolvedValue([]);
       const res = await request(app).get("/admin/notizie");
       expect(res.status).toBe(200);
   });

   it("GET /admin/eventi", async () => {
       eventiDao.getEventiAll.mockResolvedValue([]);
       const res = await request(app).get("/admin/eventi");
       expect(res.status).toBe(200);
   });

   it("GET /admin/squadre", async () => {
       squadreDao.getSquadre.mockResolvedValue([]);
       const res = await request(app).get("/admin/squadre");
       expect(res.status).toBe(200);
   });

   it("GET /admin/galleria", async () => {
       const res = await request(app).get("/admin/galleria");
       expect(res.status).toBe(200);
   });

   it("GET /admin/utenti", async () => {
       userDao.getAllUsers.mockResolvedValue([{ id: 1, stato: "attivo" }]);
       userDao.getTipiUtente.mockResolvedValue([]);
       const res = await request(app).get("/admin/utenti");
       expect(res.status).toBe(200);
   });

   it("GET /admin/recensioni", async () => {
       recensioniDao.getAllRecensioni.mockResolvedValue([]);
       const res = await request(app).get("/admin/recensioni");
       expect(res.status).toBe(200);
       expect(res.body.view).toBe("Contenuti/Gestione_Recensioni.ejs");
   });
   
   it("DELETE /admin/prenotazioni/elimina-scadute", async () => {
       const res = await request(app).delete("/admin/prenotazioni/elimina-scadute");
       expect(res.status).toBe(200);
       expect(res.body.success).toBe(true);
   });
});
