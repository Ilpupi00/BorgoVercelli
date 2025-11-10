'use strict';

class Squadra{
    constructor(id ,nome,id_immagine,Anno, dirigenti, giocatori, numero_giocatori){
        this.id = id;
        this.nome = nome;
        this.id_immagine = id_immagine;
        this.Anno = Anno;
        this.dirigenti = dirigenti || [];  // Array di dirigenti associati
        this.giocatori = giocatori || [];  // Array di giocatori associati
        this.numero_giocatori = numero_giocatori || 0;  // Numero totale di giocatori attivi
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