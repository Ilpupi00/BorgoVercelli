-- ==================== TABELLA TIPI_UTENTE ====================
-- Tabella per definire i ruoli/tipi di utente nel sistema

CREATE TABLE IF NOT EXISTS tipi_utente (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    descrizione TEXT,
    creato_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    aggiornato_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== INSERT TIPI UTENTE ====================

INSERT INTO tipi_utente (id, nome, descrizione) VALUES
(0, 'Utente', 'Tipo utente standard, con accesso limitato alle funzionalità di base del sistema.'),
(1, 'Amministratore', 'Amministratore del sistema con accesso completo'),
(2, 'Presidente', 'Presidente della società sportiva.'),
(3, 'Vice Presidente', 'Vice Presidente della società sportiva'),
(4, 'Dirigente', 'Dirigente della società sportiva.'),
(5, 'Segretario', 'Segretario della società sportiva.'),
(6, 'Gestore Campo', 'Gestore dei campi sportivi con permessi di accettare prenotazioni, modificare campi e orari.')
ON CONFLICT (id) DO UPDATE SET
    nome = EXCLUDED.nome,
    descrizione = EXCLUDED.descrizione,
    aggiornato_at = CURRENT_TIMESTAMP;

-- ==================== INDICI ====================

CREATE INDEX IF NOT EXISTS idx_tipi_utente_nome ON tipi_utente(nome);

-- ==================== VERIFICA ====================

SELECT * FROM tipi_utente ORDER BY id;
