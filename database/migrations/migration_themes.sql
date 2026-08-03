-- ==============================================================================
-- Migrazione Database: Sistema Temi Dinamici
-- Autore: AI Assistant
-- Descrizione: Crea le tabelle per la gestione dei temi globali, temi 
--              personalizzati e preferenze degli utenti.
-- ==============================================================================

-- 1. Tabella configurazione globale (singola riga)
CREATE TABLE IF NOT EXISTS tema_config (
    id SERIAL PRIMARY KEY,
    tema_attivo VARCHAR(50) NOT NULL DEFAULT 'light',
    custom_colori JSONB,
    data_aggiornamento TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Assicuriamoci che ci sia sempre e solo una riga di configurazione
CREATE UNIQUE INDEX IF NOT EXISTS idx_tema_config_single_row ON tema_config((1));

-- Inseriamo il valore di default se la tabella è vuota
INSERT INTO tema_config (id, tema_attivo, data_aggiornamento)
VALUES (1, 'light', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- 2. Tabella temi personalizzati (creati dall'admin)
CREATE TABLE IF NOT EXISTS tema_personalizzato (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    descrizione TEXT,
    colori JSONB NOT NULL,
    attivo BOOLEAN DEFAULT true,
    creato_da INTEGER REFERENCES utenti(id) ON DELETE SET NULL,
    data_creazione TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    data_aggiornamento TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indici per i temi personalizzati
CREATE INDEX IF NOT EXISTS idx_tema_personalizzato_slug ON tema_personalizzato(slug);
CREATE INDEX IF NOT EXISTS idx_tema_personalizzato_attivo ON tema_personalizzato(attivo);

-- 3. Tabella preferenze utenti
CREATE TABLE IF NOT EXISTS tema_preferenza_utente (
    utente_id INTEGER PRIMARY KEY REFERENCES utenti(id) ON DELETE CASCADE,
    tema_id VARCHAR(100) NOT NULL,
    data_aggiornamento TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indici per le preferenze utenti (utile per statistiche)
CREATE INDEX IF NOT EXISTS idx_tema_preferenza_tema_id ON tema_preferenza_utente(tema_id);

-- ==============================================================================
-- Trigger per aggiornamento automatico dei timestamp
-- ==============================================================================

-- Funzione generica per aggiornare update_at/data_aggiornamento
CREATE OR REPLACE FUNCTION update_data_aggiornamento_tema()
RETURNS TRIGGER AS $$
BEGIN
    NEW.data_aggiornamento = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger su tema_config
DROP TRIGGER IF EXISTS trg_tema_config_update ON tema_config;
CREATE TRIGGER trg_tema_config_update
BEFORE UPDATE ON tema_config
FOR EACH ROW
EXECUTE FUNCTION update_data_aggiornamento_tema();

-- Trigger su tema_personalizzato
DROP TRIGGER IF EXISTS trg_tema_personalizzato_update ON tema_personalizzato;
CREATE TRIGGER trg_tema_personalizzato_update
BEFORE UPDATE ON tema_personalizzato
FOR EACH ROW
EXECUTE FUNCTION update_data_aggiornamento_tema();

-- Trigger su tema_preferenza_utente
DROP TRIGGER IF EXISTS trg_tema_preferenza_update ON tema_preferenza_utente;
CREATE TRIGGER trg_tema_preferenza_update
BEFORE UPDATE ON tema_preferenza_utente
FOR EACH ROW
EXECUTE FUNCTION update_data_aggiornamento_tema();

-- ==============================================================================
-- Fine Migrazione
-- ==============================================================================
