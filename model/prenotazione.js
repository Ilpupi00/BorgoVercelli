'use strict';

const moment= require('moment');

class Prenotazione{
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
        this.created_at=created_at ? moment(created_at).format('YYYY-MM-DD HH:mm:ss') : null;
        this.updated_at=updated_at ? moment(updated_at).format('YYYY-MM-DD HH:mm:ss') : null;
    }

    static from(json){
        if(!json){
            return null;
        }
        const prenotazione = Object.assign(new Prenotazione(), json);
        prenotazione.created_at = moment(json.created_at).format('YYYY-MM-DD HH:mm:ss');
        prenotazione.updated_at = moment(json.updated_at).format('YYYY-MM-DD HH:mm:ss');
        return prenotazione;
    }

    static to(prenotazione){
        if(!prenotazione){
            return null;
        }
        const json = Object.assign({}, prenotazione);
        json.created_at = moment(prenotazione.created_at).format('YYYY-MM-DD HH:mm:ss');
        json.updated_at = moment(prenotazione.updated_at).format('YYYY-MM-DD HH:mm:ss');
        return json;
    }
}

module.exports=Prenotazione;