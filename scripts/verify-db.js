require("dotenv").config();
const db = require("../src/core/config/database");

(async () => {
  try {
    await db.ready;

    console.log("\n📊 Checking tipi_utente table...");
    const tipiUtente = await db.query("SELECT * FROM tipi_utente ORDER BY id");
    console.table(tipiUtente.rows);

    console.log("\n📊 Checking UTENTI table schema...");
    const schema = await db.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'utenti' 
      ORDER BY ordinal_position
    `);
    console.log(schema.rows);

    console.log("\n📊 Sample UTENTI records...");
    const utenti = await db.query(
      "SELECT id, email, tipo_utente_id FROM utenti LIMIT 5"
    );
    console.table(utenti.rows);

    console.log("\n✅ Database verification complete!");
    await db.close();
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
})();
