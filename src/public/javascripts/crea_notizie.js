/**
 * NewsEditor - Classe per gestire la creazione e modifica delle notizie
 * Gestisce l'editor Quill, la validazione e l'auto-save
 */
class NewsEditor {
    constructor() {
        this.quill = null;
        this.lastContent = null;
        this.autoSaveInterval = null;
        this.init();
    }

    /**
     * Inizializza l'editor e tutti i componenti
     */
    init() {
        this.initializeQuill();
        this.loadExistingContent();
        this.setupAutoSave();
        this.setupFormValidation();
        this.setupImagePreview();
    }

    /**
     * Inizializza l'editor Quill con la configurazione della toolbar
     */
    initializeQuill() {
        this.quill = new Quill('#editor', {
            theme: 'snow',
            placeholder: 'Scrivi il contenuto della notizia...',
            modules: {
                toolbar: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    [{ 'script': 'sub'}, { 'script': 'super' }],
                    [{ 'indent': '-1'}, { 'indent': '+1' }],
                    [{ 'color': [] }, { 'background': [] }],
                    [{ 'align': [] }],
                    ['link', 'image'],
                    ['clean']
                ]
            }
        });

        // Aggiorna il campo hidden ogni volta che il contenuto cambia
        this.quill.on('text-change', () => {
            const contenutoElement = document.getElementById('contenuto');
            if (contenutoElement) {
                const html = this.quill.root.innerHTML;
                contenutoElement.value = html;
                console.log('Contenuto aggiornato:', html);
            }
        });
    }

    /**
     * Carica il contenuto esistente se siamo in modalità modifica
     */
    loadExistingContent() {
        if (window.notiziaData && window.notiziaData.contenuto) {
            this.quill.root.innerHTML = window.notiziaData.contenuto;
            this.lastContent = this.quill.getContents();
            // Aggiorna anche il campo hidden
            const contenutoElement = document.getElementById('contenuto');
            if (contenutoElement) {
                contenutoElement.value = window.notiziaData.contenuto;
            }
        }
    }

    /**
     * Imposta l'auto-save ogni 30 secondi
     */
    setupAutoSave() {
        this.autoSaveInterval = setInterval(() => {
            this.checkForChanges();
        }, 30000);
    }

    /**
     * Controlla se ci sono modifiche e logga per auto-save
     */
    checkForChanges() {
        const currentContent = this.quill.getContents();
        if (this.lastContent && JSON.stringify(currentContent) !== JSON.stringify(this.lastContent)) {
            console.log('Contenuto modificato - auto-save disponibile');
            this.lastContent = currentContent;
        }
    }

    /**
     * Imposta la validazione del form
     */
    setupFormValidation() {
        const form = document.querySelector('form');
        if (form) {
            // Trasferisci sempre il contenuto prima dell'invio
            form.addEventListener('submit', (e) => {
                console.log('Form submit triggered');
                if (!this.validateForm()) {
                    e.preventDefault();
                    console.log('Form validation failed');
                } else {
                    console.log('Form validation passed');
                }
            });
        }
    }

    /**
     * Valida il form prima dell'invio
     * @returns {boolean} true se valido, false altrimenti
     */
    validateForm() {
        console.log('Starting form validation');

        // Trova gli elementi
        const titoloElement = document.getElementById('titolo');
        const contenutoElement = document.getElementById('contenuto');

        if (!titoloElement) {
            console.error('Titolo element not found');
            alert('Errore: campo titolo non trovato');
            return false;
        }

        if (!contenutoElement) {
            console.error('Contenuto element not found');
            alert('Errore: campo contenuto non trovato');
            return false;
        }

        // Ottieni i valori
        const titolo = titoloElement.value.trim();
        console.log('Titolo value:', titolo);

        // Ottieni il contenuto direttamente dall'editor
        const contenutoHtml = this.quill.root.innerHTML;
        contenutoElement.value = contenutoHtml; // Assicurati che sia aggiornato
        console.log('Contenuto HTML:', contenutoHtml);

        // Validazione titolo
        if (!titolo) {
            console.log('Titolo validation failed: empty');
            alert('Il titolo della notizia è obbligatorio');
            titoloElement.focus();
            return false;
        }

        // Validazione contenuto - controlla prima il valore trasferito
        if (!contenutoElement.value || contenutoElement.value.trim() === '') {
            console.log('Contenuto validation failed: empty value');
            alert('Il contenuto della notizia è obbligatorio. Scrivi qualcosa nel testo della notizia.');
            this.quill.focus();
            return false;
        }

        // Controlla contenuti vuoti comuni dell'editor
        const emptyPatterns = ['<p><br></p>', '<p></p>', '<p><br/></p>', '<div><br></div>', '<div></div>'];
        if (emptyPatterns.includes(contenutoElement.value.trim())) {
            console.log('Contenuto validation failed: empty pattern detected');
            alert('Il contenuto della notizia è obbligatorio. Scrivi qualcosa nel testo della notizia.');
            this.quill.focus();
            return false;
        }

        // Controlla che ci sia del testo effettivo (non solo tag HTML)
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = contenutoElement.value;
        const textContent = tempDiv.textContent || tempDiv.innerText || '';
        console.log('Text content extracted:', textContent);

        if (textContent.trim().length < 1) {
            console.log('Contenuto validation failed: no text content');
            alert('Il contenuto della notizia deve contenere del testo effettivo.');
            this.quill.focus();
            return false;
        }

        console.log('Form validation passed');
        return true;
    }

    /**
     * Gestisce l'anteprima dell'immagine principale
     */
    setupImagePreview() {
        const imageIdInput = document.getElementById('immagine_principale_id');
        const imagePreview = document.querySelector('.image-preview');

        if (!imageIdInput || !imagePreview) return;

        // Funzione per aggiornare l'anteprima
        const updatePreview = (imageId) => {
            if (!imageId || imageId.trim() === '' || isNaN(imageId)) {
                // Mostra immagine di default se non c'è ID valido
                imagePreview.src = '/images/default-news.jpg';
                return;
            }

            // Per ora, assumiamo che l'immagine sia in /uploads/ con il nome basato sull'ID
            // In futuro, puoi sostituire con una chiamata API reale
            const possibleUrl = `/uploads/image_${imageId}.jpg`;

            // Test se l'immagine esiste creando un'immagine temporanea
            const testImg = new Image();
            testImg.onload = () => {
                // Immagine esiste, usa questa
                imagePreview.src = possibleUrl;
            };
            testImg.onerror = () => {
                // Immagine non esiste, usa quella di default
                imagePreview.src = '/images/default-news.jpg';
            };
            testImg.src = possibleUrl;
        };

        // Gestisci l'evento input con debounce
        let timeoutId;
        imageIdInput.addEventListener('input', (e) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                updatePreview(e.target.value);
            }, 500); // Aspetta 500ms dopo che l'utente smette di digitare
        });

        // Gestisci l'evento blur (quando l'utente esce dal campo)
        imageIdInput.addEventListener('blur', (e) => {
            updatePreview(e.target.value);
        });

        // Carica l'anteprima iniziale
        updatePreview(imageIdInput.value);
    }

    /**
     * Distrugge l'editor e pulisce gli intervalli
     */
    destroy() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
        if (this.quill) {
            // Quill non ha un metodo destroy esplicito, ma possiamo rimuovere l'istanza
            this.quill = null;
        }
    }
}

// Inizializza l'editor quando il DOM è pronto
document.addEventListener('DOMContentLoaded', () => {
    window.newsEditor = new NewsEditor();
});

// Cleanup quando la pagina viene scaricata
window.addEventListener('beforeunload', () => {
    if (window.newsEditor) {
        window.newsEditor.destroy();
    }
});