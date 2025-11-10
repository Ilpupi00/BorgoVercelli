/**
 * @fileoverview Model per l'entità Recensione
 * Gestisce recensioni e valutazioni di campi, squadre, eventi
 * @module core/models/recensione
 */

'use strict';

const moment=require('moment');

/**
 * Classe Recensione
 * Rappresenta una recensione/valutazione lasciata da un utente
 *
 * @class Recensione
 */
class Recensione{
    /**
     * Crea un'istanza di Recensione
     *
     * @constructor
     * @param {number} id - ID univoco della recensione
     * @param {number} utente_id - ID dell'utente che ha lasciato la recensione
     * @param {string} entita_tipo - Tipo entità recensita: 'campo', 'squadra', 'evento'
     * @param {number} entita_id - ID dell'entità recensita
     * @param {number} valutazione - Valutazione numerica (1-5 stelle)
     * @param {string} titolo - Titolo della recensione
     * @param {string} contenuto - Testo completo della recensione
     * @param {string|Date} data_recensione - Data della recensione
     * @param {boolean} visibile - true se recensione visibile pubblicamente
     * @param {string|Date} created_at - Data creazione
     * @param {string|Date} updated_at - Data ultimo aggiornamento
     */
    constructor(id, utente_id, entita_tipo, entita_id, valutazione, titolo, contenuto, data_recensione, visibile, created_at, updated_at){
        this.id = id;
        this.utente_id = utente_id;
        this.entita_tipo = entita_tipo;
        this.entita_id = entita_id;
        this.valutazione = valutazione;
        this.titolo = titolo;
        this.contenuto = contenuto;
        // Formatta data recensione (solo YYYY-MM-DD)
        this.data_recensione = data_recensione ? moment(data_recensione).format('YYYY-MM-DD') : null;
        this.visibile = visibile;
        // Formatta timestamp completi
        this.created_at = created_at ? moment(created_at).format('YYYY-MM-DD HH:mm:ss') : null;
        this.updated_at = updated_at ? moment(updated_at).format('YYYY-MM-DD HH:mm:ss') : null;
    }

    // ==================== METODI STATICI ====================

    /**
     * Crea un'istanza Recensione da un oggetto JSON
     * Costruisce una nuova istanza passando i valori uno per uno
     *
     * @static
     * @param {Object} json - Oggetto con proprietà recensione
     * @returns {Recensione|null} Istanza Recensione o null se json è vuoto
     * @example
     * const recensione = Recensione.from({ id: 1, valutazione: 5, ... });
     */
    static from(json){
        if(!json){
            return null;
        }
        return new Recensione(
            json.id,
            json.utente_id,
            json.entita_tipo,
            json.entita_id,
            json.valutazione,
            json.titolo,
            json.contenuto,
            json.data_recensione,
            json.visibile,
            json.created_at,
            json.updated_at
        );
    }

    /**
     * Converte un'istanza Recensione in oggetto JSON
     * Restituisce un oggetto plain con tutte le proprietà
     *
     * @static
     * @param {Recensione} recensione - Istanza Recensione da convertire
     * @returns {Object|null} Oggetto JSON o null se recensione è vuoto
     * @example
     * const json = Recensione.to(recensioneInstance);
     */
    static to(recensione){
        if(!recensione){
            return null;
        }
        return {
            id: recensione.id,
            utente_id: recensione.utente_id,
            entita_tipo: recensione.entita_tipo,
            entita_id: recensione.entita_id,
            valutazione: recensione.valutazione,
            titolo: recensione.titolo,
            contenuto: recensione.contenuto,
            data_recensione: recensione.data_recensione,
            visibile: recensione.visibile,
            created_at: recensione.created_at,
            updated_at: recensione.updated_at
        };
    }
}

// ==================== EXPORT ====================

module.exports=Recensione;