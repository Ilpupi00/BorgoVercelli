/**
 * @fileoverview Model per l'entità Notizia
 * Gestisce le notizie del sito con parsing avanzato delle date
 * @module core/models/notizia
 */

'use strict';

const moment = require('moment');

/**
 * Classe Notizia
 * Rappresenta un articolo/notizia pubblicabile sul sito
 * 
 * @class Notizia
 */
class Notizia{
    /**
     * Crea un'istanza di Notizia
     * 
     * @constructor
     * @param {number} id - ID univoco della notizia
     * @param {string} titolo - Titolo principale della notizia
     * @param {string} sottotitolo - Sottotitolo/sommario
     * @param {string} immagine - URL dell'immagine di copertina
     * @param {string} contenuto - Contenuto completo in HTML/testo
     * @param {string} autore - Nome dell'autore
     * @param {number} autore_id - ID dell'utente autore
     * @param {boolean} pubblicata - true se pubblicata, false se bozza
     * @param {string|Date} data_pubblicazione - Data di pubblicazione
     * @param {number} visualizzazioni - Contatore visualizzazioni
     * @param {string|Date} created_at - Data creazione
     * @param {string|Date} updated_at - Data ultimo aggiornamento
     */
    constructor(id,titolo,sottotitolo,immagine,contenuto,autore,autore_id,pubblicata,data_pubblicazione,visualizzazioni,created_at,updated_at){
        this.id = id;
        this.titolo = titolo;
        this.sottotitolo = sottotitolo;
        this.immagine = immagine;
        this.contenuto = contenuto
        this.autore = autore;
        this.autore_id = autore_id;
        this.pubblicata = pubblicata;
        // Parse delle date con metodo personalizzato
        this.data_pubblicazione = data_pubblicazione ? Notizia.parseDate(data_pubblicazione) : null;
        this.visualizzazioni=visualizzazioni;
        this.created_at=created_at ? Notizia.parseDate(created_at) : null;
        this.updated_at=updated_at ? Notizia.parseDate(updated_at) : null;
    }

    // ==================== METODI STATICI ====================

    /**
     * Parse avanzato di stringhe data in vari formati
     * Supporta formati italiani (DD/MM/YYYY) e internazionali (YYYY-MM-DD, ISO)
     * 
     * @static
     * @param {string} dateStr - Stringa data da parsare
     * @returns {string|null} Data formattata 'YYYY-MM-DD HH:mm:ss' o null se parsing fallisce
     * @example
     * Notizia.parseDate('25/12/2024');  // '2024-12-25 00:00:00'
     * Notizia.parseDate('2024-12-25');  // '2024-12-25 00:00:00'
     */
    static parseDate(dateStr) {
        if (!dateStr || typeof dateStr !== 'string') return null;
        
        try {
            // Prova prima con moment.js specificando formati comuni
            const parsed = moment(dateStr, ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD', 'DD-MM-YYYY', moment.ISO_8601], true);
            if (parsed.isValid()) {
                return parsed.format('YYYY-MM-DD HH:mm:ss');
            }
            
            // Se moment.js fallisce, prova con logica custom per formati italiani
            let d = dateStr.replace(/\//g, '-');
            
            // Se formato DD-MM-YYYY (italiano)
            if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(d)) {
                const parts = d.split('-');
                const day = parseInt(parts[0]);
                const month = parseInt(parts[1]) - 1; // moment.js usa 0-based months
                const year = parseInt(parts[2]);
                
                const date = moment({ year, month, day });
                if (date.isValid()) {
                    return date.format('YYYY-MM-DD HH:mm:ss');
                }
            }
            
            // Fallback: restituisci null se non riusciamo a parsare
            console.warn('Impossibile parsare la data:', dateStr);
            return null;
        } catch (error) {
            console.error('Errore nel parsing della data:', dateStr, error);
            return null;
        }
    }

    /**
     * Crea un'istanza Notizia da un oggetto JSON
     * Converte automaticamente data_pubblicazione in formato moment
     * 
     * @static
     * @param {Object} json - Oggetto con proprietà notizia
     * @returns {Notizia|null} Istanza Notizia o null se json è vuoto
     * @example
     * const notizia = Notizia.from({ id: 1, titolo: 'Titolo', ... });
     */
    static from(json){
        if (!json) {
            return null;
        }
        const notizia = Object.assign(new Notizia(), json);
        // Usa data_pubblicazione se esiste, altrimenti data
        notizia.data = moment.utc(json.data_pubblicazione || json.data);
        return notizia;
    }   

    /**
     * Converte un'istanza Notizia in oggetto JSON
     * Formatta la data nel formato standard YYYY-MM-DD HH:mm:ss
     * 
     * @static
     * @param {Notizia} notizia - Istanza Notizia da convertire
     * @returns {Object|null} Oggetto JSON o null se notizia è vuoto
     * @example
     * const json = Notizia.to(notiziaInstance);
     */
    static to(notizia){
        if (!notizia) {
            return null;
        }
        const json = Object.assign({}, notizia);
        json.data= notizia.data.format('YYYY-MM-DD HH:mm:ss');
        return json;
    }
}

// ==================== EXPORT ====================

module.exports = Notizia;