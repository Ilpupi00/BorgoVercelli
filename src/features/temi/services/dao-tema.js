/**
 * @fileoverview DAO Temi - BorgoVercelli
 * @module features/temi/services/dao-tema
 * @description Data Access Object per il sistema di temi dinamici.
 *   Gestisce il tema globale del sito, i temi personalizzati e le
 *   preferenze degli utenti sul database Postgres.
 *
 * TABELLE USATE:
 *   - tema_config              : Configurazione globale (tema attivo)
 *   - tema_personalizzato      : Temi creati dagli admin
 *   - tema_preferenza_utente   : Preferenza tema per ogni utente
 */

"use strict";

const db = require("../../../core/config/database");

// ==================== HELPERS ====================

/**
 * Serializza l'oggetto colori in JSON string per il database.
 * @param {Object|string} colori
 * @returns {string}
 */
function serializeColori(colori) {
  if (typeof colori === "string") return colori;
  return JSON.stringify(colori);
}

/**
 * Deserializza i colori dal database.
 * @param {string|Object} colori
 * @returns {Object}
 */
function parseColori(colori) {
  if (!colori) return {};
  if (typeof colori === "object") return colori;
  try {
    return JSON.parse(colori);
  } catch {
    return {};
  }
}

// ==================== TEMA GLOBALE ====================

/**
 * Ottiene la configurazione del tema attivo globale del sito.
 * Se la tabella è vuota, ritorna il default 'light'.
 *
 * @returns {Promise<{tema_attivo: string, custom_colori: Object|null, data_aggiornamento: Date}>}
 */
async function getTemaAttivo() {
  try {
    const result = await db.query(
      "SELECT tema_attivo, custom_colori, data_aggiornamento FROM tema_config LIMIT 1"
    );

    if (result.rows.length === 0) {
      // La tabella esiste ma è vuota: restituisci default
      return { tema_attivo: "light", custom_colori: null, data_aggiornamento: null };
    }

    const row = result.rows[0];
    return {
      tema_attivo: row.tema_attivo || "light",
      custom_colori: parseColori(row.custom_colori),
      data_aggiornamento: row.data_aggiornamento,
    };
  } catch (err) {
    console.error("[DAO-TEMA] Errore getTemaAttivo:", err.message);
    // Fallback silenzioso: restituisce light per non bloccare le richieste
    return { tema_attivo: "light", custom_colori: null, data_aggiornamento: null };
  }
}

/**
 * Imposta il tema globale del sito (usato dall'admin).
 * Usa UPSERT per garantire che esista sempre una sola riga in tema_config.
 *
 * @param {string}      temaId       - ID del tema (es. 'dark', 'sport', o slug personalizzato)
 * @param {Object|null} [customColori] - Colori personalizzati opzionali
 * @returns {Promise<{tema_attivo: string, data_aggiornamento: Date}>}
 */
async function setTemaAttivo(temaId, customColori = null) {
  if (!temaId || typeof temaId !== "string") {
    throw new Error("temaId è obbligatorio e deve essere una stringa");
  }

  const coloriJson = customColori ? serializeColori(customColori) : null;
  const now = new Date();

  try {
    // UPSERT: aggiorna se esiste, inserisce se non esiste
    const result = await db.query(
      `INSERT INTO tema_config (tema_attivo, custom_colori, data_aggiornamento)
       VALUES ($1, $2, $3)
       ON CONFLICT (id) DO UPDATE SET
         tema_attivo       = EXCLUDED.tema_attivo,
         custom_colori     = EXCLUDED.custom_colori,
         data_aggiornamento = EXCLUDED.data_aggiornamento
       RETURNING tema_attivo, data_aggiornamento`,
      [temaId, coloriJson, now]
    );

    console.log(`[DAO-TEMA] Tema globale aggiornato a: ${temaId}`);
    return result.rows[0];
  } catch (err) {
    console.error("[DAO-TEMA] Errore setTemaAttivo:", err.message);
    throw err;
  }
}

