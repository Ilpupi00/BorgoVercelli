#!/usr/bin/env node

/**
 * @fileoverview Test connessione Redis e funzionalità base
 * Verifica sessioni, Pub/Sub, queue e performance
 */

"use strict";

require("dotenv").config();

const {
  redisClient,
  redisPubSubClient,
  redisQueueClient,
  initRedis,
  closeRedis,
  set,
  get,
  del,
  pushNotificationToQueue,
  popNotificationFromQueue,
  getQueueLength,
  publishNotification,
  subscribeNotification,
} = require("../src/core/config/redis");

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

let testsPassed = 0;
let testsFailed = 0;

async function test(name, fn) {
  try {
    console.log(`\n${colors.cyan}🧪 Testing: ${name}${colors.reset}`);
    await fn();
    console.log(`${colors.green}✅ PASSED${colors.reset}`);
    testsPassed++;
  } catch (err) {
    console.error(`${colors.red}❌ FAILED: ${err.message}${colors.reset}`);
    testsFailed++;
  }
}

async function runAllTests() {
  console.log(`\n${colors.blue}========================================`);
  console.log("🔴 REDIS TEST SUITE");
  console.log(`========================================${colors.reset}\n`);

  // 1. Test Connessione
  await test("Connessione Redis", async () => {
    const connected = await initRedis();
    if (!connected) throw new Error("Redis non connesso");
  });

  // 2. Test SET/GET
  await test("SET e GET valori", async () => {
    const testKey = "test:key:simple";
    const testValue = "hello world";

    await set(testKey, testValue);
    const result = await get(testKey);

    if (result !== testValue) {
      throw new Error(`Expected "${testValue}", got "${result}"`);
    }

    await del(testKey);
  });

  // 3. Test JSON
  await test("SET/GET JSON object", async () => {
    const testKey = "test:key:json";
    const testObj = { id: 123, name: "Test User", roles: ["admin", "user"] };

    await set(testKey, testObj);
    const result = await get(testKey);

    if (!result || result.id !== testObj.id || result.name !== testObj.name) {
      throw new Error("JSON object not preserved");
    }

    await del(testKey);
  });

  // 4. Test TTL/Expiry
  await test("Set con TTL (scadenza)", async () => {
    const testKey = "test:key:ttl";
    const testValue = "expires soon";

    await set(testKey, testValue, 1); // 1 secondo
    let result = await get(testKey);

    if (result !== testValue) {
      throw new Error("Valore non salvato");
    }

    // Aspetta scadenza
    await new Promise((resolve) => setTimeout(resolve, 1500));

    result = await get(testKey);
    if (result !== null) {
      throw new Error("TTL non ha funzionato");
    }
  });

  // 5. Test Queue
  await test("Queue: PUSH e POP notifiche", async () => {
    const queueName = "test:queue:notifications";

    const notif1 = { id: 1, title: "Notifica 1" };
    const notif2 = { id: 2, title: "Notifica 2" };

    const len1 = await pushNotificationToQueue(queueName, notif1);
    const len2 = await pushNotificationToQueue(queueName, notif2);

    if (len1 !== 1 || len2 !== 2) {
      throw new Error("Push queue fallito");
    }

    const popped1 = await popNotificationFromQueue(queueName);
    const popped2 = await popNotificationFromQueue(queueName);
    const popped3 = await popNotificationFromQueue(queueName);

    if (
      !popped1 ||
      popped1.id !== 1 ||
      !popped2 ||
      popped2.id !== 2 ||
      popped3 !== null
    ) {
      throw new Error("Pop queue fallito");
    }
  });

  // 6. Test Queue Length
  await test("Queue: Lettura lunghezza", async () => {
    const queueName = "test:queue:length";

    const notif = { id: 1, title: "Test" };
    await pushNotificationToQueue(queueName, notif);
    await pushNotificationToQueue(queueName, notif);

    const len = await getQueueLength(queueName);
    if (len !== 2) {
      throw new Error(`Expected length 2, got ${len}`);
    }

    // Cleanup
    await popNotificationFromQueue(queueName);
    await popNotificationFromQueue(queueName);
  });

  // 7. Test Session Storage (simulato)
  await test("Sessione: Salva e recupera session data", async () => {
    const sessionId = "sess:test123";
    const sessionData = {
      user: { id: 1, email: "test@example.com", roles: ["user"] },
      loginTime: new Date().toISOString(),
    };

    await set(sessionId, sessionData, 3600); // 1 ora
    const retrieved = await get(sessionId);

    if (
      !retrieved ||
      retrieved.user.id !== 1 ||
      retrieved.user.email !== "test@example.com"
    ) {
      throw new Error("Session data not preserved");
    }

    await del(sessionId);
  });

  // 8. Test Database Info
  await test("Redis: PING e INFO", async () => {
    const pong = await redisClient.ping();
    if (pong !== "PONG") {
      throw new Error("PING fallito");
    }

    const info = await redisClient.info();
    if (!info || typeof info !== "string") {
      throw new Error("INFO fallito");
    }
  });

  // 9. Test Performance
  await test("Performance: Molti SET/GET veloci", async () => {
    const iterations = 1000;
    const start = Date.now();

    for (let i = 0; i < iterations; i++) {
      await redisClient.set(`perf:test:${i}`, `value:${i}`);
    }

    const setTime = Date.now() - start;
    console.log(`   SET ${iterations} chiavi: ${setTime}ms`);

    // Cleanup
    for (let i = 0; i < iterations; i++) {
      await redisClient.del(`perf:test:${i}`);
    }

    if (setTime > 10000) {
      console.warn(`   ⚠️  Performance bassa (${setTime}ms per 1000 SET)`);
    }
  });

  // 10. Test Pub/Sub (event listener)
  await test("Pub/Sub: Publish e Subscribe notifiche", async () => {
    const channel = "test:notifications:channel";
    const testMessage = { id: 1, text: "Test message" };

    let receivedMessage = null;

    // Subscribe prima di publish
    const subscriber = redisPubSubClient.duplicate();

    await new Promise((resolve) => {
      subscriber.on("message", (ch, msg) => {
        if (ch === channel) {
          try {
            receivedMessage = JSON.parse(msg);
          } catch {
            receivedMessage = msg;
          }
          resolve();
        }
      });

      subscriber.subscribe(channel).then(() => {
        // Ora pubblica
        publishNotification(channel, testMessage).catch(resolve);
      });
    });

    await subscriber.unsubscribe(channel);
    subscriber.disconnect();

    if (
      !receivedMessage ||
      receivedMessage.id !== testMessage.id ||
      receivedMessage.text !== testMessage.text
    ) {
      throw new Error("Pub/Sub message not received correctly");
    }
  });

  // Summary
  console.log(`\n${colors.blue}========================================`);
  console.log("📊 TEST SUMMARY");
  console.log(`========================================${colors.reset}`);
  console.log(`${colors.green}✅ PASSED: ${testsPassed}${colors.reset}`);
  console.log(`${colors.red}❌ FAILED: ${testsFailed}${colors.reset}`);
  console.log(
    `${colors.cyan}📈 TOTAL: ${testsPassed + testsFailed}${colors.reset}`
  );

  if (testsFailed === 0) {
    console.log(`\n${colors.green}🎉 TUTTI I TEST PASSATI!${colors.reset}`);
  } else {
    console.log(
      `\n${colors.yellow}⚠️  ${testsFailed} test fallito${colors.reset}`
    );
  }

  console.log(
    `\n${colors.blue}========================================\n${colors.reset}`
  );

  // Cleanup
  await closeRedis();

  // Exit con codice appropriato
  process.exit(testsFailed > 0 ? 1 : 0);
}

// Run
runAllTests().catch((err) => {
  console.error(`\n${colors.red}❌ Errore non gestito:${colors.reset}`, err);
  process.exit(1);
});
