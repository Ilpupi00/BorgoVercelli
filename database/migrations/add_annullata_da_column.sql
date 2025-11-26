-- Migration: Aggiunge colonna annullata_da per tracciare chi ha annullato la prenotazione
-- Data: 2025-11-26
-- Descrizione: Permette di distinguere tra annullamenti fatti dall'utente stesso
--              e annullamenti fatti dall'admin, per gestire la riattivazione

-- Aggiungi la colonna annullata_da
ALTER TABLE PRENOTAZIONI 
ADD COLUMN IF NOT EXISTS annullata_da VARCHAR(10);

-- Commento sulla colonna
COMMENT ON COLUMN PRENOTAZIONI.annullata_da IS 'Indica chi ha annullato: user (utente stesso) o admin (amministratore)';

-- Note: 
-- - La colonna sarà NULL per prenotazioni non annullate
-- - Valori possibili: 'user', 'admin'
-- - Quando stato = 'annullata', questa colonna dovrebbe contenere chi l'ha annullata
