"use strict";

const Notizia = require('../src/core/models/notizia');
const Evento = require('../src/core/models/evento');
const User = require('../src/core/models/user');
const Campionato = require('../src/core/models/campionato');
const Campo = require('../src/core/models/campo');
const Giocatore = require('../src/core/models/giocatore');
const Immagine = require('../src/core/models/immagine');
const Prenotazione = require('../src/core/models/prenotazione');
const Recensione = require('../src/core/models/recensione');
const Squadra = require('../src/core/models/squadra');

describe('Models instantiation', () => {
    it('Notizia', () => {
        const m = new Notizia(1, 'T', 'C', 'S', 1, 'url', true, '2026-01-01', '2026-01-01', 10, 'autore');
        expect(m.id).toBe(1);
    });

    it('Evento', () => {
        const m = new Evento(1, 'T', 'D', '2026-01-01', 'pos', 'img', true, '2026-01-01', '2026-01-01', 10);
        expect(m.id).toBe(1);
    });

    it('User', () => {
        const m = new User(1, 'N', 'C', 'e@e.com', '123', 'admin', 'attivo');
        expect(m.id).toBe(1);
        expect(m.isAttivo()).toBe(true);
    });

    it('Campionato', () => {
        const m = new Campionato(1, 'N', 'S', 'C');
        expect(m.id).toBe(1);
    });

    it('Campo', () => {
        const m = new Campo(1, 'N', 'D', 'img');
        expect(m.id).toBe(1);
    });

    it('Giocatore', () => {
        const m = new Giocatore({ id: 1, Nome: 'N', Cognome: 'C' });
        expect(m.id).toBe(1);
    });

    it('Immagine', () => {
        const m = new Immagine(1, 'D', 'url', 'T', 'E', 1, 1, 'now', 'now');
        expect(m.id).toBe(1);
    });

    it('Prenotazione', () => {
        const m = new Prenotazione(1, 1, 1, 'now', 'now');
        expect(m.id).toBe(1);
    });

    it('Recensione', () => {
        const m = new Recensione(1, 1, 5, 'T', 'now');
        expect(m.id).toBe(1);
    });

    it('Squadra', () => {
        const m = new Squadra(1, 'N', 'C', 'img');
        expect(m.id).toBe(1);
    });

    it('User - isSospeso and isBannato', () => {
        const sospeso = new User(1, 'N', 'C', 'e@e.com', '123', 'admin', 'sospeso');
        expect(sospeso.isSospeso()).toBe(true);
        expect(sospeso.isAttivo()).toBe(false);
        
        const bannato = new User(1, 'N', 'C', 'e@e.com', '123', 'admin', 'bannato');
        expect(bannato.isBannato()).toBe(true);
    });

    it('User - isSospensioneScaduta returns false if not sospeso', () => {
        const m = new User(1, 'N', 'C', 'e@e.com', '123', 'admin', 'attivo');
        expect(m.isSospensioneScaduta()).toBe(false);
    });

    it('User - isSospensioneScaduta returns true if data_fine is past', () => {
        const m = new User(1, 'N', 'C', 'e@e.com', '123', 'admin', 'sospeso');
        const pastDate = new Date(Date.now() - 10000).toISOString();
        expect(m.isSospensioneScaduta({ data_fine: pastDate })).toBe(true);
    });

    it('User - isSospensioneScaduta returns false if data_fine is future', () => {
        const m = new User(1, 'N', 'C', 'e@e.com', '123', 'admin', 'sospeso');
        const futureDate = new Date(Date.now() + 10000).toISOString();
        expect(m.isSospensioneScaduta({ data_fine: futureDate })).toBe(false);
    });

    it('User - isDirigente returns false (placeholder)', () => {
        const m = new User(1, 'N', 'C', 'e@e.com', '123', 'admin', 'attivo');
        expect(m.isDirigente()).toBe(false);
    });

    it('User.from returns null for null input', () => {
        expect(User.from(null)).toBeNull();
    });

    it('User.from creates user from json', () => {
        const u = User.from({ id: 5, nome: 'Test', stato: 'attivo' });
        expect(u.id).toBe(5);
    });

    it('User.to returns null for null input', () => {
        expect(User.to(null)).toBeNull();
    });

    it('User.to converts user to json', () => {
        const m = new User(1, 'N', 'C', 'e@e.com', '123', 'admin', 'attivo');
        const json = User.to(m);
        expect(json.id).toBe(1);
    });

    it('User - default stato is attivo', () => {
        const m = new User(1, 'N', 'C', 'e@e.com', '123', 'admin', null);
        expect(m.stato).toBe('attivo');
    });

    it('Squadra.from returns null for null input', () => {
        expect(Squadra.from(null)).toBeNull();
    });

    it('Squadra.from creates from json', () => {
        const s = Squadra.from({ id: 2, nome: 'Team A' });
        expect(s.id).toBe(2);
    });

    it('Squadra.to returns null for null input', () => {
        expect(Squadra.to(null)).toBeNull();
    });

    it('Squadra.to converts to json', () => {
        const s = new Squadra(3, 'FC', null, 2020);
        const json = Squadra.to(s);
        expect(json.id).toBe(3);
    });

    it('Squadra - dirigenti and giocatori default to empty arrays', () => {
        const s = new Squadra(1, 'N', null, 2020);
        expect(s.dirigenti).toEqual([]);
        expect(s.giocatori).toEqual([]);
        expect(s.numero_giocatori).toBe(0);
    });
});
