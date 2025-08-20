'use strict';

const moment = require('moment');


'use strict';

class Notizia{
    constructor(titolo,sottotitolo,immagine,contenuto,autore,pubblicata,data_pubblicazione,visualizzazioni,created_at,updated_at){
        this.titolo = titolo;
        this.sottotitolo = sottotitolo;
        this.immagine = immagine;
        this.contenuto = contenuto
        this.autore = autore;
        this.pubblicata = pubblicata;
        this.data_pubblicazione = data_pubblicazione ? Notizia.parseDate(data_pubblicazione) : null;
        this.visualizzazioni=visualizzazioni;
        this.created_at=created_at ? Notizia.parseDate(created_at) : null;
        this.updated_at=updated_at ? Notizia.parseDate(updated_at) : null;
    }

    static parseDate(dateStr) {
        // Se già ISO, usa direttamente, altrimenti prova a normalizzare
        if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
            return moment(dateStr).format('YYYY-MM-DD HH:mm:ss');
        }
        // Se formato tipo MM/DD/YYYY o DD/MM/YYYY, prova a convertire
        let d = dateStr.replace(/\//g, '-');
        // Se formato MM-DD-YYYY
        if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(d)) {
            const [mm, dd, yyyy] = d.split('-');
            return moment(`${yyyy}-${mm.padStart(2,'0')}-${dd.padStart(2,'0')}`).format('YYYY-MM-DD HH:mm:ss');
        }
        // Se formato DD-MM-YYYY
        if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(d)) {
            const [dd, mm, yyyy] = d.split('-');
            return moment(`${yyyy}-${mm.padStart(2,'0')}-${dd.padStart(2,'0')}`).format('YYYY-MM-DD HH:mm:ss');
        }
        // Fallback: usa moment direttamente
        return moment(dateStr).format('YYYY-MM-DD HH:mm:ss');
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