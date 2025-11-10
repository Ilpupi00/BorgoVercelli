import { setupEmailFormListener } from './send_email.js';

class Homepage {
    constructor(page) {
        this.page = page;
        this.init();
    }

    init() {
        document.title = "Homepage - Asd BorgoVercelli 2022";
        setupEmailFormListener();
        this.setupModalListeners();
        this.setupRecensioneLink();
    }

    setupModalListeners() {
        // Gestione del modal per login richiesto
        const loginModal = document.getElementById('loginModal');
        if (loginModal) {
            // Eventuali listener aggiuntivi se necessari
        }
    }

    setupRecensioneLink() {
        const link = this.page.querySelector('#scrivi-recensione-link');
        if (link) {
            link.addEventListener('click', async (e) => {
                e.preventDefault();
                try {
                    const res = await fetch('/session/user');
                    if (res.ok) {
                        window.location.href = '/scrivi/recensione';
                    } else {
                        // Mostra modal
                        const { default: ShowModal } = await import('../utils/showModal.js');
                        ShowModal.showLoginRequiredModal('Devi essere loggato per scrivere una recensione');
                    }
                } catch (err) {
                    // Errore, mostra modal
                    const { default: ShowModal } = await import('../utils/showModal.js');
                    ShowModal.showLoginRequiredModal('Devi essere loggato per scrivere una recensione');
                }
            });
        }
    }
}

export default Homepage;