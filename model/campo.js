'use strict';

class Campo{
    constructor(id,nome,indirizzo,tipo_superficie,dimensioni,illuminazione,coperto,spogliatoi,capienza_pubblico,attivo,created_at,updated_at,descrizione){
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
        this.created_at = created_at;
        this.updated_at = updated_at;
        this.descrizione = descrizione;
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