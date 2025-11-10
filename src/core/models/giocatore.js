/**
 * @fileoverview Model per l'entità Giocatore
 * Rappresenta un giocatore tesserato con dati anagrafici e sportivi
 * @module core/models/giocatore
 */

'use strict';

const moment=require('moment');

/**
 * Classe Giocatore
 * Rappresenta un giocatore iscritto a una squadra
 *
 * @class Giocatore
 */
class Giocatore {
    /**
     * Crea un'istanza di Giocatore
     * Usa destructuring per i parametri
     *
     * @constructor
     * @param {Object} params - Parametri giocatore
     * @param {number} params.id - ID univoco del giocatore
     * @param {number} params.id_immagine - ID immagine profilo
     * @param {number} params.squadra_id - ID squadra di appartenenza
     * @param {number} params.numero_maglia - Numero di maglia
     * @param {string} params.ruolo - Ruolo in campo
     * @param {string|Date} params.data_nascita - Data di nascita
     * @param {string} params.piede_preferito - Piede preferito
     * @param {string|Date} params.data_inizio_tesseramento - Data inizio tesseramento
     * @param {string|Date} params.data_fine_tesseramento - Data fine tesseramento
     * @param {boolean} params.attivo - true se giocatore attivo
     * @param {string|Date} params.created_at - Data creazione
     * @param {string|Date} params.updated_at - Data ultimo aggiornamento
     * @param {string} params.Nazionalita - Nazionalità
     * @param {string} params.Nome - Nome
     * @param {string} params.Cognome - Cognome
     */
    constructor({
        id,
        id_immagine,
        squadra_id,
        numero_maglia,
        ruolo,
        data_nascita,
        piede_preferito,
        data_inizio_tesseramento,
        data_fine_tesseramento,
        attivo,
        created_at,
        updated_at,
        Nazionalita,
        Nome,
        Cognome
    }) {
        this.id = id;
        this.id_immagine = id_immagine;
        this.squadra_id = squadra_id;
        this.numero_maglia = numero_maglia;
        this.ruolo = ruolo;
        this.data_nascita = data_nascita;
        this.piede_preferito = piede_preferito;

        // BUG: data_inizio_tesseramento usa data_fine_tesseramento
        this.data_inizio_tesseramento = data_inizio_tesseramento ? moment(data_fine_tesseramento).format('YYYY-MM-DD HH:mm:ss') : null;
        this.data_fine_tesseramento = data_fine_tesseramento ? moment(data_fine_tesseramento).format('YYYY-MM-DD HH:mm:ss') : null;

        this.attivo = attivo;
        // Formatta timestamp
        this.created_at = created_at ? moment(created_at).format('YYYY-MM-DD HH:mm:ss') : null;
        this.updated_at = updated_at ? moment(updated_at).format('YYYY-MM-DD HH:mm:ss') : null;
        this.nazionalita = Nazionalita;
        this.nome = Nome;
        this.cognome = Cognome;
    }

    // ==================== METODI STATICI ====================

    /**
     * Crea un'istanza Giocatore da un oggetto JSON
     * Converte le date in oggetti Date
     *
     * @static
     * @param {Object} json - Oggetto con proprietà giocatore
     * @returns {Giocatore|null} Istanza Giocatore o null se json è vuoto
     * @example
     * const giocatore = Giocatore.from({ id: 1, nome: 'Mario', ... });
     */
    static from(json) {
        if (!json) {
            return null;
        }
        const giocatore = Object.assign(new Giocatore(), json);
        // Converte stringhe date in oggetti Date
        giocatore.data_nascita = new Date(json.data_nascita);
        giocatore.data_inizio_tesseramento = new Date(json.data_inizio_tesseramento);
        giocatore.data_fine_tesseramento = new Date(json.data_fine_tesseramento);
        return giocatore;
    }

    /**
     * Converte un'istanza Giocatore in oggetto JSON
     * Formatta le date come stringhe ISO
     *
     * @static
     * @param {Giocatore} giocatore - Istanza Giocatore da convertire
     * @returns {Object|null} Oggetto JSON o null se giocatore è vuoto
     * @example
     * const json = Giocatore.to(giocatoreInstance);
     */
    static to(giocatore) {
        if (!giocatore) {
            return null;
        }
        const json = Object.assign({}, giocatore);
        // Formatta date come stringhe YYYY-MM-DD
        json.data_nascita = giocatore.data_nascita.toISOString().split('T')[0];
        json.data_inizio_tesseramento = giocatore.data_inizio_tesseramento.toISOString().split('T')[0];
        json.data_fine_tesseramento = giocatore.data_fine_tesseramento.toISOString().split('T')[0];
        return json;
    }
}

// ==================== EXPORT ====================

module.exports = Giocatore;