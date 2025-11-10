/**
 * @fileoverview Model per l'entità Squadra
 * Rappresenta una squadra calcistica con dirigenti e giocatori associati
 * @module core/models/squadra
 */

'use strict';

/**
 * Classe Squadra
 * Rappresenta una squadra con nome, immagine, anno di fondazione e membri
 * 
 * @class Squadra
 */
class Squadra{
    /**
     * Crea un'istanza di Squadra
     * 
     * @constructor
     * @param {number} id - ID univoco della squadra
     * @param {string} nome - Nome della squadra
     * @param {number} id_immagine - ID dell'immagine logo nella tabella IMMAGINI
     * @param {number} Anno - Anno di fondazione o categoria della squadra
     * @param {Array<Object>} [dirigenti=[]] - Array di dirigenti associati alla squadra
     * @param {Array<Object>} [giocatori=[]] - Array di giocatori associati alla squadra
     * @param {number} [numero_giocatori=0] - Numero totale di giocatori attivi
     */
    constructor(id ,nome,id_immagine,Anno, dirigenti, giocatori, numero_giocatori){
        this.id = id;
        this.nome = nome;
        this.id_immagine = id_immagine;
        this.Anno = Anno;
        this.dirigenti = dirigenti || [];         // Array di dirigenti
        this.giocatori = giocatori || [];         // Array di giocatori
        this.numero_giocatori = numero_giocatori || 0;  // Conteggio giocatori
    }

    // ==================== METODI STATICI ====================

    /**
     * Crea un'istanza Squadra da un oggetto JSON
     * 
     * @static
     * @param {Object} json - Oggetto con proprietà squadra
     * @returns {Squadra|null} Istanza Squadra o null se json è vuoto
     * @example
     * const squadra = Squadra.from({ id: 1, nome: 'Juventus FC', ... });
     */
    static from (json){
        if (!json) {
            return null;
        }
        const squadra = Object.assign(new Squadra(), json);
        return squadra;
    }

    /**
     * Converte un'istanza Squadra in oggetto JSON
     * 
     * @static
     * @param {Squadra} squadra - Istanza Squadra da convertire
     * @returns {Object|null} Oggetto JSON o null se squadra è vuoto
     * @example
     * const json = Squadra.to(squadraInstance);
     */
    static to(squadra){
        if (!squadra) {
            return null;
        }
        const json = Object.assign({}, squadra);
        return json;
    }
}

// ==================== EXPORT ====================

module.exports = Squadra;