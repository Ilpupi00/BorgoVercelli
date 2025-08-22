-- Rimuove il vincolo UNIQUE dalla tabella RECENSIONI
-- SQLite non permette DROP CONSTRAINT direttamente, quindi bisogna:
-- 1. Rinominare la tabella
-- 2. Creare una nuova tabella senza il vincolo UNIQUE
-- 3. Copiare i dati
-- 4. Eliminare la vecchia tabella
-- 5. Rinominare la nuova tabella

PRAGMA foreign_keys=off;

ALTER TABLE RECENSIONI RENAME TO RECENSIONI_OLD;

CREATE TABLE RECENSIONI (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    utente_id INTEGER NOT NULL,
    entita_tipo TEXT NOT NULL,
    entita_id INTEGER NOT NULL,
    valutazione INTEGER NOT NULL,
    titolo TEXT,
    contenuto TEXT,
    data_recensione TEXT NOT NULL,
    visibile INTEGER DEFAULT 1,
    created_at TEXT,
    updated_at TEXT,
    FOREIGN KEY (utente_id) REFERENCES UTENTI(id)
);

INSERT INTO RECENSIONI (id, utente_id, entita_tipo, entita_id, valutazione, titolo, contenuto, data_recensione, visibile, created_at, updated_at)
SELECT id, utente_id, entita_tipo, entita_id, valutazione, titolo, contenuto, data_recensione, visibile, created_at, updated_at FROM RECENSIONI_OLD;

DROP TABLE RECENSIONI_OLD;

PRAGMA foreign_keys=on;
