/**
 * @fileoverview Model per l'entità Immagine
 * Gestisce immagini associate a varie entità del sistema
 * @module core/models/immagine
 */

'use strict';

// const moment= require('moment'); // Commentato - non utilizzato

/**
 * Classe Immagine
 * Rappresenta un'immagine caricata nel sistema
 *
 * @class Immagine
 */
class Immagine{
    /**
     * Crea un'istanza di Immagine
     *
     * @constructor
     * @param {number} id - ID univoco dell'immagine
     * @param {string} descrizione - Descrizione dell'immagine
     * @param {string} url - URL/path del file immagine
     * @param {string} tipo - Tipo immagine: 'profilo', 'galleria', 'notizia', ecc.
     * @param {string} entita_riferimento - Entità collegata: 'user', 'squadra', 'notizia', ecc.
     * @param {number} entita_id - ID dell'entità di riferimento
     * @param {number} ordine - Ordine di visualizzazione (per gallerie)
     * @param {string|Date} created_at - Data creazione
     * @param {string|Date} updated_at - Data ultimo aggiornamento
     */
    constructor(id,descrizione,url,tipo,entita_riferimento,entita_id,ordine,created_at,updated_at){
        this.id=id;
        this.descrizione=descrizione;
        this.url=url;
        this.tipo=tipo;
        this.entita_riferimento=entita_riferimento;
        this.entita_id=entita_id;
        this.ordine=ordine;
        this.created_at=created_at;
        this.updated_at=updated_at;
    }

    // ==================== METODI STATICI ====================

    /**
     * Crea un'istanza Immagine da un oggetto JSON
     * NOTA: Il codice attuale ha un bug - usa Immagini invece di Immagine
     *
     * @static
     * @param {Object} json - Oggetto con proprietà immagine
     * @returns {Immagine|null} Istanza Immagine o null se json è vuoto
     * @example
     * const immagine = Immagine.from({ id: 1, url: '/uploads/img.jpg', ... });
     */
    static from(json){
        if(!json){
            return null;
        }
        // BUG: dovrebbe essere Immagine(), non Immagini()
        const immagini= Object.assign(new Immagini(), json);
        return immagini;
    }

    /**
     * Converte un'istanza Immagine in oggetto JSON
     * NOTA: Il codice attuale ha un bug - parametro chiamato 'user' invece di 'immagine'
     *
     * @static
     * @param {Immagine} user - Istanza Immagine da convertire
     * @returns {Object|null} Oggetto JSON o null se immagine è vuoto
     * @example
     * const json = Immagine.to(immagineInstance);
     */
    static to(user){
        if(!user){
            return null;
        }
        // BUG: parametro chiamato 'user' ma dovrebbe essere 'immagine'
        const json= Object.assign({}, user);
        return json;
    }
}

// ==================== EXPORT ====================

module.exports=Immagine;