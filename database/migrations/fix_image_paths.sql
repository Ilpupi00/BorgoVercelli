-- Script di migrazione per correggere i percorsi delle immagini nel database
-- Converte percorsi assoluti in percorsi relativi compatibili con Railway Volume
-- 
-- PRIMA DI ESEGUIRE: Fai un backup del database!
-- 
-- Esecuzione:
--   psql $DATABASE_URL < database/migrations/fix_image_paths.sql

-- 1. Verifica percorsi da correggere
SELECT 
    'PRIMA DELLA MIGRAZIONE' as status,
    COUNT(*) as total_images,
    COUNT(CASE WHEN url LIKE 'src/public/uploads/%' THEN 1 END) as needs_fix,
    COUNT(CASE WHEN url LIKE '/uploads/%' THEN 1 END) as already_correct
FROM IMMAGINI;

-- 2. Backup della tabella (opzionale ma consigliato)
-- CREATE TABLE IMMAGINI_BACKUP AS SELECT * FROM IMMAGINI;

-- 3. Correggi percorsi nella tabella IMMAGINI
-- Rimuove 'src/public/' dai percorsi lasciando solo '/uploads/...'
UPDATE IMMAGINI
SET url = '/' || SUBSTRING(url FROM 'uploads/.*')
WHERE url LIKE 'src/public/uploads/%';

-- 4. Gestisci percorsi senza slash iniziale
UPDATE IMMAGINI
SET url = '/' || url
WHERE url LIKE 'uploads/%' 
  AND url NOT LIKE '/uploads/%';

-- 5. Verifica risultati dopo la migrazione
SELECT 
    'DOPO LA MIGRAZIONE' as status,
    COUNT(*) as total_images,
    COUNT(CASE WHEN url LIKE 'src/public/uploads/%' THEN 1 END) as needs_fix,
    COUNT(CASE WHEN url LIKE '/uploads/%' THEN 1 END) as already_correct,
    COUNT(CASE WHEN url NOT LIKE '/uploads/%' AND url != '' THEN 1 END) as other_paths
FROM IMMAGINI;

-- 6. Mostra alcuni esempi di URL corretti
SELECT 
    id,
    tipo,
    entita_riferimento,
    url
FROM IMMAGINI
WHERE url LIKE '/uploads/%'
LIMIT 10;

-- 7. Mostra URL che potrebbero ancora avere problemi (se esistono)
SELECT 
    id,
    tipo,
    entita_riferimento,
    url,
    'VERIFICA MANUALMENTE' as nota
FROM IMMAGINI
WHERE url NOT LIKE '/uploads/%' 
  AND url != '' 
  AND url IS NOT NULL;

-- Note:
-- ✅ URL corretto:  /uploads/user_123_1699999999999.jpg
-- ❌ URL vecchio:   src/public/uploads/user_123_1699999999999.jpg
-- ❌ URL incompleto: uploads/user_123_1699999999999.jpg
