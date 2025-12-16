/**
 * @fileoverview Model per l'entità DirigenteSquadra
 * Gestisce i dirigenti associati alle squadre
 * @module core/models/dirigenteSquadra
 */

'use strict';

/**
 * Classe DirigenteSquadra
 * Rappresenta un dirigente associato a una squadra
 *
 * @class DirigenteSquadra
 */
class DirigenteSquadra {
    /**
     * Crea un'istanza di DirigenteSquadra
     *
     * @constructor
     * @param {number} id - ID univoco dell'associazione dirigente-squadra
     * @param {number} utente_id - ID dell'utente dirigente
     * @param {number} squadra_id - ID della squadra
     * @param {string} ruolo - Ruolo del dirigente: 'presidente', 'allenatore', 'vice', ecc.
     * @param {string|Date} data_nomina - Data di nomina come dirigente
     * @param {string|Date} data_scadenza - Data di scadenza del mandato
     * @param {boolean} attivo - true se dirigente attualmente attivo
     * @param {string|Date} created_at - Data creazione
     * @param {string|Date} updated_at - Data ultimo aggiornamento
     * @param {string} nome - Nome del dirigente (duplicato da utente)
     * @param {string} cognome - Cognome del dirigente (duplicato da utente)
     * @param {number} immagine_id - ID immagine profilo dirigente
     */
    constructor(id, utente_id, squadra_id, ruolo, data_nomina, data_scadenza, attivo, created_at, updated_at, nome, cognome, immagine_id) {
        this.id = id;
        this.utente_id = utente_id;
        this.squadra_id = squadra_id;
        this.ruolo = ruolo;
        this.data_nomina = data_nomina;
        this.data_scadenza = data_scadenza;
        this.attivo = attivo;
        this.created_at = created_at;
        this.updated_at = updated_at;
        this.nome = nome;
        this.cognome = cognome;
            this.immagine_id = immagine_id;
            // Popola anche `immagine` per compatibilità con le view (se immagine_id è una URL)
            if (immagine_id) {
                if (typeof immagine_id === 'string' && immagine_id.startsWith('/')) {
                    this.immagine = { url: immagine_id };
                } else {
                    // se è un id numerico, manteniamo immagine_id e lasciamo immagine null
                    this.immagine = null;
                }
            } else {
                this.immagine = null;
            }
    }

    // ==================== METODI STATICI ====================

    /**
     * Crea un'istanza DirigenteSquadra da un oggetto JSON
     *
     * @static
     * @param {Object} json - Oggetto con proprietà dirigente
     * @returns {DirigenteSquadra|null} Istanza DirigenteSquadra o null se json è vuoto
     * @example
     * const dirigente = DirigenteSquadra.from({ id: 1, ruolo: 'allenatore', ... });
     */
    static from(json) {
        if (!json) {
            return null;
        }
        const dirigente = Object.assign(new DirigenteSquadra(), json);
        return dirigente;
    }

    /**
     * Converte un'istanza DirigenteSquadra in oggetto JSON
     *
     * @static
     * @param {DirigenteSquadra} dirigente - Istanza DirigenteSquadra da convertire
     * @returns {Object|null} Oggetto JSON o null se dirigente è vuoto
     * @example
     * const json = DirigenteSquadra.to(dirigenteInstance);
     */
    static to(dirigente) {
        if (!dirigente) {
            return null;
        }
        const json = Object.assign({}, dirigente);
        return json;
    }
}

// ==================== EXPORT ====================

module.exports = DirigenteSquadra;