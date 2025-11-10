'use strict';

const moment=require('moment');

class Recensione{
    constructor(id, utente_id, entita_tipo, entita_id, valutazione, titolo, contenuto, data_recensione, visibile, created_at, updated_at){
        this.id = id;
        this.utente_id = utente_id;
        this.entita_tipo = entita_tipo;
        this.entita_id = entita_id;
        this.valutazione = valutazione;
        this.titolo = titolo;
        this.contenuto = contenuto;
        this.data_recensione = data_recensione ? moment(data_recensione).format('YYYY-MM-DD') : null;
        this.visibile = visibile;
        this.created_at = created_at ? moment(created_at).format('YYYY-MM-DD HH:mm:ss') : null;
        this.updated_at = updated_at ? moment(updated_at).format('YYYY-MM-DD HH:mm:ss') : null;
    }

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
module.exports=Recensione;