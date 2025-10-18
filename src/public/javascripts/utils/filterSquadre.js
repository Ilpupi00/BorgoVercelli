class FilterSquadre {
    constructor(squadre, Section) {
        this.squadre = squadre;
        this.Section = Section;
        this.giocatori = [];
        this.init();
    }

    async init() {
        const response = await fetch('/getgiocatori');
        if (!response.ok) {
            console.error('Errore nel recupero dei giocatori:', response.statusText);
            return;
        }
        const data = await response.json();
        this.giocatori = data.giocatori || [];
        console.log('Giocatori recuperati:', this.giocatori);
        // Prendi la prima squadra e mostra il suo roster
        if (this.squadre.length > 0) {
            await this.addRoster(this.squadre[0].id);
        }
    }

    async addRoster(squadraId) {
        console.log('Aggiungo roster per squadra ID:', squadraId);
        const squadreSelect = this.Section.querySelector('#squadreSelect');
        // Se non viene passato l'id, prendi quello selezionato
        if (squadraId === undefined || squadraId === null || squadraId === "") {
            if (squadreSelect && squadreSelect.value !== "") {
                squadraId = parseInt(squadreSelect.value);
            } else if (this.squadre.length > 0) {
                squadraId = this.squadre[0].id;
                if (squadreSelect) squadreSelect.value = squadraId;
            } else {
                console.warn('Nessuna squadra selezionata o disponibile');
                return;
            }
        }
        if (squadraId === null || isNaN(squadraId)) {
            console.warn('Nessuna squadra selezionata');
            return;
        }
        // Listener per cambio squadra
        if (squadreSelect && !squadreSelect._listenerAdded) {
            squadreSelect.addEventListener('change', () => this.addRoster());
            squadreSelect._listenerAdded = true;
        }
        // Filtra i giocatori della squadra (corretto)
        const giocatori = this.giocatori.filter(g => Number(g.squadra_id) === Number(squadraId));
        const rosterTable = this.Section.querySelector('#rosterTable');
        rosterTable.innerHTML = '';
        if (giocatori.length === 0) {
            const tr = document.createElement('tr');
            const td = document.createElement('td');
            td.colSpan = 8;
            td.textContent = 'Nessun giocatore trovato per questa squadra.';
            tr.appendChild(td);
            rosterTable.appendChild(tr);
            return;
        }
        giocatori.forEach((giocatore, idx) => {
            const tr = document.createElement('tr');
            let fotoCell = '';
            if (giocatore.foto && giocatore.foto.trim() !== '') {
                fotoCell = `<img src="${giocatore.foto}" class="player-photo rounded-circle" style="width:32px;height:32px;object-fit:cover;" alt="Foto Giocatore">`;
            } else {
                fotoCell = `<i class="fa fa-user-circle fa-2x text-secondary"></i>`;
            }
            const ruoloClass = giocatore.ruolo ? giocatore.ruolo.toLowerCase().replace(/\s+/g, '').replace(/[àèéìòù]/g, '') : '';
            // Calcola età dal campo data_nascita (formato: YYYY-MM-DD)
            let eta = '';
            if (giocatore.data_nascita) {
                const oggi = new Date();
                const nascita = new Date(giocatore.data_nascita);
                eta = oggi.getFullYear() - nascita.getFullYear();
                const m = oggi.getMonth() - nascita.getMonth();
                if (m < 0 || (m === 0 && oggi.getDate() < nascita.getDate())) {
                    eta--;
                }
            } else if (giocatore.eta) {
                eta = giocatore.eta;
            }
            tr.innerHTML = `
                <td>${idx + 1}</td>
                <td>${fotoCell}</td>
                <td>${giocatore.Nome || ''}</td>
                <td>${giocatore.Cognome || ''}</td>
                <td>${giocatore.numero_maglia || ''}</td>
                <td><span class="position-badge position-${ruoloClass}">${giocatore.ruolo || ''}</span></td>
                <td>${eta}</td>
                <td>${giocatore.piede_preferito=== 'Sinistro' ? 'SX':'DX' || '' }</td>
                <td>${giocatore.Nazionalita || ''}</td>
            `;
            rosterTable.appendChild(tr);
        });
    }
}
export default FilterSquadre;