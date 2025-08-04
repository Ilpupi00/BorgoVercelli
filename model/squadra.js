'use strict';

class Squadra{
    constructor(id ,nome,id_immagine,Anno){
        this.id = id;
        this.nome = nome;
        this.id_immagine = id_immagine;
        this.Anno = Anno;
    }

    static from (json){
        if (!json) {
            return null;
        }
        const squadra = Object.assign(new SQUADRA(), json);
        return squadra;
    }

    static to(squadra){
        if (!squadra) {
            return null;
        }
        const json = Object.assign({}, squadra);
        return json;
    }
}

module.exports = Squadra;