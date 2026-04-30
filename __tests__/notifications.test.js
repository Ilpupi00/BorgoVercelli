const notificationsQueue = require("../src/shared/services/notifications");
const { redisQueueClient } = require("../src/core/config/redis");
const pushService = require("../src/shared/services/webpush");

jest.mock("../src/core/config/redis", () => ({
  redisQueueClient: {
    rpush: jest.fn(),
    llen: jest.fn()
  }
}));

jest.mock("../src/shared/services/webpush", () => ({
  sendNotificationToAdmins: jest.fn(),
  sendNotificationToUsers: jest.fn(),
  sendNotificationToAll: jest.fn()
}));

describe("Service: Notifications Queue", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("queueNotificationForAdmins", () => {
    it("should queue accurately on redis", async () => {
      redisQueueClient.rpush.mockResolvedValue(1); // Mocks a 1 element push success
      const result = await notificationsQueue.queueNotificationForAdmins({ msg: "Hi Admin" });
      
      expect(result.success).toBe(true);
      expect(result.queued).toBe(true);
      expect(redisQueueClient.rpush).toHaveBeenCalled();
      expect(pushService.sendNotificationToAdmins).not.toHaveBeenCalled();
    });

    it("should trigger fallback (direct send) if redis push fails", async () => {
      // Forziamo un errore di redis fittizio
      redisQueueClient.rpush.mockRejectedValue(new Error("Redis offline"));
      pushService.sendNotificationToAdmins.mockResolvedValue(true);

      const result = await notificationsQueue.queueNotificationForAdmins({ msg: "Fall" });
      
      expect(result.success).toBe(true);
      expect(result.fallback).toBe(true);
      expect(result.queued).toBe(false);
      expect(pushService.sendNotificationToAdmins).toHaveBeenCalled();
    });

    it("should completely fail if both Redis and fallback fail", async () => {
      redisQueueClient.rpush.mockRejectedValue(new Error("No redis"));
      pushService.sendNotificationToAdmins.mockRejectedValue(new Error("No service provider either"));

      const result = await notificationsQueue.queueNotificationForAdmins({ hi: 1 });
      expect(result.success).toBe(false);
      expect(result.error).toBe("No service provider either");
    });
  });

  describe("queueNotificationForUsers", () => {
    it("should exit immediately if users array is empty", async () => {
      const result = await notificationsQueue.queueNotificationForUsers([]);
      expect(result.success).toBe(false);
      expect(redisQueueClient.rpush).not.toHaveBeenCalled();
    });

    it("should queue for specific users", async () => {
      redisQueueClient.rpush.mockResolvedValue(1);
      const result = await notificationsQueue.queueNotificationForUsers([1, 2], { c: 1 });
      
      expect(result.success).toBe(true);
      expect(redisQueueClient.rpush).toHaveBeenCalled();
    });

    it("should fallback on direct send", async () => {
      redisQueueClient.rpush.mockRejectedValue(new Error("-"));
      pushService.sendNotificationToUsers.mockResolvedValue(true);

      const result = await notificationsQueue.queueNotificationForUsers([1], {});
      expect(result.fallback).toBe(true);
      expect(pushService.sendNotificationToUsers).toHaveBeenCalledWith([1], {});
    });
  });

  describe("queueNotificationForAll", () => {
    it("should queue properly globally", async () => {
      redisQueueClient.rpush.mockResolvedValue(true);
      const res = await notificationsQueue.queueNotificationForAll({ n: 1 });
      expect(res.queued).toBe(true);
    });

    it("should fallback to all send if global queue fails", async () => {
      redisQueueClient.rpush.mockRejectedValue(new Error("Fail"));
      const res = await notificationsQueue.queueNotificationForAll({});
      expect(res.fallback).toBe(true);
      expect(pushService.sendNotificationToAll).toHaveBeenCalled();
    });
  });

  describe("getQueueStats", () => {
    it("should return correct metrics structure upon success", async () => {
      redisQueueClient.llen.mockResolvedValue(55);
      const stats = await notificationsQueue.getQueueStats();
      
      expect(stats.pending).toBe(55);
      expect(stats.total).toBe(55);
      expect(stats.sending).toBe(0);
    });

    it("should gracefully handle llen failures and return null", async () => {
      redisQueueClient.llen.mockRejectedValue(new Error("Conn blocked"));
      const stats = await notificationsQueue.getQueueStats();
      expect(stats).toBeNull();
    });
  });
});
