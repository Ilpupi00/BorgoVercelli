'use strict';

class User{
    constructor(nome,cognome,email,telefono,tipo_utente){
        this.nome = nome;
        this.cognome = cognome;
        this.email = email;
        this.telefono = telefono;
        this.tipo_utente=tipo_utente;
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
}


module.exports = User;