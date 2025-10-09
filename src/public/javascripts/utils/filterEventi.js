class FilterEventi {
    constructor(section, Eventi) {
        this.section = section;
        this.Eventi = Eventi || [];
        this.render(this.Eventi);
    }

    filterByDate(date) {
        const filteredEventi = this.Eventi.filter(evento => {
            const dataEvento = new Date(evento.data);
            // Verifica che la data sia valida
            return !isNaN(dataEvento.getTime()) && dataEvento >= date;
        });
        this.render(filteredEventi);
    }

    getDefaultImage() {
        return '../images/default-news.jpg';
    }

    render(filteredEventi) {
        this.section.className = 'vw-100';
        this.section.innerHTML = `
            <div class="container mt-5"> 
                <h2 class="section-title">Eventi</h2>
                <div class="row row-cols-1 row-cols-md-3 g-4">
                </div>
            </div>
        `;

        const row = this.section.querySelector('.row');
        const fallbackImage = this.getDefaultImage();

        if (filteredEventi && filteredEventi.length > 0) {
            filteredEventi.slice(0, 3).forEach(evento => {
                // Gestione campi mancanti
                const titolo = evento.titolo || 'Titolo non disponibile';
                const sottotitolo = evento.descrizione || 'Descrizione non disponibile';
                const imageUrl = evento.immagine || fallbackImage;

                // Gestione data
                let formattedDate = 'N/D';
                if (evento.data_inizio) {
                    try {
                        // Sostituisci spazio con T se necessario
                        const date = new Date(evento.data_inizio.replace(' ', 'T'));
                        if (!isNaN(date.getTime())) {
                            formattedDate = date.toLocaleDateString('it-IT');
                        }
                    } catch (e) {
                        // lascia N/D
                    }
                }

                const eventoElement = document.createElement('div');
                eventoElement.className = 'col';
                eventoElement.innerHTML = `
                    <div class="card h-100">
                        <div class="card-img-container" style="height: 200px; overflow: hidden;">
                            <img src="${imageUrl}" 
                                 class="card-img-top" 
                                 alt="${titolo}" 
                                 style="object-fit: cover; height: 100%; width: 100%;"
                                 onerror="this.src='${fallbackImage}'">
                        </div>
                        <div class="card-body d-flex flex-column">
                            <h5 class="card-title overflow-hidden">${titolo}</h5>
                            <p class="card-text">${sottotitolo}</p>
                            <div class="mt-auto">
                                <div class="text-muted mb-2">${formattedDate}</div>
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
        const altreNotizie = document.createElement('div');
        altreNotizie.className = 'd-flex justify-content-center mt-5'; 
        altreNotizie.innerHTML = `<a href="/eventi/all" class="btn btn-primary btn-sm">Altre eventi</a>`;
        this.section.appendChild(altreNotizie);
    }
}

export default FilterEventi;
