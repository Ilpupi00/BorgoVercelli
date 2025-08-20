import FilterGiocatori from "../utils/filterSquadre.js"
import SearchPlayer from "../utils/cercaGiocatore.js";

class Squadre {
    constructor(page, loadCSS) {
        if (typeof loadCSS === 'function') loadCSS();
        this.page = page;
        this.init();
    }

    async init() {
        const squadre = await this.fetchSquadre();
        this.renderPage(squadre);
        this.setupComponents(squadre);
    }

    async fetchSquadre() {
        try {
            const response = await fetch('/GetSquadre');
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

    renderPage(squadre) {
        this.page.innerHTML = `
            <header class="m-5">
                <div class="mb-5 select-container mx-auto">
                    <select class="form-select form-select-sm custom-select" aria-label="Select menu" id="squadreSelect"></select>
                    <select class="form-select form-select-sm custom-select mt-4" aria-label="Select menu" id="annoSelect"></select>
                </div>
                <div>
                    <h1 class="text-center mb-4 overflow-hidden" id="SquadraTitle"></h1>
                </div>
                <div class="row">
                    ${
                        squadre.length === 0 
                        ? '<p class="text-center">Nessuna squadra trovata</p>' 
                        : squadre[0].id_immagine !== null
                            ? `<div class="col-12 text-center img-container">
                                <img src="${squadre[0].id_immagine}" alt="${squadre[0].nome}" class="img-fluid">
                            </div>`
                            : `<div class="img-container">
                                <img src="../../images/Logo.png" alt="Descrizione dell'immagine" class="centered-image w-auto h-auto">
                            </div>`
                    }
                </div>
            </header>
            <section>
                <div class="container mt-5">
                    <h1 class="text-center mb-4 overflow-hidden">Roster Squadra FC</h1>
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <div class="input-group">
                                <input type="text" class="form-control" placeholder="Cerca giocatore..." id="searchPlayer">
                                <button class="btn btn-outline-secondary" type="button" id="searchButton">Cerca</button>
                            </div>
                            <div id="resultsContainer" class="mt-2"></div>
                        </div>
                    </div>
                    <div class="table-responsive">
                        <table class="table table-soccer table-striped">
                            <thead>
                                <tr>
                                    <th scope="col">#</th>
                                    <th scope="col">Foto</th>
                                    <th scope="col">Nome</th>
                                    <th scope="col">Cognome</th>
                                    <th scope="col">Numero</th>
                                    <th scope="col">Ruolo</th>
                                    <th scope="col">Età</th>
                                    <th scope="col">Nazionalità</th>
                                </tr>
                            </thead>
                            <tbody id="rosterTable">
                                <!-- I giocatori saranno inseriti qui dinamicamente -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
        `;
    }

    setupComponents(squadre) {
        new SearchPlayer();
        const squadreSelect = this.page.querySelector('#squadreSelect');
        const annoSelect = this.page.querySelector('#annoSelect');
        const title = this.page.querySelector('#SquadraTitle');
        title.textContent = squadre.length > 0 ? squadre[0].nome : 'Nessuna squadra selezionata';
        let squadreAnno = [];
        if (squadre.length === 0) {
            squadreSelect.innerHTML = '<option value="">Nessuna squadra trovata</option>';
            return;
        }
        this.populateAnniSelect(squadre, annoSelect);
        annoSelect.value = this.getFirstAnno(squadre);
        squadreAnno = squadre.filter(s => s.Anno === annoSelect.value);
        this.populateSquadreSelect(squadreAnno, squadreSelect);
        this.updateHeader(squadreAnno, title);
        squadreSelect.value = squadreAnno[0] ? squadreAnno[0].id : '';
        const filterGiocatori = new FilterGiocatori(squadre, this.page);
        squadreSelect.addEventListener('change', (event) => {
            this.handleSquadraChange(event, squadre, title, filterGiocatori);
        });
        annoSelect.addEventListener('change', (event) => {
            this.handleAnnoChange(event, squadre, squadreSelect, title, filterGiocatori);
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

    populateSquadreSelect(squadreAnno, squadreSelect) {
        squadreSelect.innerHTML = '';
        squadreAnno.forEach(squadra => {
            const option = document.createElement('option');
            option.value = squadra.id;
            option.textContent = `${squadra.nome}`;
            squadreSelect.appendChild(option);
        });
    }

    updateHeader(squadreAnno, title) {
        if (squadreAnno.length > 0) {
            title.textContent = squadreAnno[0].nome;
            this.page.querySelector('img').src = squadreAnno[0].id_immagine || '../../images/Logo.png';
        } else {
            title.textContent = 'Nessuna squadra selezionata';
            this.page.querySelector('img').src = '../../images/Logo.png';
        }
    }

    handleSquadraChange(event, squadre, title, filterGiocatori) {
        const selectedSquadra = squadre.find(s => s.id === parseInt(event.target.value));
        title.textContent = selectedSquadra ? selectedSquadra.nome : 'Nessuna squadra selezionata';
        if (selectedSquadra && selectedSquadra.id_immagine) {
            this.page.querySelector('img').src = selectedSquadra.id_immagine;
        } else {
            this.page.querySelector('img').src = '../../images/Logo.png';
        }
        filterGiocatori.addRoster(parseInt(event.target.value));
    }

    handleAnnoChange(event, squadre, squadreSelect, title, filterGiocatori) {
        const selectedAnno = event.target.value;
        const filteredSquadre = squadre.filter(s => s.Anno === selectedAnno);
        this.populateSquadreSelect(filteredSquadre, squadreSelect);
        if (filteredSquadre.length > 0) {
            const firstSquadra = filteredSquadre[0];
            this.page.querySelector('img').src = firstSquadra.id_immagine || '../../images/Logo.png';
            title.textContent = firstSquadra.nome;
            squadreSelect.value = firstSquadra.id;
            filterGiocatori.addRoster(firstSquadra.id);
        } else {
            this.page.querySelector('img').src = '../../images/Logo.png';
            title.textContent = 'Nessuna squadra selezionata';
            filterGiocatori.addRoster(null);
        }
    }
}

export default Squadre;