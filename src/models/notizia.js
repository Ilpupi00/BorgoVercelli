'use strict';

const moment = require('moment');


'use strict';

class Notizia{
        constructor(id,titolo,sottotitolo,immagine,contenuto,autore,autore_id,pubblicata,data_pubblicazione,visualizzazioni,created_at,updated_at){
        this.id = id;
        this.titolo = titolo;
        this.sottotitolo = sottotitolo;
        this.immagine = immagine;
        this.contenuto = contenuto
        this.autore = autore;
        this.autore_id = autore_id;
        this.pubblicata = pubblicata;
        this.data_pubblicazione = data_pubblicazione ? Notizia.parseDate(data_pubblicazione) : null;
        this.visualizzazioni=visualizzazioni;
        this.created_at=created_at ? Notizia.parseDate(created_at) : null;
        this.updated_at=updated_at ? Notizia.parseDate(updated_at) : null;
    }

    static parseDate(dateStr) {
        if (!dateStr || typeof dateStr !== 'string') return null;
        
        try {
            // Prova prima con moment.js specificando formati comuni
            const parsed = moment(dateStr, ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD', 'DD-MM-YYYY', moment.ISO_8601], true);
            if (parsed.isValid()) {
                return parsed.format('YYYY-MM-DD HH:mm:ss');
            }
            
            // Se moment.js fallisce, prova con logica custom per formati italiani
            let d = dateStr.replace(/\//g, '-');
            // Se formato DD-MM-YYYY (italiano)
            if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(d)) {
                const parts = d.split('-');
                const day = parseInt(parts[0]);
                const month = parseInt(parts[1]) - 1; // moment.js usa 0-based months
                const year = parseInt(parts[2]);
                
                const date = moment({ year, month, day });
                if (date.isValid()) {
                    return date.format('YYYY-MM-DD HH:mm:ss');
                }
            }
            
            // Fallback: restituisci null se non riusciamo a parsare
            console.warn('Impossibile parsare la data:', dateStr);
            return null;
        } catch (error) {
            console.error('Errore nel parsing della data:', dateStr, error);
            return null;
        }
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