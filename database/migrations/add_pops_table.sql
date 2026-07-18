-- ============================================================
-- Migration: add_pops_table.sql
-- Scopo:
--   1. Aggiunge is_pinned a NOTIZIE (fix compatibilità branch feat/pin_news)
--   2. Crea la tabella POPS per i popup gestiti dall'admin
--   3. Pre-inserisce le feste italiane come POPS di sistema (non modificabili)
-- ============================================================

-- 1. Fix is_pinned su NOTIZIE (colonna richiesta dal codice su produzione)
ALTER TABLE NOTIZIE ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;

-- 2. Crea tabella POPS
CREATE TABLE IF NOT EXISTS POPS (
    id              SERIAL PRIMARY KEY,
    titolo          VARCHAR(255) NOT NULL,
    messaggio       TEXT         NOT NULL,
    icona           VARCHAR(100) DEFAULT '📢',
    colore_primario   VARCHAR(20) DEFAULT '#3b82f6',
    colore_secondario VARCHAR(20) DEFAULT '#1e40af',

    -- 'default' = ricorrente ogni anno (usa giorno/mese)
    -- 'custom'  = una-tantum (usa data_inizio / data_fine)
    tipo            VARCHAR(20)  DEFAULT 'custom' CHECK (tipo IN ('default','custom')),

    -- Campi per tipo 'default' (si ripete ogni anno, basta giorno+mese)
    giorno_inizio   INTEGER CHECK (giorno_inizio BETWEEN 1 AND 31),
    mese_inizio     INTEGER CHECK (mese_inizio  BETWEEN 1 AND 12),
    giorno_fine     INTEGER CHECK (giorno_fine  BETWEEN 1 AND 31),
    mese_fine       INTEGER CHECK (mese_fine    BETWEEN 1 AND 12),

    -- Campi per tipo 'custom' (date complete)
    data_inizio     DATE,
    data_fine       DATE,

    attivo          BOOLEAN      DEFAULT TRUE,
    -- TRUE = creato dal sistema, non modificabile/eliminabile dall'admin
    is_system       BOOLEAN      DEFAULT FALSE,
    autore_id       INTEGER      REFERENCES UTENTI(id) ON DELETE SET NULL,
    created_at      TIMESTAMP    DEFAULT NOW(),
    updated_at      TIMESTAMP    DEFAULT NOW()
);

-- Aggiunge is_system se la tabella esisteva già (idempotente)
ALTER TABLE POPS ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT FALSE;

-- Indici
CREATE INDEX IF NOT EXISTS idx_pops_tipo      ON POPS(tipo);
CREATE INDEX IF NOT EXISTS idx_pops_attivo    ON POPS(attivo);
CREATE INDEX IF NOT EXISTS idx_pops_is_system ON POPS(is_system);

-- ============================================================
-- 3. Feste italiane di sistema (da modalFeste.js)
--    Inserite solo se non esistono gia'
-- ============================================================

-- Capodanno — 1 gennaio
INSERT INTO POPS (titolo, messaggio, icona, colore_primario, colore_secondario,
                  tipo, giorno_inizio, mese_inizio, giorno_fine, mese_fine,
                  attivo, is_system)
SELECT '🎊 Capodanno',
       'Ti auguriamo un fantastico nuovo anno pieno di gol, vittorie e soddisfazioni sportive! Che questo nuovo anno porti successi a te e alla nostra societa''! Ci vediamo in campo! ⚽',
       '🎉🥂', '#FFD700', '#FF6B6B',
       'default', 1, 1, 1, 1, TRUE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM POPS WHERE titolo = '🎊 Capodanno' AND is_system = TRUE);

-- Epifania — 6 gennaio
INSERT INTO POPS (titolo, messaggio, icona, colore_primario, colore_secondario,
                  tipo, giorno_inizio, mese_inizio, giorno_fine, mese_fine,
                  attivo, is_system)
SELECT '⭐ Epifania',
       'La Befana porta dolci a chi e'' stato bravo... e voi siete stati fantastici! Grazie per far parte della nostra famiglia sportiva! Ci vediamo in campo! ⚽',
       '🧙‍♀️🎁', '#9C27B0', '#E91E63',
       'default', 6, 1, 6, 1, TRUE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM POPS WHERE titolo = '⭐ Epifania' AND is_system = TRUE);

-- Carnevale — periodo variabile (aprox. 25 gen - 15 mar ogni anno)
-- Nota: la data esatta dipende dalla Pasqua, calcolata da modalFeste.js
INSERT INTO POPS (titolo, messaggio, icona, colore_primario, colore_secondario,
                  tipo, giorno_inizio, mese_inizio, giorno_fine, mese_fine,
                  attivo, is_system)
SELECT '🎭 Carnevale',
       'Ogni scherzo vale! Divertiti e festeggia con allegria! La nostra societa'' ti augura un Carnevale pieno di gioia e colori! Ci vediamo in campo! ⚽',
       '🎭🎉', '#FF6B6B', '#4ECDC4',
       'default', 25, 1, 15, 3, TRUE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM POPS WHERE titolo = '🎭 Carnevale' AND is_system = TRUE);

-- Pasqua — periodo variabile (aprox. 22 mar - 26 apr ogni anno)
-- Nota: la data esatta e'' calcolata da modalFeste.js con algoritmo Meeus/Jones/Butcher
INSERT INTO POPS (titolo, messaggio, icona, colore_primario, colore_secondario,
                  tipo, giorno_inizio, mese_inizio, giorno_fine, mese_fine,
                  attivo, is_system)
