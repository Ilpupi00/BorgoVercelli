-- Aggiunta campi preferenze alla tabella UTENTI
ALTER TABLE UTENTI ADD COLUMN ruolo_preferito TEXT;
ALTER TABLE UTENTI ADD COLUMN piede_preferito TEXT;