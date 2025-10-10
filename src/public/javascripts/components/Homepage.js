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
    }

    setupModalListeners() {
        // Gestione del modal per login richiesto
        const loginModal = document.getElementById('loginModal');
        if (loginModal) {
            // Eventuali listener aggiuntivi se necessari
        }
    }
}

export default Homepage;