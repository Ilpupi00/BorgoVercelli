'use strict';

const moment = require('moment');


'use strict';

class Notizia{
    constructor(titolo,sottotitolo,immagine,contenuto,autore,pubblicata,data_pubblicazione,visualizzazioni,created_at,updated_at){
        this.titolo = titolo;
        this.sottotitolo = sottotitolo;
        this.immagine = immagine;
        this.contenuto = contenuto;
        this.autore = autore;
        this.pubblicata = pubblicata;
        this.data_pubblicazione = moment(data_pubblicazione);
        this.visualizzazioni=visualizzazioni;
        this.created_at= moment(created_at);
        this.updated_at=moment(updated_at);
    }

    static from(json){
        if (!json) {
            return null;
        }
        const notizia = Object.assign(new Notizia(), json);
        // Usa data_pubblicazione se esiste, altrimenti data
        notizia.data = moment.utc(json.data_pubblicazione || json.data);
        return notizia;
    }   

    static to(notizia){
        if (!notizia) {
            return null;
        }
        const json = Object.assign({}, notizia);
        json.data= notizia.data.format('YYYY-MM-DD HH:mm:ss');
        return json;
    }
}

module.exports = Notizia;