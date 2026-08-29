-- 1. Aggiunta campi per la sicurezza nella tabella UTENTI
ALTER TABLE UTENTI 
ADD COLUMN IF NOT EXISTS due_fattori_attivo BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS due_fattori_segreto VARCHAR(255),
ADD COLUMN IF NOT EXISTS codici_backup JSONB, -- Array di codici di emergenza
ADD COLUMN IF NOT EXISTS ultima_modifica_password TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- 2. Creazione tabella per la Cronologia degli Accessi (Attività di accesso)
CREATE TABLE IF NOT EXISTS ATTIVITA_ACCESSI (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES UTENTI(id) ON DELETE CASCADE,
    dispositivo VARCHAR(255),    -- es. "MacBook Pro M2" o "iPhone 14 Pro"
    browser VARCHAR(255),        -- es. "Safari 16.0"
    sistema_operativo VARCHAR(255), -- es. "macOS", "iOS", "Windows 10"
    indirizzo_ip VARCHAR(45),
    posizione VARCHAR(255),      -- es. "Milano, IT" (ricavata dall'IP)
    stato VARCHAR(50) NOT NULL,  -- 'RIUSCITO', 'BLOCCATO', 'FALLITO'
    creato_il TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indice per velocizzare le query sulla cronologia di un utente specifico
CREATE INDEX IF NOT EXISTS idx_attivita_accessi_user_id ON ATTIVITA_ACCESSI(user_id);