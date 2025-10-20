import { setupEmailFormListener } from './send_email.js';

class Campionato {
    constructor(page) {
        this.page = page;
        this.init();
    }

    init() {
        document.title = "Campionato";
        this.setupSelect();
        setupEmailFormListener();
        // Aggiungere altre inizializzazioni se necessario
    }

    setupSelect() {
        const select = this.page.querySelector('.custom-select');
        if (select) {
            select.addEventListener('change', (event) => {
                const campionatoId = event.target.value;
                this.loadClassifica(campionatoId);
            });
        }
    }

    async loadClassifica(campionatoId) {
        try {
            const response = await fetch(`/campionato/classifica/${campionatoId}`);
            if (!response.ok) {
                throw new Error('Errore nel caricamento della classifica');
            }
            const data = await response.json();
            this.updateTable(data.classifica);
            this.updateLegenda(data.regole);
        } catch (error) {
            console.error('Errore:', error);
            // Potrebbe mostrare un messaggio di errore
        }
    }

    updateTable(classifica) {
        const tbody = this.page.querySelector('tbody');
        if (!tbody) return;

        tbody.innerHTML = ''; // Svuota la tabella

        classifica.forEach(squadra => {
            const row = document.createElement('tr');
            row.className = squadra.classe || '';
            row.innerHTML = `
                <th scope="row">${squadra.posizione}</th>
                <td>${squadra.nome}</td>
                <td>${squadra.punti}</td>
            `;
            tbody.appendChild(row);
        });
    }

    updateLegenda(regole) {
        const legendaList = this.page.querySelector('.legend-box-container ul');
        if (!legendaList) return;

        const promozioneDiretta = regole.promozione_diretta || 2;
        const playoffStart = regole.playoff_start || 3;
        const playoffEnd = regole.playoff_end || 6;
        const playoutStart = regole.playout_start || 11;
        const playoutEnd = regole.playout_end || 14;
        const retrocessioneDiretta = regole.retrocessione_diretta || 2;

        legendaList.innerHTML = `
            <li class="d-flex align-items-center gap-2">
                <span class="legend-color bg-success"></span>
                <span>Promozione diretta (1°-${promozioneDiretta}°)</span>
            </li>
            <li class="d-flex align-items-center gap-2">
                <span class="legend-color bg-secondary"></span>
                <span>Playoff (${playoffStart}°-${playoffEnd}°)</span>
            </li>
            <li class="d-flex align-items-center gap-2">
                <span class="legend-color bg-warning"></span>
                <span>Play-out (${playoutStart}°-${playoutEnd}°)</span>
            </li>
            <li class="d-flex align-items-center gap-2">
                <span class="legend-color bg-danger"></span>
                <span>Retrocessione diretta (ultime ${retrocessioneDiretta})</span>
            </li>
        `;
    }
}

export default Campionato;