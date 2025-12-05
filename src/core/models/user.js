/**
 * @fileoverview Model per l'entità Utente
 * Rappresenta un utente del sistema con le sue proprietà e metodi di validazione
 * @module core/models/user
 */

'use strict';

/**
 * Classe User
 * Rappresenta un utente con dati personali, preferenze calcistiche e stato account
 * 
 * @class User
 */
class User{
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
     * @param {string} ruolo_preferito - Ruolo preferito in campo (es: 'portiere', 'difensore')
     * @param {string} piede_preferito - Piede preferito: 'destro', 'sinistro', 'ambidestro'
     * @param {string} stato - Stato account: 'attivo', 'sospeso', 'bannato'
     * @param {string|null} motivo_sospensione - Motivo della sospensione/ban
     * @param {string|null} data_inizio_sospensione - Data inizio sospensione (ISO format)
     * @param {string|null} data_fine_sospensione - Data fine sospensione (ISO format)
     * @param {number|null} admin_sospensione_id - ID dell'admin che ha sospeso l'utente
     */
    constructor(id,nome,cognome,email,telefono,tipo_utente,ruolo_preferito,piede_preferito,stato,motivo_sospensione,data_inizio_sospensione,data_fine_sospensione,admin_sospensione_id,data_nascita,codice_fiscale){
        this.id=id;
        this.nome = nome;
        this.cognome = cognome;
        this.email = email;
        this.telefono = telefono;
        this.tipo_utente=tipo_utente;
        this.ruolo_preferito = ruolo_preferito;
        this.piede_preferito = piede_preferito;
        this.stato = stato || 'attivo';  // Default: 'attivo'
        this.motivo_sospensione = motivo_sospensione;
        this.data_inizio_sospensione = data_inizio_sospensione;
        this.data_fine_sospensione = data_fine_sospensione;
        this.admin_sospensione_id = admin_sospensione_id;
        this.data_nascita = data_nascita || null;
        this.codice_fiscale = codice_fiscale || null;
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
    static from(json){
        if (!json) {
            return null;
        }
        const user =Object.assign(new User(), json);
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
    static to(user){
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
        return this.stato === 'attivo';
    }

    /**
     * Verifica se l'account utente è sospeso
     * 
     * @returns {boolean} true se stato è 'sospeso'
     */
    isSospeso() {
        return this.stato === 'sospeso';
    }

    /**
     * Verifica se l'account utente è bannato permanentemente
     * 
     * @returns {boolean} true se stato è 'bannato'
     */
    isBannato() {
        return this.stato === 'bannato';
    }

    /**
     * Verifica se la sospensione temporanea è scaduta
     * Controlla se la data di fine sospensione è nel passato
     * 
     * @returns {boolean} true se la sospensione è scaduta, false altrimenti
     */
    isSospensioneScaduta() {
        // Non sospeso o senza data fine → non scaduta
        if (this.stato !== 'sospeso' || !this.data_fine_sospensione) {
            return false;
        }
        // Confronta data fine con data corrente
        return new Date(this.data_fine_sospensione) < new Date();
    }
}

// ==================== EXPORT ====================

module.exports = User;