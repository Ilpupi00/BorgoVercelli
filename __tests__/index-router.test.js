const express = require("express");
const request = require("supertest");
const indexRouter = require("../src/shared/routes/index");
const emailService = require("../src/shared/services/email-service");

jest.mock("../src/features/notizie/services/dao-notizie", () => ({
  getNotiziePaginated: jest.fn().mockResolvedValue([]),
  searchNotizie: jest.fn().mockResolvedValue([])
}));

jest.mock("../src/features/eventi/services/dao-eventi", () => ({
  getEventiPubblicati: jest.fn().mockResolvedValue([]),
  searchEventi: jest.fn().mockResolvedValue([])
}));

jest.mock("../src/features/recensioni/services/dao-recensioni", () => ({
  getRecensioni: jest.fn().mockResolvedValue([])
}));

jest.mock("../src/features/squadre/services/dao-membri-societa", () => ({
  getMembriSocieta: jest.fn().mockResolvedValue([])
}));

jest.mock("../src/features/squadre/services/dao-squadre", () => ({
  getSquadre: jest.fn().mockResolvedValue([]),
  searchSquadre: jest.fn().mockResolvedValue([])
}));

jest.mock("../src/features/prenotazioni/services/dao-campi", () => ({
  getCampiAttivi: jest.fn().mockResolvedValue([]),
  searchCampi: jest.fn().mockResolvedValue([]),
  getCampoById: jest.fn().mockResolvedValue({})
}));

jest.mock("../src/features/prenotazioni/services/dao-prenotazione", () => ({
  getCampiAttivi: jest.fn().mockResolvedValue([{ id: 1 }]),
  getDisponibilitaCampo: jest.fn().mockResolvedValue(["10:00"])
}));

jest.mock("../src/features/galleria/services/dao-galleria", () => ({
  getImmagini: jest.fn().mockResolvedValue([])
}));

jest.mock("../src/features/campionati/services/dao-campionati", () => ({
  getCampionati: jest.fn().mockResolvedValue([{ id: 1 }]),
  getClassificaByCampionatoId: jest.fn().mockResolvedValue([])
}));

jest.mock("../src/shared/services/email-service", () => ({
  verifyTransporter: jest.fn(),
  sendTestViaResend: jest.fn(),
  sendEmail: jest.fn()
}));

jest.mock("../src/core/middlewares/auth", () => ({
  isLoggedIn: (req, res, next) => next(),
  isDirigente: (req, res, next) => next(),
  isAdminOrDirigente: (req, res, next) => next(),
  isStaffOrAdmin: (req, res, next) => next(),
  canManageCampi: (req, res, next) => next(),
  isAdmin: (req, res, next) => next()
}));

jest.mock("../src/core/config/database", () => ({
  all: jest.fn().mockImplementation((sql, params, cb) => cb(null, []))
}));

jest.mock("../src/shared/utils/file-helper", () => ({
  imageFileExists: jest.fn().mockReturnValue(true)
}));

describe("Index Router", () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use(express.json());
    
    app.use((req, res, next) => {
      res.render = jest.fn((view, options) => res.send("fake render"));
      next();
    });

    app.use((req, res, next) => {
      req.isAuthenticated = () => true;
      req.user = { id: 1 };
      req.session = {};
      next();
    });

    app.use("/", indexRouter);

    app.use((err, req, res, next) => {
      console.error(err);
      res.status(500).send(err.message);
    });
  });

  describe("Admin routes", () => {
    const originalToken = process.env.ADMIN_VERIFY_TOKEN;
    const originalResend = process.env.RESEND_API_KEY;

    afterEach(() => {
      process.env.ADMIN_VERIFY_TOKEN = originalToken;
      process.env.RESEND_API_KEY = originalResend;
    });

    it("GET /admin/verify-smtp requires configured token", async () => {
      delete process.env.ADMIN_VERIFY_TOKEN;
      const res = await request(app).get("/admin/verify-smtp");
      expect(res.status).toBe(400);
    });

    it("GET /admin/verify-smtp requires correct token", async () => {
      process.env.ADMIN_VERIFY_TOKEN = "secret";
      const res = await request(app).get("/admin/verify-smtp?token=wrong");
      expect(res.status).toBe(403);
    });

    it("GET /admin/verify-smtp succeeds", async () => {
      process.env.ADMIN_VERIFY_TOKEN = "secret";
      emailService.verifyTransporter.mockResolvedValueOnce(true);
      const res = await request(app).get("/admin/verify-smtp?token=secret");
      expect(res.status).toBe(200);
    });

    it("GET /admin/send-test-resend succeeds", async () => {
      process.env.ADMIN_VERIFY_TOKEN = "secret";
      process.env.RESEND_API_KEY = "resend";
      emailService.sendTestViaResend.mockResolvedValueOnce({ id: 1 });
      const res = await request(app).get("/admin/send-test-resend?token=secret&to=test@test.com");
      expect(res.status).toBe(200);
    });
  });

  describe("View routes", () => {
    it("GET /homepage", async () => {
      const res = await request(app).get("/homepage");
      expect(res.status).toBe(200);
    });

    it("GET /campionato", async () => {
      const res = await request(app).get("/campionato");
      expect(res.status).toBe(200);
    });

    it("GET /squadre", async () => {
      const res = await request(app).get("/squadre");
      expect(res.status).toBe(200);
    });

    it("GET /galleria", async () => {
      const res = await request(app).get("/galleria");
      expect(res.status).toBe(200);
    });

    it("GET /societa", async () => {
      const res = await request(app).get("/societa");
      expect(res.status).toBe(200);
    });

    it("GET /prenotazione", async () => {
      const res = await request(app).get("/prenotazione");
      expect(res.status).toBe(200);
    });

    it("GET /recensioni/all", async () => {
      require("../src/features/recensioni/services/dao-recensioni").getRecensioni.mockResolvedValueOnce([{ valutazione: 5 }]);
      const res = await request(app).get("/recensioni/all");
      expect(res.status).toBe(200);
    });

    it("GET /search", async () => {
      const res = await request(app).get("/search?q=test");
      expect(res.status).toBe(200);
    });
  });

  describe("POST /contatti", () => {
    it("should fail if fields missing", async () => {
      const res = await request(app).post("/contatti").send({});
      expect(res.status).toBe(400);
    });

    it("should succeed", async () => {
      emailService.sendEmail.mockResolvedValueOnce({});
      const res = await request(app).post("/contatti").send({ name: "n", email: "e", message: "m", subject: "s", phone: "p" });
      expect(res.status).toBe(200);
    });
  });
});
