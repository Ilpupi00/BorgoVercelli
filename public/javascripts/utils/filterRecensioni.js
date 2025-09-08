import showModal from '../utils/showModal.js';

class FilteredRecensioni {
    constructor(section, recensioni) {
        this.section = section;
        this.recensioni = recensioni;
        this.render();
    }

    render() {
        
        this.section.className = 'reviews-this.section mt-5 py-5';

        this.section.innerHTML = `
            <div class="container">
                <div class="row text-center">
                    <div class="col-12">
                        <h2 class="this.section-title overflow-hidden">Recensioni della struttura</h2>
                    </div>
                </div>
                <div class="row" id="reviews-row"></div>
            </div>
        `;

        const reviewsRow = this.section.querySelector('#reviews-row');

        // Limita a solo 6 recensioni
        const limitedRecensioni = this.recensioni.slice(0, 6);

        limitedRecensioni.forEach(recensione => {
            
            const col = document.createElement('div');
            col.className = 'col-md-4 mb-4';

            // Map database fields to expected format
            // Assicurati che stars sia un numero valido tra 0 e 5
            let stars = parseInt(recensione.valutazione) || 5;
            stars = Math.min(Math.max(stars, 0), 5); // Forza il valore tra 0 e 5
            
            const text = recensione.contenuto || recensione.titolo || 'Nessun contenuto disponibile';
            const name = `${recensione.nome_utente || ''} ${recensione.cognome_utente || ''}`.trim() || 'Utente Anonimo';
            const date = recensione.data_recensione ? new Date(recensione.data_recensione).toLocaleDateString('it-IT') : 'Data non disponibile';
            
            // Se non c'è immagine, usa l'icona profilo
            const imageElement = recensione.immagine_utente 
                ? `<img src="${recensione.immagine_utente}" alt="Reviewer" class="reviewer-image">`
                : `<i class="fas fa-user-circle reviewer-icon"></i>`;
            
            // Genera le stelle - assicurati che il totale sia sempre 5
            const filledStars = '<i class="fas fa-star text-warning"></i>'.repeat(stars);
            const emptyStars = '<i class="far fa-star text-muted"></i>'.repeat(5 - stars);
            const starsHtml = filledStars + emptyStars;

            col.innerHTML = `
                <div class="review-card bg-white">
                    <div class="review-content">
                        <div class="review-stars mb-2">
                            ${starsHtml}
                        </div>
                        <p class="review-text">${text}</p>
                        <div class="reviewer-info">
                            ${imageElement}
                            <div>
                                <p class="reviewer-name">${name}</p>
                                <p class="review-date">${date}</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            reviewsRow.appendChild(col);
        });

        const altreNotizie = document.createElement('div');
        altreNotizie.className = 'd-flex justify-content-center mt-3'; 
        altreNotizie.innerHTML = `
            <a href="/recensioni/all" class="btn btn-primary btn-sm m-auto me-2 ms-2">Altre Recensioni</a>
            <a href="#" id="scriviRecensioneBtn" class="btn btn-primary btn-sm me-2 ms-2">Scrivi Recensione</a>`;
        this.section.appendChild(altreNotizie);

        // Gestione click su "Scrivi Recensione"
        const scriviBtn = this.section.querySelector('#scriviRecensioneBtn');
        if (scriviBtn) {
            scriviBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                try {
                    const response = await fetch('/scrivi/Recensione', { method: 'GET' });
                    if (response.status === 401) {
                        showModal.showLoginRequiredModal('Devi essere autenticato per scrivere una recensione!');
                        return;
                    }
                    // Se non 401, vai alla pagina
                    window.location.href = '/scrivi/Recensione';
                } catch (err) {
                    alert('Errore di rete. Riprova più tardi.');
                }
            });
        }
        return this.section;
    }
}

export default FilteredRecensioni;
