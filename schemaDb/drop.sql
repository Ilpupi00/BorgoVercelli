DROP TABLE UTENTI;

CREATE TABLE UTENTI (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  nome TEXT NOT NULL,
  cognome TEXT NOT NULL,
  telefono TEXT,
  tipo_utente_id INTEGER,
  data_registrazione TEXT,
  created_at TEXT,
  updated_at TEXT,
  FOREIGN KEY (tipo_utente_id) REFERENCES TIPI_UTENTE (id)
);