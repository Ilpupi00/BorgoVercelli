require('dotenv').config();
const db = require('./src/core/config/database');

(async () => {
    try {
        console.log("Checking columns...");
        const res = await db.query("SELECT column_name FROM information_schema.columns WHERE table_name='notizie'");
        const columns = res.rows.map(r => r.column_name);
        
        if (!columns.includes('is_pinned')) {
            console.log("Adding is_pinned column...");
            await db.query("ALTER TABLE NOTIZIE ADD COLUMN is_pinned BOOLEAN DEFAULT FALSE");
            console.log("Column added.");
        } else {
            console.log("Column already exists.");
        }
    } catch (e) {
        console.error(e);
    } finally {
        db.close();
        process.exit(0);
    }
})();
