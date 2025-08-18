'use strict';

class Immagini{
    constructor(id,descrizione,url,tipo,entita_riferimento_entita_id,ordine,created_at,updated_at){
        this.id=id;
        this.descrizione=descrizione;
        this.url=url;
        this.tipo=tipo;
        this.entita_riferimento_entita_id=entita_riferimento_entita_id;
        this.ordine=ordine;
        this.created_at=created_at;
        this.updated_at=updated_at;
    }

    static from(json){
        if(!json){
            return null;
        }
        const immagini= Object.assign(new Immagini(), json);
        return immagini;
    }

    static to(user){
        if(!user){
            return null;
        }

        const json= Object.assign({}, user);
        return json;
    }

}