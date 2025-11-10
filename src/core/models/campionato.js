'use strict';

const moment=require('moment');

class Campionato{
    constructor(id, nome, stagione, categoria, fonte_esterna_id, url_fonte, attivo, created_at, updated_at, promozione_diretta, playoff_start, playoff_end, playout_start, playout_end, retrocessione_diretta){
        this.id = id;
        this.nome = nome;
        this.stagione = stagione;
        this.categoria = categoria;
        this.fonte_esterna_id = fonte_esterna_id;
        this.url_fonte = url_fonte;
        this.attivo = attivo;
        this.created_at = created_at ? moment(created_at).format('YYYY-MM-DD HH:mm:ss') : null;
        this.updated_at = updated_at ? moment(updated_at).format('YYYY-MM-DD HH:mm:ss') : null;
        this.promozione_diretta = promozione_diretta || 2;
        this.playoff_start = playoff_start || 3;
        this.playoff_end = playoff_end || 6;
        this.playout_start = playout_start || 11;
        this.playout_end = playout_end || 14;
        this.retrocessione_diretta = retrocessione_diretta || 2;
    }

    static from(json){
        if(!json){
            return null;
        }
        const campionato = Object.assign(new Campionato(), json);
        campionato.created_at = json.created_at ? moment(json.created_at).format('YYYY-MM-DD HH:mm:ss') : null;
        campionato.updated_at = json.updated_at ? moment(json.updated_at).format('YYYY-MM-DD HH:mm:ss') : null;
        return campionato;
    }

    static to(campionato){
        if(!campionato){
            return null;
        }
        const json = Object.assign({}, campionato);
        json.created_at = campionato.created_at ? moment(campionato.created_at).format('YYYY-MM-DD HH:mm:ss') : null;
        json.updated_at = campionato.updated_at ? moment(campionato.updated_at).format('YYYY-MM-DD HH:mm:ss') : null;
        return json;
    }
}

module.exports = Campionato;