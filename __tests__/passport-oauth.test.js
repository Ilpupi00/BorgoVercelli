const passportOAuth = require("../src/core/config/passport-oauth");
const db = require("../src/core/config/database");
const passport = require("passport");

jest.mock("../src/core/config/database", () => ({
  query: jest.fn()
}));

jest.mock("passport", () => ({
  use: jest.fn()
}));

describe("Passport OAuth", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    delete process.env.FACEBOOK_APP_ID;
    delete process.env.FACEBOOK_APP_SECRET;
    delete process.env.APPLE_CLIENT_ID;
    delete process.env.APPLE_TEAM_ID;
    delete process.env.APPLE_KEY_ID;
    delete process.env.APPLE_PRIVATE_KEY_LOCATION;
  });

  it("should warn if no env vars", () => {
    const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
    passportOAuth.initOAuth();
    expect(consoleSpy).toHaveBeenCalledTimes(3);
    consoleSpy.mockRestore();
  });

  it("should configure strategies if env vars are present", () => {
    process.env.GOOGLE_CLIENT_ID = "1";
    process.env.GOOGLE_CLIENT_SECRET = "2";
    process.env.FACEBOOK_APP_ID = "3";
    process.env.FACEBOOK_APP_SECRET = "4";
    process.env.APPLE_CLIENT_ID = "5";
    process.env.APPLE_TEAM_ID = "6";
    process.env.APPLE_KEY_ID = "7";
    process.env.APPLE_PRIVATE_KEY_LOCATION = "8";

    const consoleSpy = jest.spyOn(console, "log").mockImplementation();
    passportOAuth.initOAuth();
    expect(passport.use).toHaveBeenCalledTimes(3);
    consoleSpy.mockRestore();
  });

  describe("Strategy callbacks", () => {
    let googleCallback, facebookCallback, appleCallback;

    beforeEach(() => {
      process.env.GOOGLE_CLIENT_ID = "1";
      process.env.GOOGLE_CLIENT_SECRET = "2";
      process.env.FACEBOOK_APP_ID = "3";
      process.env.FACEBOOK_APP_SECRET = "4";
      process.env.APPLE_CLIENT_ID = "5";
      process.env.APPLE_TEAM_ID = "6";
      process.env.APPLE_KEY_ID = "7";
      process.env.APPLE_PRIVATE_KEY_LOCATION = "8";

      const consoleSpy = jest.spyOn(console, "log").mockImplementation();
      passportOAuth.initOAuth();
      consoleSpy.mockRestore();

      googleCallback = passport.use.mock.calls[0][0]._verify;
      facebookCallback = passport.use.mock.calls[1][0]._verify;
      appleCallback = passport.use.mock.calls[2][0]._verify;
    });

    it("should handle new google user", async () => {
      db.query.mockResolvedValueOnce({ rows: [] }); // oauth check
      db.query.mockResolvedValueOnce({ rows: [] }); // email check
      db.query.mockResolvedValueOnce({ rows: [{ id: 1 }] }); // insert
      
      const done = jest.fn();
      await googleCallback("at", "rt", { id: "g1", emails: [{ value: "test@test.com" }], name: { givenName: "A", familyName: "B" }, photos: [{ value: "url" }] }, done);
      expect(done).toHaveBeenCalledWith(null, { id: 1 });
    });

    it("should handle existing google user by oauth", async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id: 1 }] }); // oauth check
      
      const done = jest.fn();
      await googleCallback("at", "rt", { id: "g1", emails: [{ value: "test@test.com" }] }, done);
      expect(done).toHaveBeenCalledWith(null, { id: 1 });
    });

    it("should handle existing google user by email", async () => {
      db.query.mockResolvedValueOnce({ rows: [] }); // oauth check
      db.query.mockResolvedValueOnce({ rows: [{ id: 1 }] }); // email check
      
      const done = jest.fn();
      await googleCallback("at", "rt", { id: "g1", emails: [{ value: "test@test.com" }] }, done);
      expect(done).toHaveBeenCalledWith(null, { id: 1 });
    });

    it("should handle facebook callback error", async () => {
      db.query.mockRejectedValueOnce(new Error("db error")); // oauth check
      
      const done = jest.fn();
      await facebookCallback("at", "rt", { id: "f1", emails: [{ value: "test@test.com" }] }, done);
      expect(done).toHaveBeenCalledWith(expect.any(Error), null);
    });

    it("should handle apple callback", async () => {
      db.query.mockResolvedValueOnce({ rows: [] }); // oauth check
      db.query.mockResolvedValueOnce({ rows: [] }); // email check
      db.query.mockResolvedValueOnce({ rows: [{ id: 1 }] }); // insert
      
      const done = jest.fn();
      await appleCallback("at", "rt", { sub: "a1", email: "test@test.com" }, { name: { firstName: "A", lastName: "B" } }, done);
      expect(done).toHaveBeenCalledWith(null, { id: 1 });
    });

    it("should handle apple callback error", async () => {
      db.query.mockRejectedValueOnce(new Error("db error")); // oauth check
      
      const done = jest.fn();
      await appleCallback("at", "rt", { sub: "a1", email: "test@test.com" }, { name: { firstName: "A", lastName: "B" } }, done);
      expect(done).toHaveBeenCalledWith(expect.any(Error), null);
    });
  });
});
