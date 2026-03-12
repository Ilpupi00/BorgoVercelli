-- Script di test per verificare i nuovi ruoli
-- Eseguire questo script per testare il sistema dei ruoli

-- 1. Verifica che i nuovi ruoli siano stati creati
SELECT * FROM TIPI_UTENTE ORDER BY id;
-- Output atteso:
-- ID 0: Utente
-- ID 1: Admin
-- ID 2: Presidente
-- ID 3: Vice Presidente
-- ID 4: Dirigente
-- ID 5: Segretario
-- ID 6: Gestore Campo

-- 2. Crea utenti di test (opzionale)
-- NOTA: Sostituire email e password con valori reali

-- Crea un Segretario di test
-- INSERT INTO UTENTI (email, password_hash, nome, cognome, tipo_utente_id, data_registrazione)
-- VALUES ('segretario@test.com', '$2a$10$...', 'Mario', 'Segretario', 5, NOW());

-- Crea un Gestore Campo di test
-- INSERT INTO UTENTI (email, password_hash, nome, cognome, tipo_utente_id, data_registrazione)
-- VALUES ('gestore@test.com', '$2a$10$...', 'Luca', 'Gestore', 6, NOW());

-- 3. Test multi-squadra per dirigenti
-- Verifica che un dirigente possa avere più squadre

-- Trova un utente dirigente esistente
-- SELECT id, nome, cognome FROM UTENTI WHERE tipo_utente_id = 4 LIMIT 1;

-- Assegna il dirigente a più squadre (esempio con utente_id = 123)
-- INSERT INTO DIRIGENTI_SQUADRE (utente_id, squadra_id, ruolo, attivo, created_at, updated_at)
-- VALUES 
--   (123, 1, 'Dirigente Tecnico', true, NOW(), NOW()),
--   (123, 3, 'Dirigente Organizzativo', true, NOW(), NOW());

-- Verifica assegnazione multi-squadra
-- SELECT ds.*, s.nome as squadra_nome, u.nome, u.cognome
-- FROM DIRIGENTI_SQUADRE ds
-- JOIN UTENTI u ON ds.utente_id = u.id
-- JOIN SQUADRE s ON ds.squadra_id = s.id
-- WHERE u.tipo_utente_id = 4 AND ds.attivo = true
-- ORDER BY u.id, s.id;

-- 4. Verifica conteggio utenti per ruolo
SELECT 
    t.id,
    t.nome as ruolo,
    COUNT(u.id) as numero_utenti
FROM TIPI_UTENTE t
LEFT JOIN UTENTI u ON t.id = u.tipo_utente_id
GROUP BY t.id, t.nome
ORDER BY t.id;

-- 5. Test permessi: Lista utenti con permessi staff
SELECT 
    u.id,
    u.nome,
    u.cognome,
    u.email,
    t.nome as ruolo
FROM UTENTI u
JOIN TIPI_UTENTE t ON u.tipo_utente_id = t.id
WHERE u.tipo_utente_id IN (1, 2, 3, 5, 6)  -- Admin, Presidente, Vice, Segretario, Gestore
ORDER BY u.tipo_utente_id, u.nome;

-- 6. Verifica integrità referenziale
-- Controlla che non ci siano utenti con tipo_utente_id non valido
SELECT u.id, u.email, u.tipo_utente_id
FROM UTENTI u
LEFT JOIN TIPI_UTENTE t ON u.tipo_utente_id = t.id
WHERE t.id IS NULL;
-- Output atteso: nessuna riga (tutti gli utenti devono avere un tipo valido)

COMMIT;
