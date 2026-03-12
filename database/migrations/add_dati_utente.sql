-- Active: 1762870879414@@shortline.proxy.rlwy.net@32056@railway
ALTER TABLE utenti
ADD COLUMN data_nascita DATE,
ADD COLUMN codice_fiscale VARCHAR(16);