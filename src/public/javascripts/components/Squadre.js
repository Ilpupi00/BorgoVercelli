import FilterGiocatori from "../utils/filterSquadre.js"
import SearchPlayer from "../utils/cercaGiocatore.js";

class Squadre {
    constructor(page, loadCSS) {
        if (typeof loadCSS === 'function') loadCSS();
        this.page = page;
        this.init();
    }

    async init() {
        document.title = "Squadre";
        const squadre = await this.fetchSquadre();
        this.setupComponents(squadre);
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

        let squadreAnno = [];
        if (squadre.length === 0) {
            return;
        }
        this.populateAnniSelect(squadre, annoSelect);
        annoSelect.value = this.getFirstAnno(squadre);
        squadreAnno = squadre.filter(s => s.Anno === annoSelect.value);
        this.updateSelects(squadreAnno, squadreSelect);
        this.updateHeader(squadreAnno, title, img);
        const filterGiocatori = new FilterGiocatori(squadre, this.page);
        squadreSelect.addEventListener('change', (event) => {
            this.handleSquadraChange(event, squadre, title, img, filterGiocatori);
        });
        annoSelect.addEventListener('change', (event) => {
            this.handleAnnoChange(event, squadre, squadreSelect, title, img, filterGiocatori);
        });
    }

    populateAnniSelect(squadre, annoSelect) {
        annoSelect.innerHTML = '';
        const anniUnici = [...new Set(squadre.map(s => s.Anno))];
        anniUnici.forEach(anno => {
            const option = document.createElement('option');
            option.value = anno;
            option.textContent = `${anno}`;
            annoSelect.appendChild(option);
        });
    }

    getFirstAnno(squadre) {
        const anniUnici = [...new Set(squadre.map(s => s.Anno))];
        return anniUnici[0];
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

    updateHeader(squadreAnno, title, img) {
        if (squadreAnno.length > 0) {
            const squadra = squadreAnno[0];
            title.textContent = squadra.nome;
            img.src = squadra.id_immagine || '/images/Logo.png';
            img.alt = squadra.nome;
        } else {
            title.textContent = 'Nessuna squadra selezionata';
            img.src = '/images/Logo.png';
            img.alt = 'Logo';
        }
    }

    handleSquadraChange(event, squadre, title, img, filterGiocatori) {
        const selectedSquadra = squadre.find(s => s.id === parseInt(event.target.value));
        title.textContent = selectedSquadra ? selectedSquadra.nome : 'Nessuna squadra selezionata';
        if (selectedSquadra && selectedSquadra.id_immagine) {
            img.src = selectedSquadra.id_immagine;
            img.alt = selectedSquadra.nome;
        } else {
            img.src = '/images/Logo.png';
            img.alt = 'Logo';
        }
        filterGiocatori.addRoster(parseInt(event.target.value));
    }

    handleAnnoChange(event, squadre, squadreSelect, title, img, filterGiocatori) {
        const selectedAnno = event.target.value;
        const filteredSquadre = squadre.filter(s => s.Anno === selectedAnno);
        this.updateSelects(filteredSquadre, squadreSelect);
        if (filteredSquadre.length > 0) {
            const firstSquadra = filteredSquadre[0];
            this.updateHeader(filteredSquadre, title, img);
            squadreSelect.value = firstSquadra.id;
            filterGiocatori.addRoster(firstSquadra.id);
        } else {
            this.updateHeader([], title, img);
            filterGiocatori.addRoster(null);
        }
    }
}

export default Squadre;