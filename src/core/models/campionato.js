/**
 * @fileoverview Model per l'entità Campionato
 * Gestisce campionati calcistici con regole promozione/retrocessione
 * @module core/models/campionato
 */

'use strict';

const moment=require('moment');

/**
 * Classe Campionato
 * Rappresenta un campionato calcistico con regole di promozione/retrocessione
 *
 * @class Campionato
 */
class Campionato{
    /**
     * Crea un'istanza di Campionato
     *
     * @constructor
     * @param {number} id - ID univoco del campionato
     * @param {string} nome - Nome del campionato (es: "Serie A", "Campionato Primavera")
     * @param {string} stagione - Stagione (es: "2024-2025")
     * @param {string} categoria - Categoria (es: "Juniores", "Allievi")
     * @param {number|null} fonte_esterna_id - ID fonte esterna per dati ufficiali
     * @param {string|null} url_fonte - URL della fonte esterna
     * @param {boolean} attivo - true se campionato attivo
     * @param {string|Date} created_at - Data creazione
     * @param {string|Date} updated_at - Data ultimo aggiornamento
     * @param {number} [promozione_diretta=2] - Squadre che salgono direttamente
     * @param {number} [playoff_start=3] - Posizione inizio playoff
     * @param {number} [playoff_end=6] - Posizione fine playoff
     * @param {number} [playout_start=11] - Posizione inizio playout
     * @param {number} [playout_end=14] - Posizione fine playout
     * @param {number} [retrocessione_diretta=2] - Squadre che retrocedono direttamente
     */
    constructor(id, nome, stagione, categoria, fonte_esterna_id, url_fonte, attivo, created_at, updated_at, promozione_diretta, playoff_start, playoff_end, playout_start, playout_end, retrocessione_diretta){
        this.id = id;
        this.nome = nome;
        this.stagione = stagione;
        this.categoria = categoria;
        this.fonte_esterna_id = fonte_esterna_id;
        this.url_fonte = url_fonte;
        this.attivo = attivo;
        // Formatta timestamp
        this.created_at = created_at ? moment(created_at).format('YYYY-MM-DD HH:mm:ss') : null;
        this.updated_at = updated_at ? moment(updated_at).format('YYYY-MM-DD HH:mm:ss') : null;
        // Regole promozione/retrocessione con valori default
        this.promozione_diretta = promozione_diretta || 2;
        this.playoff_start = playoff_start || 3;
        this.playoff_end = playoff_end || 6;
        this.playout_start = playout_start || 11;
        this.playout_end = playout_end || 14;
        this.retrocessione_diretta = retrocessione_diretta || 2;
    }

    // ==================== METODI STATICI ====================

    /**
     * Crea un'istanza Campionato da un oggetto JSON
     * Formatta automaticamente i timestamp
     *
     * @static
     * @param {Object} json - Oggetto con proprietà campionato
     * @returns {Campionato|null} Istanza Campionato o null se json è vuoto
     * @example
     * const campionato = Campionato.from({ id: 1, nome: 'Serie A', ... });
     */
    static from(json){
        if(!json){
            return null;
        }
        const campionato = Object.assign(new Campionato(), json);
        // Formatta timestamp
        campionato.created_at = json.created_at ? moment(json.created_at).format('YYYY-MM-DD HH:mm:ss') : null;
        campionato.updated_at = json.updated_at ? moment(json.updated_at).format('YYYY-MM-DD HH:mm:ss') : null;
        return campionato;
    }

    /**
     * Converte un'istanza Campionato in oggetto JSON
     * Formatta automaticamente i timestamp
     *
     * @static
     * @param {Campionato} campionato - Istanza Campionato da convertire
     * @returns {Object|null} Oggetto JSON o null se campionato è vuoto
     * @example
     * const json = Campionato.to(campionatoInstance);
     */
    static to(campionato){
        if(!campionato){
            return null;
        }
        const json = Object.assign({}, campionato);
        // Formatta timestamp
        json.created_at = campionato.created_at ? moment(campionato.created_at).format('YYYY-MM-DD HH:mm:ss') : null;
        json.updated_at = campionato.updated_at ? moment(campionato.updated_at).format('YYYY-MM-DD HH:mm:ss') : null;
        return json;
    }
}

// ==================== EXPORT ====================

module.exports = Campionato;