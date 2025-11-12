/**
 * @fileoverview Model per l'entità Evento
 * Gestisce eventi sportivi e sociali con parsing robusto delle date
 * @module core/models/evento
 */

'use strict';

const moment = require('moment');

/**
 * Classe Evento
 * Rappresenta un evento sportivo o sociale organizzato dalla società
 *
 * @class Evento
 */
class Evento {
    /**
     * Crea un'istanza di Evento
     *
     * @constructor
     * @param {number} id - ID univoco dell'evento
     * @param {string} titolo - Titolo dell'evento
     * @param {string} descrizione - Descrizione dettagliata
     * @param {string|Date} data_inizio - Data e ora inizio evento
     * @param {string|Date} data_fine - Data e ora fine evento
     * @param {string} luogo - Luogo dell'evento
     * @param {string} tipo_evento - Tipo: 'partita', 'torneo', 'allenamento', 'evento_sociale'
     * @param {number} autore_id - ID dell'utente che ha creato l'evento
     * @param {number|null} squadra_id - ID squadra coinvolta (opzionale)
     * @param {number|null} campo_id - ID campo dove si svolge (opzionale)
     * @param {number|null} max_partecipanti - Numero massimo partecipanti
     * @param {boolean} pubblicato - true se evento visibile pubblicamente
     * @param {string|Date} created_at - Data creazione
     * @param {string|Date} updated_at - Data ultimo aggiornamento
     * @param {number|null} immagini_id - ID immagine associata
     */
    constructor(id, titolo, descrizione, data_inizio, data_fine, luogo, tipo_evento, autore_id, squadra_id, campo_id, max_partecipanti, pubblicato,created_at,updated_at, immagini_id) {
        this.id = id;
        this.titolo = titolo;
        this.descrizione = descrizione;

        // Parsing robusto delle date con gestione errori
        try {
            this.data_inizio = data_inizio ? Evento.parseDate(data_inizio) : null;
        } catch (error) {
            console.warn('Errore nel parsing data_inizio:', data_inizio, error);
            this.data_inizio = data_inizio;
        }
        try {
            this.data_fine = data_fine ? Evento.parseDate(data_fine) : null;
        } catch (error) {
            console.warn('Errore nel parsing data_fine:', data_fine, error);
            this.data_fine = data_fine;
        }

        this.luogo = luogo;
        this.tipo_evento = tipo_evento;
        this.autore_id = autore_id;
        this.squadra_id = squadra_id;
        this.campo_id = campo_id;
        this.max_partecipanti = max_partecipanti;
        this.pubblicato = pubblicato;

        // Parsing timestamp con gestione errori
        try {
            this.created_at = created_at ? Evento.parseDate(created_at) : null;
        } catch (error) {
            console.warn('Errore nel parsing created_at:', created_at, error);
            this.created_at = created_at;
        }
        try {
            this.updated_at = updated_at ? Evento.parseDate(updated_at) : null;
        } catch (error) {
            console.warn('Errore nel parsing updated_at:', updated_at, error);
            this.updated_at = updated_at;
        }

        this.immagini_id = immagini_id;
        // Aggiungi alias immagine_url per compatibilità template (evento non ha immagini, usa placeholder)
        this.immagine_url = null;
    }

    // ==================== METODI STATICI ====================

    /**
     * Parser robusto per date in molteplici formati
     * Supporta ISO, MM/DD/YYYY, DD/MM/YYYY con fallback
     *
     * @static
     * @param {string|Date} dateStr - Stringa data da parsare
     * @returns {string} Data formattata YYYY-MM-DD HH:mm:ss
     * @example
     * Evento.parseDate('2024-01-15'); // '2024-01-15 00:00:00'
     * Evento.parseDate('15/01/2024'); // '2024-01-15 00:00:00'
     */
    static parseDate(dateStr) {
        // Accetta sia stringhe che oggetti Date
        if (dateStr instanceof Date) {
            return moment(dateStr).format('YYYY-MM-DD HH:mm:ss');
        }
        // Se non è stringa, prova a convertirla in stringa tramite toString
        if (typeof dateStr !== 'string') {
            try {
                dateStr = dateStr.toString();
            } catch (e) {
                // fallback: usa moment direttamente
                return moment(dateStr).format('YYYY-MM-DD HH:mm:ss');
            }
        }

        // Se già ISO, usa direttamente
        if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
            return moment(dateStr).format('YYYY-MM-DD HH:mm:ss');
        }

        // Se formato tipo MM/DD/YYYY o DD/MM/YYYY, prova a convertire
        let d = dateStr.replace(/\//g, '-');

        // Se formato MM-DD-YYYY (americano)
        if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(d)) {
            const [mm, dd, yyyy] = d.split('-');
            return moment(`${yyyy}-${mm.padStart(2,'0')}-${dd.padStart(2,'0')}`).format('YYYY-MM-DD HH:mm:ss');
        }

        // Se formato DD-MM-YYYY (italiano)
        if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(d)) {
            const [dd, mm, yyyy] = d.split('-');
            return moment(`${yyyy}-${mm.padStart(2,'0')}-${dd.padStart(2,'0')}`).format('YYYY-MM-DD HH:mm:ss');
        }

        // Fallback: usa moment direttamente
        return moment(dateStr).format('YYYY-MM-DD HH:mm:ss');
    }

    /**
     * Crea un'istanza Evento da un oggetto JSON
     * NOTA: Il codice attuale ha un bug - usa Eventi invece di Evento
     *
     * @static
     * @param {Object} json - Oggetto con proprietà evento
     * @returns {Evento|null} Istanza Evento o null se json è vuoto
     * @example
     * const evento = Evento.from({ id: 1, titolo: 'Partita amichevole', ... });
     */
    static from(json){
        if (!json) {
            return null;
        }
        // Crea correttamente una nuova istanza di Evento
        const evento = Object.assign(new Evento(), json);
        return evento;
    }

    /**
     * Converte un'istanza Evento in oggetto JSON
     *
     * @static
     * @param {Evento} evento - Istanza Evento da convertire
     * @returns {Object|null} Oggetto JSON o null se evento è vuoto
     * @example
     * const json = Evento.to(eventoInstance);
     */
    static to(evento){
        if (!evento) {
            return null;
        }
        const json = Object.assign({}, evento);
        return json;
    }
}

// ==================== EXPORT ====================

module.exports = Evento;