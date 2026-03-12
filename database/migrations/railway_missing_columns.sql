-- Missing columns for Railway PostgreSQL migration
-- Run this after the initial schema setup

-- Add immagine_profilo to UTENTI if not exists
ALTER TABLE UTENTI ADD COLUMN IF NOT EXISTS immagine_profilo TEXT;

-- Add ruolo_preferito to UTENTI if not exists
ALTER TABLE UTENTI ADD COLUMN IF NOT EXISTS ruolo_preferito TEXT;

-- Add piede_preferito to UTENTI if not exists
ALTER TABLE UTENTI ADD COLUMN IF NOT EXISTS piede_preferito TEXT;

-- Add reset_token to UTENTI if not exists
ALTER TABLE UTENTI ADD COLUMN IF NOT EXISTS reset_token TEXT;

-- Add reset_expires to UTENTI if not exists
ALTER TABLE UTENTI ADD COLUMN IF NOT EXISTS reset_expires TIMESTAMP;

-- Add stato to UTENTI if not exists (attivo, sospeso, bannato)
ALTER TABLE UTENTI ADD COLUMN IF NOT EXISTS stato VARCHAR(20) DEFAULT 'attivo';

-- Add motivo_sospensione to UTENTI if not exists
ALTER TABLE UTENTI ADD COLUMN IF NOT EXISTS motivo_sospensione TEXT;

-- Add data_inizio_sospensione to UTENTI if not exists
ALTER TABLE UTENTI ADD COLUMN IF NOT EXISTS data_inizio_sospensione TIMESTAMP;

-- Add data_fine_sospensione to UTENTI if not exists
ALTER TABLE UTENTI ADD COLUMN IF NOT EXISTS data_fine_sospensione TIMESTAMP;

-- Add admin_sospensione_id to UTENTI if not exists
ALTER TABLE UTENTI ADD COLUMN IF NOT EXISTS admin_sospensione_id INTEGER REFERENCES UTENTI(id);

-- Add descrizione to CAMPI if not exists
ALTER TABLE CAMPI ADD COLUMN IF NOT EXISTS descrizione TEXT;

-- Add Docce to CAMPI if not exists
ALTER TABLE CAMPI ADD COLUMN IF NOT EXISTS Docce INTEGER DEFAULT 0;

-- Add autore_id to EVENTI if not exists (might already exist)
-- This is just for completeness, should already be in schema
-- ALTER TABLE EVENTI ADD COLUMN IF NOT EXISTS autore_id INTEGER REFERENCES UTENTI(id);

-- Add autore_id to NOTIZIE if not exists (might already exist)
-- This is just for completeness, should already be in schema
-- ALTER TABLE NOTIZIE ADD COLUMN IF NOT EXISTS autore_id INTEGER REFERENCES UTENTI(id);

-- Add zone configuration to CAMPIONATI if not exists
ALTER TABLE CAMPIONATI ADD COLUMN IF NOT EXISTS promozione_diretta INTEGER DEFAULT 0;
ALTER TABLE CAMPIONATI ADD COLUMN IF NOT EXISTS playoff_start INTEGER DEFAULT 0;
ALTER TABLE CAMPIONATI ADD COLUMN IF NOT EXISTS playoff_end INTEGER DEFAULT 0;
ALTER TABLE CAMPIONATI ADD COLUMN IF NOT EXISTS playout_start INTEGER DEFAULT 0;
ALTER TABLE CAMPIONATI ADD COLUMN IF NOT EXISTS playout_end INTEGER DEFAULT 0;
ALTER TABLE CAMPIONATI ADD COLUMN IF NOT EXISTS retrocessione_diretta INTEGER DEFAULT 0;

-- Create ORARI_CAMPI table if not exists
CREATE TABLE IF NOT EXISTS ORARI_CAMPI (
    id SERIAL PRIMARY KEY,
    campo_id INTEGER NOT NULL REFERENCES CAMPI(id) ON DELETE CASCADE,
    giorno_settimana INTEGER, -- NULL = default, 0-6 = Domenica-Sabato
    ora_inizio TIME NOT NULL,
    ora_fine TIME NOT NULL,
    attivo INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create DIRIGENTI_SQUADRE table if not exists
CREATE TABLE IF NOT EXISTS DIRIGENTI_SQUADRE (
    id SERIAL PRIMARY KEY,
    utente_id INTEGER NOT NULL REFERENCES UTENTI(id) ON DELETE CASCADE,
    squadra_id INTEGER NOT NULL REFERENCES SQUADRE(id) ON DELETE CASCADE,
    ruolo VARCHAR(100) NOT NULL,
    data_nomina TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_scadenza DATE,
    attivo INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(utente_id, squadra_id, ruolo)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_utenti_email ON UTENTI(email);
CREATE INDEX IF NOT EXISTS idx_utenti_tipo ON UTENTI(tipo_utente_id);
CREATE INDEX IF NOT EXISTS idx_utenti_stato ON UTENTI(stato);
CREATE INDEX IF NOT EXISTS idx_recensioni_visibile ON RECENSIONI(visibile);
CREATE INDEX IF NOT EXISTS idx_notizie_pubblicata ON NOTIZIE(pubblicata);
CREATE INDEX IF NOT EXISTS idx_eventi_pubblicato ON EVENTI(pubblicato);
CREATE INDEX IF NOT EXISTS idx_prenotazioni_campo ON PRENOTAZIONI(campo_id, data_prenotazione);
CREATE INDEX IF NOT EXISTS idx_classifica_campionato ON CLASSIFICA(campionato_id);
CREATE INDEX IF NOT EXISTS idx_orari_campi_campo ON ORARI_CAMPI(campo_id);
CREATE INDEX IF NOT EXISTS idx_dirigenti_squadre ON DIRIGENTI_SQUADRE(utente_id, squadra_id);
