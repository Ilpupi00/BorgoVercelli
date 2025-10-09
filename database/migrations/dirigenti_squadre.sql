-- Tabella per associare dirigenti a squadre (o societari se squadra_id NULL)
CREATE TABLE DIRIGENTI_SQUADRE (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    utente_id INTEGER NOT NULL,
    squadra_id INTEGER,  -- NULL se dirigente societario
    ruolo TEXT NOT NULL,  -- Es: 'Allenatore', 'Presidente', 'Segretario', ecc.
    data_nomina TEXT,
    data_scadenza TEXT,
    attivo INTEGER DEFAULT 1,
    created_at TEXT,
    updated_at TEXT,
    FOREIGN KEY (utente_id) REFERENCES UTENTI(id),
    FOREIGN KEY (squadra_id) REFERENCES SQUADRE(id),
    UNIQUE(utente_id, squadra_id, ruolo)  -- Un utente può avere un ruolo per squadra
);