-- Aggiungere colonne per reset password
ALTER TABLE UTENTI ADD reset_token TEXT;
ALTER TABLE UTENTI ADD reset_expires TEXT;