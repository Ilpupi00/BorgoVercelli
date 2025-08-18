class Prenotazione{
    constructor(page,loadCSS){
        if (typeof loadCSS === 'function') loadCSS(); 
        this.page = page;
        this.init();
    }
    init(){
        this.render();
    }
    render(){
        this.page.innerHTML = `
                <section class="campo-prenotazione">
                    <div class="container py-5">
                        <div class="row align-items-center">
                            <div class="col-lg-5 col-md-6 mb-4 mb-md-0">
                                <div class="campo-img position-relative overflow-hidden rounded-lg shadow-lg">
                                    <img src="/Sito/Immagini/Campo_a_5.jpg" alt="Campo di Calcio a 5" class="img-fluid w-100 transition-transform">
                                    <div class="campo-overlay d-flex align-items-center justify-content-center">
                                        <span class="badge bg-primary px-3 py-2 fs-6">Disponibile</span>
                                    </div>
                                </div>
                            </div>
                            <div class="col-lg-7 col-md-6">
                                <div class="campo-dettagli bg-light p-4 rounded-lg shadow-sm">
                                    <h2 class="campo-tipo fw-bold text-primary mb-3 overflow-hidden">Calcio a 5</h2>
                                    <div class="campo-features mb-4">
                                        <div class="row g-3">
                                            <div class="col-6 col-md-4">
                                                <div class="feature-item d-flex align-items-center">
                                                    <i class="bi bi-grass me-2 text-success"></i>
                                                    <span>Erba sintetica</span>
                                                </div>
                                            </div>
                                            <div class="col-6 col-md-4">
                                                <div class="feature-item d-flex align-items-center">
                                                    <i class="bi bi-lightbulb me-2 text-warning"></i>
                                                    <span>Illuminazione</span>
                                                </div>
                                            </div>
                                            <div class="col-6 col-md-4">
                                                <div class="feature-item d-flex align-items-center">
                                                    <i class="bi bi-droplet me-2 text-info"></i>
                                                    <span>Docce</span>
                                                </div>
                                            </div>
                                            <div class="col-6 col-md-4">
                                                <div class="feature-item d-flex align-items-center">
                                                    <i class="bi bi-door-open me-2 text-secondary"></i>
                                                    <span>Spogliatoi</span>
                                                </div>
                                            </div>
                                            <div class="col-6 col-md-4">
                                                <div class="feature-item d-flex align-items-center">
                                                    <i class="bi bi-p-circle me-2 text-primary"></i>
                                                    <span>Parcheggio</span>
                                                </div>
                                            </div>
                                            <div class="col-6 col-md-4">
                                                <div class="feature-item d-flex align-items-center">
                                                    <i class="bi bi-calendar3 me-2 text-danger"></i>
                                                    <span>Disponibilità</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <p class="campo-descrizione mb-4">
                                        Campo moderno con superficie in erba sintetica di ultima generazione, completamente illuminato per partite serali. Dispone di spogliatoi confortevoli con docce, area relax e parcheggio gratuito.
                                    </p>
                                    <div class="d-flex flex-column flex-md-row gap-3 mt-4">
                                        <button class="btn btn-primary btn-outline-light rounded-pill px-4 py-2 btn-prenota d-flex align-items-center justify-content-center" data-bs-toggle="modal" data-bs-target="#prenotaModal">
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
                                            <span class="badge bg-light text-dark border p-2">16:00-17:00</span>
                                            <span class="badge bg-light text-dark border p-2">18:00-19:00</span>
                                            <span class="badge bg-light text-dark border p-2">20:00-21:00</span>
                                            <span class="badge bg-light text-dark border p-2">21:00-22:00</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                <section class="campo-prenotazione">
                    <div class="container py-5">
                        <div class="row align-items-center">
                            <div class="col-lg-5 col-md-6 mb-4 mb-md-0">
                                <div class="campo-img position-relative overflow-hidden rounded-lg shadow-lg">
                                    <img src="/Sito/Immagini/Campo_a_7.jpg" alt="Campo di Calcio a 7" class="img-fluid w-100 transition-transform">
                                    <div class="campo-overlay d-flex align-items-center justify-content-center">
                                        <span class="badge bg-primary px-3 py-2 fs-6">Disponibile</span>
                                    </div>
                                </div>
                            </div>
                            <div class="col-lg-7 col-md-6">
                                <div class="campo-dettagli bg-light p-4 rounded-lg shadow-sm">
                                    <h2 class="campo-tipo fw-bold text-primary mb-3 overflow-hidden">Calcio a 7</h2>
                                    <div class="campo-features mb-4">
                                        <div class="row g-3">
                                            <div class="col-6 col-md-4">
                                                <div class="feature-item d-flex align-items-center">
                                                    <i class="bi bi-grass me-2 text-success"></i>
                                                    <span>Erba sintetica</span>
                                                </div>
                                            </div>
                                            <div class="col-6 col-md-4">
                                                <div class="feature-item d-flex align-items-center">
                                                    <i class="bi bi-lightbulb me-2 text-warning"></i>
                                                    <span>Illuminazione</span>
                                                </div>
                                            </div>
                                            <div class="col-6 col-md-4">
                                                <div class="feature-item d-flex align-items-center">
                                                    <i class="bi bi-droplet me-2 text-info"></i>
                                                    <span>Docce</span>
                                                </div>
                                            </div>
                                            <div class="col-6 col-md-4">
                                                <div class="feature-item d-flex align-items-center">
                                                    <i class="bi bi-door-open me-2 text-secondary"></i>
                                                    <span>Spogliatoi</span>
                                                </div>
                                            </div>
                                            <div class="col-6 col-md-4">
                                                <div class="feature-item d-flex align-items-center">
                                                    <i class="bi bi-p-circle me-2 text-primary"></i>
                                                    <span>Parcheggio</span>
                                                </div>
                                            </div>
                                            <div class="col-6 col-md-4">
                                                <div class="feature-item d-flex align-items-center">
                                                    <i class="bi bi-calendar3 me-2 text-danger"></i>
                                                    <span>Disponibilità</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <p class="campo-descrizione mb-4">
                                        Campo moderno con superficie in erba sintetica di ultima generazione, completamente illuminato per partite serali. Dispone di spogliatoi confortevoli con docce, area relax e parcheggio gratuito.
                                    </p>
                                    <div class="d-flex flex-column flex-md-row gap-3 mt-4">
                                        <button class="btn btn-primary btn-outline-light rounded-pill px-4 py-2 btn-prenota d-flex align-items-center justify-content-center" data-bs-toggle="modal" data-bs-target="#prenotaModal">
                                            <i class="bi bi-calendar-check me-2 overflow-hidden"></i>
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
                                            <span class="badge bg-light text-dark border p-2">16:00-17:00</span>
                                            <span class="badge bg-light text-dark border p-2">18:00-19:00</span>
                                            <span class="badge bg-light text-dark border p-2">20:00-21:00</span>
                                            <span class="badge bg-light text-dark border p-2">21:00-22:00</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

        `;
    }
}
export default Prenotazione;