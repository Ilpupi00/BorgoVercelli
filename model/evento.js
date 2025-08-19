'use strict';

class Evento {
    constructor(id, titolo, descrizione, data_inizio, data_fine, luogo, tipo_evento, squadra_id, campo_id, max_partecipanti, pubblicato, immagini_id) {
        this.id = id;
        this.titolo = titolo;
        this.descrizione = descrizione;
        this.data_inizio = data_inizio;
        this.data_fine = data_fine;
        this.luogo = luogo;
        this.tipo_evento = tipo_evento;
        this.squadra_id = squadra_id;
        this.campo_id = campo_id;
        this.max_partecipanti = max_partecipanti;
        this.pubblicato = pubblicato;
        this.immagini_id = immagini_id;
    }

    static from(json){
        if (!json) {
            return null;
        }
        const evento = Object.assign(new Eventi(), json);
        return evento;
    }

    static to(evento){
        if (!evento) {
            return null;
        }
        const json = Object.assign({}, evento);
        return json;
    }
}

module.exports = Evento;