const { createClient } = require("redis");
const IORedis = require("ioredis");

jest.mock("redis", () => {
  const mClient = {
    on: jest.fn(),
    connect: jest.fn().mockResolvedValue(),
    ping: jest.fn().mockResolvedValue("PONG"),
    quit: jest.fn().mockResolvedValue(),
    set: jest.fn(),
    setEx: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    isOpen: false
  };
  return {
    createClient: jest.fn(() => mClient)
  };
});

jest.mock("ioredis", () => {
  return jest.fn().mockImplementation(() => {
    return {
      on: jest.fn(),
      connect: jest.fn().mockResolvedValue(),
      quit: jest.fn().mockResolvedValue(),
      publish: jest.fn().mockResolvedValue(1),
      subscribe: jest.fn().mockResolvedValue(),
      rpush: jest.fn().mockResolvedValue(1),
      lpop: jest.fn().mockResolvedValue('{"test": true}'),
      llen: jest.fn().mockResolvedValue(1),
      status: "close"
    };
  });
});

describe("Redis Configuration", () => {
  let redisModule;
  let redisClient;
  let redisPubSubClient;
  let redisQueueClient;

  beforeAll(() => {
    process.env.REDIS_URL = "redis://localhost:6379";
    redisModule = require("../src/core/config/redis");
    redisClient = redisModule.redisClient;
    redisPubSubClient = redisModule.redisPubSubClient;
    redisQueueClient = redisModule.redisQueueClient;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("initRedis", () => {
    it("should initialize connections", async () => {
      const res = await redisModule.initRedis();
      expect(res).toBe(true);
      expect(redisClient.connect).toHaveBeenCalled();
      expect(redisPubSubClient.connect).toHaveBeenCalled();
      expect(redisQueueClient.connect).toHaveBeenCalled();
    });

    it("should return false on ping fail", async () => {
      redisClient.ping.mockResolvedValueOnce("FAIL");
      const res = await redisModule.initRedis();
      expect(res).toBe(false);
    });
  });

  describe("closeRedis", () => {
    it("should close connections", async () => {
      await redisModule.closeRedis();
      expect(redisClient.quit).toHaveBeenCalled();
      expect(redisPubSubClient.quit).toHaveBeenCalled();
      expect(redisQueueClient.quit).toHaveBeenCalled();
    });
  });

  describe("publishNotification", () => {
    it("should publish", async () => {
      const res = await redisModule.publishNotification("chan", { a: 1 });
      expect(redisPubSubClient.publish).toHaveBeenCalledWith("chan", '{"a":1}');
      expect(res).toBe(1);
    });
  });

  describe("subscribeNotification", () => {
    it("should subscribe and handle message", async () => {
      let messageHandler;
      redisPubSubClient.on.mockImplementation((event, handler) => {
        if (event === "message") messageHandler = handler;
      });
      const cb = jest.fn();
      
      await redisModule.subscribeNotification("chan", cb);
      expect(redisPubSubClient.subscribe).toHaveBeenCalledWith("chan");
      
      // trigger
      messageHandler("chan", '{"data": 123}');
      expect(cb).toHaveBeenCalledWith({ data: 123 });
    });
  });

  describe("pushNotificationToQueue", () => {
    it("should rpush", async () => {
      const res = await redisModule.pushNotificationToQueue("q", { msg: "hi" });
      expect(redisQueueClient.rpush).toHaveBeenCalledWith("q", '{"msg":"hi"}');
      expect(res).toBe(1);
    });
  });

  describe("popNotificationFromQueue", () => {
    it("should lpop and parse", async () => {
      const res = await redisModule.popNotificationFromQueue("q");
      expect(redisQueueClient.lpop).toHaveBeenCalledWith("q");
      expect(res).toEqual({ test: true });
    });

    it("should handle null", async () => {
      redisQueueClient.lpop.mockResolvedValueOnce(null);
      const res = await redisModule.popNotificationFromQueue("q");
      expect(res).toBeNull();
    });
  });

  describe("getQueueLength", () => {
    it("should return llen", async () => {
      const res = await redisModule.getQueueLength("q");
      expect(redisQueueClient.llen).toHaveBeenCalledWith("q");
      expect(res).toBe(1);
    });
  });

  describe("General CRUD (set, get, del, exists)", () => {
    it("set without expiry", async () => {
      redisClient.set.mockResolvedValueOnce("OK");
      await redisModule.set("key", { a: 1 });
      expect(redisClient.set).toHaveBeenCalledWith("key", '{"a":1}');
    });

    it("set with expiry", async () => {
      redisClient.setEx.mockResolvedValueOnce("OK");
      await redisModule.set("key", "val", 60);
      expect(redisClient.setEx).toHaveBeenCalledWith("key", 60, "val");
    });

    it("get existing", async () => {
      redisClient.get.mockResolvedValueOnce('{"a":1}');
      const res = await redisModule.get("key");
      expect(res).toEqual({ a: 1 });
    });

    it("get plain string", async () => {
      redisClient.get.mockResolvedValueOnce('plain');
      const res = await redisModule.get("key");
      expect(res).toBe('plain');
    });

    it("del", async () => {
      redisClient.del.mockResolvedValueOnce(1);
      const res = await redisModule.del("key");
      expect(res).toBe(1);
    });

    it("exists", async () => {
      redisClient.exists.mockResolvedValueOnce(1);
      const res = await redisModule.exists("key");
      expect(res).toBe(1);
    });
  });
});
