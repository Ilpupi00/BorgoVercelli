-- Active: 1762870879414@@shortline.proxy.rlwy.net@32056@railway
-- Aggiunge colonne per supporto OAuth (Google, Facebook, Apple)
-- oauth_provider: il nome del provider ('google', 'facebook', 'apple')
-- oauth_id: l'ID univoco restituito dal provider

ALTER TABLE utenti ADD COLUMN IF NOT EXISTS oauth_provider VARCHAR(20) DEFAULT NULL;
ALTER TABLE utenti ADD COLUMN IF NOT EXISTS oauth_id VARCHAR(255) DEFAULT NULL;

-- Rende password_hash facoltativo per utenti OAuth
ALTER TABLE utenti ALTER COLUMN password_hash DROP NOT NULL;

-- Indice univoco per combinazione provider+id (non possono esistere duplicati)
CREATE UNIQUE INDEX IF NOT EXISTS idx_utenti_oauth ON utenti (oauth_provider, oauth_id)
  WHERE oauth_provider IS NOT NULL AND oauth_id IS NOT NULL;

-- Colonna per URL foto profilo OAuth (backup resiliente, non dipende da tabella IMMAGINI)
ALTER TABLE utenti ADD COLUMN IF NOT EXISTS foto_oauth TEXT DEFAULT NULL;
