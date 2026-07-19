const express = require("express");
const request = require("supertest");
const pushRouter = require("../src/shared/routes/push");
const pushService = require("../src/shared/services/webpush");
const notifications = require("../src/shared/services/notifications");

jest.mock("../src/shared/services/webpush", () => ({
  addSubscription: jest.fn(),
  getSubscriptionByEndpoint: jest.fn(),
  removeSubscription: jest.fn(),
  loadSubscriptions: jest.fn().mockResolvedValue([]),
  sendNotificationToUsers: jest.fn(),
  sendNotificationToAdmins: jest.fn(),
  sendNotificationToAll: jest.fn()
}));

jest.mock("../src/shared/services/notifications", () => ({
  queueNotificationForAdmins: jest.fn()
}));

describe("Push Router", () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    jest.spyOn(app.response, 'render').mockImplementation(function (view, options) {
      this.status(200).send("fake view");
    });
    
    // Auth middleware mock
    app.use((req, res, next) => {
      if (req.headers["x-auth-status"] === "auth-user") {
        req.isAuthenticated = () => true;
        req.user = { id: 1, tipo_utente_id: 0, isAdmin: false };
      } else if (req.headers["x-auth-status"] === "auth-admin") {
        req.isAuthenticated = () => true;
        req.user = { id: 2, tipo_utente_id: 1, isAdmin: true };
      } else {
        req.isAuthenticated = () => false;
      }
      next();
    });

    app.use("/", pushRouter);
  });

  describe("GET /push/vapidPublicKey", () => {
    it("should return the public key", async () => {
      process.env.VAPID_PUBLIC_KEY = "test-key";
      const res = await request(app).get("/push/vapidPublicKey");
      expect(res.status).toBe(200);
      expect(res.body.publicKey).toBe("test-key");
    });
  });

  describe("POST /push/subscribe", () => {
    it("should return 401 if not authenticated", async () => {
      const res = await request(app).post("/push/subscribe");
      expect(res.status).toBe(401);
    });

    it("should return 400 if invalid sub", async () => {
      const res = await request(app)
        .post("/push/subscribe")
        .set("x-auth-status", "auth-user")
        .send({});
      expect(res.status).toBe(400);
    });

    it("should save sub if valid", async () => {
      pushService.addSubscription.mockResolvedValueOnce(true);
      const res = await request(app)
        .post("/push/subscribe")
        .set("x-auth-status", "auth-user")
        .send({ endpoint: "url", keys: { p256dh: "k1", auth: "k2" } });
      expect(res.status).toBe(201);
      expect(pushService.addSubscription).toHaveBeenCalled();
    });

    it("should handle service error", async () => {
      pushService.addSubscription.mockRejectedValueOnce(new Error("add err"));
      const res = await request(app)
        .post("/push/subscribe")
        .set("x-auth-status", "auth-user")
        .send({ endpoint: "url", keys: { p256dh: "k1", auth: "k2" } });
      expect(res.status).toBe(500);
    });
  });

  describe("POST /push/subscribe-anon", () => {
    const originalEnv = process.env.NODE_ENV;
    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it("should block in production", async () => {
      process.env.NODE_ENV = "production";
      const res = await request(app).post("/push/subscribe-anon");
      expect(res.status).toBe(404);
    });

    it("should return 400 if invalid sub", async () => {
      process.env.NODE_ENV = "test";
      const res = await request(app)
        .post("/push/subscribe-anon")
        .send({});
      expect(res.status).toBe(400);
    });

    it("should save anon sub", async () => {
      process.env.NODE_ENV = "test";
      pushService.addSubscription.mockResolvedValueOnce(true);
      const res = await request(app)
        .post("/push/subscribe-anon")
        .send({ endpoint: "url" });
      expect(res.status).toBe(201);
      expect(pushService.addSubscription).toHaveBeenCalledWith({ endpoint: "url" }, 0, false, null);
    });

    it("should handle service error", async () => {
      process.env.NODE_ENV = "test";
      pushService.addSubscription.mockRejectedValueOnce(new Error("err"));
      const res = await request(app)
        .post("/push/subscribe-anon")
        .send({ endpoint: "url" });
      expect(res.status).toBe(500);
    });
  });

  describe("POST /push/unsubscribe", () => {
    it("should require endpoint", async () => {
      const res = await request(app).post("/push/unsubscribe").send({});
      expect(res.status).toBe(400);
    });

    it("should return 404 if not found", async () => {
      pushService.getSubscriptionByEndpoint.mockResolvedValueOnce(null);
      const res = await request(app).post("/push/unsubscribe").send({ endpoint: "e" });
      expect(res.status).toBe(404);
    });

    it("should return 403 if unauthorized owner", async () => {
      pushService.getSubscriptionByEndpoint.mockResolvedValueOnce({ user_id: 2 });
      const res = await request(app)
        .post("/push/unsubscribe")
        .set("x-auth-status", "auth-user") // user id 1
        .send({ endpoint: "e" });
      expect(res.status).toBe(403);
    });

    it("should allow admin to remove other subs", async () => {
      pushService.getSubscriptionByEndpoint.mockResolvedValueOnce({ user_id: 1 });
      pushService.removeSubscription.mockResolvedValueOnce(true);
      const res = await request(app)
        .post("/push/unsubscribe")
        .set("x-auth-status", "auth-admin")
        .send({ endpoint: "e" });
      expect(res.status).toBe(200);
      expect(pushService.removeSubscription).toHaveBeenCalled();
    });

    it("should notify admins when authenticated user unsubscribes", async () => {
      pushService.getSubscriptionByEndpoint.mockResolvedValueOnce({ user_id: 1 });
      pushService.removeSubscription.mockResolvedValueOnce(true);
      const res = await request(app)
        .post("/push/unsubscribe")
        .set("x-auth-status", "auth-user")
        .send({ endpoint: "e" });
      expect(res.status).toBe(200);
      expect(notifications.queueNotificationForAdmins).toHaveBeenCalled();
    });

    it("should handle service error on get", async () => {
      pushService.getSubscriptionByEndpoint.mockRejectedValueOnce(new Error("err"));
      const res = await request(app).post("/push/unsubscribe").send({ endpoint: "e" });
      expect(res.status).toBe(500);
    });

    it("should handle service error on remove", async () => {
      pushService.getSubscriptionByEndpoint.mockResolvedValueOnce({ user_id: 1 });
      pushService.removeSubscription.mockRejectedValueOnce(new Error("err"));
      const res = await request(app).post("/push/unsubscribe").set("x-auth-status", "auth-admin").send({ endpoint: "e" });
      expect(res.status).toBe(500);
    });
  });

  describe("Admin routes", () => {
    it("GET /push/subscriptions should return 403 for non-admin", async () => {
      const res = await request(app).get("/push/subscriptions").set("x-auth-status", "auth-user");
      expect(res.status).toBe(403);
    });

    it("GET /push/subscriptions should return subs for admin", async () => {
      pushService.loadSubscriptions.mockResolvedValueOnce([{ endpoint: "abcdefghijklmnopqrstuvwxyz123456789012345678901234567890", userId: 1 }]);
      const res = await request(app).get("/push/subscriptions").set("x-auth-status", "auth-admin");
      expect(res.status).toBe(200);
      expect(res.body.subscriptions[0].endpoint).toContain("...");
    });

    it("GET /push/subscriptions should handle service error", async () => {
      pushService.loadSubscriptions.mockRejectedValueOnce(new Error("err"));
      const res = await request(app).get("/push/subscriptions").set("x-auth-status", "auth-admin");
      expect(res.status).toBe(500);
    });

    it("GET /push/admin-subs should return 403 for non-admin", async () => {
      const res = await request(app).get("/push/admin-subs").set("x-auth-status", "auth-user");
      expect(res.status).toBe(403);
    });

    it("GET /push/admin-subs should return admin subs", async () => {
      pushService.loadSubscriptions.mockResolvedValueOnce([{ endpoint: "e", isAdmin: true, userId: 1 }]);
      const res = await request(app).get("/push/admin-subs").set("x-auth-status", "auth-admin");
      expect(res.status).toBe(200);
    });

    it("GET /push/admin-subs should handle error", async () => {
      pushService.loadSubscriptions.mockRejectedValueOnce(new Error("err"));
      const res = await request(app).get("/push/admin-subs").set("x-auth-status", "auth-admin");
      expect(res.status).toBe(500);
    });

    it("POST /push/force-admin-notify should return 403 for non-admin", async () => {
      const res = await request(app).post("/push/force-admin-notify").set("x-auth-status", "auth-user");
      expect(res.status).toBe(403);
    });

    it("POST /push/force-admin-notify should send notification", async () => {
      pushService.sendNotificationToAdmins.mockResolvedValueOnce(true);
      const res = await request(app).post("/push/force-admin-notify").set("x-auth-status", "auth-admin");
      expect(res.status).toBe(200);
    });

    it("POST /push/force-admin-notify should handle error", async () => {
      pushService.sendNotificationToAdmins.mockRejectedValueOnce(new Error("err"));
      const res = await request(app).post("/push/force-admin-notify").set("x-auth-status", "auth-admin");
      expect(res.status).toBe(500);
    });
  });

  describe("Debug routes", () => {
    it("POST /push/test should send to 'me'", async () => {
      const res = await request(app).post("/push/test").set("x-auth-status", "auth-user").send({ to: "me" });
      expect(res.status).toBe(200);
      expect(pushService.sendNotificationToUsers).toHaveBeenCalled();
    });

    it("POST /push/test should send to 'admins'", async () => {
      const res = await request(app).post("/push/test").set("x-auth-status", "auth-admin").send({ to: "admins" });
      expect(res.status).toBe(200);
      expect(pushService.sendNotificationToAdmins).toHaveBeenCalled();
    });

    it("POST /push/test should handle 'all' safely", async () => {
      const res = await request(app).post("/push/test").set("x-auth-status", "auth-admin").send({ to: "all" });
      expect(res.status).toBe(200);
      expect(pushService.sendNotificationToAll).toHaveBeenCalled();
    });

    it("POST /push/test should handle error", async () => {
      pushService.sendNotificationToUsers.mockRejectedValueOnce(new Error("err"));
      const res = await request(app).post("/push/test").set("x-auth-status", "auth-user").send({ to: "me" });
      expect(res.status).toBe(500);
    });

    it("POST /push/test should handle invalid to", async () => {
      const res = await request(app).post("/push/test").set("x-auth-status", "auth-user").send({ to: "invalid" });
      expect(res.status).toBe(400);
    });
  });

  describe("Other routes", () => {
    it("POST /push/subscribe-error should return 200", async () => {
      const res = await request(app).post("/push/subscribe-error").send({});
      expect(res.status).toBe(200);
    });

    it("GET /push/my-subscriptions should require auth", async () => {
      const res = await request(app).get("/push/my-subscriptions");
      expect(res.status).toBe(401);
    });
    
    it("GET /push/my-subscriptions should return subs", async () => {
      pushService.loadSubscriptions.mockResolvedValueOnce([{ userId: 1 }]);
      const res = await request(app).get("/push/my-subscriptions").set("x-auth-status", "auth-user");
      expect(res.status).toBe(200);
    });

    it("GET /push/my-subscriptions should handle error", async () => {
      pushService.loadSubscriptions.mockRejectedValueOnce(new Error("err"));
      const res = await request(app).get("/push/my-subscriptions").set("x-auth-status", "auth-user");
      expect(res.status).toBe(500);
    });

    it("GET /push/debug should require auth", async () => {
      const res = await request(app).get("/push/debug");
      expect(res.status).toBe(401);
    });

    it("GET /push/debug should return debug info", async () => {
      const res = await request(app).get("/push/debug").set("x-auth-status", "auth-user");
      expect(res.status).toBe(200);
    });

    it("GET /push/debug-my-subscriptions should require auth", async () => {
      const res = await request(app).get("/push/debug-my-subscriptions");
      expect(res.status).toBe(401);
    });

    it("GET /push/debug-my-subscriptions should return info", async () => {
      pushService.loadSubscriptions.mockResolvedValueOnce([{ userId: 1 }]);
      const res = await request(app).get("/push/debug-my-subscriptions").set("x-auth-status", "auth-user");
      expect(res.status).toBe(200);
    });

    it("GET /push/debug-my-subscriptions should handle error", async () => {
      pushService.loadSubscriptions.mockRejectedValueOnce(new Error("err"));
      const res = await request(app).get("/push/debug-my-subscriptions").set("x-auth-status", "auth-user");
      expect(res.status).toBe(500);
    });

    it("POST /push/debug-send-myself should require auth", async () => {
      const res = await request(app).post("/push/debug-send-myself");
      expect(res.status).toBe(401);
    });

    it("POST /push/debug-send-myself should send", async () => {
      pushService.sendNotificationToUsers.mockResolvedValueOnce(true);
      const res = await request(app).post("/push/debug-send-myself").set("x-auth-status", "auth-user");
      expect(res.status).toBe(200);
    });

    it("POST /push/debug-send-myself should handle error", async () => {
      pushService.sendNotificationToUsers.mockRejectedValueOnce(new Error("err"));
      const res = await request(app).post("/push/debug-send-myself").set("x-auth-status", "auth-user");
      expect(res.status).toBe(500);
    });

    it("GET /push/test should redirect if not auth", async () => {
      const res = await request(app).get("/push/test");
      expect(res.status).toBe(302);
    });

    it("GET /push/test should render if auth", async () => {
      const res = await request(app).get("/push/test").set("x-auth-status", "auth-user");
      expect(res.status).toBe(200);
    });
  });
});