// ==================== TEMI PERSONALIZZATI ====================

/**
 * Crea un nuovo tema personalizzato nel database.
 *
 * @param {string} nome         - Nome leggibile del tema (unico)
 * @param {string} slug         - Identificatore URL-safe (unico)
 * @param {string} descrizione  - Breve descrizione
 * @param {Object} colori       - Oggetto colori del tema
 * @param {number} creato_da    - ID dell'utente admin che crea il tema
 * @returns {Promise<Object>}   Tema creato con ID assegnato
 */
async function creaTemasPersonalizzato(nome, slug, descrizione, colori, creato_da) {
  // Validazione input
  if (!nome || !slug || !colori) {
    throw new Error("nome, slug e colori sono obbligatori per creare un tema");
  }

  // Sanificazione slug: solo lettere, numeri, trattini
  const slugSanitizzato = slug
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (!slugSanitizzato) {
    throw new Error("Lo slug generato non è valido");
  }

  const coloriJson = serializeColori(colori);
  const now = new Date();

  try {
    const result = await db.query(
      `INSERT INTO tema_personalizzato
         (nome, slug, descrizione, colori, attivo, creato_da, data_creazione, data_aggiornamento)
       VALUES ($1, $2, $3, $4, true, $5, $6, $6)
       RETURNING *`,
      [nome, slugSanitizzato, descrizione || "", coloriJson, creato_da || null, now]
    );

    const tema = result.rows[0];
    tema.colori = parseColori(tema.colori);
    console.log(`[DAO-TEMA] Tema personalizzato creato: "${nome}" (slug: ${slugSanitizzato})`);
    return tema;
  } catch (err) {
    if (err.code === "23505") {
      // Violazione UNIQUE su nome o slug
      throw new Error(`Esiste già un tema con nome "${nome}" o slug "${slugSanitizzato}"`);
    }
    console.error("[DAO-TEMA] Errore creaTemasPersonalizzato:", err.message);
    throw err;
  }
}

/**
 * Recupera un tema personalizzato per ID numerico.
 *
 * @param {number} id - ID del tema
 * @returns {Promise<Object|null>}
 */
async function getTemasPersonalizzato(id) {
  try {
    const result = await db.query(
      `SELECT tp.*, u.nome || ' ' || u.cognome AS creato_da_nome
       FROM tema_personalizzato tp
       LEFT JOIN utenti u ON u.id = tp.creato_da
       WHERE tp.id = $1`,
      [id]
    );

    if (result.rows.length === 0) return null;
    const tema = result.rows[0];
    tema.colori = parseColori(tema.colori);
    return tema;
  } catch (err) {
    console.error("[DAO-TEMA] Errore getTemasPersonalizzato:", err.message);
    throw err;
  }
}

/**
 * Recupera un tema personalizzato per slug (usato dal middleware).
 *
 * @param {string} slug - Slug del tema
 * @returns {Promise<Object|null>}
 */
async function getTemaPersonalizzatoBySlug(slug) {
  if (!slug) return null;
  try {
    const result = await db.query(
      "SELECT * FROM tema_personalizzato WHERE slug = $1 AND attivo = true",
      [slug]
    );

    if (result.rows.length === 0) return null;
    const tema = result.rows[0];
    tema.colori = parseColori(tema.colori);
    return tema;
  } catch (err) {
    console.error("[DAO-TEMA] Errore getTemaPersonalizzatoBySlug:", err.message);
    throw err;
  }
}

/**
 * Ottiene la lista dei temi personalizzati.
 *
 * @param {boolean} [attiviSolo=true] - Se true, ritorna solo i temi attivi
 * @returns {Promise<Object[]>}
 */
