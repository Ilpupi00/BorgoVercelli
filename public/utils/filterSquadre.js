class FilterSquadre {
    constructor(squadre, Section) {
        this.squadre = squadre;
        this.Section = Section;
        this.giocatori = [];
        this.init();
    }

    async init() {
        const response = await fetch('/GetGiocatori');
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
        // Se squadraId non è passato, prendi quello selezionato dal select
        const squadreSelect = this.Section.querySelector('#squadreSelect');
        console.log('Valore select:', squadreSelect ? squadreSelect.value : 'select non trovato');
        if (squadreSelect) {
            console.log('Opzioni select:', Array.from(squadreSelect.options).map(opt => opt.value));
        }
        console.log('Id passato a addRoster:', squadraId);
        if (squadraId === undefined || squadraId === null || squadraId === "") {
            squadraId = squadreSelect ? parseInt(squadreSelect.value) : null;
        }
        if (squadraId === null || isNaN(squadraId) || squadraId === "") {
            console.warn('Nessuna squadra selezionata');
            return;
        }
        // Filtra i giocatori della squadra
        console.log('id_squadra dei giocatori:', this.giocatori.map(g => g.id_squadra));
        const giocatori = this.giocatori.filter(g => Number(g.id_squadra) === Number(squadraId));
        console.log('Giocatori per la squadra:', giocatori);  
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
            tr.innerHTML = `
                <td>${idx + 1}</td>
                <td><img src="${giocatore.foto || ''}" class="player-photo" alt="Foto Giocatore"></td>
                <td>${giocatore.nome || ''}</td>
                <td>${giocatore.cognome || ''}</td>
                <td>${giocatore.numero_maglia || ''}</td>
                <td><span class="position-badge position-${giocatore.ruolo ? giocatore.ruolo.toLowerCase() : ''}">${giocatore.ruolo || ''}</span></td>
                <td>${giocatore.eta || ''}</td>
                <td>${giocatore.piede_preferito || ''}</td>
            `;
            rosterTable.appendChild(tr);
        });
    }
}
export default FilterSquadre;