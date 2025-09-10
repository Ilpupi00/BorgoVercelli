class FilterNotizie {
    constructor(section, Notizie, date = null) {
        this.section = section;
        this.Notizie = Notizie || [];
        
        // Clear existing content
        this.section.innerHTML = '';
        
        if (date) {
            this.filterByDate(date);
        } else {
            // If no date filter, show all news
            this.render(this.Notizie);
        }
    }

    filterByDate(date) {
        try {
            const filteredNotizie = this.Notizie.filter(notizia => {
                // Use data_pubblicazione instead of data
                const notiziaDate = new Date(notizia.data_pubblicazione);
                
                // Check if date is valid
                if (isNaN(notiziaDate.getTime())) {
                    console.warn('Invalid date for notizia:', notizia);
                    return false;
                }
                
                return notiziaDate >= date;
            });
            
            this.render(filteredNotizie);
        } catch (error) {
            console.error('Error filtering notizie by date:', error);
            this.render([]);
        }
    }

    getDefaultImage() {
        // Use a placeholder service or create a data URL for a simple placeholder
        return '../images/default-news.jpg';
    }

    render(filteredNotizie) {
        try {
            this.section.className = 'vw-100';
            this.section.innerHTML = `
                <div class="container mt-5"> 
                    <h2 class="section-title">Notizie</h2>
                    <div class="row row-cols-1 row-cols-md-3 g-5">
                    </div>
                </div>
            `;

            const row = this.section.querySelector('.row');
            
            if (filteredNotizie && filteredNotizie.length > 0) {
                // Show up to 3 news items
                filteredNotizie.slice(0, 3).forEach(notizia => {
                    const notiziaElement = document.createElement('div');
                    notiziaElement.className = 'col';
                    
                    // Format date properly
                    let formattedDate = 'N/D';
                    if (notizia.data_pubblicazione) {
                        try {
                            const date = new Date(notizia.data_pubblicazione.replace(' ', 'T'));
                            if (!isNaN(date.getTime())) {
                                formattedDate = date.toLocaleDateString('it-IT');
                            } else {
                                console.warn('DEBUG data non valida:', notizia.data_pubblicazione);
                            }
                        } catch (e) {
                            console.warn('Error formatting date:', notizia.data_pubblicazione);
                        }
                    } else {
                        console.warn('DEBUG data_pubblicazione assente:', notizia);
                    }
                    
                        let imageUrl = this.getDefaultImage();
                        if (notizia.immagine) {
                            if (!isNaN(Number(notizia.immagine))) {
                                imageUrl = `/uploads/${notizia.immagine}.jpg`;
                            } else {
                                imageUrl = notizia.immagine;
                            }
                        }
                        const fallbackImage = this.getDefaultImage();

                        // Calcolo id valido
                        let idNotizia = null;
                        if (notizia.N_id && !isNaN(Number(notizia.N_id)) && Number(notizia.N_id) > 0) {
                            idNotizia = Number(notizia.N_id);
                        } else if (notizia.id && !isNaN(Number(notizia.id)) && Number(notizia.id) > 0) {
                            idNotizia = Number(notizia.id);
                        }
                        if (!idNotizia) {
                            console.warn('Notizia con id non valido:', notizia);
                        }
                        const linkNotizia = idNotizia ? `/Notizia/${idNotizia}` : null;

                        // Funzione per verificare se l'immagine esiste
                        function checkImage(url) {
                            return fetch(url, { method: 'HEAD' })
                                .then(res => res.ok)
                                .catch(() => false);
                        }

                        // Generazione asincrona della card per gestire l'immagine
                        (async () => {
                            const exists = await checkImage(imageUrl);
                            const finalImageUrl = exists ? imageUrl : fallbackImage;
                            notiziaElement.innerHTML = `
                                <div class="card h-100">
                                    <div class="card-img-container" style="height: 200px; overflow: hidden;">
                                        <img src="${finalImageUrl}" 
                                             class="card-img-top" 
                                             alt="${notizia.titolo || 'Notizia'}" 
                                             style="object-fit: cover; height: 100%; width: 100%;">
                                    </div>
                                    <div class="card-body d-flex flex-column">
                                        <h5 class="card-title overflow-hidden">${notizia.titolo || 'Titolo non disponibile'}</h5>
                                        <p class="card-text">${notizia.sottotitolo || 'Descrizione non disponibile'
                                        }</p>
                                        <div class="text-muted small">${(notizia.autore_nome || '') + (notizia.autore_cognome ? ' ' + notizia.autore_cognome : '')}</div>
                                        <div class="mt-auto">
                                            <div class="text-muted mb-2">${formattedDate}</div>
                                            ${linkNotizia ? `<a href="${linkNotizia}" class="btn btn-primary btn-sm">Leggi di più</a>` : `<span class="btn btn-secondary btn-sm disabled">ID non valido</span>`}
                                        </div>
                                    </div>
                                </div>
                            `;
                            row.appendChild(notiziaElement);
                        })();
                });
            } else {
                row.innerHTML = '<div class="col-12"><div class="alert alert-info">Nessuna notizia disponibile per il periodo selezionato</div></div>';
            }
            const altreNotizie = document.createElement('div');
            altreNotizie.className = 'd-flex justify-content-center mt-5'; 
            altreNotizie.innerHTML = `<a href="/notizie/all" class="btn btn-primary btn-sm">Altre notizie</a>`;
            this.section.appendChild(altreNotizie);
        } catch (error) {
            console.error('Error rendering notizie:', error);
            this.section.innerHTML = '<div class="alert alert-danger">Errore nel caricamento delle notizie</div>';
        }
    }
}

export default FilterNotizie;