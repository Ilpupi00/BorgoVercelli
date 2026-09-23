-- Script SQL per creare il database Postgres per Sito_BorgoVercelli
-- Basato sugli schemi estratti dal dump SQLite

-- Creazione delle tabelle
DROP TABLE IF EXISTS TIPI_UTENTE;
DROP TABLE IF EXISTS UTENTI;
DROP TABLE IF EXISTS SQUADRE;
DROP TABLE IF EXISTS GIOCATORI;
DROP TABLE IF EXISTS CAMPI;
DROP TABLE IF EXISTS PRENOTAZIONI;
DROP TABLE IF EXISTS IMMAGINI;
DROP TABLE IF EXISTS NOTIZIE;
DROP TABLE IF EXISTS EVENTI;
DROP TABLE IF EXISTS CAMPIONATI;
DROP TABLE IF EXISTS CLASSIFICA;
DROP TABLE IF EXISTS PARTECIPAZIONI_EVENTI;
DROP TABLE IF EXISTS RECENSIONI;
DROP TABLE IF EXISTS DIRIGENTI_SQUADRE;
DROP TABLE IF EXISTS ORARI_CAMPI;

CREATE TABLE TIPI_UTENTE (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) UNIQUE NOT NULL,
    descrizione TEXT
);

CREATE TABLE UTENTI (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nome VARCHAR(255) NOT NULL,
    cognome VARCHAR(255) NOT NULL,
    telefono VARCHAR(255),
    ruolo_preferito VARCHAR(255),
    piede_preferito VARCHAR(255),
    tipo_utente_id INTEGER,
    data_registrazione TIMESTAMP,
    reset_token VARCHAR(255),
    reset_expires TIMESTAMP,
    stato VARCHAR(255),
    motivo_sospensione TEXT,
    data_inizio_sospensione TIMESTAMP,
    data_fine_sospensione TIMESTAMP,
    admin_sospensione_id INTEGER,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (tipo_utente_id) REFERENCES TIPI_UTENTE(id),
    FOREIGN KEY (admin_sospensione_id) REFERENCES UTENTI(id)
);

CREATE TABLE SQUADRE (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    categoria VARCHAR(255),
    anno_fondazione INTEGER,
    colori_sociali VARCHAR(255),
    stemma_url VARCHAR(255),
    allenatore_id INTEGER,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (allenatore_id) REFERENCES UTENTI(id)
);

CREATE TABLE GIOCATORI (
    id SERIAL PRIMARY KEY,
    utente_id INTEGER,
    squadra_id INTEGER,
    numero_maglia INTEGER,
    ruolo VARCHAR(255),
    data_nascita DATE,
    altezza REAL,
    peso REAL,
    piede_preferito VARCHAR(255),
    data_inizio_tesseramento DATE,
    data_fine_tesseramento DATE,
    attivo BOOLEAN,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    Nome VARCHAR(255),
    Cognome VARCHAR(255),
    Nazionalità VARCHAR(255),
    immagini_id INTEGER,
    FOREIGN KEY (utente_id) REFERENCES UTENTI(id),
    FOREIGN KEY (squadra_id) REFERENCES SQUADRE(id),
    FOREIGN KEY (immagini_id) REFERENCES IMMAGINI(id)
);

