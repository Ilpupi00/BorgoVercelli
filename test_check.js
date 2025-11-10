const db = require('./src/config/database');

function normalizeNow() {
    const now = new Date();
    const currentDate = now.toISOString().slice(0,10);
    const currentTime = now.toTimeString().slice(0,5);
    return { currentDate, currentTime };
}

(async () => {
    const { currentDate, currentTime } = normalizeNow();
    console.log('CurrentDate:', currentDate, 'CurrentTime:', currentTime);
    const sql = `SELECT id, data_prenotazione, ora_inizio, ora_fine, stato FROM PRENOTAZIONI WHERE stato = 'confermata' AND (data_prenotazione < ? OR (data_prenotazione = ? AND ora_fine <= ?))`;
    db.all(sql, [currentDate, currentDate, currentTime], (err, rows) => {
        if (err) {
            console.error('Error running query:', err);
            process.exit(1);
        }
        console.log('Matching rows count:', rows.length);
        console.log(rows);
        process.exit(0);
    });
})();
