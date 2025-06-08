'use strict';

const moment = require('moment');


'use strict';

class Notizia{
    constructor(titolo,sottotitolo,immagine,contenuto,autore,data){
        this.titolo = titolo;
        this.sottotitolo = sottotitolo;
        this.immagine = immagine;
        this.contenuto = contenuto;
        this.autore = autore;
        this.data = moment(data);
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