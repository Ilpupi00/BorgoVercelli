class Giocatore {
    constructor({
        id,
        id_immagine,
        squadra_id,
        numero_maglia,
        ruolo,
        data_nascita,
        piede_preferito,
        data_inizio_tesseramento,
        data_fine_tesseramento,
        attivo,
        created_at,
        updated_at,
        nazionalita,
        nome,
        cognome
    }) {
        this.id = id;
        this.id_immagine = id_immagine;
        this.squadra_id = squadra_id;
        this.numero_maglia = numero_maglia;
        this.ruolo = ruolo;
        this.data_nascita = data_nascita;
        this.piede_preferito = piede_preferito;
        this.data_inizio_tesseramento = data_inizio_tesseramento;
        this.data_fine_tesseramento = data_fine_tesseramento;
        this.attivo = attivo;
        this.created_at = created_at;
        this.updated_at = updated_at;
        this.nazionalita = nazionalita;
        this.nome = nome;
        this.cognome = cognome;
    }

    static from(json) {
        if (!json) {
            return null;
        }
        const giocatore = Object.assign(new Giocatore(), json);
        // Convert date strings to Date objects
        giocatore.data_nascita = new Date(json.data_nascita);
        giocatore.data_inizio_tesseramento = new Date(json.data_inizio_tesseramento);
        giocatore.data_fine_tesseramento = new Date(json.data_fine_tesseramento);
        return giocatore;
    }
    static to(giocatore) {
        if (!giocatore) {
            return null;
        }
        const json = Object.assign({}, giocatore);
        // Format dates as strings
        json.data_nascita = giocatore.data_nascita.toISOString().split('T')[0];
        json.data_inizio_tesseramento = giocatore.data_inizio_tesseramento.toISOString().split('T')[0];
        json.data_fine_tesseramento = giocatore.data_fine_tesseramento.toISOString().split('T')[0];
        return json;
    }
}

module.exports = Giocatore;