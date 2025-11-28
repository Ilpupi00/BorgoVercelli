-- Migration: Crea tabella per coda notifiche push
-- Questa tabella memorizza tutte le notifiche da inviare, 
-- permettendo al worker di processarle in modo asincrono

CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL,  -- 'admin' | 'user' | 'all'
    user_ids INTEGER[],  -- Array di user_id per notifiche a utenti specifici
    payload JSONB NOT NULL,  -- Contiene title, body, icon, url, tag, requireInteraction
    status VARCHAR(20) DEFAULT 'pending',  -- 'pending' | 'sending' | 'sent' | 'failed'
    priority INTEGER DEFAULT 0,  -- 0=normale, 1=alta, 2=critica
    send_after TIMESTAMP DEFAULT NOW(),  -- Quando inviare la notifica
    attempts INTEGER DEFAULT 0,  -- Numero di tentativi effettuati
    max_attempts INTEGER DEFAULT 3,  -- Massimo numero di tentativi
    last_error TEXT,  -- Ultimo errore incontrato
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    sent_at TIMESTAMP  -- Quando è stata effettivamente inviata
);

-- Indici per performance del worker
CREATE INDEX IF NOT EXISTS idx_notifications_status_sendafter 
    ON notifications(status, send_after) 
    WHERE status = 'pending' OR status = 'failed';

CREATE INDEX IF NOT EXISTS idx_notifications_type 
    ON notifications(type);

CREATE INDEX IF NOT EXISTS idx_notifications_created 
    ON notifications(created_at DESC);

-- Commenti
COMMENT ON TABLE notifications IS 'Coda notifiche push da processare in modo asincrono';
COMMENT ON COLUMN notifications.type IS 'Tipo di destinatari: admin, user, all';
COMMENT ON COLUMN notifications.user_ids IS 'Array di user_id per notifiche a utenti specifici';
COMMENT ON COLUMN notifications.payload IS 'Payload JSON della notifica (title, body, etc)';
COMMENT ON COLUMN notifications.status IS 'Stato corrente: pending, sending, sent, failed';
COMMENT ON COLUMN notifications.priority IS 'Priorità: 0=normale, 1=alta, 2=critica';
COMMENT ON COLUMN notifications.send_after IS 'Timestamp per notifiche programmate';
COMMENT ON COLUMN notifications.attempts IS 'Numero di tentativi di invio effettuati';
