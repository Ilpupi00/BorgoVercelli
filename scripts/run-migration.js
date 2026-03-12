#!/usr/bin/env node

/**
 * Migration runner script
 * Executes SQL migrations in order against the PostgreSQL database
 */

const fs = require("fs");
const path = require("path");
require("dotenv").config();

const db = require("../src/core/config/database");

async function runMigrations() {
  try {
    console.log("=".repeat(60));
    console.log("🚀 Running database migrations...");
    console.log("=".repeat(60));

    // Wait for database connection
    await db.ready;

    const migrationDir = path.join(__dirname, "../database/migrations");
    const files = fs
      .readdirSync(migrationDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    if (files.length === 0) {
      console.log("✅ No migrations to run");
      process.exit(0);
    }

    console.log(`📁 Found ${files.length} migration(s)\n`);

    for (const file of files) {
      const filePath = path.join(migrationDir, file);
      const sql = fs.readFileSync(filePath, "utf8");

      console.log(`▶️  Executing: ${file}`);

      try {
        const result = await db.query(sql);
        console.log(`✅ ${file} - completed\n`);
      } catch (err) {
        console.error(`❌ ${file} - failed:`);
        console.error(`   ${err.message}\n`);
        // Continue with other migrations
      }
    }

    console.log("=".repeat(60));
    console.log("✅ Migrations completed!");
    console.log("=".repeat(60));

    await db.close();
    process.exit(0);
  } catch (err) {
    console.error("❌ Migration error:", err.message);
    process.exit(1);
  }
}

runMigrations();
