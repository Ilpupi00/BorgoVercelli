

class CercaGiocatore {
    constructor() {
        this.searchInput = document.getElementById('searchPlayer');
        this.searchButton = document.getElementById('searchButton');
        this.resultsContainer = document.getElementById('resultsContainer');

        if (this.searchInput && this.searchButton && this.resultsContainer) {
            this.searchButton.addEventListener('click', () => this.searchPlayer());
        } else {
            console.error('[CercaGiocatore] Uno o più elementi non trovati nel DOM:', {
                searchInput: this.searchInput,
                searchButton: this.searchButton,
                resultsContainer: this.resultsContainer
            });
        }
    }

    async searchPlayer() {
        const query = this.searchInput.value.trim();
        const rosterTable = document.getElementById('rosterTable');
        if (!rosterTable) return;
        const response = await fetch('/GetGiocatori');
        if (!response.ok) {
            this.resultsContainer.innerHTML = 'Errore nel recupero dei giocatori.';
            return;
        }
        const data = await response.json();
        const giocatori = data.giocatori || [];
        let results = giocatori;
        if (query) {
            results = giocatori.filter(g =>
                (g.nome && g.nome.toLowerCase().includes(query.toLowerCase())) ||
                (g.cognome && g.cognome.toLowerCase().includes(query.toLowerCase()))
            );
        }
        rosterTable.innerHTML = '';
        if (!query) {
        // Se la ricerca è vuota, mostra solo i giocatori della squadra selezionata, oppure tutti se nessuna squadra è selezionata
        this.resultsContainer.innerHTML = '';
        const squadreSelect = document.getElementById('squadreSelect');
        let squadraId = squadreSelect ? parseInt(squadreSelect.value) : null;
        let filtered = [];
        if (squadraId) {
            filtered = giocatori.filter(g => Number(g.squadra_id) === squadraId);
        } else {
            filtered = giocatori;
        }
        rosterTable.innerHTML = '';
        filtered.forEach((g, idx) => {
            const tr = document.createElement('tr');
            let fotoCell = '';
            if (g.id_immagine) {
                fotoCell = `<img src="${g.id_immagine}" class="player-photo rounded-circle" style="width:32px;height:32px;object-fit:cover;" alt="Foto Giocatore">`;
            } else {
                fotoCell = `<i class='fa fa-user-circle fa-2x text-secondary'></i>`;
            }
            const ruoloClass = g.ruolo ? g.ruolo.toLowerCase().replace(/\s+/g, '').replace(/[àèéìòù]/g, '') : '';
            // Calcola età dal campo data_nascita (formato: YYYY-MM-DD)
            let eta = '';
            if (g.data_nascita) {
                const oggi = new Date();
                const nascita = new Date(g.data_nascita);
                eta = oggi.getFullYear() - nascita.getFullYear();
                const m = oggi.getMonth() - nascita.getMonth();
                if (m < 0 || (m === 0 && oggi.getDate() < nascita.getDate())) {
                    eta--;
                }
            } else if (g.eta) {
                eta = g.eta;
            }
            tr.innerHTML = `
                <td>${idx + 1}</td>
                <td>${fotoCell}</td>
                <td>${g.nome || ''}</td>
                <td>${g.cognome || ''}</td>
                <td>${g.numero_maglia || ''}</td>
                <td><span class="position-badge position-${ruoloClass}">${g.ruolo || ''}</span></td>
                <td>${eta}</td>
                <td>${g.piede_preferito === 'Sinistro' ? 'SX' : 'DX' || ''}</td>
            `;
            rosterTable.appendChild(tr);
        });
        return;
        } else if (results.length === 0) {
            this.resultsContainer.innerHTML = 'Nessun giocatore trovato.';
            return;
        } else {
            this.resultsContainer.innerHTML = '';
        }
        results.forEach((g, idx) => {
            const tr = document.createElement('tr');
            let fotoCell = '';
            if (g.id_immagine) {
                fotoCell = `<img src="${g.id_immagine}" class="player-photo rounded-circle" style="width:32px;height:32px;object-fit:cover;" alt="Foto Giocatore">`;
            } else {
                fotoCell = `<i class='fa fa-user-circle fa-2x text-secondary'></i>`;
            }
            const ruoloClass = g.ruolo ? g.ruolo.toLowerCase().replace(/\s+/g, '').replace(/[àèéìòù]/g, '') : '';
            // Calcola età dal campo data_nascita (formato: YYYY-MM-DD)
            let eta = '';
            if (g.data_nascita) {
                const oggi = new Date();
                const nascita = new Date(g.data_nascita);
                eta = oggi.getFullYear() - nascita.getFullYear();
                const m = oggi.getMonth() - nascita.getMonth();
                if (m < 0 || (m === 0 && oggi.getDate() < nascita.getDate())) {
                    eta--;
                }
            } else if (g.eta) {
                eta = g.eta;
            }
            tr.innerHTML = `
                <td>${idx + 1}</td>
                <td>${fotoCell}</td>
                <td>${g.nome || ''}</td>
                <td>${g.cognome || ''}</td>
                <td>${g.numero_maglia || ''}</td>
                <td><span class="position-badge position-${ruoloClass}">${g.ruolo || ''}</span></td>
                <td>${eta}</td>
                <td>${g.piede_preferito === 'Sinistro' ? 'SX' : 'DX' || ''}</td>
            `;
            rosterTable.appendChild(tr);
        });
    }
}

export default CercaGiocatore;