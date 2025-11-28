-- Migration: Aggiungi tabella per push subscriptions
-- Descrizione: Crea la tabella per memorizzare le subscription push web invece del file JSON
-- Data: 2025-11-28

-- Crea la tabella per le subscription push
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_success_at TIMESTAMP,
    last_error_at TIMESTAMP,
    error_count INTEGER DEFAULT 0
);

-- Aggiungi foreign key a users se la tabella esiste
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') THEN
        ALTER TABLE push_subscriptions 
        ADD CONSTRAINT fk_push_subscriptions_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Foreign key a users aggiunta con successo';
    ELSE
        RAISE NOTICE 'Tabella users non trovata, foreign key non aggiunta';
    END IF;
END $$;

-- Indici per migliorare le performance
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_is_admin ON push_subscriptions(is_admin);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);

-- Trigger per aggiornare updated_at automaticamente
CREATE OR REPLACE FUNCTION update_push_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER push_subscriptions_updated_at
    BEFORE UPDATE ON push_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_push_subscriptions_updated_at();

-- Commenti sulla tabella e colonne per documentazione
COMMENT ON TABLE push_subscriptions IS 'Memorizza le subscription per le notifiche push web';
COMMENT ON COLUMN push_subscriptions.endpoint IS 'URL endpoint univoco della subscription';
COMMENT ON COLUMN push_subscriptions.p256dh IS 'Chiave pubblica per la crittografia (keys.p256dh)';
COMMENT ON COLUMN push_subscriptions.auth IS 'Secret di autenticazione per la crittografia (keys.auth)';
COMMENT ON COLUMN push_subscriptions.is_admin IS 'Flag per identificare se l''utente è admin';
COMMENT ON COLUMN push_subscriptions.user_agent IS 'User agent del browser per debug';
COMMENT ON COLUMN push_subscriptions.error_count IS 'Contatore di errori consecutivi per pulizia automatica';
