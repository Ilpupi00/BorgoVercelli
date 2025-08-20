'use strict';

const moment=require('moment');

class Recensione{
    constructor(id, utente_id, entita_tipo,entita_id,valutazione,titolo,contenuto,data_recensione,visibile, created_at, updated_at){
        this.id=id;
        this.utente_id=utente_id;
        this.entita_tipo=entita_tipo;
        this.entita_id=entita_id;
        this.valutazione=valutazione;
        this.titolo=titolo;
        this.contenuto=contenuto;
        this.data_recensione=data_recensione ? moment(data_recensione).format('YYYY-MM-DD') : null;
        this.visibile=visibile;
        this.created_at=created_at ? moment(created_at).format('YYYY-MM-DD HH:mm:ss') : null;
        this.updated_at=updated_at ? moment(updated_at).format('YYYY-MM-DD HH:mm:ss') : null;
    }

    static from(json){
        if(!json){
            return null;
        }
        const recensione=Object.assign(new Recensione(), json);
        recensione.data_recensione=moment(json.data_recensione).format('YYYY-MM-DD');
        recensione.created_at=moment(json.created_at).format('YYYY-MM-DD HH:mm:ss');
        recensione.updated_at=moment(json.updated_at).format('YYYY-MM-DD HH:mm:ss');
        return recensione;
    }

    static to(recensione){
        if(!recensione){
            return null;
        }
        const json=Object.assign({}, recensione);
        json.created_at = moment(campionato.created_at).format('YYYY-MM-DD HH:mm:ss');
        json.updated_at = moment(campionato.updated_at).format('YYYY-MM-DD HH:mm:ss');
        return json;
    }
}
module.exports=Recensione;