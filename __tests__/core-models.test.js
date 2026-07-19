const Campionato = require("../src/core/models/campionato");
const Campo = require("../src/core/models/campo");
const DirigenteSquadra = require("../src/core/models/dirigenteSquadra");
const Evento = require("../src/core/models/evento");
const Giocatore = require("../src/core/models/giocatore");
const Immagine = require("../src/core/models/immagine");
const Notizia = require("../src/core/models/notizia");
const Prenotazione = require("../src/core/models/prenotazione");
const Recensione = require("../src/core/models/recensione");
const Squadra = require("../src/core/models/squadra");
const User = require("../src/core/models/user");

describe("Core Models", () => {
  it("Campionato", () => {
    const c = new Campionato(1, "nome", "stag", "datai", "dataf", "desc", 1, "stato", [], "1");
    expect(c.id).toBe(1);
    expect(Campionato.from({ id: 2 })).toBeDefined();
    expect(Campionato.from(null)).toBeNull();
    expect(Campionato.to(c)).toBeDefined();
    expect(Campionato.to(null)).toBeNull();
  });

  it("Campo", () => {
    const c = new Campo(1, "nome", "desc", 10, "tipo", true);
    expect(c.id).toBe(1);
    expect(Campo.from({ id: 2 })).toBeDefined();
    expect(Campo.from(null)).toBeNull();
    expect(Campo.to(c)).toBeDefined();
    expect(Campo.to(null)).toBeNull();
  });

  it("DirigenteSquadra", () => {
    const c = new DirigenteSquadra(1, "s", 1, 2, "ruolo", "data_inizio");
    expect(c.id).toBe(1);
    expect(DirigenteSquadra.from({ id: 2 })).toBeDefined();
    expect(DirigenteSquadra.from(null)).toBeNull();
    expect(DirigenteSquadra.to(c)).toBeDefined();
    expect(DirigenteSquadra.to(null)).toBeNull();
  });

  it("Evento", () => {
    const c = new Evento(1, "titolo", "desc", "data_inizio", "data_fine", "luogo", "tipo");
    expect(c.id).toBe(1);
    expect(Evento.from({ id: 2 })).toBeDefined();
    expect(Evento.from(null)).toBeNull();
    expect(Evento.to(c)).toBeDefined();
    expect(Evento.to(null)).toBeNull();
  });

  it("Giocatore", () => {
    const c = new Giocatore({ id: 1, data_nascita: "2024-01-01", data_inizio_tesseramento: "2024-01-01", data_fine_tesseramento: "2024-01-01" });
    expect(c).toBeDefined();
    expect(Giocatore.from({ id: 2, data_nascita: "2024-01-01", data_inizio_tesseramento: "2024-01-01", data_fine_tesseramento: "2024-01-01" })).toBeDefined();
    expect(Giocatore.from(null)).toBeNull();
    // avoid calling Giocatore.to(c) because it assumes data_nascita is a Date object, but constructor stores it as passed string
    c.data_nascita = new Date();
    c.data_inizio_tesseramento = new Date();
    c.data_fine_tesseramento = new Date();
    expect(Giocatore.to(c)).toBeDefined();
    expect(Giocatore.to(null)).toBeNull();
  });

  it("Immagine", () => {
    const c = new Immagine(1, "url", "desc", "entita", 1);
    expect(c.id).toBe(1);
    expect(Immagine.from({ id: 2 })).toBeDefined();
    expect(Immagine.from(null)).toBeNull();
    expect(Immagine.to(c)).toBeDefined();
    expect(Immagine.to(null)).toBeNull();
  });

  it("Notizia", () => {
    const c = new Notizia(1, "titolo", "sotto", "img", "cont", "autore", 1, true, "2024-01-01", 0, "2024-01-01", "2024-01-01");
    expect(c.id).toBe(1);
    expect(Notizia.from({ id: 2, data_pubblicazione: "2024-01-01" })).toBeDefined();
    expect(Notizia.from(null)).toBeNull();
    expect(Notizia.to(c)).toBeDefined();
    expect(Notizia.to(null)).toBeNull();
    expect(Notizia.parseDate(new Date())).toBeDefined();
    expect(Notizia.parseDate("20/12/2024")).toBeDefined();
    expect(Notizia.parseDate("2024-12-20")).toBeDefined();
    expect(Notizia.parseDate(null)).toBeNull();
    expect(Notizia.parseDate({})).toBeNull();
  });

  it("Prenotazione", () => {
    const c = new Prenotazione(1, 1, 1, "2024-01-01", "10:00", "11:00", "stato", 10, false, "note");
    expect(c.id).toBe(1);
    expect(Prenotazione.from({ id: 2 })).toBeDefined();
    expect(Prenotazione.from(null)).toBeNull();
    expect(Prenotazione.to(c)).toBeDefined();
    expect(Prenotazione.to(null)).toBeNull();
  });

  it("Recensione", () => {
    const c = new Recensione(1, 1, 1, 5, "commento", "2024-01-01", "stato", "risp", "2024-01-01");
    expect(c.id).toBe(1);
    expect(Recensione.from({ id: 2 })).toBeDefined();
    expect(Recensione.from(null)).toBeNull();
    expect(Recensione.to(c)).toBeDefined();
    expect(Recensione.to(null)).toBeNull();
  });

  it("Squadra", () => {
    const c = new Squadra(1, "nome", "logo", "anno", "desc", "cat");
    expect(c.id).toBe(1);
    expect(Squadra.from({ id: 2 })).toBeDefined();
    expect(Squadra.from(null)).toBeNull();
    expect(Squadra.to(c)).toBeDefined();
    expect(Squadra.to(null)).toBeNull();
  });

  it("User", () => {
    const c = new User(1, "email", "pass", "nome", "cogn", "tel", 1, "tipo", "2024-01-01", "url");
    expect(c.id).toBe(1);
    expect(User.from({ id: 2 })).toBeDefined();
    expect(User.from(null)).toBeNull();
    expect(User.to(c)).toBeDefined();
    expect(User.to(null)).toBeNull();
  });
});
