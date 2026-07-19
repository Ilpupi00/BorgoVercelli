const request = require("supertest");
const express = require("express");
const indexRouter = require("../src/shared/routes/index");

jest.mock("../src/features/notizie/services/dao-notizie", () => ({ getNotiziePaginated: jest.fn() }));
jest.mock("../src/features/eventi/services/dao-eventi", () => ({ getEventiPubblicati: jest.fn() }));
jest.mock("../src/features/recensioni/services/dao-recensioni", () => ({ getRecensioni: jest.fn() }));
jest.mock("../src/features/squadre/services/dao-membri-societa", () => ({ getMembriSocieta: jest.fn() }));
jest.mock("../src/features/squadre/services/dao-squadre", () => ({ getSquadre: jest.fn() }));
jest.mock("../src/features/prenotazioni/services/dao-campi", () => ({ getCampoById: jest.fn() }));
jest.mock("../src/features/prenotazioni/services/dao-prenotazione", () => ({ getCampiAttivi: jest.fn().mockResolvedValue([]), getDisponibilitaCampo: jest.fn().mockResolvedValue([]) }));
jest.mock("../src/features/campionati/services/dao-campionati", () => ({ getCampionati: jest.fn(), getClassificaByCampionatoId: jest.fn() }));
jest.mock("../src/shared/services/email-service", () => ({ verifyTransporter: jest.fn(), sendTestViaResend: jest.fn(), sendEmail: jest.fn() }));
jest.mock("../src/core/config/database", () => ({ all: jest.fn((sql, params, cb) => cb(null, [])) }));
jest.mock("../src/core/middlewares/auth", () => ({
  isLoggedIn: (req, res, next) => next(),
  isDirigente: (req, res, next) => next(),
  isAdminOrDirigente: (req, res, next) => next(),
  isStaffOrAdmin: (req, res, next) => next(),
  canManageCampi: (req, res, next) => next(),
  isAdmin: (req, res, next) => next(),
}));
jest.mock("../src/shared/utils/file-helper", () => ({ imageFileExists: jest.fn().mockReturnValue(true) }));

describe("Index Router", () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.set("view engine", "ejs");
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    
    app.use((req, res, next) => {
      res.render = jest.fn((view, options) => {
        res.json({ view });
      });
      req.isAuthenticated = jest.fn().mockReturnValue(true);
      req.user = { id: 1, isAdmin: true };
      next();
    });

    app.use("/", indexRouter);
  });

  it("GET /homepage should render homepage", async () => {
    const response = await request(app).get("/homepage");
    expect(response.status).toBe(200);
    expect(response.body.view).toBe("homepage");
  });

  it("GET /campionato should render campionato", async () => {
    const response = await request(app).get("/campionato");
    expect(response.status).toBe(200);
    expect(response.body.view).toBe("campionato");
  });

  it("GET /squadre should render squadre", async () => {
    const response = await request(app).get("/squadre");
    expect(response.status).toBe(200);
    expect(response.body.view).toBe("squadre");
  });

  it("GET /contatti should render contatti", async () => {
    const response = await request(app).get("/contatti");
    expect(response.status).toBe(200);
    expect(response.body.view).toBe("contatti");
  });

  it("POST /contatti should send email", async () => {
    require("../src/shared/services/email-service").sendEmail.mockResolvedValue({});
    const response = await request(app).post("/contatti").send({ name: "test", email: "test@test.com", message: "msg", subject: "sub" });
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  it("GET /admin/verify-smtp should verify smtp", async () => {
    process.env.ADMIN_VERIFY_TOKEN = "token123";
    require("../src/shared/services/email-service").verifyTransporter.mockResolvedValue(true);
    const response = await request(app).get("/admin/verify-smtp?token=token123");
    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
  });

  it("GET /societa should render societa", async () => {
    require("../src/features/squadre/services/dao-membri-societa").getMembriSocieta.mockResolvedValue([]);
    const response = await request(app).get("/societa");
    expect(response.status).toBe(200);
  });

  it("GET /prenotazione should render prenotazione", async () => {
    const response = await request(app).get("/prenotazione");
    expect(response.status).toBe(200);
  });

  it("GET /login should render Login", async () => {
    const response = await request(app).get("/login");
    expect(response.status).toBe(200);
  });

  it("GET /registrazione should render Registrazione", async () => {
    const response = await request(app).get("/registrazione");
    expect(response.status).toBe(200);
  });

  it("GET /scrivi/recensione should render scrivi_recensione", async () => {
    const response = await request(app).get("/scrivi/recensione");
    expect(response.status).toBe(200);
  });

  it("GET /recensioni/all should render recensioni", async () => {
    require("../src/features/recensioni/services/dao-recensioni").getRecensioni.mockResolvedValue([]);
    const response = await request(app).get("/recensioni/all");
    expect(response.status).toBe(200);
  });

  it("GET /notizie/crea_notizie should render notizia", async () => {
    const response = await request(app).get("/notizie/crea_notizie");
    expect(response.status).toBe(200);
  });

  it("GET /regolamento should render regolamento", async () => {
    const response = await request(app).get("/regolamento");
    expect(response.status).toBe(200);
  });

  it("GET /privacy should render privacy", async () => {
    const response = await request(app).get("/privacy");
    expect(response.status).toBe(200);
  });

  it("GET /modifica_campo/1 should render modifica_campo", async () => {
    require("../src/features/prenotazioni/services/dao-campi").getCampoById.mockResolvedValue({});
    const response = await request(app).get("/modifica_campo/1");
    expect(response.status).toBe(200);
  });
});
