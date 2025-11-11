/**
 * @fileoverview Model per l'entità Campo
 * Rappresenta un campo da calcio con caratteristiche e servizi
 * @module core/models/campo
 */

'use strict';

const moment=require('moment');

/**
 * Classe Campo
 * Rappresenta un campo sportivo con le sue caratteristiche tecniche
 *
 * @class Campo
 */
class Campo{
    /**
     * Crea un'istanza di Campo
     *
     * @constructor
     * @param {number} id - ID univoco del campo
     * @param {string} nome - Nome del campo
     * @param {string} indirizzo - Indirizzo completo del campo
     * @param {string} tipo_superficie - Tipo superficie: 'erba', 'sintetico', 'terra'
     * @param {string} dimensioni - Dimensioni campo (es: "100x60m")
     * @param {boolean} illuminazione - true se campo illuminato
     * @param {boolean} coperto - true se campo coperto
     * @param {boolean} spogliatoi - true se presenti spogliatoi
     * @param {number} capienza_pubblico - Numero massimo spettatori
     * @param {boolean} attivo - true se campo disponibile per prenotazioni
     * @param {string|Date} created_at - Data creazione
     * @param {string|Date} updated_at - Data ultimo aggiornamento
     * @param {string} descrizione - Descrizione dettagliata del campo
     * @param {boolean} docce - true se presenti docce negli spogliatoi
     * @param {string} immagine - URL immagine del campo
     */
    constructor(id,nome,indirizzo,tipo_superficie,dimensioni,illuminazione,coperto,spogliatoi,capienza_pubblico,attivo,created_at,updated_at,descrizione,docce,immagine){
        this.id = id;
        this.nome = nome;
        this.indirizzo = indirizzo;
        this.tipo_superficie = tipo_superficie;
        this.dimensioni = dimensioni;
        this.illuminazione = illuminazione;
        this.coperto = coperto;
        this.spogliatoi = spogliatoi;
        this.capienza_pubblico = capienza_pubblico;
        this.attivo = attivo;
        // Formatta timestamp
        this.created_at = created_at ? moment(created_at).format('YYYY-MM-DD HH:mm:ss') : null;
        this.updated_at = updated_at ? moment(updated_at).format('YYYY-MM-DD HH:mm:ss') : null;
        this.descrizione = descrizione;
        this.docce = docce;
        this.immagine = immagine;
    }

    // ==================== METODI STATICI ====================

    /**
     * Crea un'istanza Campo da un oggetto JSON
     * NOTA: Il codice attuale ha un bug - usa Prenotazione invece di Campo
     *
     * @static
     * @param {Object} json - Oggetto con proprietà campo
     * @returns {Campo|null} Istanza Campo o null se json è vuoto
     * @example
     * const campo = Campo.from({ id: 1, nome: 'Campo Centrale', ... });
     */
    static from(json){
        if(!json){
            return null;
        }
        // BUG: dovrebbe essere Campo(), non Prenotazione()
        const prenotazione = Object.assign(new Prenotazione(), json);
        return prenotazione;
    }

    /**
     * Converte un'istanza Campo in oggetto JSON
     * NOTA: Il codice attuale ha un bug - usa prenotazione invece di campo
     *
     * @static
     * @param {Campo} prenotazione - Istanza Campo da convertire
     * @returns {Object|null} Oggetto JSON o null se campo è vuoto
     * @example
     * const json = Campo.to(campoInstance);
     */
    static to(prenotazione){
        if(!prenotazione){
            return null;
        }
        // BUG: parametro chiamato 'prenotazione' ma dovrebbe essere 'campo'
        const json = Object.assign({}, prenotazione);
        return json;
    }
}

// ==================== EXPORT ====================

module.exports=Campo;