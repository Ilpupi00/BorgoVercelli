-- Popolamento tabella CAMPI con dati di esempio
INSERT INTO CAMPI (nome, indirizzo, tipo_superficie, dimensioni, illuminazione, coperto, spogliatoi, capienza_pubblico, attivo, created_at, updated_at) VALUES
('Campo Comunale di Vercelli', 'Via Roma 1, Vercelli', 'Erba Sintetica', '100x60', 1, 0, 1, 500, 1, datetime('now'), datetime('now')),
('Campo Secondario', 'Via Milano 10, Vercelli', 'Erba Naturale', '90x50', 0, 0, 1, 200, 1, datetime('now'), datetime('now')),
('Campo Coperto', 'Via Torino 5, Vercelli', 'Parquet', '40x20', 1, 1, 1, 100, 1, datetime('now'), datetime('now'));