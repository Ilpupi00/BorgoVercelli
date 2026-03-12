-- Aggiungere colonna autore_id alla tabella EVENTI
ALTER TABLE EVENTI ADD COLUMN autore_id INTEGER REFERENCES UTENTI(id);