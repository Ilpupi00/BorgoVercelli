
class Squadre{
    constructor(page,loadCSS){
        if (typeof loadCSS === 'function') loadCSS(); 
        this.page = page;
        this.render();
    }

    async render(){
        const response= await fetch('/GetSquadre'); 
        if (!response.ok) {
            console.error('Errore nel recupero delle squadre:', response.statusText);
        }        
        const data = await response.json();
        const squadre = data.squadre || [];
        this.page.innerHTML = `
        <header class="m-5">
            <!-- Menu a tendina con margine sotto -->
            <div class="mb-5 w-25 overflow-hidden mx-auto">
                <select class="form-select form-select-sm custom-select " aria-label="Select menu" id="squadreSelect"></select>
                <select class="form-select form-select-sm custom-select mt-4" aria-label="Select menu" id="annoSelect"></select>
            </div>
            <div class="row">
                ${
                    squadre.length === 0 
                    ? '<p class="text-center">Nessuna squadra trovata</p>' 
                    : squadre[0].id_immagine !==null
                    ? `<div class="col-12 text-center">
                        <img src="${squadre[0].id_immagine}" alt="${squadre[0].nome}" class="img-fluid rounded-circle" style="max-width: 200px; max-height: 200px;">
                      </div>`
                    :`<div class="img-container">
                        <img src="../../images/Logo.png" alt="Descrizione dell'immagine" class="centered-image w-auto h-auto">
                    </div>`
                    
                }>
            </div>
        </header>
        `;
        const squadreSelect = this.page.querySelector('#squadreSelect');
        const annoSelect = this.page.querySelector('#annoSelect');
        
        try {
           
            
            if (squadre.length === 0) {
                squadreSelect.innerHTML = '<option value="">Nessuna squadra trovata</option>';
                return;
            }           
            squadre.forEach(anno => {
                if(anno.Anno === annoSelect.value) return; // Skip if already added
                const option = document.createElement('option');
                option.value = anno.Anno;
                option.textContent = `${anno.Anno}`;
                annoSelect.appendChild(option);
            });
            // Popola il menu a tendina delle squadre
            squadre.forEach(squadra => {
                if(squadra.nome === squadreSelect.value) return; // Skip if already added
                const option = document.createElement('option');
                option.value = squadra.id;
                option.textContent = `${squadra.nome}`;
                squadreSelect.appendChild(option);
            });

            // Popola il menu a tendina degli anni
           


        } catch (error) {
            console.error('Errore nel recupero delle squadre:', error);
        }
    }
}

export default Squadre;