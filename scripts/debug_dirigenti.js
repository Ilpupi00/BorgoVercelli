const db = require('../src/core/config/database');

const sql = `
SELECT
    ds.id AS ds_id,
    ds.utente_id AS ds_utente_id,
    ds.squadra_id AS ds_squadra_id,
    ds.ruolo AS ds_ruolo,
    ds.attivo AS ds_attivo,
    u.nome AS utente_nome,
    u.cognome AS utente_cognome,
    u.email AS utente_email,
    i.url AS immagine_profilo,
    s.nome AS squadra_nome
FROM DIRIGENTI_SQUADRE ds
JOIN UTENTI u ON ds.utente_id = u.id
LEFT JOIN SQUADRE s ON ds.squadra_id = s.id
LEFT JOIN IMMAGINI i ON i.entita_riferimento = 'utente'
    AND i.entita_id = u.id
    AND (i.ordine = 1 OR i.ordine IS NULL)
WHERE ds.attivo = true
ORDER BY ds.squadra_id, ds.ruolo
`;

db.all(sql, [], (err, rows) => {
    if (err) {
        console.error('Errore esecuzione query debug dirigenti:', err);
        process.exit(1);
    }
    console.log('DEBUG DIRIGENTI ROWS:');
    console.log(JSON.stringify(rows, null, 2));
    process.exit(0);
});
