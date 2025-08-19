class Prenotazione {
    constructor(page, loadCSS) {
        if (typeof loadCSS === 'function') loadCSS();
        this.page = page;
        this.campi = [];
        this.orariDisponibili = {};
        this.init();
    }

    async init() {
        await this.fetchCampi();
        await this.fetchOrari();
        this.render();
        this.addEventListeners();
    }

    async fetchCampi() {
        try {
            const res = await fetch('/prenotazione/campi');
            this.campi = await res.json();
        } catch (e) {
            this.campi = [];
        }
    }

    async fetchOrari() {
        const oggi = new Date().toISOString().slice(0, 10);
        this.orariDisponibili = {};
        for (const campo of this.campi) {
            try {
                const res = await fetch(`/prenotazione/campi/${campo.id}/disponibilita?data=${oggi}`);
                this.orariDisponibili[campo.id] = await res.json();
            } catch (e) {
                this.orariDisponibili[campo.id] = [];
            }
        }
    }

    render() {
        let html = '';
        if (this.campi.length === 0) {
            html = '<div class="alert alert-warning">Nessun campo disponibile al momento.</div>';
        } else {
            html = this.campi.map(campo => {
                // Usa la prima immagine associata, se presente, altrimenti fallback
                let imgSrc = '/Sito/Immagini/default-news.jpg';
                if (campo.immagini && campo.immagini.length > 0) {
                    // Se l'url non inizia con /Sito/Immagini, allora è un upload
                    if (campo.immagini[0].url.startsWith('/Sito/Immagini')) {
                        imgSrc = campo.immagini[0].url;
                    } else {
                        imgSrc = '/uploads/' + campo.immagini[0].url.replace(/^\/+/, '');
                    }
                } else if (campo.tipo === 'Calcio a 5') {
                    imgSrc = '/Sito/Immagini/Campo_a_5.jpg';
                } else if (campo.tipo === 'Calcio a 7') {
                    imgSrc = '/Sito/Immagini/Campo_a_7.jpg';
                }
                    // Mostra tutte le immagini disponibili e il numero
                    let immaginiHtml = '';
                    let numImmagini = (campo.immagini && Array.isArray(campo.immagini)) ? campo.immagini.length : 0;
                    if (numImmagini > 0) {
                        immaginiHtml = campo.immagini.map(img => {
                            let src = img.url;
                            if (src.startsWith('/Sito/Immagini')) {
                                // Immagine statica
                                // src rimane invariato
                            } else if (src.startsWith('/uploads')) {
                                // Immagine già corretta
                            } else {
                                src = '/uploads/' + src.replace(/^\/+/, '');
                            }
                            return `<img src="${src}" alt="Campo" class="img-fluid w-100 mb-2 rounded">`;
                        }).join('');
                    } else if (campo.tipo === 'Calcio a 5') {
                        immaginiHtml = `<img src="/Sito/Immagini/Campo_a_5.jpg" alt="Campo di Calcio a 5" class="img-fluid w-100 mb-2 rounded">`;
                    } else if (campo.tipo === 'Calcio a 7') {
                        immaginiHtml = `<img src="/Sito/Immagini/Campo_a_7.jpg" alt="Campo di Calcio a 7" class="img-fluid w-100 mb-2 rounded">`;
                    } else {
                        immaginiHtml = `<img src="/Sito/Immagini/default-news.jpg" alt="Campo" class="img-fluid w-100 mb-2 rounded">`;
                    }
                    return `
                <section class="campo-prenotazione">
                    <div class="container py-5">
                        <div class="row align-items-center">
                            <div class="col-lg-5 col-md-6 mb-4 mb-md-0">
                                    <div class="campo-img position-relative overflow-hidden rounded-lg shadow-lg">
                                        ${immaginiHtml}
                                        <div class="campo-overlay d-flex align-items-center justify-content-center">
                                            <span class="badge bg-primary px-3 py-2 fs-6">${campo.attivo ? 'Disponibile' : 'Non disponibile'}</span>
                                        </div>
                                    </div>
                            </div>
                            <div class="col-lg-7 col-md-6">
                                <div class="campo-dettagli bg-light p-4 rounded-lg shadow-sm">
                                    <h2 class="campo-tipo fw-bold text-primary mb-3 overflow-hidden">${campo.nome || campo.tipo}</h2>
                                    <div class="campo-features mb-4">
                                        <div class="row g-3">
                                            <div class="col-6 col-md-4"><div class="feature-item d-flex align-items-center"><i class="bi bi-grass me-2 text-success"></i><span>${campo.tipo_superficie || 'Erba sintetica'}</span></div></div>
                                            <div class="col-6 col-md-4"><div class="feature-item d-flex align-items-center"><i class="bi bi-lightbulb me-2 text-warning"></i><span>${campo.illuminazione ? 'Illuminazione' : 'No illuminazione'}</span></div></div>
                                                    <div class="col-6 col-md-4"><div class="feature-item d-flex align-items-center"><i class="bi bi-droplet me-2 text-info"></i><span>${campo.Docce === 1 ? 'Docce' : 'No docce'}</span></div></div>
                                            <div class="col-6 col-md-4"><div class="feature-item d-flex align-items-center"><i class="bi bi-door-open me-2 text-secondary"></i><span>${campo.spogliatoi ? 'Spogliatoi' : 'No spogliatoi'}</span></div></div>
                                            <div class="col-6 col-md-4"><div class="feature-item d-flex align-items-center"><i class="bi bi-p-circle me-2 text-primary"></i><span>Parcheggio</span></div></div>
                                            <div class="col-6 col-md-4"><div class="feature-item d-flex align-items-center"><i class="bi bi-calendar3 me-2 text-danger"></i><span>Disponibilità</span></div></div>
                                        </div>
                                    </div>
                                    <p class="campo-descrizione mb-4">${campo.descrizione || 'Nessuna descrizione'}</p>
                                    <div class="d-flex flex-column flex-md-row gap-3 mt-4">
                                        <button class="btn btn-primary btn-outline-light rounded-pill px-4 py-2 btn-prenota d-flex align-items-center justify-content-center" data-campo-id="${campo.id}">
                                            <i class="bi bi-calendar-check me-2"></i>
                                            Prenota ora
                                        </button>
                                    </div>
                                    <div class="mt-4">
                                        <p class="mb-1"><strong>Orari disponibili oggi:</strong></p>
                                        <div class="d-flex flex-wrap gap-2 mt-2">
                                            ${this.orariDisponibili[campo.id] && this.orariDisponibili[campo.id].length > 0 ?
                                                this.orariDisponibili[campo.id].map(orario => `<span class="badge bg-light text-dark border p-2">${orario.inizio}-${orario.fine}</span>`).join('')
                                                : '<span class="badge bg-danger text-light p-2">Nessun orario disponibile</span>'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                `;
            }).join('');
        }
        this.page.innerHTML = html;
    }

    addEventListeners() {
        this.page.querySelectorAll('.btn-prenota').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const campoId = btn.getAttribute('data-campo-id');
                this.openPrenotaModal(campoId);
            });
        });
    }

    async openPrenotaModal(campoId) {
        const campo = this.campi.find(c => c.id == campoId);
        const orari = this.orariDisponibili[campoId] || [];
        // Import dinamico per evitare errori di bundle
        const { showModalPrenotazione } = await import('../utils/modalPrenotazione.js');
        showModalPrenotazione(campo, orari, async (datiPrenotazione) => {
            // Recupera utente loggato
            let utenteId = null;
            try {
                const resUser = await fetch('/session/user');
                if (resUser.ok) {
                    const user = await resUser.json();
                    utenteId = user.id;
                }
            } catch (e) {
                utenteId = null;
            }
            // Log per debug
            console.log('Utente loggato:', utenteId);
            // Esegui la chiamata POST per prenotare
            try {
                const res = await fetch('/prenotazione/prenotazioni', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...datiPrenotazione, utente_id: utenteId })
                });
                if (res.status === 401) {
                    showLoginRequiredModal();
                    return;
                }
                const result = await res.json();
                if (result.success) {
                    alert('Prenotazione confermata!');
                    await this.fetchOrari();
                    this.render();
                    this.addEventListeners();
                } else {
                    alert(result.error || 'Errore nella prenotazione');
                }
            } catch (err) {
                alert('Errore di rete nella prenotazione');
            }
        });
    }
}

// Modal per login richiesto
    function showLoginRequiredModal() {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'modalLoginRequired';
        modal.tabIndex = -1;
        modal.innerHTML = `
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header bg-warning">
                        <h5 class="modal-title">Accesso richiesto</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body text-center">
                        <p>Devi essere loggato per effettuare una prenotazione.<br>Effettua il login per continuare.</p>
                        <a href="/login" class="btn btn-primary">Vai al login</a>
                    </div>
                </div>
            </div>
    `;
    document.body.appendChild(modal);
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
    modal.addEventListener('hidden.bs.modal', () => {
        modal.remove();
    });

    function showModalSuccess(){
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'modalSuccess';
        modal.tabIndex = -1;
        modal.innerHTML = `
          <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
              <div class="modal-header bg-success">
                <h5 class="modal-title">Prenotazione avvenuta con successo</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body text-center">
                <p>La tua prenotazione è stata confermata!</p>
              </div>
            </div>
          </div>
        `;
        document.body.appendChild(modal);
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
        modal.addEventListener('hidden.bs.modal', () => {
            modal.remove();
        });
    }
}

export default Prenotazione;