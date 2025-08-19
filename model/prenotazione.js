'use strict';

class Prenotazione{
    constructor(id,campo_id,utente_id,squadra_id,data_prenotazione,ora_inizio,ora_fine,tipo_attivita,note,stato,created_at,updated_at){
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
        this.created_at=created_at;
        this.updated_at=updated_at;
    }

    static from(json){
        if(!json){
            return null;
        }
        const prenotazione = Object.assign(new Prenotazione(), json);
        return prenotazione;
    }

    static to(prenotazione){
        if(!prenotazione){
            return null;
        }
        const json = Object.assign({}, prenotazione);
        return json;
    }
}

module.exports=Prenotazione;