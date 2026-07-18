-- ============================================================
-- Migration: add_pops_table.sql
-- Scopo:
--   1. Aggiunge is_pinned a NOTIZIE (fix compatibilità branch feat/pin_news)
--   2. Crea la tabella POPS per i popup gestiti dall'admin
-- ============================================================

-- 1. Fix is_pinned su NOTIZIE (colonna richiesta dal codice su produzione)
ALTER TABLE NOTIZIE ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;

-- 2. Crea tabella POPS
CREATE TABLE IF NOT EXISTS POPS (
    id              SERIAL PRIMARY KEY,
    titolo          VARCHAR(255) NOT NULL,
    messaggio       TEXT         NOT NULL,
    icona           VARCHAR(100) DEFAULT '📢',
    colore_primario   VARCHAR(20) DEFAULT '#3b82f6',
    colore_secondario VARCHAR(20) DEFAULT '#1e40af',

    -- 'default' = ricorrente ogni anno (usa giorno/mese)
    -- 'custom'  = una-tantum (usa data_inizio / data_fine)
    tipo            VARCHAR(20)  DEFAULT 'custom' CHECK (tipo IN ('default','custom')),

    -- Campi per tipo 'default' (si ripete ogni anno, basta giorno+mese)
    giorno_inizio   INTEGER CHECK (giorno_inizio BETWEEN 1 AND 31),
    mese_inizio     INTEGER CHECK (mese_inizio  BETWEEN 1 AND 12),
    giorno_fine     INTEGER CHECK (giorno_fine  BETWEEN 1 AND 31),
    mese_fine       INTEGER CHECK (mese_fine    BETWEEN 1 AND 12),

    -- Campi per tipo 'custom' (date complete)
    data_inizio     DATE,
    data_fine       DATE,

    attivo          BOOLEAN      DEFAULT TRUE,
    autore_id       INTEGER      REFERENCES UTENTI(id) ON DELETE SET NULL,
    created_at      TIMESTAMP    DEFAULT NOW(),
    updated_at      TIMESTAMP    DEFAULT NOW()
);

-- Indici
CREATE INDEX IF NOT EXISTS idx_pops_tipo   ON POPS(tipo);
CREATE INDEX IF NOT EXISTS idx_pops_attivo ON POPS(attivo);
