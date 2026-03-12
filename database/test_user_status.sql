-- Test per verificare che le colonne siano state aggiunte correttamente
SELECT 
    id, 
    nome, 
    cognome, 
    email, 
    stato, 
    motivo_sospensione, 
    data_inizio_sospensione, 
    data_fine_sospensione,
    admin_sospensione_id
FROM UTENTI 
LIMIT 5;