async function getTemiPersonalizzati(attiviSolo = true) {
  try {
    const whereClause = attiviSolo ? "WHERE tp.attivo = true" : "";
    const result = await db.query(
      `SELECT tp.*, u.nome || ' ' || u.cognome AS creato_da_nome
       FROM tema_personalizzato tp
       LEFT JOIN utenti u ON u.id = tp.creato_da
       ${whereClause}
       ORDER BY tp.data_creazione DESC`
    );

    return result.rows.map((row) => ({
      ...row,
      colori: parseColori(row.colori),
    }));
  } catch (err) {
    console.error("[DAO-TEMA] Errore getTemiPersonalizzati:", err.message);
    throw err;
  }
}

/**
 * Aggiorna un tema personalizzato esistente.
 *
 * @param {number} id - ID del tema
 * @param {Object} dati - Campi da aggiornare: {nome, descrizione, colori, attivo}
 * @returns {Promise<Object>} Tema aggiornato
 */
async function aggiornaTemaPersonalizzato(id, { nome, descrizione, colori, attivo }) {
  // Costruisce la query in modo dinamico
  const aggiornamenti = [];
  const valori = [];
  let idx = 1;

  if (nome !== undefined) {
    aggiornamenti.push(`nome = $${idx++}`);
    valori.push(nome);
  }
  if (descrizione !== undefined) {
    aggiornamenti.push(`descrizione = $${idx++}`);
    valori.push(descrizione);
  }
  if (colori !== undefined) {
    aggiornamenti.push(`colori = $${idx++}`);
    valori.push(serializeColori(colori));
  }
  if (attivo !== undefined) {
    aggiornamenti.push(`attivo = $${idx++}`);
    valori.push(Boolean(attivo));
  }

  if (aggiornamenti.length === 0) {
    throw new Error("Nessun campo da aggiornare fornito");
  }

  aggiornamenti.push(`data_aggiornamento = $${idx++}`);
  valori.push(new Date());
  valori.push(id);

  try {
    const result = await db.query(
      `UPDATE tema_personalizzato
       SET ${aggiornamenti.join(", ")}
       WHERE id = $${idx}
       RETURNING *`,
      valori
    );

    if (result.rows.length === 0) {
      throw new Error(`Tema con ID ${id} non trovato`);
    }

    const tema = result.rows[0];
    tema.colori = parseColori(tema.colori);
    console.log(`[DAO-TEMA] Tema personalizzato aggiornato: ID ${id}`);
    return tema;
  } catch (err) {
    console.error("[DAO-TEMA] Errore aggiornaTemaPersonalizzato:", err.message);
    throw err;
  }
}

/**
 * Elimina un tema personalizzato dal database.
 * Rimuove anche tutte le preferenze utenti che usavano questo tema.
 *
 * @param {number} id - ID del tema da eliminare
 * @returns {Promise<boolean>} true se eliminato con successo
 */
async function eliminaTemasPersonalizzato(id) {
  try {
    // Prima recupera lo slug per poter pulire le preferenze
    const temaResult = await db.query(
      "SELECT slug FROM tema_personalizzato WHERE id = $1",
      [id]
    );

    if (temaResult.rows.length === 0) {
      throw new Error(`Tema con ID ${id} non trovato`);
    }

    const slug = temaResult.rows[0].slug;

    // Rimuove preferenze che usano questo tema
    await db.query(
      "DELETE FROM tema_preferenza_utente WHERE tema_id = $1",
      [slug]
    );

    // Elimina il tema
    const result = await db.query(
      "DELETE FROM tema_personalizzato WHERE id = $1 RETURNING id",
      [id]
    );

    console.log(`[DAO-TEMA] Tema personalizzato eliminato: ID ${id} (slug: ${slug})`);
    return result.rows.length > 0;
  } catch (err) {
    console.error("[DAO-TEMA] Errore eliminaTemasPersonalizzato:", err.message);
    throw err;
  }
}

// ==================== PREFERENZE UTENTE ====================

/**
 * Salva la preferenza tema di un utente (UPSERT).
 *
 * @param {number} utenteId - ID utente
 * @param {string} temaId   - ID/slug del tema scelto
 * @returns {Promise<Object>}
 */
