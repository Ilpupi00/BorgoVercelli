const express = require("express");
const request = require("supertest");
const sessionRouter = require("../src/shared/routes/session");
const passport = require("passport");

// Mock dependencies
jest.mock("passport", () => ({
  authenticate: jest.fn()
}));

jest.mock("../src/core/middlewares/jwt", () => ({
  generateToken: jest.fn().mockReturnValue("fake-token")
}));

jest.mock("../src/core/config/redis", () => ({
  redisClient: {
    keys: jest.fn(),
    get: jest.fn(),
    del: jest.fn()
  }
}));

jest.mock("../src/features/users/services/dao-sospensioni", () => ({
  getByUtenteId: jest.fn(),
  revocaSospensioneBan: jest.fn()
}));

jest.mock("../src/shared/services/webpush", () => ({
  loadSubscriptions: jest.fn().mockReturnValue([])
}));

describe("Session Router", () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use(express.json());

    // Fake session middleware
    app.use((req, res, next) => {
      req.sessionID = "fake-session-id";
      req.logIn = jest.fn((user, cb) => cb(null));
      req.logout = jest.fn((cb) => cb(null));
      next();
    });

    app.use("/", sessionRouter);
  });

  describe("POST /session (Login)", () => {
    it("should return 401 if passport auth fails", async () => {
      passport.authenticate.mockImplementation((strategy, cb) => (req, res, next) => {
        cb(null, false, { message: "Invalid credentials" });
      });

      const response = await request(app).post("/session");
      expect(response.status).toBe(401);
      expect(response.body.error).toBe("Invalid credentials");
    });

    it("should return 403 if user is banned", async () => {
      passport.authenticate.mockImplementation((strategy, cb) => (req, res, next) => {
        cb(null, { id: 1, isBannato: () => true });
      });

      const response = await request(app).post("/session");
      expect(response.status).toBe(403);
      expect(response.body.type).toBe("banned");
    });

    it("should login user successfully without remember me", async () => {
      passport.authenticate.mockImplementation((strategy, cb) => (req, res, next) => {
        cb(null, { id: 1, email: "test@test.com", tipo_utente_id: 1, isBannato: () => false, isSospeso: () => false });
      });

      const response = await request(app).post("/session");
      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Login effettuato");
      expect(response.body.isAdmin).toBe(true);
    });

    it("should generate token if remember is true", async () => {
      passport.authenticate.mockImplementation((strategy, cb) => (req, res, next) => {
        cb(null, { id: 1, email: "test@test.com", tipo_utente_id: 0, isBannato: () => false, isSospeso: () => false });
      });

      const response = await request(app).post("/session").send({ remember: true });
      expect(response.status).toBe(200);
      // Express response will contain set-cookie
      expect(response.headers["set-cookie"][0]).toContain("rememberToken=fake-token");
    });

    it("should handle suspended user correctly (expired)", async () => {
      passport.authenticate.mockImplementation((strategy, cb) => (req, res, next) => {
        cb(null, { id: 1, isBannato: () => false, isSospeso: () => true });
      });

      const daoSospensioni = require("../src/features/users/services/dao-sospensioni");
      // expired suspension
      daoSospensioni.getByUtenteId.mockResolvedValueOnce({ data_fine: new Date(Date.now() - 10000).toISOString() });
      daoSospensioni.revocaSospensioneBan.mockResolvedValueOnce();

      const response = await request(app).post("/session");
      expect(response.status).toBe(200);
      expect(daoSospensioni.revocaSospensioneBan).toHaveBeenCalledWith(1);
    });

    it("should handle suspended user correctly (active)", async () => {
      passport.authenticate.mockImplementation((strategy, cb) => (req, res, next) => {
        cb(null, { id: 1, isBannato: () => false, isSospeso: () => true });
      });

      const daoSospensioni = require("../src/features/users/services/dao-sospensioni");
      // active suspension
      daoSospensioni.getByUtenteId.mockResolvedValueOnce({ data_fine: new Date(Date.now() + 10000).toISOString(), motivo: "Bad behavior" });

      const response = await request(app).post("/session");
      expect(response.status).toBe(403);
      expect(response.body.type).toBe("suspended");
      expect(response.body.motivo).toBe("Bad behavior");
    });
  });

  describe("DELETE /session", () => {
    it("should logout successfully", async () => {
      const response = await request(app).delete("/session");
      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Logout effettuato");
      expect(response.headers["set-cookie"][0]).toContain("rememberToken=;");
    });
  });

  describe("GET /session", () => {
    it("should return 405", async () => {
      const response = await request(app).get("/session");
      expect(response.status).toBe(405);
    });
  });

  describe("Redis session stats", () => {
    it("should return 403 if not admin", async () => {
      app.use((req, res, next) => {
        req.user = { isAdmin: false };
        next();
      });
      const response = await request(app).get("/session/stats/redis");
      expect(response.status).toBe(403);
    });

    it("should return stats if admin", async () => {
      // Create a new app instance where user is admin before the route
      const adminApp = express();
      adminApp.use(express.json());
      adminApp.use((req, res, next) => {
        req.user = { isAdmin: true };
        next();
      });
      adminApp.use("/", sessionRouter);

      const redis = require("../src/core/config/redis").redisClient;
      redis.keys.mockResolvedValue(["sess:123"]);
      redis.get.mockResolvedValue(JSON.stringify({ passport: { user: 1 }, cookie: { originalMaxAge: Date.now() } }));

      const response = await request(adminApp).get("/session/stats/redis");
      expect(response.status).toBe(200);
      expect(response.body.totalSessions).toBe(1);
    });
  });

  describe("Redis session clear", () => {
    it("should return 403 if not admin", async () => {
      const response = await request(app).delete("/session/admin/clear-all");
      expect(response.status).toBe(403);
    });

    it("should clear sessions if admin", async () => {
      const adminApp = express();
      adminApp.use(express.json());
      adminApp.use((req, res, next) => {
        req.user = { isAdmin: true };
        next();
      });
      adminApp.use("/", sessionRouter);

      const redis = require("../src/core/config/redis").redisClient;
      redis.keys.mockResolvedValue(["sess:123"]);
      redis.del.mockResolvedValue();

      const response = await request(adminApp).delete("/session/admin/clear-all");
      expect(response.status).toBe(200);
      expect(redis.del).toHaveBeenCalledWith("sess:123");
      expect(response.body.clearedSessions).toBe(1);
    });
  });
});
