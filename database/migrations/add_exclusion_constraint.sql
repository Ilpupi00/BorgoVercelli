-- Migration: Add exclusion constraint to prevent overlapping bookings
-- This constraint ensures that no two bookings for the same campo_id can have overlapping time ranges

-- Enable btree_gist extension (required for exclusion constraints with ranges)
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Add exclusion constraint to PRENOTAZIONI table
-- This prevents race conditions and ensures data integrity at the database level
-- Two bookings overlap if NOT (fine <= inizio2 OR inizio >= fine2)
-- The constraint uses tstzrange to represent time intervals and && operator for overlap check

-- First, we need to add temporary columns to store full timestamps
-- (since we have separate date and time columns)
ALTER TABLE PRENOTAZIONI 
ADD COLUMN IF NOT EXISTS inizio_timestamp TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS fine_timestamp TIMESTAMPTZ;

-- Update existing records to populate the timestamp columns
UPDATE PRENOTAZIONI
SET 
    inizio_timestamp = (data_prenotazione::date + ora_inizio::time),
    fine_timestamp = (data_prenotazione::date + ora_fine::time);

-- Create a function to automatically update the timestamp columns
CREATE OR REPLACE FUNCTION update_prenotazione_timestamps()
RETURNS TRIGGER AS $$
BEGIN
    NEW.inizio_timestamp := (NEW.data_prenotazione::date + NEW.ora_inizio::time);
    NEW.fine_timestamp := (NEW.data_prenotazione::date + NEW.ora_fine::time);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to maintain timestamp columns
DROP TRIGGER IF EXISTS trigger_update_prenotazione_timestamps ON PRENOTAZIONI;
CREATE TRIGGER trigger_update_prenotazione_timestamps
    BEFORE INSERT OR UPDATE ON PRENOTAZIONI
    FOR EACH ROW
    EXECUTE FUNCTION update_prenotazione_timestamps();

-- Add the exclusion constraint
-- This ensures no two active bookings for the same campo can overlap
-- We only check non-cancelled bookings (stato != 'annullata')
ALTER TABLE PRENOTAZIONI
DROP CONSTRAINT IF EXISTS prenotazioni_no_overlap;

ALTER TABLE PRENOTAZIONI
ADD CONSTRAINT prenotazioni_no_overlap 
EXCLUDE USING GIST (
    campo_id WITH =, 
    tstzrange(inizio_timestamp, fine_timestamp) WITH &&
)
WHERE (stato != 'annullata' AND stato != 'rifiutata');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_prenotazioni_timestamps 
ON PRENOTAZIONI(campo_id, inizio_timestamp, fine_timestamp)
WHERE stato != 'annullata' AND stato != 'rifiutata';

-- Note: This migration adds robust database-level protection against overlapping bookings.
-- The exclusion constraint will raise an error (code 23P01) if a conflicting booking is attempted.
