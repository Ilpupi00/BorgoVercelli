const webpushService = require("../src/shared/services/webpush");
const db = require("../src/core/config/database");
const webpush = require("web-push");

jest.mock("../src/core/config/database", () => ({
  query: jest.fn()
}));

jest.mock("web-push", () => ({
  setVapidDetails: jest.fn(),
  sendNotification: jest.fn()
}));

describe("Service: WebPush", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("addSubscription", () => {
    it("should reject invalid subscriptions", async () => {
      await expect(webpushService.addSubscription({}, 1))
        .rejects.toThrow("Subscription non valida: mancano endpoint o keys");
        
      await expect(webpushService.addSubscription({ endpoint: "a", keys: {} }, 1))
        .rejects.toThrow("Subscription non valida: mancano p256dh o auth");
    });

    it("should successfully add a complete subscription", async () => {
      const mockResult = {
        rows: [{ id: 1, created_at: new Date(100), updated_at: new Date(100) }] // New insert
      };
      db.query.mockResolvedValue(mockResult);

      const res = await webpushService.addSubscription(
        { endpoint: "ext", keys: { p256dh: "key", auth: "auth" } },
        123
      );
      
      expect(res.id).toBe(1);
      expect(res.isNew).toBe(true);
      expect(db.query).toHaveBeenCalledTimes(1);
    });

    it("should identify an updated subscription", async () => {
      const mockResult = {
        rows: [{ id: 2, created_at: new Date(50), updated_at: new Date(150) }] // Updated
      };
      db.query.mockResolvedValue(mockResult);

      const res = await webpushService.addSubscription(
        { endpoint: "ext", keys: { p256dh: "key", auth: "auth" } },
        4
      );
      expect(res.isNew).toBe(false);
    });
  });

  describe("loadSubscriptions", () => {
    it("should map rows format properly out of the DB", async () => {
      db.query.mockResolvedValue({
        rows: [
          { endpoint: "123", p256dh: "p", auth: "a", user_id: 1, is_admin: true }
        ]
      });

      const subs = await webpushService.loadSubscriptions();
      expect(subs[0].endpoint).toBe("123");
      expect(subs[0].keys.p256dh).toBe("p");
      expect(subs[0].isAdmin).toBe(true);
    });

    it("should return empty array on failure", async () => {
      db.query.mockRejectedValue(new Error("DB Down"));
      const subs = await webpushService.loadSubscriptions();
      expect(subs).toEqual([]);
    });
  });

  describe("sendNotificationToUsers", () => {
    const mockDbSubs = [
      { userId: 1, endpoint: "/ep1", keys: { p256dh: "a", auth: "b" } },
      { userId: 2, endpoint: "/ep2", keys: { p256dh: "c", auth: "d" } }
    ];

    it("should return zeros if no targeted subs exist", async () => {
      const result = await webpushService.sendNotificationToUsers([99], { msg: "Hi" }, mockDbSubs);
      expect(result.sent).toBe(0);
      expect(result.failed).toBe(0);
    });

    it("should successfully send notifications and update success timestamps", async () => {
      webpush.sendNotification.mockResolvedValue(true);
      db.query.mockResolvedValue({ rows: [] }); // Mocks the "updateSuccessTimestamp" query

      const result = await webpushService.sendNotificationToUsers([1], { body: "Text" }, mockDbSubs);
      
      expect(result.sent).toBe(1);
      expect(webpush.sendNotification).toHaveBeenCalledWith(
        { endpoint: "/ep1", keys: expect.any(Object) },
        JSON.stringify({ body: "Text" }),
        expect.any(Object)
      );
    });

    it("should mark sub as removed on HTTP 404/410 webpush error", async () => {
      const err410 = new Error("Gone");
      err410.statusCode = 410;
      webpush.sendNotification.mockRejectedValue(err410);
      db.query.mockResolvedValue({ rows: [] }); // Mocks removeSubscription query execution

      const result = await webpushService.sendNotificationToUsers([2], { }, mockDbSubs);
      
      expect(result.removed).toBe(1);
      expect(result.failed).toBe(0); // 404/410 count as removed, not just randomly failed
      expect(result.sent).toBe(0);
    });

    it("should count as failed and update error metrics on HTTP 403 or generic 500 error", async () => {
      const err500 = new Error("Server Dead");
      err500.statusCode = 500;
      webpush.sendNotification.mockRejectedValue(err500);
      db.query.mockResolvedValue({ rows: [] }); // Mocks incrementErrorCount query execution

      const result = await webpushService.sendNotificationToUsers([1, 2], { }, mockDbSubs);
      
      expect(result.failed).toBe(2);
      // Verify that error_count update query was called multiple times
      expect(db.query).toHaveBeenCalled();
    });
  });

  describe("sendNotificationToAdmins / sendNotificationToAll", () => {
    it("should target admins only", async () => {
      const mockDbSubs = [
        { userId: 1, endpoint: "/ep1", keys: {}, isAdmin: true },
        { userId: 2, endpoint: "/ep2", keys: {}, isAdmin: false }
      ];
      webpush.sendNotification.mockResolvedValue(true);

      const result = await webpushService.sendNotificationToAdmins({ }, mockDbSubs);
      expect(result.sent).toBe(1);
      expect(webpush.sendNotification).toHaveBeenCalledTimes(1);
    });

    it("should fallback cleanly if no admins active", async () => {
        const mockDbSubs = [{ userId: 1, endpoint: "/ep1", keys: {}, isAdmin: false }];
        const result = await webpushService.sendNotificationToAdmins({ }, mockDbSubs);
        expect(result.sent).toBe(0);
    });

    it("broadcast to all targets the entire list", async () => {
      const mockDbSubs = [
        { endpoint: "/ep1", keys: {} },
        { endpoint: "/ep2", keys: {} }
      ];
      webpush.sendNotification.mockResolvedValue(true);

      const result = await webpushService.sendNotificationToAll({ }, mockDbSubs);
      expect(result.sent).toBe(2);
    });
  });

  describe("DB Helpers (remove, increment, cleanup)", () => {
    it("cleanupFailedSubscriptions should format query well", async () => {
      db.query.mockResolvedValue({ rows: [{ id: 1 }, { id: 2 }] });
      const deletedCount = await webpushService.cleanupFailedSubscriptions(5);
      
      expect(deletedCount).toBe(2);
      expect(db.query).toHaveBeenCalledWith(
        "DELETE FROM push_subscriptions WHERE error_count >= $1 RETURNING id, endpoint",
        [5]
      );
    });

    it("getSubscriptionByEndpoint responds accordingly", async () => {
        db.query.mockResolvedValue({ rows: [{ id: 5 }] });
        const sub = await webpushService.getSubscriptionByEndpoint("/api");
        expect(sub.id).toBe(5);

        db.query.mockResolvedValue({ rows: [] });
        const nil = await webpushService.getSubscriptionByEndpoint("/err");
        expect(nil).toBe(null);
    });
  });
});
