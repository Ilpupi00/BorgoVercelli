const { generateToken, verifyToken, jwtAuth } = require("../src/core/middlewares/jwt");
const userDao = require("../src/features/users/services/dao-user");

jest.mock("../src/features/users/services/dao-user", () => ({
  getUserById: jest.fn()
}));

const mockUser = {
  id: 10,
  email: "test@domain.com",
  tipo_utente_id: 2
};

describe("Middleware: jwt (Autenticazione / Token)", () => {
  let token;
  const originalEnv = process.env;

  beforeAll(() => {
    process.env.JWT_SECRET = "super-secret-test-key";
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("should generate a valid JWT token", () => {
    token = generateToken(mockUser);
    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(20);
  });

  it("should strictly verify the token data", () => {
    const verified = verifyToken(token);
    expect(verified).not.toBeNull();
    expect(verified.id).toBe(mockUser.id);
    expect(verified.email).toBe(mockUser.email);
  });

  it("should return null on invalid token verification", () => {
    const invalid = verifyToken("this.is.invalid_token");
    expect(invalid).toBeNull();
  });

  describe("jwtAuth Middleware", () => {
    let req, res, next;

    beforeEach(() => {
      req = {
        cookies: {},
        isAuthenticated: jest.fn().mockReturnValue(false),
        path: "/homepage",
        logIn: jest.fn((user, cb) => cb(null))
      };
      res = {
        clearCookie: jest.fn()
      };
      next = jest.fn();
      jest.clearAllMocks();
    });

    it("should skip if user is already authenticated", async () => {
      req.isAuthenticated.mockReturnValue(true);
      await jwtAuth(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(req.logIn).not.toHaveBeenCalled();
    });

    it("should skip on /logout path", async () => {
      req.path = "/logout";
      await jwtAuth(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it("should skip if no token in cookies", async () => {
      await jwtAuth(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it("should clear cookie and skip if token is invalid", async () => {
      req.cookies.rememberToken = "badtoken";
      await jwtAuth(req, res, next);
      expect(res.clearCookie).toHaveBeenCalledWith("rememberToken");
      expect(next).toHaveBeenCalled();
    });

    it("should log in user successfully if valid token to exist in DB", async () => {
      const validToken = generateToken(mockUser);
      req.cookies.rememberToken = validToken;
      userDao.getUserById.mockResolvedValue(mockUser);

      await jwtAuth(req, res, next);

      expect(userDao.getUserById).toHaveBeenCalledWith(mockUser.id);
      expect(req.logIn).toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    it("should clear cookie if user does not exist in DB", async () => {
      const validToken = generateToken(mockUser);
      req.cookies.rememberToken = validToken;
      userDao.getUserById.mockResolvedValue(null);

      await jwtAuth(req, res, next);
      expect(res.clearCookie).toHaveBeenCalledWith("rememberToken");
      expect(req.logIn).not.toHaveBeenCalled();
    });

    it("should handle login errors inside logIn callback gracefully", async () => {
      const validToken = generateToken(mockUser);
      req.cookies.rememberToken = validToken;
      userDao.getUserById.mockResolvedValue(mockUser);
      
      // Simulate error in passport mock
      req.logIn = jest.fn((user, cb) => cb(new Error("Login failed")));

      await jwtAuth(req, res, next);
      expect(res.clearCookie).toHaveBeenCalledWith("rememberToken");
      expect(next).toHaveBeenCalled();
    });
  });
});
