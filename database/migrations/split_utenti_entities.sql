-- ============================================================================
-- MIGRAZIONE: Split tabella UTENTI in entità separate
-- ============================================================================
-- Crea 4 tabelle 1:1 con UTENTI e migra i dati esistenti.
-- Il campo `stato` resta in UTENTI perché usato ovunque per controllo accessi.
-- ============================================================================

BEGIN;

-- 1) UTENTI_SOSPENSIONI --------------------------------------------------
CREATE TABLE IF NOT EXISTS UTENTI_SOSPENSIONI (
    id SERIAL PRIMARY KEY,
    utente_id INTEGER NOT NULL UNIQUE REFERENCES UTENTI(id) ON DELETE CASCADE,
    motivo TEXT,
    data_inizio TIMESTAMP NOT NULL DEFAULT NOW(),
    data_fine TIMESTAMP,                       -- NULL = ban permanente
    admin_id INTEGER REFERENCES UTENTI(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Migra dati esistenti (solo utenti sospesi o bannati)
INSERT INTO UTENTI_SOSPENSIONI (utente_id, motivo, data_inizio, data_fine, admin_id, created_at)
SELECT id, motivo_sospensione, data_inizio_sospensione, data_fine_sospensione,
       admin_sospensione_id, COALESCE(data_inizio_sospensione, NOW())
FROM UTENTI
WHERE stato IN ('sospeso', 'bannato')
  AND motivo_sospensione IS NOT NULL
ON CONFLICT (utente_id) DO NOTHING;

-- 2) UTENTI_RESET_TOKEN --------------------------------------------------
CREATE TABLE IF NOT EXISTS UTENTI_RESET_TOKEN (
    id SERIAL PRIMARY KEY,
    utente_id INTEGER NOT NULL UNIQUE REFERENCES UTENTI(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL,
    expires TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Migra token esistenti
INSERT INTO UTENTI_RESET_TOKEN (utente_id, token, expires)
SELECT id, reset_token, reset_expires
FROM UTENTI
WHERE reset_token IS NOT NULL AND reset_expires IS NOT NULL
ON CONFLICT (utente_id) DO NOTHING;

-- 3) UTENTI_PREFERENZE ---------------------------------------------------
CREATE TABLE IF NOT EXISTS UTENTI_PREFERENZE (
    id SERIAL PRIMARY KEY,
    utente_id INTEGER NOT NULL UNIQUE REFERENCES UTENTI(id) ON DELETE CASCADE,
    ruolo_preferito VARCHAR(50),
    piede_preferito VARCHAR(50)
);

-- Migra preferenze esistenti (solo se almeno uno dei campi è valorizzato)
INSERT INTO UTENTI_PREFERENZE (utente_id, ruolo_preferito, piede_preferito)
SELECT id, ruolo_preferito, piede_preferito
FROM UTENTI
WHERE ruolo_preferito IS NOT NULL OR piede_preferito IS NOT NULL
ON CONFLICT (utente_id) DO NOTHING;

-- 4) UTENTI_DATI_PERSONALI -----------------------------------------------
CREATE TABLE IF NOT EXISTS UTENTI_DATI_PERSONALI (
    id SERIAL PRIMARY KEY,
    utente_id INTEGER NOT NULL UNIQUE REFERENCES UTENTI(id) ON DELETE CASCADE,
    data_nascita DATE,
    codice_fiscale VARCHAR(16)
);

-- Migra dati personali esistenti
INSERT INTO UTENTI_DATI_PERSONALI (utente_id, data_nascita, codice_fiscale)
SELECT id, data_nascita, codice_fiscale
FROM UTENTI
WHERE data_nascita IS NOT NULL OR codice_fiscale IS NOT NULL
ON CONFLICT (utente_id) DO NOTHING;

-- 5) Rimuovi colonne migrate da UTENTI -----------------------------------
ALTER TABLE UTENTI DROP COLUMN IF EXISTS motivo_sospensione;
ALTER TABLE UTENTI DROP COLUMN IF EXISTS data_inizio_sospensione;
ALTER TABLE UTENTI DROP COLUMN IF EXISTS data_fine_sospensione;
ALTER TABLE UTENTI DROP COLUMN IF EXISTS admin_sospensione_id;
ALTER TABLE UTENTI DROP COLUMN IF EXISTS reset_token;
ALTER TABLE UTENTI DROP COLUMN IF EXISTS reset_expires;
ALTER TABLE UTENTI DROP COLUMN IF EXISTS ruolo_preferito;
ALTER TABLE UTENTI DROP COLUMN IF EXISTS piede_preferito;
ALTER TABLE UTENTI DROP COLUMN IF EXISTS data_nascita;
ALTER TABLE UTENTI DROP COLUMN IF EXISTS codice_fiscale;

-- 6) Indici per performance -----------------------------------------------
CREATE INDEX IF NOT EXISTS idx_sospensioni_admin ON UTENTI_SOSPENSIONI(admin_id);
CREATE INDEX IF NOT EXISTS idx_reset_token ON UTENTI_RESET_TOKEN(token);
CREATE INDEX IF NOT EXISTS idx_reset_expires ON UTENTI_RESET_TOKEN(expires);

COMMIT;
