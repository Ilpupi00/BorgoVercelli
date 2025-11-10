-- Aggiunta colonne per gestione sospensione e ban utenti
PRAGMA foreign_keys = OFF;

-- Aggiungi colonne alla tabella UTENTI
ALTER TABLE UTENTI ADD COLUMN stato TEXT DEFAULT 'attivo' CHECK(stato IN ('attivo', 'sospeso', 'bannato'));
ALTER TABLE UTENTI ADD COLUMN motivo_sospensione TEXT;
ALTER TABLE UTENTI ADD COLUMN data_inizio_sospensione TEXT;
ALTER TABLE UTENTI ADD COLUMN data_fine_sospensione TEXT;
ALTER TABLE UTENTI ADD COLUMN admin_sospensione_id INTEGER;

-- Aggiungi foreign key constraint
-- ALTER TABLE UTENTI ADD CONSTRAINT fk_admin_sospensione FOREIGN KEY (admin_sospensione_id) REFERENCES UTENTI(id);

PRAGMA foreign_keys = ON;