CREATE TABLE CAMPI (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    indirizzo TEXT,
    tipo_superficie VARCHAR(255),
    dimensioni VARCHAR(255),
    illuminazione BOOLEAN,
    coperto BOOLEAN,
    spogliatoi BOOLEAN,
    capienza_pubblico INTEGER,
    attivo BOOLEAN,
    descrizione TEXT,
    Docce BOOLEAN,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE PRENOTAZIONI (
    id SERIAL PRIMARY KEY,
    campo_id INTEGER,
    utente_id INTEGER,
    squadra_id INTEGER,
    data_prenotazione DATE NOT NULL,
    ora_inizio TIME NOT NULL,
    ora_fine TIME NOT NULL,
    tipo_attivita VARCHAR(255),
    note TEXT,
    stato VARCHAR(255),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (campo_id) REFERENCES CAMPI(id),
    FOREIGN KEY (utente_id) REFERENCES UTENTI(id),
    FOREIGN KEY (squadra_id) REFERENCES SQUADRE(id),
    UNIQUE(campo_id, data_prenotazione, ora_inizio, ora_fine)
);

CREATE TABLE IMMAGINI (
    id SERIAL PRIMARY KEY,
    titolo VARCHAR(255),
    descrizione TEXT,
    url VARCHAR(255) NOT NULL,
    tipo VARCHAR(255),
    entita_riferimento VARCHAR(255),
    entita_id INTEGER,
    ordine INTEGER,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE NOTIZIE (
    id SERIAL PRIMARY KEY,
    titolo VARCHAR(255) NOT NULL,
    sottotitolo VARCHAR(255),
    contenuto TEXT NOT NULL,
    autore_id INTEGER,
    immagine_principale_id INTEGER,
    pubblicata BOOLEAN,
    data_pubblicazione TIMESTAMP,
    visualizzazioni INTEGER,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (autore_id) REFERENCES UTENTI(id),
    FOREIGN KEY (immagine_principale_id) REFERENCES IMMAGINI(id)
);

CREATE TABLE EVENTI (
    id SERIAL PRIMARY KEY,
    titolo VARCHAR(255) NOT NULL,
    descrizione TEXT,
    data_inizio TIMESTAMP NOT NULL,
    data_fine TIMESTAMP,
    luogo VARCHAR(255),
    tipo_evento VARCHAR(255),
    autore_id INTEGER,
    squadra_id INTEGER,
    campo_id INTEGER,
    max_partecipanti INTEGER,
    pubblicato BOOLEAN,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (autore_id) REFERENCES UTENTI(id),
    FOREIGN KEY (squadra_id) REFERENCES SQUADRE(id),
    FOREIGN KEY (campo_id) REFERENCES CAMPI(id)
);

CREATE TABLE CAMPIONATI (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    stagione VARCHAR(255) NOT NULL,
    categoria VARCHAR(255),
    fonte_esterna_id VARCHAR(255),
    url_fonte VARCHAR(255),
    attivo BOOLEAN,
    promozione_diretta INTEGER DEFAULT 2,
    playoff_start INTEGER,
    playoff_end INTEGER,
    playout_start INTEGER,
    playout_end INTEGER,
    retrocessione_diretta INTEGER DEFAULT 2,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE CLASSIFICA (
    id SERIAL PRIMARY KEY,
    campionato_id INTEGER,
    squadra_nome VARCHAR(255) NOT NULL,
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
    ultimo_aggiornamento TIMESTAMP,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (campionato_id) REFERENCES CAMPIONATI(id),
    FOREIGN KEY (nostra_squadra_id) REFERENCES SQUADRE(id),
    UNIQUE(campionato_id, squadra_nome)
);

CREATE TABLE PARTECIPAZIONI_EVENTI (
    id SERIAL PRIMARY KEY,
    evento_id INTEGER,
    utente_id INTEGER,
    stato VARCHAR(255),
    note TEXT,
    created_at TIMESTAMP,
    FOREIGN KEY (evento_id) REFERENCES EVENTI(id),
    FOREIGN KEY (utente_id) REFERENCES UTENTI(id),
    UNIQUE(evento_id, utente_id)
);

-- Nota: RECENSIONI, DIRIGENTI_SQUADRE, ORARI_CAMPI sono nel schema ma non nel dump iniziale, ma le includo se presenti.

CREATE TABLE RECENSIONI (
    id SERIAL PRIMARY KEY,
    utente_id INTEGER NOT NULL,
    entita_tipo VARCHAR(255) NOT NULL,
    entita_id INTEGER NOT NULL,
    valutazione INTEGER NOT NULL,
    titolo VARCHAR(255),
    contenuto TEXT,
    data_recensione TIMESTAMP NOT NULL,
    visibile BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (utente_id) REFERENCES UTENTI(id),
    UNIQUE(utente_id, entita_tipo, entita_id)
);

CREATE TABLE DIRIGENTI_SQUADRE (
    id SERIAL PRIMARY KEY,
    utente_id INTEGER NOT NULL,
    squadra_id INTEGER,
    ruolo VARCHAR(255) NOT NULL,
    data_nomina DATE,
    data_scadenza DATE,
    attivo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (utente_id) REFERENCES UTENTI(id),
    FOREIGN KEY (squadra_id) REFERENCES SQUADRE(id),
    UNIQUE(utente_id, squadra_id, ruolo)
);

CREATE TABLE ORARI_CAMPI (
    id SERIAL PRIMARY KEY,
    campo_id INTEGER NOT NULL,
    giorno_settimana INTEGER,
    ora_inizio TIME NOT NULL,
    ora_fine TIME NOT NULL,
    attivo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (campo_id) REFERENCES CAMPI(id),
    UNIQUE(campo_id, giorno_settimana, ora_inizio, ora_fine)
);

-- Inserimento dati iniziali per TIPI_UTENTE
INSERT INTO TIPI_UTENTE (nome, descrizione) VALUES ('Utente', 'Tipo utente standard, con accesso limitato alle funzionalità di base del sistema.');

-- Nota: Puoi aggiungere altri INSERT se necessario dal dump.