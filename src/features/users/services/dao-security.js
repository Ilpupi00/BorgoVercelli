"use strict";

const db = require("../../../core/config/database");

/**
 * Registra un'attività di accesso
 * @param {number} utenteId 
 * @param {Object} data 
 * @param {string} data.device Es. "Chrome su Windows"
 * @param {string} data.detail Es. "Windows 11 · Chrome 120"
 * @param {string} data.icon Es. "display", "laptop", "phone"
 * @param {string} data.ip_address 
 * @param {string} data.location Es. "Milano, Italia"
 * @param {string} data.status "Riuscito", "Bloccato", "Fallito"
 * @returns {Promise<void>}
 */
async function logLoginActivity(utenteId, data) {
  const sql = `
    INSERT INTO LOGIN_ACTIVITY (utente_id, device, detail, icon, ip_address, location, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  try {
    await db.query(sql, [
      utenteId,
      data.device || "Sconosciuto",
      data.detail || "",
      data.icon || "display",
      data.ip_address || "0.0.0.0",
      data.location || "Sconosciuto",
      data.status || "Sconosciuto",
    ]);
  } catch (err) {
    console.error("[DAO Security] Errore inserimento login_activity:", err);
  }
}

/**
 * Recupera le ultime attività di accesso per un utente
 * @param {number} utenteId 
 * @param {number} limit 
 * @returns {Promise<Array>}
 */
async function getRecentLoginActivity(utenteId, limit = 5) {
  const sql = `
    SELECT 
      device, 
      detail, 
      icon, 
      ip_address, 
      location, 
      status, 
      created_at 
    FROM LOGIN_ACTIVITY
    WHERE utente_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `;
  try {
    const result = await db.query(sql, [utenteId, limit]);
    return result.rows || [];
  } catch (err) {
    console.error("[DAO Security] Errore recupero login_activity:", err);
    return [];
  }
}

/**
 * Recupera le impostazioni di sicurezza dell'utente (2FA, data password)
 * @param {number} utenteId 
 * @returns {Promise<Object>}
 */
async function getSecuritySettings(utenteId) {
  const sql = `
    SELECT 
      two_factor_enabled, 
      password_last_changed 
    FROM UTENTI 
    WHERE id = ?
  `;
  try {
    const result = await db.query(sql, [utenteId]);
    if (result.rows && result.rows.length > 0) {
      return result.rows[0];
    }
    return {
      two_factor_enabled: false,
      password_last_changed: new Date(),
    };
  } catch (err) {
    console.error("[DAO Security] Errore recupero security settings:", err);
    return {
      two_factor_enabled: false,
      password_last_changed: new Date(),
    };
  }
}

/**
 * Abilita o disabilita la 2FA per l'utente
 * @param {number} utenteId 
 * @param {boolean} status 
 * @returns {Promise<void>}
 */
async function toggle2FA(utenteId, status) {
  const sql = `
    UPDATE UTENTI 
    SET two_factor_enabled = ? 
    WHERE id = ?
  `;
  try {
    await db.query(sql, [status, utenteId]);
  } catch (err) {
    console.error("[DAO Security] Errore toggle 2FA:", err);
    throw err;
  }
}

/**
 * Registra una revoca delle sessioni su DB
 * (Visto che le sessioni reali sono in Redis, qui ci limitiamo a un placeholder 
 * o a un eventuale salvataggio log se si volesse tracciare la disconnessione globale)
 * @param {number} utenteId 
 * @returns {Promise<void>}
 */
async function revokeOtherSessions(utenteId) {
  // Se avessimo una tabella SESSIONS la cancelleremmo qui.
  // Nel caso attuale (Redis), questo DAO method potrebbe non fare nulla sul DB relazionale
  // a meno che non logghiamo l'azione.
  await logLoginActivity(utenteId, {
    device: "Sistema",
    detail: "Revoca di tutte le altre sessioni",
    icon: "shield-lock",
    ip_address: "0.0.0.0",
    location: "Sistema",
    status: "Riuscito"
  });
}

module.exports = {
  logLoginActivity,
  getRecentLoginActivity,
  getSecuritySettings,
  toggle2FA,
  revokeOtherSessions,
};
