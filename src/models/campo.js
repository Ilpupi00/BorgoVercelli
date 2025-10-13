'use strict';

const moment=require('moment');

class Campo{
    constructor(id,nome,indirizzo,tipo_superficie,dimensioni,illuminazione,coperto,spogliatoi,capienza_pubblico,attivo,created_at,updated_at,descrizione,Docce,immagine){
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
        this.created_at = created_at ? moment(created_at).format('YYYY-MM-DD HH:mm:ss') : null;
        this.updated_at = updated_at ? moment(updated_at).format('YYYY-MM-DD HH:mm:ss') : null;
        this.descrizione = descrizione;
        this.Docce = Docce;
        this.immagine = immagine;
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

module.exports=Campo;