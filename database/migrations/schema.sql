PRAGMA foreign_keys = ON;

CREATE TABLE TIPI_UTENTE (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT UNIQUE NOT NULL,
    descrizione TEXT
);

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
    FOREIGN KEY (tipo_utente_id) REFERENCES TIPI_UTENTE(id)
);

CREATE TABLE SQUADRE (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    anno_fondazione INTEGER,
    FOREIGN KEY (allenatore_id) REFERENCES UTENTI(id)
);

CREATE TABLE GIOCATORI (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    utente_id INTEGER,
    squadra_id INTEGER,
    numero_maglia INTEGER,
    ruolo TEXT,
    data_nascita TEXT,
    altezza REAL,
    peso REAL,
    piede_preferito TEXT,
    data_inizio_tesseramento TEXT,
    data_fine_tesseramento TEXT,
    attivo INTEGER,
    created_at TEXT,
    updated_at TEXT,
    FOREIGN KEY (utente_id) REFERENCES UTENTI(id),
    FOREIGN KEY (squadra_id) REFERENCES SQUADRE(id)
);

CREATE TABLE CAMPI (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    indirizzo TEXT,
    tipo_superficie TEXT,
    dimensioni TEXT,
    illuminazione INTEGER,
    coperto INTEGER,
    spogliatoi INTEGER,
    capienza_pubblico INTEGER,
    attivo INTEGER,
    created_at TEXT,
    updated_at TEXT,
    id_immagine INTEGER,
    FOREIGN KEY (id_immagine) REFERENCES IMMAGINI(id)
);

CREATE TABLE PRENOTAZIONI (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campo_id INTEGER,
    utente_id INTEGER,
    squadra_id INTEGER,
    data_prenotazione TEXT NOT NULL,
    ora_inizio TEXT NOT NULL,
    ora_fine TEXT NOT NULL,
    tipo_attivita TEXT,
    note TEXT,
    stato TEXT,
    created_at TEXT,
    updated_at TEXT,
    FOREIGN KEY (campo_id) REFERENCES CAMPI(id),
    FOREIGN KEY (utente_id) REFERENCES UTENTI(id),
    FOREIGN KEY (squadra_id) REFERENCES SQUADRE(id),
    UNIQUE(campo_id, data_prenotazione, ora_inizio, ora_fine)
);

CREATE TABLE IMMAGINI (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titolo TEXT,
    descrizione TEXT,
    url TEXT NOT NULL,
    tipo TEXT,
    entita_riferimento TEXT,
    entita_id INTEGER,
    ordine INTEGER,
    created_at TEXT,
    updated_at TEXT
);

CREATE TABLE NOTIZIE (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titolo TEXT NOT NULL,
    sottotitolo TEXT,
    contenuto TEXT NOT NULL,
    autore_id INTEGER,
    immagine_principale_id INTEGER,
    pubblicata INTEGER,
    data_pubblicazione TEXT,
    visualizzazioni INTEGER,
    created_at TEXT,
    updated_at TEXT,
    FOREIGN KEY (autore_id) REFERENCES UTENTI(id),
    FOREIGN KEY (immagine_principale_id) REFERENCES IMMAGINI(id)
);

CREATE TABLE EVENTI (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titolo TEXT NOT NULL,
    descrizione TEXT,
    data_inizio TEXT NOT NULL,
    data_fine TEXT,
    luogo TEXT,
    tipo_evento TEXT,
    squadra_id INTEGER,
    campo_id INTEGER,
    max_partecipanti INTEGER,
    pubblicato INTEGER,
    created_at TEXT,
    updated_at TEXT,
    FOREIGN KEY (squadra_id) REFERENCES SQUADRE(id),
    FOREIGN KEY (campo_id) REFERENCES CAMPI(id)
);

CREATE TABLE CAMPIONATI (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    stagione TEXT NOT NULL,
    categoria TEXT,
    fonte_esterna_id TEXT,
    url_fonte TEXT,
    attivo INTEGER,
    created_at TEXT,
    updated_at TEXT
);

CREATE TABLE CLASSIFICA (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campionato_id INTEGER,
    squadra_nome TEXT NOT NULL,
    nostra_squadra_id INTEGER,
    posizione INTEGER NOT NULL,
    punti INTEGER NOT NULL,
    partite_giocate INTEGER,
    vittorie INTEGER,
    pareggi INTEGER,
    sconfitte INTEGER,
    gol_fatti INTEGER,
    gol_subiti INTEGER,
    differenza_reti INTEGER,
    ultimo_aggiornamento TEXT,
    created_at TEXT,
    updated_at TEXT,
    FOREIGN KEY (campionato_id) REFERENCES CAMPIONATI(id),
    FOREIGN KEY (nostra_squadra_id) REFERENCES SQUADRE(id),
    UNIQUE(campionato_id, squadra_nome)
);

CREATE TABLE PARTECIPAZIONI_EVENTI (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    evento_id INTEGER,
    utente_id INTEGER,
    stato TEXT,
    note TEXT,
    created_at TEXT,
    FOREIGN KEY (evento_id) REFERENCES EVENTI(id),
    FOREIGN KEY (utente_id) REFERENCES UTENTI(id),
    UNIQUE(evento_id, utente_id)
);

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
    FOREIGN KEY (utente_id) REFERENCES UTENTI(id),
    UNIQUE(utente_id, entita_tipo, entita_id)
);

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

CREATE TABLE ORARI_CAMPI (
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