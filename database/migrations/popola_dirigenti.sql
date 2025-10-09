-- Esempio di inserimento dirigenti per squadre
-- Assumi che ci siano utenti con ID 1,2,3,4 e squadre con ID 1,2

-- Dirigenti societari (squadra_id NULL)
INSERT INTO DIRIGENTI_SQUADRE (utente_id, squadra_id, ruolo, data_nomina, attivo, created_at, updated_at) VALUES
(1, NULL, 'Presidente', '2023-01-01', 1, '2023-01-01 00:00:00', '2023-01-01 00:00:00'),
(2, NULL, 'Segretario', '2023-01-01', 1, '2023-01-01 00:00:00', '2023-01-01 00:00:00');

-- Dirigenti per squadra 1 (Prima Squadra)
INSERT INTO DIRIGENTI_SQUADRE (utente_id, squadra_id, ruolo, data_nomina, attivo, created_at, updated_at) VALUES
(3, 1, 'Allenatore', '2023-06-01', 1, '2023-06-01 00:00:00', '2023-06-01 00:00:00'),
(4, 1, 'Dirigente Accompagnatore', '2023-06-01', 1, '2023-06-01 00:00:00', '2023-06-01 00:00:00');

-- Dirigenti per squadra 2 (Seconda Squadra)
INSERT INTO DIRIGENTI_SQUADRE (utente_id, squadra_id, ruolo, data_nomina, attivo, created_at, updated_at) VALUES
(5, 2, 'Allenatore', '2023-06-01', 1, '2023-06-01 00:00:00', '2023-06-01 00:00:00');