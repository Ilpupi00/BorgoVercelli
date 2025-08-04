import FilterGiocatori from "../../utils/filterSquadre.js"
class Squadre {
    constructor(page, loadCSS) {
        if (typeof loadCSS === 'function') loadCSS();
        this.page = page;
        this.render();
    }

    async render() {
            const response = await fetch('/GetSquadre');
            if (!response.ok) {
                console.error('Errore nel recupero delle squadre:', response.statusText);
            }
            const data = await response.json();
            const squadre = data.squadre || [];
            this.page.innerHTML = `
            <header class="m-5">
                <!-- Menu a tendina con margine sotto -->
                <div class="mb-5 w-25 overflow-hidden mx-auto col-2">
                    <select class="form-select form-select-sm custom-select row-cols-2" aria-label="Select menu" id="squadreSelect"></select>
                    <select class="form-select form-select-sm custom-select mt-4 row-cols-1" aria-label="Select menu" id="annoSelect"></select>
                </div>
                <div>
                    <h1 class="text-center mb-4 overflow-hidden" id="SquadraTitle"></h1>
                </div>
                <div class="row">
                    ${
                        squadre.length === 0 
                        ? '<p class="text-center">Nessuna squadra trovata</p>' 
                        : squadre[0].id_immagine !==null
                            ? 
                            `<div class="col-12 text-center img-container">
                                <img src="${squadre[0].id_immagine}" alt="${squadre[0].nome}" class="img-fluid">
                            </div>`
                            :
                            `<div class="img-container">
                                <img src="../../images/Logo.png" alt="Descrizione dell'immagine" class="centered-image w-auto h-auto">
                            </div>`
                    }
                </div>

                </div>
            </header>
            <section>
                <div class="container mt-5">
                    <h1 class="text-center mb-4 overflow-hidden">Roster Squadra FC</h1>
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <div class="input-group">
                            <input type="text" class="form-control" placeholder="Cerca giocatore..." id="searchPlayer">
                            <button class="btn btn-outline-secondary" type="button">Cerca</button>
                        </div>
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
            </section>
  
            `;
        
        const searchInput = this.page.querySelector('#searchPlayer');
        const squadreSelect = this.page.querySelector('#squadreSelect');
        const annoSelect = this.page.querySelector('#annoSelect');
        const title = this.page.querySelector('#SquadraTitle');
        title.textContent = squadre.length > 0 ? squadre[0].nome : 'Nessuna squadra selezionata';
        let squadreAnno = [];
        try {
            if (squadre.length === 0) {
                squadreSelect.innerHTML = '<option value="">Nessuna squadra trovata</option>';
                return;
            }
            // Popola il menu a tendina degli anni (senza duplicati)
            const anniUnici = [...new Set(squadre.map(s => s.Anno))];
            anniUnici.forEach(anno => {
                const option = document.createElement('option');
                option.value = anno;
                option.textContent = `${anno}`;
                annoSelect.appendChild(option);
            });
            // Seleziona il primo anno disponibile
            annoSelect.value = anniUnici[0];
            // Popola il menu a tendina delle squadre solo per l'anno selezionato
            squadreAnno = squadre.filter(s => s.Anno === annoSelect.value);
            squadreSelect.innerHTML = '';
            squadreAnno.forEach(squadra => {
                const option = document.createElement('option');
                option.value = squadra.id;
                option.textContent = `${squadra.nome}`;
                squadreSelect.appendChild(option);
            });
            // Aggiorna titolo e immagine in base alla prima squadra dell'anno selezionato
            if (squadreAnno.length > 0) {
                title.textContent = squadreAnno[0].nome;
                this.page.querySelector('img').src = squadreAnno[0].id_immagine || '../../images/Logo.png';
            } else {
                title.textContent = 'Nessuna squadra selezionata';
                this.page.querySelector('img').src = '../../images/Logo.png';
            }
        } catch (error) {
            console.error('Errore nel recupero delle squadre:', error);
        }
        // Dopo il try/catch
        squadreSelect.value = squadreAnno[0] ? squadreAnno[0].id : '';
        const filterGiocatori = new FilterGiocatori(squadre, this.page);

        squadreSelect.addEventListener('change', (event) => {
            const selectedSquadra = squadre.find(s => s.id === parseInt(event.target.value));
            title.textContent = selectedSquadra ? selectedSquadra.nome : 'Nessuna squadra selezionata';
            if (selectedSquadra && selectedSquadra.id_immagine) {
                this.page.querySelector('img').src = selectedSquadra.id_immagine;
            } else {
                this.page.querySelector('img').src = '../../images/Logo.png';
            }
            filterGiocatori.addRoster(parseInt(event.target.value));
        }); 

        annoSelect.addEventListener('change', (event) => {
            const selectedAnno = event.target.value;
            const filteredSquadre = squadre.filter(s => s.Anno === selectedAnno);
            squadreSelect.innerHTML = '';
            filteredSquadre.forEach(squadra => {
                const option = document.createElement('option');
                option.value = squadra.id;
                option.textContent = `${squadra.nome}`;
                squadreSelect.appendChild(option);
            });
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
        });
    }
}

export default Squadre;