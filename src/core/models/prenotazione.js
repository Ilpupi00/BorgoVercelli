/**
 * @fileoverview Model per l'entità Prenotazione
 * Gestisce le prenotazioni dei campi da calcio con stato e timestamp
 * @module core/models/prenotazione
 */

'use strict';

const moment= require('moment');

/**
 * Classe Prenotazione
 * Rappresenta una prenotazione di un campo per una squadra/utente
 * 
 * @class Prenotazione
 */
class Prenotazione{
    /**
     * Crea un'istanza di Prenotazione
     * 
     * @constructor
     * @param {number} id - ID univoco della prenotazione
     * @param {number} campo_id - ID del campo prenotato
     * @param {number} utente_id - ID dell'utente che prenota
     * @param {number|null} squadra_id - ID della squadra (opzionale per prenotazioni di squadra)
     * @param {string} data_prenotazione - Data della prenotazione (YYYY-MM-DD)
     * @param {string} ora_inizio - Ora inizio (HH:mm)
     * @param {string} ora_fine - Ora fine (HH:mm)
     * @param {string} tipo_attivita - Tipo attività: 'allenamento', 'partita', 'torneo', ecc.
     * @param {string|null} note - Note aggiuntive
     * @param {string} stato - Stato: 'in_attesa', 'accettata', 'rifiutata', 'scaduta'
     * @param {string|Date} created_at - Data creazione
     * @param {string|Date} updated_at - Data ultimo aggiornamento
     * @param {boolean} docce - Disponibilità docce richiesta
     */
    constructor(id,campo_id,utente_id,squadra_id,data_prenotazione,ora_inizio,ora_fine,tipo_attivita,note,stato,created_at,updated_at,docce){
        this.id=id;
        this.campo_id=campo_id;
        this.utente_id=utente_id;
        this.squadra_id=squadra_id;
        this.data_prenotazione=data_prenotazione;
        this.ora_inizio=ora_inizio;
        this.ora_fine=ora_fine;
        this.tipo_attivita=tipo_attivita;
        this.note=note;
        this.stato=stato;
        // Formatta timestamp con moment
        this.created_at=created_at ? moment(created_at).format('YYYY-MM-DD HH:mm:ss') : null;
        this.updated_at=updated_at ? moment(updated_at).format('YYYY-MM-DD HH:mm:ss') : null;
    }

    // ==================== METODI STATICI ====================

    /**
     * Crea un'istanza Prenotazione da un oggetto JSON
     * Formatta automaticamente i timestamp con moment
     * 
     * @static
     * @param {Object} json - Oggetto con proprietà prenotazione
     * @returns {Prenotazione|null} Istanza Prenotazione o null se json è vuoto
     * @example
     * const prenotazione = Prenotazione.from({ id: 1, campo_id: 2, ... });
     */
    static from(json){
        if(!json){
            return null;
        }
        const prenotazione = Object.assign(new Prenotazione(), json);
        // Formatta timestamp
        prenotazione.created_at = moment(json.created_at).format('YYYY-MM-DD HH:mm:ss');
        prenotazione.updated_at = moment(json.updated_at).format('YYYY-MM-DD HH:mm:ss');
        return prenotazione;
    }

    /**
     * Converte un'istanza Prenotazione in oggetto JSON
     * Formatta automaticamente i timestamp con moment
     * 
     * @static
     * @param {Prenotazione} prenotazione - Istanza Prenotazione da convertire
     * @returns {Object|null} Oggetto JSON o null se prenotazione è vuoto
     * @example
     * const json = Prenotazione.to(prenotazioneInstance);
     */
    static to(prenotazione){
        if(!prenotazione){
            return null;
        }
        const json = Object.assign({}, prenotazione);
        // Formatta timestamp
        json.created_at = moment(prenotazione.created_at).format('YYYY-MM-DD HH:mm:ss');
        json.updated_at = moment(prenotazione.updated_at).format('YYYY-MM-DD HH:mm:ss');
        return json;
    }
}

// ==================== EXPORT ====================

module.exports=Prenotazione;