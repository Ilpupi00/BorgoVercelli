import SearchPlayer from "../utils/cercaGiocatore.js";
import FilterGiocatori from "../utils/filterSquadre.js";
import { setupEmailFormListener } from './send_email.js';

class Squadre {
    constructor(page) {
        this.page = page;
        this.init();
    }

    async init() {
        document.title = "Squadre";
        const squadre = await this.fetchSquadre();
        this.setupComponents(squadre);
        setupEmailFormListener();
    }

    async fetchSquadre() {
        try {
            const response = await fetch('/getsquadre');
            if (!response.ok) {
                console.error('Errore nel recupero delle squadre:', response.statusText);
                return [];
            }
            const data = await response.json();
            return data || [];
        } catch (error) {
            console.error('Errore nel recupero delle squadre:', error);
            return [];
        }
    }

    setupComponents(squadre) {
        new SearchPlayer();
        const squadreSelect = this.page.querySelector('#squadreSelect');
        const annoSelect = this.page.querySelector('#annoSelect');
        const title = this.page.querySelector('#SquadraTitle');
        const img = this.page.querySelector('.img-container img');
        const rosterTitle = this.page.querySelector('#rosterTitle');

        let squadreAnno = [];
        if (squadre.length === 0) {
            return;
        }
        this.populateAnniSelect(squadre, annoSelect);
        // Assicuriamoci che il valore dell'anno sia una stringa per il confronto
        annoSelect.value = this.getFirstAnno(squadre);
        squadreAnno = squadre.filter(s => String(s.Anno) === String(annoSelect.value));
        this.updateSelects(squadreAnno, squadreSelect);
        this.updateHeader(squadreAnno, title, img);
        const filterGiocatori = new FilterGiocatori(squadre, this.page);
        squadreSelect.addEventListener('change', (event) => {
            this.handleSquadraChange(event, squadre, title, img, filterGiocatori, rosterTitle);
        });
        annoSelect.addEventListener('change', (event) => {
            this.handleAnnoChange(event, squadre, squadreSelect, title, img, filterGiocatori, rosterTitle);
        });
    }

    populateAnniSelect(squadre, annoSelect) {
        annoSelect.innerHTML = '';
        const anniUnici = [...new Set(squadre.map(s => s.Anno))];
        anniUnici.forEach(anno => {
            const option = document.createElement('option');
            // Normalizziamo il valore come stringa per evitare mismatch tra stringa/numero
            option.value = String(anno);
            option.textContent = String(anno);
            annoSelect.appendChild(option);
        });
    }

    getFirstAnno(squadre) {
        const anniUnici = [...new Set(squadre.map(s => s.Anno))];
        return anniUnici.length > 0 ? String(anniUnici[0]) : '';
    }

    updateSelects(squadreAnno, squadreSelect) {
        squadreSelect.innerHTML = '';
        squadreAnno.forEach(squadra => {
            const option = document.createElement('option');
            option.value = squadra.id;
            option.textContent = `${squadra.nome}`;
            squadreSelect.appendChild(option);
        });
        if (squadreAnno.length > 0) {
            squadreSelect.value = squadreAnno[0].id;
        }
    }

    updateHeader(squadreAnno, title, img, rosterTitle) {
        if (squadreAnno.length > 0) {
            const squadra = squadreAnno[0];
            title.textContent = squadra.nome;
            img.src = squadra.id_immagine || '/assets/images/Logo.png';
            img.alt = squadra.nome;
            if (rosterTitle) rosterTitle.textContent = `Roster ${squadra.nome}`;
        } else {
            title.textContent = 'Nessuna squadra selezionata';
            img.src = '/assets/images/Logo.png';
            img.alt = 'Logo';
            if (rosterTitle) rosterTitle.textContent = 'Roster';
        }
    }

    handleSquadraChange(event, squadre, title, img, filterGiocatori, rosterTitle) {
        const selectedSquadra = squadre.find(s => s.id === parseInt(event.target.value));
        this.updateHeader(selectedSquadra ? [selectedSquadra] : [], title, img, rosterTitle);
        filterGiocatori.addRoster(parseInt(event.target.value));
    }

    handleAnnoChange(event, squadre, squadreSelect, title, img, filterGiocatori, rosterTitle) {
        const selectedAnno = event.target.value;
        // Confronto su stringhe per evitare mismatch tra tipi
        const filteredSquadre = squadre.filter(s => String(s.Anno) === String(selectedAnno));
        this.updateSelects(filteredSquadre, squadreSelect);
        if (filteredSquadre.length > 0) {
            const firstSquadra = filteredSquadre[0];
            this.updateHeader(filteredSquadre, title, img, rosterTitle);
            squadreSelect.value = firstSquadra.id;
            filterGiocatori.addRoster(firstSquadra.id);
        } else {
            this.updateHeader([], title, img, rosterTitle);
            filterGiocatori.addRoster(null);
        }
    }
}

export default Squadre;