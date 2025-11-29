-- Migration: Aggiunge colonna reminder_sent per tracciare i promemoria inviati
-- Data: 2025-11-29
-- Descrizione: Aggiunge il campo reminder_sent per gestire l'invio automatico 
--              di notifiche promemoria agli utenti 2 ore prima della prenotazione

ALTER TABLE PRENOTAZIONI 
ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT FALSE;

-- Crea indice per ottimizzare le query del worker
CREATE INDEX IF NOT EXISTS idx_prenotazioni_reminder_check 
ON PRENOTAZIONI (stato, reminder_sent, data_prenotazione, ora_inizio)
WHERE stato = 'confermata' AND reminder_sent = false;

COMMENT ON COLUMN PRENOTAZIONI.reminder_sent IS 'Indica se è stato inviato il promemoria push 2 ore prima';
