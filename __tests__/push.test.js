const request = require("supertest");
const express = require("express");
const pushRouter = require("../src/shared/routes/push");
const pushService = require("../src/shared/services/webpush");

jest.mock("../src/shared/services/webpush", () => ({
  addSubscription: jest.fn(),
  getSubscriptionByEndpoint: jest.fn(),
  removeSubscription: jest.fn(),
  loadSubscriptions: jest.fn(),
  sendNotificationToUsers: jest.fn(),
  sendNotificationToAdmins: jest.fn(),
  sendNotificationToAll: jest.fn(),
}));

jest.mock("../src/shared/services/notifications", () => ({
  queueNotificationForAdmins: jest.fn(),
}));

describe("Push Router", () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.VAPID_PUBLIC_KEY = "test-public-key";
    
    app = express();
    app.use(express.json());
    
    app.use((req, res, next) => {
      req.isAuthenticated = jest.fn().mockReturnValue(req.headers.auth === "true");
      if (req.headers.auth === "true") {
        req.user = { id: 1, isAdmin: req.headers.admin === "true" };
      }
      next();
    });

    app.use("/", pushRouter);
  });

  it("GET /push/vapidPublicKey should return key", async () => {
    const response = await request(app).get("/push/vapidPublicKey");
    expect(response.status).toBe(200);
    expect(response.body.publicKey).toBe("test-public-key");
  });

  it("POST /push/subscribe should fail if not authenticated", async () => {
    const response = await request(app).post("/push/subscribe").send({ endpoint: "test", keys: {} });
    expect(response.status).toBe(401);
  });

  it("POST /push/subscribe should succeed if authenticated", async () => {
    pushService.addSubscription.mockResolvedValue();
    const response = await request(app)
      .post("/push/subscribe")
      .set("auth", "true")
      .send({ endpoint: "test", keys: {} });
    expect(response.status).toBe(201);
    expect(pushService.addSubscription).toHaveBeenCalled();
  });

  it("POST /push/unsubscribe should fail if endpoint is missing", async () => {
    const response = await request(app).post("/push/unsubscribe").send({});
    expect(response.status).toBe(400);
  });

  it("POST /push/unsubscribe should fail if subscription not found", async () => {
    pushService.getSubscriptionByEndpoint.mockResolvedValue(null);
    const response = await request(app).post("/push/unsubscribe").send({ endpoint: "test" });
    expect(response.status).toBe(404);
  });

  it("POST /push/unsubscribe should succeed for authenticated owner", async () => {
    pushService.getSubscriptionByEndpoint.mockResolvedValue({ user_id: 1 });
    pushService.removeSubscription.mockResolvedValue();
    const response = await request(app)
      .post("/push/unsubscribe")
      .set("auth", "true")
      .send({ endpoint: "test" });
    expect(response.status).toBe(200);
    expect(pushService.removeSubscription).toHaveBeenCalled();
  });

  it("GET /push/subscriptions should fail if not admin", async () => {
    const response = await request(app).get("/push/subscriptions").set("auth", "true");
    expect(response.status).toBe(403);
  });

  it("GET /push/subscriptions should succeed if admin", async () => {
    pushService.loadSubscriptions.mockResolvedValue([{ userId: 1, isAdmin: false, endpoint: "test", createdAt: new Date() }]);
    const response = await request(app).get("/push/subscriptions").set("auth", "true").set("admin", "true");
    expect(response.status).toBe(200);
    expect(response.body.count).toBe(1);
  });

  it("POST /push/test should send to me", async () => {
    pushService.sendNotificationToUsers.mockResolvedValue({});
    const response = await request(app)
      .post("/push/test")
      .set("auth", "true")
      .send({ to: "me", title: "test", body: "body", url: "/" });
    expect(response.status).toBe(200);
    expect(pushService.sendNotificationToUsers).toHaveBeenCalled();
  });
});
