'use strict';

class DirigenteSquadra {
    constructor(id, utente_id, squadra_id, ruolo, data_nomina, data_scadenza, attivo, created_at, updated_at) {
        this.id = id;
        this.utente_id = utente_id;
        this.squadra_id = squadra_id;
        this.ruolo = ruolo;
        this.data_nomina = data_nomina;
        this.data_scadenza = data_scadenza;
        this.attivo = attivo;
        this.created_at = created_at;
        this.updated_at = updated_at;
    }

    static from(json) {
        if (!json) {
            return null;
        }
        const dirigente = Object.assign(new DirigenteSquadra(), json);
        return dirigente;
    }

    static to(dirigente) {
        if (!dirigente) {
            return null;
        }
        const json = Object.assign({}, dirigente);
        return json;
    }
}

module.exports = DirigenteSquadra;