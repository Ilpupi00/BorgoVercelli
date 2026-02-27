const Redis = require("ioredis");
const session = require("express-session");
const { RedisStore } = require("connect-redis");

require("dotenv").config();

const redisClient = new Redis({
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: Number(process.env.REDIS_PORT) || 6379,
  db: Number(process.env.REDIS_DB) || 0,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  lazyConnect: true,
});

if (process.env.REDIS_PASSWORD && process.env.REDIS_PASSWORD.trim() !== "") {
  redisClient.options.password = process.env.REDIS_PASSWORD;
}

(async () => {
  try {
    console.log("🔗 Connecting to Redis...");
    await redisClient.connect();
    console.log("✅ Connected to Redis");

    // Test basic operations
    console.log("\n📝 Testing SET...");
    await redisClient.set("test:key", "test:value");
    console.log("✅ SET successful");

    console.log("📖 Testing GET...");
    const value = await redisClient.get("test:key");
    console.log("✅ GET successful:", value);

    // Test with RedisStore
    console.log("\n🔄 Creating RedisStore...");
    const store = new RedisStore({ client: redisClient });
    console.log("✅ RedisStore created");

    // Test session
    console.log("\n💾 Testing session.set()...");
    await new Promise((resolve, reject) => {
      store.set("test-session-id", { userId: 123 }, (err) => {
        if (err) {
          console.error("❌ Error:", err.message);
          reject(err);
        } else {
          console.log("✅ session.set() successful");
          resolve();
        }
      });
    });

    console.log("\n📖 Testing session.get()...");
    await new Promise((resolve, reject) => {
      store.get("test-session-id", (err, session) => {
        if (err) {
          console.error("❌ Error:", err.message);
          reject(err);
        } else {
          console.log("✅ session.get() successful:", session);
          resolve();
        }
      });
    });

    console.log("\n✅ All tests passed!");
    await redisClient.quit();
  } catch (err) {
    console.error("❌ Test failed:", err.message);
    console.error(err);
    process.exit(1);
  }
})();
