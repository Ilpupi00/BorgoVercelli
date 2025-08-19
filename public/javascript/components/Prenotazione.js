
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
            html = this.campi.map(campo => `
                <section class="campo-prenotazione">
                    <div class="container py-5">
                        <div class="row align-items-center">
                            <div class="col-lg-5 col-md-6 mb-4 mb-md-0">
                                <div class="campo-img position-relative overflow-hidden rounded-lg shadow-lg">
                                    <img src="${campo.tipo === 'Calcio a 5' ? '/Sito/Immagini/Campo_a_5.jpg' : '/Sito/Immagini/Campo_a_7.jpg'}" alt="Campo di ${campo.tipo}" class="img-fluid w-100 transition-transform">
                                    <div class="campo-overlay d-flex align-items-center justify-content-center">
                                        <span class="badge bg-primary px-3 py-2 fs-6">${campo.attivo ? 'Disponibile' : 'Non disponibile'}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="col-lg-7 col-md-6">
                                <div class="campo-dettagli bg-light p-4 rounded-lg shadow-sm">
                                    <h2 class="campo-tipo fw-bold text-primary mb-3 overflow-hidden">${campo.tipo}</h2>
                                    <div class="campo-features mb-4">
                                        <div class="row g-3">
                                            <div class="col-6 col-md-4"><div class="feature-item d-flex align-items-center"><i class="bi bi-grass me-2 text-success"></i><span>Erba sintetica</span></div></div>
                                            <div class="col-6 col-md-4"><div class="feature-item d-flex align-items-center"><i class="bi bi-lightbulb me-2 text-warning"></i><span>Illuminazione</span></div></div>
                                            <div class="col-6 col-md-4"><div class="feature-item d-flex align-items-center"><i class="bi bi-droplet me-2 text-info"></i><span>Docce</span></div></div>
                                            <div class="col-6 col-md-4"><div class="feature-item d-flex align-items-center"><i class="bi bi-door-open me-2 text-secondary"></i><span>Spogliatoi</span></div></div>
                                            <div class="col-6 col-md-4"><div class="feature-item d-flex align-items-center"><i class="bi bi-p-circle me-2 text-primary"></i><span>Parcheggio</span></div></div>
                                            <div class="col-6 col-md-4"><div class="feature-item d-flex align-items-center"><i class="bi bi-calendar3 me-2 text-danger"></i><span>Disponibilità</span></div></div>
                                        </div>
                                    </div>
                                    <p class="campo-descrizione mb-4">${campo.descrizione || 'Campo moderno con superficie in erba sintetica di ultima generazione, completamente illuminato per partite serali. Dispone di spogliatoi confortevoli con docce, area relax e parcheggio gratuito.'}</p>
                                    <div class="d-flex flex-column flex-md-row gap-3 mt-4">
                                        <button class="btn btn-primary btn-outline-light rounded-pill px-4 py-2 btn-prenota d-flex align-items-center justify-content-center" data-campo-id="${campo.id}">
                                            <i class="bi bi-calendar-check me-2"></i>
                                            Prenota ora
                                        </button>
                                        <button class="btn btn-outline-secondary rounded-pill px-4 py-2 btn-info d-flex align-items-center justify-content-center">
                                            <i class="bi bi-info-circle me-2"></i>
                                            Maggiori info
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
            `).join('');
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

    openPrenotaModal(campoId) {
        // Qui puoi implementare la logica per mostrare un modal di prenotazione
        alert('Prenotazione campo ID: ' + campoId + '\n(Implementa qui la logica/modal per la prenotazione)');
    }
}

export default Prenotazione;