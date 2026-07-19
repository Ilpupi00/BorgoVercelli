const request = require("supertest");
const express = require("express");
const sessionRouter = require("../src/shared/routes/session");
const passport = require("passport");

jest.mock("passport", () => ({
  authenticate: jest.fn(),
}));

jest.mock("../src/core/config/redis", () => ({
  redisClient: {
    keys: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
  },
}));

jest.mock("../src/core/middlewares/jwt", () => ({
  generateToken: jest.fn().mockReturnValue("jwt-token"),
}));

jest.mock("../src/features/users/services/dao-sospensioni", () => ({
  getByUtenteId: jest.fn(),
  revocaSospensioneBan: jest.fn(),
}));

jest.mock("../src/core/middlewares/getUser", () => jest.fn((req, res) => res.json({ user: req.user })));

describe("Session Router", () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use(express.json());

    app.use((req, res, next) => {
      req.isAuthenticated = jest.fn().mockReturnValue(req.headers.auth === "true");
      if (req.headers.auth === "true") {
        req.user = { id: 1, isAdmin: req.headers.admin === "true" };
      }
      req.logIn = jest.fn((user, cb) => cb(null));
      req.logout = jest.fn((cb) => cb(null));
      req.sessionID = "session-123";
      next();
    });

    app.use("/", sessionRouter);
  });

  it("POST /session should fail on passport error", async () => {
    passport.authenticate.mockImplementation((strategy, cb) => (req, res, next) => cb(new Error("auth error")));
    
    app.use((err, req, res, next) => {
      res.status(500).json({ error: err.message });
    });

    const response = await request(app).post("/session");
    expect(response.status).toBe(500);
    expect(response.body.error).toBe("auth error");
  });

  it("POST /session should return 401 on invalid credentials", async () => {
    passport.authenticate.mockImplementation((strategy, cb) => (req, res, next) => cb(null, false, { message: "Invalid" }));
    
    const response = await request(app).post("/session");
    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Invalid");
  });

  it("POST /session should return 403 if user is banned", async () => {
    const mockUser = { isBannato: () => true };
    passport.authenticate.mockImplementation((strategy, cb) => (req, res, next) => cb(null, mockUser));
    
    const response = await request(app).post("/session");
    expect(response.status).toBe(403);
    expect(response.body.type).toBe("banned");
  });

  it("POST /session should login user successfully", async () => {
    const mockUser = { id: 1, email: "test@test.com", tipo_utente_id: 1 };
    passport.authenticate.mockImplementation((strategy, cb) => (req, res, next) => cb(null, mockUser));
    
    const response = await request(app).post("/session").send({ remember: true });
    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Login effettuato");
  });

  it("DELETE /session should logout user", async () => {
    const response = await request(app).delete("/session");
    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Logout effettuato");
  });

  it("GET /session should return 405", async () => {
    const response = await request(app).get("/session");
    expect(response.status).toBe(405);
  });
});
