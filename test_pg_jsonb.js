const db = require('./src/core/config/database');

async function test() {
    try {
        // Test update
        const res = await db.query(`
            SELECT ('["abc", "def"]'::jsonb) - $1 as test_remove,
                   ('["abc", "def"]'::jsonb) @> $2::jsonb as test_contains
        `, ['abc', JSON.stringify(['abc'])]);
        
        console.log(res.rows[0]);

    } catch(e) {
        console.error(e.message);
    } finally {
        process.exit(0);
    }
}
test();
