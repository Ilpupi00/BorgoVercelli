DELETE FROM IMMAGINI;

INSERT INTO IMMAGINI (
    titolo,
    descrizione,
    url,
    tipo,
    entita_riferimento,
    entita_id,
    ordine,
    created_at,
    updated_at
) VALUES (
    'Foto Profilo',
    'Foto profilo utente',
    '/workspaces/Sito_BorgoVercelli/public/ImmaginiDatbase/Lucajpg.jpg',
    'profilo',  -- tipo specifico per foto profilo
    'utente',   -- o 'user' a seconda del tuo schema
    1,        -- ID dell'utente
    1,
    datetime('now'),
    datetime('now')
);