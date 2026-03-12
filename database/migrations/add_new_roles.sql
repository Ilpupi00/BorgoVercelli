-- Migration: Aggiornamento sistema ruoli
-- Aggiunge i nuovi ruoli: Segretario e Gestore Campo
-- Data: 2025-12-14

-- Inserisce il ruolo Segretario
INSERT INTO TIPI_UTENTE (id, nome, descrizione)
VALUES (5, 'Segretario', 'Segretario della società sportiva con accesso a tutte le squadre.')
ON CONFLICT (id) DO UPDATE SET 
    nome = EXCLUDED.nome,
    descrizione = EXCLUDED.descrizione;

-- Inserisce il ruolo Gestore Campo
INSERT INTO TIPI_UTENTE (id, nome, descrizione)
VALUES (6, 'Gestore Campo', 'Gestore dei campi sportivi con permessi di accettare prenotazioni, modificare campi e orari.')
ON CONFLICT (id) DO UPDATE SET 
    nome = EXCLUDED.nome,
    descrizione = EXCLUDED.descrizione;

-- Verifica inserimento
SELECT * FROM TIPI_UTENTE ORDER BY id;
