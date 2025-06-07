class FilterEventi {
    constructor(section, Eventi) {
        console.log('FilterEventi costruttore - Eventi ricevuti:', Eventi); // Aggiungi questo log
        this.section = section;
        this.Eventi = Eventi;
        this.render(Eventi);
    }

    filterByDate(date) {
        const filteredEventi = this.Eventi.filter(evento => { // Era eventi =>
            const dataEvento = new Date(evento.data); // Era notiziaEventi
            return dataEvento >= date;
        });
        this.render(filteredEventi);
    }

    render(filteredEventi) { // Era fileterdEventi (errore di battitura)
        const eventiSection = document.createElement('section');
        eventiSection.className = 'vw-100';
        eventiSection.innerHTML = `
            <div class="container mt-5"> 
                <h2 class="section-title">Eventi</h2>
                <div class="row row-cols-1 row-cols-md-3 g-4">
                </div>
            </div>
        `;

        const row = eventiSection.querySelector('.row');
        
        if (filteredEventi && filteredEventi.length > 0) {
            filteredEventi.slice(0, 3).forEach(evento => { // Era eventi
                const eventoElement = document.createElement('div'); // Era EventiElement
                eventoElement.className = 'col';
                eventoElement.innerHTML = `
                    <div class="card h-100">
                        <div class="card-img-container" style="height: 200px; overflow: hidden;">
                            <img src="${evento.immagine}" class="card-img-top" alt="Evento" style="object-fit: cover; height: 100%; width: 100%;">
                        </div>
                        <div class="card-body d-flex flex-column">
                            <h5 class="card-title overflow-hidden">${evento.titolo}</h5>
                            <p class="card-text">${evento.sottotitolo}</p>
                            <div class="mt-auto">
                                <div class="text-muted mb-2">${new Date(evento.data).toLocaleDateString()}</div>
                                <a href="/Evento/${evento.id}" class="btn btn-primary btn-sm">Leggi di più</a>
                            </div>
                        </div>
                    </div>
                `;
                row.appendChild(eventoElement);
            });
        } else {
            row.innerHTML = '<div class="col"><p>Nessun evento disponibile</p></div>';
        }

        this.section.appendChild(eventiSection);
    }
}

export default FilterEventi;