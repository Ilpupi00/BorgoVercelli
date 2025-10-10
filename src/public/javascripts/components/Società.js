import { setupEmailFormListener } from './send_email.js';

class Societa {
    constructor(page) {
        this.page = page;
        this.init();
    }

    init() {
        document.title = "Società - ASD BorgoVercelli";
        this.setupEventListeners();
        setupEmailFormListener();
        this.setupAnimations();
    }

    setupEventListeners() {
        // Gestione dei click sui pulsanti "Contatta"
        this.page.querySelectorAll('[onclick*="contattaMembro"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const email = e.currentTarget.getAttribute('onclick').match(/'([^']+)'/)[1];
                this.contattaMembro(email);
            });
        });

        // Gestione dei click sui pulsanti "Dettagli"
        this.page.querySelectorAll('[onclick*="vediDettagli"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const id = e.currentTarget.getAttribute('onclick').match(/(\d+)/)[1];
                this.vediDettagli(id);
            });
        });
    }

    contattaMembro(email) {
        // Apri client email o mostra modal
        const subject = encodeURIComponent('Contatto ASD BorgoVercelli');
        const body = encodeURIComponent('Salve, vorrei contattarla riguardo...');
        window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
    }

    async vediDettagli(membroId) {
        try {
            // Fetch dettagli membro (se necessario)
            const response = await fetch(`/api/membro/${membroId}`);
            if (response.ok) {
                const membro = await response.json();
                this.mostraModalDettagli(membro);
            } else {
                this.mostraMessaggio('Errore nel caricamento dei dettagli');
            }
        } catch (error) {
            console.error('Errore:', error);
            this.mostraMessaggio('Errore di connessione');
        }
    }

    mostraModalDettagli(membro) {
        // Implementazione modal per dettagli membro
        const modalHtml = `
            <div class="modal fade" id="dettagliModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">${membro.nome} ${membro.cognome}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <p><strong>Ruolo:</strong> ${membro.ruolo}</p>
                            <p><strong>Email:</strong> ${membro.email}</p>
                            <p><strong>Telefono:</strong> ${membro.telefono || 'Non disponibile'}</p>
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

    mostraMessaggio(messaggio) {
        // Mostra messaggio di errore/successo
        const toastHtml = `
            <div class="toast align-items-center text-white bg-primary border-0" role="alert">
                <div class="d-flex">
                    <div class="toast-body">${messaggio}</div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                </div>
            </div>
        `;

        const toastContainer = document.querySelector('.toast-container') || this.creaToastContainer();
        toastContainer.insertAdjacentHTML('beforeend', toastHtml);

        const toast = new bootstrap.Toast(toastContainer.lastElementChild);
        toast.show();
    }

    creaToastContainer() {
        const container = document.createElement('div');
        container.className = 'toast-container position-fixed top-0 end-0 p-3';
        container.style.zIndex = '9999';
        document.body.appendChild(container);
        return container;
    }

    setupAnimations() {
        // Animazioni per le card al scroll
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        // Applica animazioni alle card
        this.page.querySelectorAll('.hover-card').forEach(card => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(card);
        });
    }
}

export default Societa;