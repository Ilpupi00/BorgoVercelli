const normalizeUser = require("../src/core/middlewares/normalizeUser");

describe("Middleware: normalizeUser", () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = { user: {} };
    res = {};
    next = jest.fn();
  });

  it("should do nothing if req.user is undefined", () => {
    req.user = undefined;
    normalizeUser(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it("should set tipo_utente to 'admin' when tipo_utente_nome is 'marioamministratore'", () => {
    req.user.tipo_utente_nome = "marioamministratore";
    normalizeUser(req, res, next);
    expect(req.user.tipo_utente).toBe("admin");
    expect(next).toHaveBeenCalled();
  });

  it("should set tipo_utente to 'dirigente' when tipo_utente_nome contains 'dirigen'", () => {
    req.user.tipo_utente_nome = "Vice Dirigente";
    normalizeUser(req, res, next);
    expect(req.user.tipo_utente).toBe("dirigente");
    expect(next).toHaveBeenCalled();
  });

  it("should set tipo_utente to 'utente' when tipo_utente_nome contains 'utente'", () => {
    req.user.tipo_utente_nome = "Normale Utente";
    normalizeUser(req, res, next);
    expect(req.user.tipo_utente).toBe("utente");
  });

  it("should set tipo_utente to 'admin' when tipo_utente_id === 1", () => {
    req.user.tipo_utente_id = 1;
    normalizeUser(req, res, next);
    expect(req.user.tipo_utente).toBe("admin");
  });

  it("should convert string tipo_utente_id to number", () => {
    req.user.tipo_utente_id = "5";
    normalizeUser(req, res, next);
    expect(req.user.tipo_utente_id).toBe(5);
  });

  it("should keep tipo_utente_id as string if invalid number", () => {
    req.user.tipo_utente_id = "abc";
    normalizeUser(req, res, next);
    expect(req.user.tipo_utente_id).toBe("abc");
  });

  it("should correctly compute isAdmin boolean", () => {
    req.user.tipo_utente = "admin";
    normalizeUser(req, res, next);
    expect(req.user.isAdmin).toBe(true);
  });

  it("should not overwrite isAdmin if explicitly false and not an admin", () => {
    req.user.isAdmin = false;
    req.user.tipo_utente = "utente";
    normalizeUser(req, res, next);
    expect(req.user.isAdmin).toBe(false);
  });

  it("should handle error gracefully without throwing", () => {
    // Rendere non modificabile per creare un errore forzato locale ma bypassare crash
    Object.defineProperty(req.user, "tipo_utente", {
      get() { throw new Error("Errore Test"); }
    });
    // In questo caso deve chiamare next passando oltre all'errore silenziato
    normalizeUser(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
