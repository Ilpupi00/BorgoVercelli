'use strict';

class Squadra{
    constructor(id ,nome,id_immagine,Anno, dirigenti){
        this.id = id;
        this.nome = nome;
        this.id_immagine = id_immagine;
        this.Anno = Anno;
        this.dirigenti = dirigenti || [];  // Array di dirigenti associati
    }

    static from (json){
        if (!json) {
            return null;
        }
        const squadra = Object.assign(new Squadra(), json);
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