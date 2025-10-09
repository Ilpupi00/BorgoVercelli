'use strict';

class User{
    constructor(id,nome,cognome,email,telefono,tipo_utente,ruolo_preferito,piede_preferito){
        this.id=id;
        this.nome = nome;
        this.cognome = cognome;
        this.email = email;
        this.telefono = telefono;
        this.tipo_utente=tipo_utente;
        this.ruolo_preferito = ruolo_preferito;
        this.piede_preferito = piede_preferito;
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
}


module.exports = User;