-- ========================================
-- Railway PostgreSQL Migration Script
-- ========================================
-- This script adds all missing columns and records needed for the application to work correctly
-- Run this on your Railway PostgreSQL database

-- ========================================
-- 1. Add missing columns to CAMPIONATI table
-- ========================================
ALTER TABLE CAMPIONATI ADD COLUMN IF NOT EXISTS promozione_diretta INTEGER DEFAULT 2;
ALTER TABLE CAMPIONATI ADD COLUMN IF NOT EXISTS playoff_start INTEGER;
ALTER TABLE CAMPIONATI ADD COLUMN IF NOT EXISTS playoff_end INTEGER;
ALTER TABLE CAMPIONATI ADD COLUMN IF NOT EXISTS playout_start INTEGER;
ALTER TABLE CAMPIONATI ADD COLUMN IF NOT EXISTS playout_end INTEGER;
ALTER TABLE CAMPIONATI ADD COLUMN IF NOT EXISTS retrocessione_diretta INTEGER DEFAULT 2;

-- ========================================
-- 2. Add missing columns to CAMPI table
-- ========================================
ALTER TABLE CAMPI ADD COLUMN IF NOT EXISTS descrizione TEXT;
ALTER TABLE CAMPI ADD COLUMN IF NOT EXISTS Docce BOOLEAN;

-- ========================================
-- 3. Add missing columns to GIOCATORI table
-- ========================================
ALTER TABLE GIOCATORI ADD COLUMN IF NOT EXISTS Nome VARCHAR(255);
ALTER TABLE GIOCATORI ADD COLUMN IF NOT EXISTS Cognome VARCHAR(255);
ALTER TABLE GIOCATORI ADD COLUMN IF NOT EXISTS Nazionalità VARCHAR(255);
ALTER TABLE GIOCATORI ADD COLUMN IF NOT EXISTS immagini_id INTEGER;

-- Add foreign key constraint (drop first if exists to avoid errors)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_giocatori_immagini'
    ) THEN
        ALTER TABLE GIOCATORI ADD CONSTRAINT fk_giocatori_immagini 
            FOREIGN KEY (immagini_id) REFERENCES IMMAGINI(id);
    END IF;
END $$;

-- ========================================
-- 4. Add missing TIPI_UTENTE records
-- ========================================
-- ID 1 = Amministratore (used for admin checks throughout the app)
-- ID 5 = Utente normale (default for new registrations)
INSERT INTO TIPI_UTENTE (id, nome, descrizione) 
VALUES (1, 'Amministratore', 'Amministratore del sistema con accesso completo') 
ON CONFLICT (id) DO NOTHING;

INSERT INTO TIPI_UTENTE (id, nome, descrizione) 
VALUES (5, 'Utente', 'Utente normale del sistema') 
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- 5. Update existing users with tipo_utente_id = 0 to tipo_utente_id = 5
-- ========================================
-- This fixes any existing users that were created with the old default value
UPDATE UTENTI SET tipo_utente_id = 5 WHERE tipo_utente_id = 0;

-- ========================================
-- Migration Complete!
-- ========================================
-- After running this script:
-- 1. Deploy the updated code from GitHub
-- 2. Test user registration
-- 3. Test all features that were showing errors
-- ========================================
