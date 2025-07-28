class FilterSquadre {
    constructor(squadre, Section) {
        this.squadre = squadre;
        this.Section = Section;
        this.init();
    }

    async init() {
        const response = await fetch('/GetSquadre');
        if (!response.ok) {
            console.error('Errore nel recupero delle squadre:', response.statusText);
            return;
        }
        const data = await response.json();
        this.squadre = data.squadre || [];
        await this.addRoster(this.squadre[0].id);
    }

    async addRoster(squadraId) {
        // Filtra i giocatori della squadra
        const giocatori = this.squadre.filter(s => s.id === squadraId);
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
                <td><img src="${giocatore.foto || 'https://via.placeholder.com/40'}" class="player-photo" alt="Foto Giocatore"></td>
                <td>${giocatore.nome || ''}</td>
                <td>${giocatore.cognome || ''}</td>
                <td>${giocatore.numero_maglia || ''}</td>
                <td><span class="position-badge position-${giocatore.ruolo ? giocatore.ruolo.toLowerCase() : ''}">${giocatore.ruolo || ''}</span></td>
                <td>${giocatore.eta || ''}</td>
                <td>${giocatore.nazionalita || ''}</td>
            `;
            rosterTable.appendChild(tr);
        });
    }
}
export default FilterSquadre;