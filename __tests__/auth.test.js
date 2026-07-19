process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/db';
const auth = require("../src/core/middlewares/auth");
const daoNotizie = require("../src/features/notizie/services/dao-notizie");
const daoSospensioni = require("../src/features/users/services/dao-sospensioni");
const daoDirigenti = require("../src/features/squadre/services/dao-dirigenti-squadre");

jest.mock("../src/features/notizie/services/dao-notizie");
jest.mock("../src/features/users/services/dao-sospensioni");
jest.mock("../src/features/squadre/services/dao-dirigenti-squadre");

describe("Auth Middlewares", () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      isAuthenticated: jest.fn(),
      user: null,
      headers: { accept: "" },
      logout: jest.fn((cb) => cb && cb()),
      params: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      render: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe("isLoggedIn", () => {
    it("should reject if not authenticated", async () => {
      req.isAuthenticated.mockReturnValue(false);
      await auth.isLoggedIn(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.render).toHaveBeenCalledWith("error", expect.any(Object));
    });

    it("should reject with json if client accepts json", async () => {
      req.isAuthenticated.mockReturnValue(false);
      req.headers.accept = "application/json";
      await auth.isLoggedIn(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
    });

    it("should call next if valid active user", async () => {
      req.isAuthenticated.mockReturnValue(true);
      req.user = { isBannato: () => false, isSospeso: () => false };
      await auth.isLoggedIn(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it("should block banned user", async () => {
      req.isAuthenticated.mockReturnValue(true);
      req.user = { isBannato: () => true, isSospeso: () => false };
      await auth.isLoggedIn(req, res, next);
      expect(req.logout).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("should block suspended user and show reason", async () => {
      req.isAuthenticated.mockReturnValue(true);
      req.user = { id: 1, isBannato: () => false, isSospeso: () => true };
      
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      daoSospensioni.getByUtenteId.mockResolvedValue({
        data_fine: futureDate.toISOString(),
        motivo: "Spam"
      });

      await auth.isLoggedIn(req, res, next);
      expect(req.logout).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.render).toHaveBeenCalledWith("error", expect.objectContaining({
        message: expect.stringContaining("Spam")
      }));
    });

    it("should unblock suspended user if suspension expired", async () => {
      req.isAuthenticated.mockReturnValue(true);
      req.user = { id: 1, isBannato: () => false, isSospeso: () => true };
      
      const pastDate = new Date();
      pastDate.setFullYear(pastDate.getFullYear() - 1);
      daoSospensioni.getByUtenteId.mockResolvedValue({
        data_fine: pastDate.toISOString()
      });
      daoSospensioni.revocaSospensioneBan.mockResolvedValue(true);

      await auth.isLoggedIn(req, res, next);
      expect(daoSospensioni.revocaSospensioneBan).toHaveBeenCalledWith(1);
      expect(next).toHaveBeenCalled();
    });
  });

  describe("isAdmin", () => {
    it("should call next if admin", () => {
      req.isAuthenticated.mockReturnValue(true);
      req.user = { tipo_utente_id: 1 };
      auth.isAdmin(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it("should reject if not admin (json)", () => {
      req.isAuthenticated.mockReturnValue(true);
      req.user = { tipo_utente_id: 2 };
      req.headers.accept = "application/json";
      auth.isAdmin(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalled();
    });

    it("should reject if not admin (html)", () => {
      req.isAuthenticated.mockReturnValue(true);
      req.user = { tipo_utente_id: 2 };
      auth.isAdmin(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.render).toHaveBeenCalled();
    });
  });

  describe("isDirigente", () => {
    it("should call next if dirigente", () => {
      req.isAuthenticated.mockReturnValue(true);
      req.user = { tipo_utente_id: 2 };
      auth.isDirigente(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it("should reject if not dirigente (json)", () => {
      req.isAuthenticated.mockReturnValue(true);
      req.user = { tipo_utente_id: 1 };
      req.headers.accept = "application/json";
      auth.isDirigente(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("should reject if not dirigente (html)", () => {
      req.isAuthenticated.mockReturnValue(true);
      req.user = { tipo_utente_id: 1 };
      auth.isDirigente(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.render).toHaveBeenCalled();
    });
  });

  describe("isAdminOrDirigente", () => {
    it("should allow admin or dirigente", () => {
      req.isAuthenticated.mockReturnValue(true);
      req.user = { tipo_utente_id: 1 };
      auth.isAdminOrDirigente(req, res, next);
      expect(next).toHaveBeenCalledTimes(1);

      req.user = { tipo_utente_id: 2 };
      auth.isAdminOrDirigente(req, res, next);
      expect(next).toHaveBeenCalledTimes(2);
    });

    it("should reject otherwise (html)", () => {
      req.isAuthenticated.mockReturnValue(true);
      req.user = { tipo_utente_id: 3 };
      auth.isAdminOrDirigente(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.render).toHaveBeenCalled();
    });

    it("should reject otherwise (json)", () => {
      req.isAuthenticated.mockReturnValue(true);
      req.headers.accept = "application/json";
      req.user = { tipo_utente_id: 3 };
      auth.isAdminOrDirigente(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe("isSquadraDirigente", () => {
    it("should allow admin/presidente without check", async () => {
      req.isAuthenticated.mockReturnValue(true);
      req.user = { tipo_utente_id: 1 };
      await auth.isSquadraDirigente(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it("should allow dirigente if assigned to team", async () => {
      req.isAuthenticated.mockReturnValue(true);
      req.user = { id: 10, tipo_utente_id: 4 };
      req.params.id = "5";
      daoDirigenti.getDirigenteByUserId.mockResolvedValue([{ squadra_id: 5 }]);
      await auth.isSquadraDirigente(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it("should reject if not logged in (html)", async () => {
      req.isAuthenticated.mockReturnValue(false);
      await auth.isSquadraDirigente(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.render).toHaveBeenCalled();
    });

    it("should reject if not dirigente (html)", async () => {
      req.isAuthenticated.mockReturnValue(true);
      req.user = { id: 10, tipo_utente_id: 6 }; // gestore campo
      await auth.isSquadraDirigente(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.render).toHaveBeenCalled();
    });

    it("should reject dirigente if not assigned to team (json/html)", async () => {
      req.isAuthenticated.mockReturnValue(true);
      req.user = { id: 10, tipo_utente_id: 4 };
      req.params.id = "5";
      daoDirigenti.getDirigenteByUserId.mockResolvedValue([{ squadra_id: 9 }]);
      
      await auth.isSquadraDirigente(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.render).toHaveBeenCalled();

      req.headers.accept = "application/json";
      await auth.isSquadraDirigente(req, res, next);
      expect(res.json).toHaveBeenCalled();
    });

    it("should handle error (json/html)", async () => {
      req.isAuthenticated.mockReturnValue(true);
      req.user = { id: 10, tipo_utente_id: 4 };
      req.params.id = "5";
      daoDirigenti.getDirigenteByUserId.mockRejectedValue(new Error("err"));
      
      await auth.isSquadraDirigente(req, res, next);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.render).toHaveBeenCalled();

      req.headers.accept = "application/json";
      await auth.isSquadraDirigente(req, res, next);
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe("canEditNotizia", () => {
    it("should allow admin", async () => {
      req.isAuthenticated.mockReturnValue(true);
      req.user = { tipo_utente_id: 1 };
      await auth.canEditNotizia(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it("should allow dirigente if author", async () => {
      req.isAuthenticated.mockReturnValue(true);
      req.user = { id: 10, tipo_utente_id: 4 };
      req.params.id = "5";
      daoNotizie.getNotiziaById.mockResolvedValue({ autore_id: 10 });
      await auth.canEditNotizia(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it("should reject if not logged in (html)", async () => {
      req.isAuthenticated.mockReturnValue(false);
      await auth.canEditNotizia(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.render).toHaveBeenCalled();
    });

    it("should catch error and reject (html)", async () => {
      req.isAuthenticated.mockReturnValue(true);
      req.user = { id: 10, tipo_utente_id: 4 };
      req.params.id = "5";
      daoNotizie.getNotiziaById.mockRejectedValue(new Error("err"));
      await auth.canEditNotizia(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.render).toHaveBeenCalled();
    });

    it("should reject dirigente if not author (json)", async () => {
      req.isAuthenticated.mockReturnValue(true);
      req.headers.accept = "application/json";
      req.user = { id: 10, tipo_utente_id: 4 };
      req.params.id = "5";
      daoNotizie.getNotiziaById.mockResolvedValue({ autore_id: 11 });
      await auth.canEditNotizia(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe("isGestoreCampo", () => {
    it("should allow gestore campo", () => {
      req.isAuthenticated.mockReturnValue(true);
      req.user = { tipo_utente_id: 6 };
      auth.isGestoreCampo(req, res, next);
      expect(next).toHaveBeenCalled();
    });
    it("should reject otherwise (html)", () => {
      req.isAuthenticated.mockReturnValue(true);
      req.user = { tipo_utente_id: 1 };
      auth.isGestoreCampo(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.render).toHaveBeenCalled();
    });
  });

  describe("isStaffOrAdmin", () => {
    it("should allow staff", () => {
      req.isAuthenticated.mockReturnValue(true);
      req.user = { tipo_utente_id: 5 };
      auth.isStaffOrAdmin(req, res, next);
      expect(next).toHaveBeenCalled();
    });
    it("should reject otherwise (html)", () => {
      req.isAuthenticated.mockReturnValue(true);
      req.user = { tipo_utente_id: 6 };
      auth.isStaffOrAdmin(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.render).toHaveBeenCalled();
    });
  });

  describe("canManageCampi", () => {
    it("should allow admin", () => {
      req.isAuthenticated.mockReturnValue(true);
      req.user = { tipo_utente_id: 1 };
      auth.canManageCampi(req, res, next);
      expect(next).toHaveBeenCalled();
    });
    it("should reject otherwise (html)", () => {
      req.isAuthenticated.mockReturnValue(true);
      req.user = { tipo_utente_id: 4 };
      auth.canManageCampi(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.render).toHaveBeenCalled();
    });
  });
});
