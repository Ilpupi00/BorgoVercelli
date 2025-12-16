import { setupEmailFormListener } from './send_email.js';

class Societa {
    constructor(page) {
        this.page = page;
        this.init();
    }

    init() {
        document.title = "Società - A.S.D. Borgo Vercelli";
        this.setupEventListeners();
        setupEmailFormListener();
        this.setupAnimations();
        this.setupScrollEffects();
        this.setupParallax();
    }

    setupEventListeners() {
        // Gestione dei click sui pulsanti "Contatta" (usando funzioni globali)
        // Le funzioni sono definite nel template EJS

        // Gestione hover effects per le card membri
        this.page.querySelectorAll('.member-card').forEach(card => {
            card.addEventListener('mouseenter', (e) => {
                this.onCardHover(e.currentTarget, true);
            });
            card.addEventListener('mouseleave', (e) => {
                this.onCardHover(e.currentTarget, false);
            });
        });

        // Gestione click sui feature cards
        this.page.querySelectorAll('.feature-card').forEach(card => {
            card.addEventListener('click', (e) => {
                this.onFeatureClick(e.currentTarget);
            });
        });
    }

    onCardHover(card, isHovering) {
        const avatar = card.querySelector('.member-avatar');
        const actions = card.querySelector('.member-actions');

        if (isHovering) {
            if (avatar) {
                avatar.style.transform = 'scale(1.1) rotate(5deg)';
            }
            if (actions) {
                actions.style.transform = 'translateY(-5px)';
            }
        } else {
            if (avatar) {
                avatar.style.transform = 'scale(1) rotate(0deg)';
            }
            if (actions) {
                actions.style.transform = 'translateY(0)';
            }
        }
    }

    onFeatureClick(card) {
        // Aggiungi effetto di "pulse" al click
        card.style.animation = 'none';
        setTimeout(() => {
            card.style.animation = 'pulse 0.6s ease-in-out';
        }, 10);

        // Rimuovi l'animazione dopo che finisce
        setTimeout(() => {
            card.style.animation = '';
        }, 600);
    }

    contattaMembro(email) {
        // Apri client email con template precompilato
        const subject = encodeURIComponent('Contatto A.S.D. Borgo Vercelli');
        const body = encodeURIComponent(`Salve,

Mi rivolgo a lei in qualità di membro dell'A.S.D. Borgo Vercelli.

Scrivo per...

Cordiali saluti`);

        // Prova prima mailto, se non funziona mostra modal
        try {
            window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
        } catch (error) {
            this.mostraModalContatto(email, subject, body);
        }
    }

    async vediDettagli(membroId) {
        try {
            this.mostraLoading();

            // Fetch dettagli membro
            const response = await fetch(`/api/membro/${membroId}`);
            if (response.ok) {
                const membro = await response.json();
                this.mostraModalDettagli(membro);
            } else {
                this.mostraMessaggio('Errore nel caricamento dei dettagli del membro', 'danger');
            }
        } catch (error) {
            console.error('Errore nel caricamento dei dettagli:', error);
            this.mostraMessaggio('Errore di connessione', 'danger');
        } finally {
            this.nascondiLoading();
        }
    }

