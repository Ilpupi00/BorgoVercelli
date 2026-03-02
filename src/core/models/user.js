/**
 * @fileoverview Model per l'entità Utente
 * Rappresenta un utente del sistema con le sue proprietà core.
 * I dati aggiuntivi (sospensione, preferenze, dati personali) sono gestiti
 * da tabelle ed entità separate con i rispettivi DAO.
 * @module core/models/user
 */

"use strict";

/**
 * Classe User
 * Rappresenta un utente con dati anagrafici e stato account.
 * I campi extra (preferenze, dati personali, sospensione) possono
 * essere aggiunti dinamicamente tramite Object.assign nel metodo from().
 *
 * @class User
 */
class User {
  /**
   * Crea un'istanza di User
   *
   * @constructor
   * @param {number} id - ID univoco dell'utente
   * @param {string} nome - Nome dell'utente
   * @param {string} cognome - Cognome dell'utente
   * @param {string} email - Email dell'utente (usata per login)
   * @param {string} telefono - Numero di telefono
   * @param {string} tipo_utente - Tipo utente: 'giocatore', 'dirigente', 'admin'
   * @param {string} stato - Stato account: 'attivo', 'sospeso', 'bannato'
   */
  constructor(
    id,
    nome,
    cognome,
    email,
    telefono,
    tipo_utente,
    stato
  ) {
    this.id = id;
    this.nome = nome;
    this.cognome = cognome;
    this.email = email;
    this.telefono = telefono;
    this.tipo_utente = tipo_utente;
    this.stato = stato || "attivo"; // Default: 'attivo'
  }

  // ==================== METODI STATICI ====================

  /**
   * Crea un'istanza User da un oggetto JSON
   *
   * @static
   * @param {Object} json - Oggetto con proprietà utente
   * @returns {User|null} Istanza User o null se json è vuoto
   * @example
   * const user = User.from({ id: 1, nome: 'Mario', cognome: 'Rossi', ... });
   */
  static from(json) {
    if (!json) {
      return null;
    }
    const user = Object.assign(new User(), json);
    return user;
  }

  /**
   * Converte un'istanza User in oggetto JSON
   *
   * @static
   * @param {User} user - Istanza User da convertire
   * @returns {Object|null} Oggetto JSON o null se user è vuoto
   * @example
   * const json = User.to(userInstance);
   */
  static to(user) {
    if (!user) {
      return null;
    }
    const json = Object.assign({}, user);
    return json;
  }

  // ==================== METODI DI ISTANZA ====================

  /**
   * Verifica se l'utente è un dirigente
   * NOTA: Questo è un placeholder, la verifica reale richiede una query
   * alla tabella DIRIGENTI_SQUADRE (implementata nel DAO)
   *
   * @returns {boolean} false (placeholder)
   */
  isDirigente() {
    return false; // Placeholder - implementare nel DAO
  }

  /**
   * Verifica se l'account utente è attivo
   *
   * @returns {boolean} true se stato è 'attivo'
   */
  isAttivo() {
    return this.stato === "attivo";
  }

  /**
   * Verifica se l'account utente è sospeso
   *
   * @returns {boolean} true se stato è 'sospeso'
   */
  isSospeso() {
    return this.stato === "sospeso";
  }

  /**
   * Verifica se l'account utente è bannato permanentemente
   *
   * @returns {boolean} true se stato è 'bannato'
   */
  isBannato() {
    return this.stato === "bannato";
  }

  /**
   * Verifica se la sospensione temporanea è scaduta
   * Richiede che i dati sospensione siano stati aggiunti all'oggetto
   * (es. tramite JOIN o merge con dati da dao-sospensioni)
   *
   * @param {Object} [sospensione] - Dati sospensione (opzionali, altrimenti cerca su this)
   * @param {string} [sospensione.data_fine] - Data fine sospensione
   * @returns {boolean} true se la sospensione è scaduta, false altrimenti
   */
  isSospensioneScaduta(sospensione) {
    if (this.stato !== "sospeso") return false;
    const dataFine = sospensione ? sospensione.data_fine : this.data_fine_sospensione;
    if (!dataFine) return false;
    return new Date(dataFine) < new Date();
  }
}

// ==================== EXPORT ====================

module.exports = User;
