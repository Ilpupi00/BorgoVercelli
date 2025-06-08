class FilterNotizie {
    constructor(section, Notizie) {
        this.section = section;
        this.Notizie = Notizie;
        this.render(Notizie); // Aggiungi questa riga per renderizzare subito le notizie
    }

    filterByDate(date) {
        const filteredNotizie = this.Notizie.filter(notizia => {
            const notiziaDate = new Date(notizia.data);
            return notiziaDate >= date;
        });
        this.render(filteredNotizie);
    }

    render(filteredNotizie) {
        // Usa direttamente this.section invece di querySelector
        const notizieSection = document.createElement('section');
        notizieSection.className = 'vw-100';
        notizieSection.innerHTML = `
            <div class="container mt-5"> 
                <h2 class="section-title">Notizie</h2>
                <div class="row row-cols-1 row-cols-md-3 g-5">
                </div>
            </div>
        `;

        const row = notizieSection.querySelector('.row');
        
        if (filteredNotizie && filteredNotizie.length > 0) {
            filteredNotizie.slice(0, 3).forEach(notizia => {
                const notiziaElement = document.createElement('div');
                notiziaElement.className = 'col';
                notiziaElement.innerHTML = `
                    <div class="card h-100">
                        <div class="card-img-container" style="height: 200px; overflow: hidden;">
                            <img src="${notizia.immagine}" class="card-img-top" alt="Evento Tech" style="object-fit: cover; height: 100%; width: 100%;">
                        </div>
                        <div class="card-body d-flex flex-column">
                            <h5 class="card-title overflow-hidden">${notizia.titolo}</h5>
                            <p class="card-text">${notizia.sottotitolo}</p>
                            <div class="mt-auto">
                                <div class="text-muted mb-2">  ${notizia.data_pubblicazione 
                                ? new Date(notizia.data_pubblicazione.replace(' ', 'T')).toLocaleDateString() 
                                : 'N/D'}</div>
                                <a href="/Notizia/${notizia.id}" class="btn btn-primary btn-sm">Leggi di più</a>
                            </div>
                        </div>
                    </div>
                `;
                row.appendChild(notiziaElement);
            });
        } else {
            row.innerHTML = '<div class="col"><p>Nessuna notizia disponibile</p></div>';
        }

        this.section.appendChild(notizieSection);
    }
}

export default FilterNotizie;