SELECT '🐰 Pasqua',
       'Ti auguriamo una Pasqua serena e piena di gioia insieme ai tuoi cari! Che questa festivita'' porti rinnovata energia per tornare in campo! Ci vediamo in campo! ⚽',
       '🐰🥚', '#9CCC65', '#FFEB3B',
       'default', 22, 3, 26, 4, TRUE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM POPS WHERE titolo = '🐰 Pasqua' AND is_system = TRUE);

-- Festa della Liberazione — 25 aprile
INSERT INTO POPS (titolo, messaggio, icona, colore_primario, colore_secondario,
                  tipo, giorno_inizio, mese_inizio, giorno_fine, mese_fine,
                  attivo, is_system)
SELECT '🇮🇹 Festa della Liberazione',
       'Ricordiamo con gratitudine chi ha lottato per la nostra liberta''. Buon 25 Aprile a tutta la nostra comunita'' sportiva! Viva l''Italia! ⚽',
       '🇮🇹🕊️', '#009246', '#CE2B37',
       'default', 25, 4, 25, 4, TRUE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM POPS WHERE titolo = '🇮🇹 Festa della Liberazione' AND is_system = TRUE);

-- Festa dei Lavoratori — 1 maggio
INSERT INTO POPS (titolo, messaggio, icona, colore_primario, colore_secondario,
                  tipo, giorno_inizio, mese_inizio, giorno_fine, mese_fine,
                  attivo, is_system)
SELECT '💪 Festa dei Lavoratori',
       'Auguri a tutti i lavoratori che ogni giorno si impegnano con dedizione! La nostra societa'' celebra il valore del lavoro e dell''impegno! Ci vediamo in campo! ⚽',
       '🛠️💪', '#E53935', '#FDD835',
       'default', 1, 5, 1, 5, TRUE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM POPS WHERE titolo = '💪 Festa dei Lavoratori' AND is_system = TRUE);

-- Festa della Repubblica — 2 giugno
INSERT INTO POPS (titolo, messaggio, icona, colore_primario, colore_secondario,
                  tipo, giorno_inizio, mese_inizio, giorno_fine, mese_fine,
                  attivo, is_system)
SELECT '🇮🇹 Festa della Repubblica',
       'Celebriamo insieme i valori della nostra Repubblica! Auguri a tutta la comunita'' sportiva italiana! Viva l''Italia! ⚽',
       '🇮🇹🎊', '#009246', '#CE2B37',
       'default', 2, 6, 2, 6, TRUE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM POPS WHERE titolo = '🇮🇹 Festa della Repubblica' AND is_system = TRUE);

-- Ferragosto — 13-16 agosto
INSERT INTO POPS (titolo, messaggio, icona, colore_primario, colore_secondario,
                  tipo, giorno_inizio, mese_inizio, giorno_fine, mese_fine,
                  attivo, is_system)
SELECT '☀️ Ferragosto',
       'Ti auguriamo un Ferragosto ricco di sole, mare e relax! Goditi le vacanze estive e ricarica le energie per la nuova stagione! Ci vediamo in campo! ⚽',
       '☀️🏖️', '#FF9800', '#03A9F4',
       'default', 13, 8, 16, 8, TRUE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM POPS WHERE titolo = '☀️ Ferragosto' AND is_system = TRUE);

-- Ognissanti — 1 novembre
INSERT INTO POPS (titolo, messaggio, icona, colore_primario, colore_secondario,
                  tipo, giorno_inizio, mese_inizio, giorno_fine, mese_fine,
                  attivo, is_system)
SELECT '🕯️ Ognissanti',
       'Un momento di riflessione e ricordo per chi non c''e'' piu''. La nostra societa'' e'' vicina a tutti in questo giorno speciale. Ci vediamo in campo! ⚽',
       '🕯️🌹', '#7E57C2', '#FFB74D',
       'default', 1, 11, 1, 11, TRUE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM POPS WHERE titolo = '🕯️ Ognissanti' AND is_system = TRUE);

-- Immacolata Concezione — 8 dicembre
INSERT INTO POPS (titolo, messaggio, icona, colore_primario, colore_secondario,
                  tipo, giorno_inizio, mese_inizio, giorno_fine, mese_fine,
                  attivo, is_system)
SELECT '⭐ Immacolata Concezione',
       'Auguri per questa festa speciale che segna l''inizio del periodo natalizio! La nostra societa'' ti augura serenita'' e gioia! Ci vediamo in campo! ⚽',
       '⭐🕊️', '#2196F3', '#1565C0',
       'default', 8, 12, 8, 12, TRUE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM POPS WHERE titolo = '⭐ Immacolata Concezione' AND is_system = TRUE);

-- Natale — 1-31 dicembre
INSERT INTO POPS (titolo, messaggio, icona, colore_primario, colore_secondario,
                  tipo, giorno_inizio, mese_inizio, giorno_fine, mese_fine,
                  attivo, is_system)
SELECT '🎄 Natale e Buone Feste',
       'A nome di tutta la A.S.D. Borgo Vercelli 2022, vi auguriamo un Natale sereno e pieno di gioia. Grazie per far parte della nostra comunita'' sportiva! Buon Natale! 🎄',
       '🎅🎁', '#c41e3a', '#165b33',
       'default', 1, 12, 31, 12, TRUE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM POPS WHERE titolo = '🎄 Natale e Buone Feste' AND is_system = TRUE);
