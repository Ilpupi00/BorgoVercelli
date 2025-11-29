-- Migration: Aggiunta campi identità e telefono alle prenotazioni
-- Data: 2025-11-29
-- Scopo: Rafforzare verifica identità utente e richiedere numero telefono per ogni prenotazione

-- Aggiunge colonna telefono (obbligatorio)
ALTER TABLE PRENOTAZIONI 
ADD COLUMN IF NOT EXISTS telefono VARCHAR(20);

-- Aggiunge colonna codice fiscale (opzionale ma consigliato)
ALTER TABLE PRENOTAZIONI 
ADD COLUMN IF NOT EXISTS codice_fiscale VARCHAR(16);

-- Aggiunge colonna tipo documento (opzionale)
ALTER TABLE PRENOTAZIONI 
ADD COLUMN IF NOT EXISTS tipo_documento VARCHAR(50);

-- Aggiunge colonna numero documento (opzionale)
ALTER TABLE PRENOTAZIONI 
ADD COLUMN IF NOT EXISTS numero_documento VARCHAR(50);

-- Commenti per documentazione
COMMENT ON COLUMN PRENOTAZIONI.telefono IS 'Numero di telefono obbligatorio per la prenotazione - preso da utente o richiesto al momento';
COMMENT ON COLUMN PRENOTAZIONI.codice_fiscale IS 'Codice fiscale per identificazione univoca utente';
COMMENT ON COLUMN PRENOTAZIONI.tipo_documento IS 'Tipo documento identità (es: Carta Identità, Patente, Passaporto)';
COMMENT ON COLUMN PRENOTAZIONI.numero_documento IS 'Numero del documento di identità fornito';

-- Indice per ricerca rapida per telefono (utile per duplicati/verifiche)
CREATE INDEX IF NOT EXISTS idx_prenotazioni_telefono ON PRENOTAZIONI(telefono);
CREATE INDEX IF NOT EXISTS idx_prenotazioni_codice_fiscale ON PRENOTAZIONI(codice_fiscale);
CREATE INDEX IF NOT EXISTS idx_prenotazioni_numero_documento ON PRENOTAZIONI(numero_documento);

-- Restringiamo i valori ammessi per `tipo_documento` a 'CF' (codice fiscale) o 'ID' (documento identificativo)
-- e aggiungiamo vincoli che assicurino che quando `tipo_documento='CF'` sia presente `codice_fiscale`
-- e quando `tipo_documento='ID'` sia presente `numero_documento`.

-- Riduciamo la lunghezza della colonna tipo_documento a 2 caratteri (CF o ID)
ALTER TABLE PRENOTAZIONI
ALTER COLUMN tipo_documento TYPE VARCHAR(2);

-- Aggiunge constraint per i valori ammessi (se non esiste)
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint c
		JOIN pg_class t ON c.conrelid = t.oid
		WHERE t.relname = 'prenotazioni' AND c.conname = 'prenotazioni_tipo_documento_check'
	) THEN
		ALTER TABLE PRENOTAZIONI
		ADD CONSTRAINT prenotazioni_tipo_documento_check CHECK (tipo_documento IN ('CF','ID') OR tipo_documento IS NULL);
	END IF;
END$$;

-- Vincolo per richiedere il campo corretto a seconda del tipo selezionato
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint c
		JOIN pg_class t ON c.conrelid = t.oid
		WHERE t.relname = 'prenotazioni' AND c.conname = 'prenotazioni_documento_presence_check'
	) THEN
		ALTER TABLE PRENOTAZIONI
		ADD CONSTRAINT prenotazioni_documento_presence_check CHECK (
		  (tipo_documento = 'CF' AND codice_fiscale IS NOT NULL AND char_length(codice_fiscale) = 16)
		  OR
		  (tipo_documento = 'ID' AND numero_documento IS NOT NULL AND char_length(numero_documento) > 2)
		  OR
		  (tipo_documento IS NULL)
		);
	END IF;
END$$;

