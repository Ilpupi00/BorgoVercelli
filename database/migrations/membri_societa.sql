-- Membri della società A.S.D. Borgo Vercelli
INSERT INTO UTENTI (email, password_hash, nome, cognome, telefono, tipo_utente_id, data_registrazione, created_at, updated_at)
VALUES
('presidente@borgovercelli.it', '$2a$04$hashedpassword', 'Mario', 'Rossi', '+39 0123 456789', 2, '2020-01-01', '2020-01-01', '2025-01-01'),
('vicepresidente@borgovercelli.it', '$2a$04$hashedpassword', 'Luca', 'Bianchi', '+39 0123 456790', 3, '2020-01-02', '2020-01-02', '2025-01-01'),
('dirigente1@borgovercelli.it', '$2a$04$hashedpassword', 'Giovanni', 'Verdi', '+39 0123 456791', 4, '2020-01-03', '2020-01-03', '2025-01-01'),
('dirigente2@borgovercelli.it', '$2a$04$hashedpassword', 'Paolo', 'Neri', '+39 0123 456792', 4, '2020-01-04', '2020-01-04', '2025-01-01');