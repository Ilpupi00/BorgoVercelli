-- Popola orari di default per tutti i campi attivi
INSERT OR REPLACE INTO ORARI_CAMPI (campo_id, giorno_settimana, ora_inizio, ora_fine, attivo, created_at, updated_at)
SELECT c.id, NULL, '16:00', '17:00', 1, datetime('now'), datetime('now')
FROM CAMPI c WHERE c.attivo = 1;

INSERT OR REPLACE INTO ORARI_CAMPI (campo_id, giorno_settimana, ora_inizio, ora_fine, attivo, created_at, updated_at)
SELECT c.id, NULL, '18:00', '19:00', 1, datetime('now'), datetime('now')
FROM CAMPI c WHERE c.attivo = 1;

INSERT OR REPLACE INTO ORARI_CAMPI (campo_id, giorno_settimana, ora_inizio, ora_fine, attivo, created_at, updated_at)
SELECT c.id, NULL, '20:00', '21:00', 1, datetime('now'), datetime('now')
FROM CAMPI c WHERE c.attivo = 1;

INSERT OR REPLACE INTO ORARI_CAMPI (campo_id, giorno_settimana, ora_inizio, ora_fine, attivo, created_at, updated_at)
SELECT c.id, NULL, '21:00', '22:00', 1, datetime('now'), datetime('now')
FROM CAMPI c WHERE c.attivo = 1;