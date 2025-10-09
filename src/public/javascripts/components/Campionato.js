class Campionato {
    constructor(page, loadCSS) {
        if (typeof loadCSS === 'function') loadCSS();
        this.page = page;
        this.init();
    }

    init() {
        document.title = "Campionato";
        this.setupSelect();
        // Aggiungere altre inizializzazioni se necessario
    }

    setupSelect() {
        const select = this.page.querySelector('.custom-select');
        if (select) {
            select.addEventListener('change', (event) => {
                // Logica per cambiare campionato, per ora solo log
                console.log('Campionato selezionato:', event.target.value);
                // Potrebbe fetch nuova classifica e aggiornare tabella
            });
        }
    }
}

export default Campionato;