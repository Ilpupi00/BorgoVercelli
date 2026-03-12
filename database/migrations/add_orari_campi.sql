CREATE TABLE IF NOT EXISTS ORARI_CAMPI (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campo_id INTEGER NOT NULL,
    giorno_settimana INTEGER,  -- 0=Lunedì, 1=Martedì, ..., 6=Domenica, NULL=Default
    ora_inizio TEXT NOT NULL,
    ora_fine TEXT NOT NULL,
    attivo INTEGER DEFAULT 1,
    created_at TEXT,
    updated_at TEXT,
    FOREIGN KEY (campo_id) REFERENCES CAMPI(id),
    UNIQUE(campo_id, giorno_settimana, ora_inizio, ora_fine)
);