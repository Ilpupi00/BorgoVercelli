const db = require("../src/core/config/database");
const daoResetToken = require("../src/features/users/services/dao-reset-token");

jest.mock("../src/core/config/database", () => ({
  run: jest.fn(),
  get: jest.fn(),
}));

jest.mock("../src/core/models/user", () => {
  return {
    from: jest.fn(data => data)
  };
});

describe("DAO Reset Token", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("saveResetToken should resolve on success", async () => {
    db.run.mockImplementation((sql, params, cb) => cb(null));
    const expiresAt = new Date();
    await expect(daoResetToken.saveResetToken(1, "token123", expiresAt)).resolves.toEqual({ message: "Reset token saved successfully" });
  });

  it("saveResetToken should reject on error", async () => {
    db.run.mockImplementation((sql, params, cb) => cb(new Error("db error")));
    const expiresAt = new Date();
    await expect(daoResetToken.saveResetToken(1, "token123", expiresAt)).rejects.toEqual({ error: "Error saving reset token: db error" });
  });

  it("getUserByResetToken should resolve with user on success", async () => {
    const mockUser = { id: 1, email: "test@test.com" };
    db.get.mockImplementation((sql, params, cb) => cb(null, mockUser));
    await expect(daoResetToken.getUserByResetToken("token123")).resolves.toEqual(mockUser);
  });

  it("getUserByResetToken should resolve with null if no user", async () => {
    db.get.mockImplementation((sql, params, cb) => cb(null, null));
    await expect(daoResetToken.getUserByResetToken("token123")).resolves.toBeNull();
  });

  it("getUserByResetToken should reject on error", async () => {
    db.get.mockImplementation((sql, params, cb) => cb(new Error("db error")));
    await expect(daoResetToken.getUserByResetToken("token123")).rejects.toEqual({ error: "Error retrieving user by reset token: db error" });
  });

  it("invalidateResetToken should resolve on success", async () => {
    db.run.mockImplementation((sql, params, cb) => cb(null));
    await expect(daoResetToken.invalidateResetToken(1)).resolves.toEqual({ message: "Reset token invalidated successfully" });
  });

  it("invalidateResetToken should reject on error", async () => {
    db.run.mockImplementation((sql, params, cb) => cb(new Error("db error")));
    await expect(daoResetToken.invalidateResetToken(1)).rejects.toEqual({ error: "Error invalidating reset token: db error" });
  });
});
