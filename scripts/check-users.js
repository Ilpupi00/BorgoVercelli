require("dotenv").config();
const db = require("../src/core/config/database");

(async () => {
  try {
    await db.ready;
    const newUsers = await db.query(
      "SELECT id, email, tipo_utente_id FROM utenti ORDER BY id DESC LIMIT 3"
    );
    console.log("\n✅ Last 3 registered users:");
    console.table(newUsers.rows);
    await db.close();
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
})();