    mostraModalContatto(email, subject, body) {
        const modalHtml = `
            <div class="modal fade" id="contattoModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title">
                                <i class="fas fa-envelope me-2"></i>Contatta Membro
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="contactForm">
                                <div class="mb-3">
                                    <label for="contactName" class="form-label">Il tuo nome</label>
                                    <input type="text" class="form-control" id="contactName" required>
                                </div>
                                <div class="mb-3">
                                    <label for="contactEmail" class="form-label">La tua email</label>
                                    <input type="email" class="form-control" id="contactEmail" required>
                                </div>
                                <div class="mb-3">
                                    <label for="contactMessage" class="form-label">Messaggio</label>
                                    <textarea class="form-control" id="contactMessage" rows="4" required>${decodeURIComponent(body)}</textarea>
                                </div>
                                <div class="text-center">
                                    <button type="submit" class="btn btn-primary px-4">
                                        <i class="fas fa-paper-plane me-2"></i>Invia Messaggio
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('contattoModal'));
        modal.show();

        // Gestione form
        document.getElementById('contactForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.inviaMessaggioContatto(email);
            modal.hide();
        });

        // Rimuovi modal dal DOM dopo chiusura
        document.getElementById('contattoModal').addEventListener('hidden.bs.modal', () => {
            document.getElementById('contattoModal').remove();
        });
    }

    async inviaMessaggioContatto(email) {
        // Qui potresti implementare l'invio del messaggio
        // Per ora mostriamo solo un messaggio di successo
        this.mostraMessaggio('Messaggio inviato con successo!', 'success');
    }

    mostraModalDettagli(membro) {
        const modalHtml = `
            <div class="modal fade" id="dettagliModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title">
                                <i class="fas fa-user me-2"></i>${membro.nome} ${membro.cognome}
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-md-4 text-center mb-3">
                                    ${membro.immagine_profilo ?
                                        `<img src="${membro.immagine_profilo}" alt="Foto di ${membro.nome}" class="img-fluid rounded-circle shadow">` :
                                        `<div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center mx-auto shadow" style="width: 120px; height: 120px;">
                                            <i class="bi bi-person-fill" style="font-size: 3rem;"></i>
                                        </div>`
                                    }
                                </div>
                                <div class="col-md-8">
                                    <div class="mb-3">
                                        <strong class="text-primary">Ruolo:</strong>
                                        <span class="badge role-badge role-${membro.ruolo.toLowerCase().replace(/\s+/g, '-')} ms-2">${membro.ruolo}</span>
                                    </div>
                                    <div class="mb-3">
                                        <strong class="text-primary"><i class="fas fa-envelope me-1"></i>Email:</strong>
                                        <a href="mailto:${membro.email}" class="ms-2">${membro.email}</a>
                                    </div>
                                    ${membro.telefono ? `
                                    <div class="mb-3">
                                        <strong class="text-primary"><i class="fas fa-phone me-1"></i>Telefono:</strong>
                                        <a href="tel:${membro.telefono}" class="ms-2">${membro.telefono}</a>
                                    </div>
                                    ` : ''}
                                    <div class="mt-4">
                                        <p class="text-muted">
                                            Membro attivo dell'A.S.D. Borgo Vercelli, contribuisce attivamente
                                            allo sviluppo e alla crescita della nostra società sportiva.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Chiudi</button>
                            <button type="button" class="btn btn-primary" onclick="contattaMembro('${membro.email}')">
                                <i class="fas fa-envelope me-1"></i>Contatta
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('dettagliModal'));
        modal.show();

        // Rimuovi modal dal DOM dopo chiusura
        document.getElementById('dettagliModal').addEventListener('hidden.bs.modal', () => {
            document.getElementById('dettagliModal').remove();
        });
    }

    mostraMessaggio(messaggio, tipo = 'info') {
        const toastHtml = `
            <div class="toast align-items-center text-white bg-${tipo} border-0" role="alert">
                <div class="d-flex">
                    <div class="toast-body">
                        <i class="fas fa-${tipo === 'success' ? 'check-circle' : tipo === 'danger' ? 'exclamation-triangle' : 'info-circle'} me-2"></i>
                        ${messaggio}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                </div>
            </div>
        `;

        const toastContainer = this.page.querySelector('.toast-container') || this.creaToastContainer();
        toastContainer.insertAdjacentHTML('beforeend', toastHtml);

        const toast = new bootstrap.Toast(toastContainer.lastElementChild);
        toast.show();
    }

    mostraLoading() {
        if (!this.loadingOverlay) {
            this.loadingOverlay = document.createElement('div');
            this.loadingOverlay.className = 'loading-overlay';
            this.loadingOverlay.innerHTML = `
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Caricamento...</span>
                </div>
            `;
            this.loadingOverlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
            `;
            document.body.appendChild(this.loadingOverlay);
        }
        this.loadingOverlay.style.display = 'flex';
    }

    nascondiLoading() {
        if (this.loadingOverlay) {
            this.loadingOverlay.style.display = 'none';
        }
    }

    creaToastContainer() {
        const container = document.createElement('div');
        container.className = 'toast-container position-fixed top-0 end-0 p-3';
        container.style.zIndex = '9999';
        this.page.appendChild(container);
        return container;
    }

    setupAnimations() {
        // Keep feature-card hover/press animations; allow scroll-reveal
        // to control visibility of member cards. Do not force member-card
        // styles here (so reveal system can animate them).
        this.page.querySelectorAll('.feature-card').forEach(card => {
            card.style.transition = 'all 0.3s ease';
        });
    }

    setupScrollEffects() {
        // Effetto parallax per l'hero section
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const heroSection = this.page.querySelector('.hero-section');
            if (heroSection) {
                heroSection.style.backgroundPositionY = -(scrolled * 0.5) + 'px';
            }
        });
    }

    setupParallax() {
        // Effetto parallax per gli elementi dell'hero
        const heroElements = this.page.querySelectorAll('.hero-section .animate__animated');
        heroElements.forEach((element, index) => {
            element.style.transform = 'translateY(0)';
            element.style.transition = 'transform 0.1s linear';
        });

        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            heroElements.forEach((element, index) => {
                const speed = (index + 1) * 0.1;
                element.style.transform = `translateY(${scrolled * speed}px)`;
            });
        });
    }
}

export default Societa;