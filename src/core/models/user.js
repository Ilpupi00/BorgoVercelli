'use strict';

class User{
    constructor(id,nome,cognome,email,telefono,tipo_utente,ruolo_preferito,piede_preferito,stato,motivo_sospensione,data_inizio_sospensione,data_fine_sospensione,admin_sospensione_id){
        this.id=id;
        this.nome = nome;
        this.cognome = cognome;
        this.email = email;
        this.telefono = telefono;
        this.tipo_utente=tipo_utente;
        this.ruolo_preferito = ruolo_preferito;
        this.piede_preferito = piede_preferito;
        this.stato = stato || 'attivo';
        this.motivo_sospensione = motivo_sospensione;
        this.data_inizio_sospensione = data_inizio_sospensione;
        this.data_fine_sospensione = data_fine_sospensione;
        this.admin_sospensione_id = admin_sospensione_id;
    }

    static from(json){
        if (!json) {
            return null;
        }
        const user =Object.assign(new User(), json);

        return user;
    }

    static to(user){
        if (!user) {
            return null;
        }
        const json = Object.assign({}, user);
        return json;
    }

    // Metodo per verificare se l'utente è un dirigente (da estendere con query al DB)
    isDirigente() {
        // Questo richiede una query a DIRIGENTI_SQUADRE, implementa nel DAO
        return false; // Placeholder
    }

    // Metodo per verificare se l'utente è attivo
    isAttivo() {
        return this.stato === 'attivo';
    }

    // Metodo per verificare se l'utente è sospeso
    isSospeso() {
        return this.stato === 'sospeso';
    }

    // Metodo per verificare se l'utente è bannato
    isBannato() {
        return this.stato === 'bannato';
    }

    // Metodo per verificare se la sospensione è scaduta
    isSospensioneScaduta() {
        if (this.stato !== 'sospeso' || !this.data_fine_sospensione) {
            return false;
        }
        return new Date(this.data_fine_sospensione) < new Date();
    }
}


module.exports = User;