async function setPreferenzaTema(utenteId, temaId) {
  if (!utenteId || !temaId) {
    throw new Error("utenteId e temaId sono obbligatori");
  }

  const now = new Date();
  try {
    const result = await db.query(
      `INSERT INTO tema_preferenza_utente (utente_id, tema_id, data_aggiornamento)
       VALUES ($1, $2, $3)
       ON CONFLICT (utente_id) DO UPDATE SET
         tema_id            = EXCLUDED.tema_id,
         data_aggiornamento = EXCLUDED.data_aggiornamento
       RETURNING *`,
      [utenteId, temaId, now]
    );

    console.log(`[DAO-TEMA] Preferenza tema salvata: utente ${utenteId} → ${temaId}`);
    return result.rows[0];
  } catch (err) {
    console.error("[DAO-TEMA] Errore setPreferenzaTema:", err.message);
    throw err;
  }
}

/**
 * Ottiene la preferenza tema di un utente.
 *
 * @param {number} utenteId - ID utente
 * @returns {Promise<{tema_id: string, data_aggiornamento: Date}|null>}
 */
async function getPreferenzaTema(utenteId) {
  if (!utenteId) return null;
  try {
    const result = await db.query(
      "SELECT tema_id, data_aggiornamento FROM tema_preferenza_utente WHERE utente_id = $1",
      [utenteId]
    );
    return result.rows[0] || null;
  } catch (err) {
    console.error("[DAO-TEMA] Errore getPreferenzaTema:", err.message);
    return null; // Non bloccare il middleware
  }
}

/**
 * Cancella la preferenza tema di un utente (reset al default).
 *
 * @param {number} utenteId - ID utente
 * @returns {Promise<boolean>}
 */
async function deletePreferenzaTema(utenteId) {
  try {
    const result = await db.query(
      "DELETE FROM tema_preferenza_utente WHERE utente_id = $1 RETURNING utente_id",
      [utenteId]
    );
    return result.rows.length > 0;
  } catch (err) {
    console.error("[DAO-TEMA] Errore deletePreferenzaTema:", err.message);
    throw err;
  }
}

// ==================== STATISTICHE ====================

/**
 * Ottiene statistiche sull'utilizzo dei temi.
 * Raggruppa le preferenze degli utenti per tema_id.
 *
 * @returns {Promise<Array<{tema_id: string, count: number, percentuale: number}>>}
 */
async function getStatisticaTemi() {
  try {
    // Conteggio preferenze per tema
    const result = await db.query(
      `SELECT
         tema_id,
         COUNT(*)::int AS count
       FROM tema_preferenza_utente
       GROUP BY tema_id
       ORDER BY count DESC`
    );

    const totale = result.rows.reduce((acc, r) => acc + r.count, 0);

    const statistiche = result.rows.map((row) => ({
      tema_id: row.tema_id,
      count: row.count,
      percentuale: totale > 0 ? Math.round((row.count / totale) * 100) : 0,
    }));

    // Aggiunge meta: tema attivo corrente
    let temaAttivoCorrente = "light";
    try {
      const config = await getTemaAttivo();
      temaAttivoCorrente = config.tema_attivo;
    } catch (_) { /* ignora */ }

    return {
      distribuzionePreferenze: statistiche,
      totaleUtentiConPreferenza: totale,
      temaGlobaleAttivo: temaAttivoCorrente,
    };
  } catch (err) {
    console.error("[DAO-TEMA] Errore getStatisticaTemi:", err.message);
    throw err;
  }
}

// ==================== EXPORT ====================

module.exports = {
  // Tema globale
  getTemaAttivo,
  setTemaAttivo,

  // Temi personalizzati
  creaTemasPersonalizzato,
  getTemasPersonalizzato,
  getTemaPersonalizzatoBySlug,
  getTemiPersonalizzati,
  aggiornaTemaPersonalizzato,
  eliminaTemasPersonalizzato,

  // Preferenze utente
  setPreferenzaTema,
  getPreferenzaTema,
  deletePreferenzaTema,

  // Statistiche
  getStatisticaTemi,
};
