
import ShowModal from '../utils/showModal.js';
import { setupEmailFormListener } from './send_email.js';

class Galleria{
    constructor(page){
        this.page = page;
        this.allImages = [];
        this.imagesShown = 8; // Since 8 are already shown in EJS
        this.imagesPerPage = 8;
        this.init();
    }

    async init(){
        document.title = "Galleria";
        await this.fetchImages();
        this.setupUploadButton();
        this.setupLoadMoreButton();
        this.setupImageClicks();
        setupEmailFormListener();
    }

    async fetchImages() {
        try {
            const response = await fetch('/GetImmagini');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            this.allImages = data.immagini || [];

            // Update header image if available
            if (this.allImages.length > 0) {
                const headerImg = this.page.querySelector('header .centered-image');
                if (headerImg) {
                    headerImg.src = this.allImages[0].url;
                    headerImg.alt = this.allImages[0].descrizione || 'Immagine della galleria';
                }
            }

            console.log(`Caricate ${this.allImages.length} immagini dalla galleria`);
        } catch (error) {
            console.error('Errore nel recupero delle immagini:', error);
            // Mostra un messaggio di errore all'utente
            const galleryContainer = this.page.querySelector('.gallery-container');
            if (galleryContainer) {
                galleryContainer.innerHTML = `
                    <div class="col-12 text-center">
                        <div class="alert alert-warning">
                            <i class="bi bi-exclamation-triangle"></i>
                            Impossibile caricare le immagini. Riprova più tardi.
                        </div>
                    </div>
                `;
            }
        }
    }

    setupLoadMoreButton() {
        const loadMoreBtn = this.page.querySelector('#loadMoreBtn');
        if (loadMoreBtn) {
            loadMoreBtn.onclick = () => this.showNextImages();
        }
    }

    showNextImages() {
        const nextImages = this.allImages.slice(this.imagesShown, this.imagesShown + this.imagesPerPage);
        this.addImage(nextImages);
        this.imagesShown += nextImages.length;
        // Hide button if no more images
        const loadMoreBtn = this.page.querySelector('#loadMoreBtn');
        if (loadMoreBtn) {
            if (this.imagesShown >= this.allImages.length) {
                loadMoreBtn.style.display = 'none';
            }
        }
    }

    addImage(immagini) {
        const galleryRow = this.page.querySelector('.gallery-container');
        if (!galleryRow) return;
        immagini.forEach((img, localIndex) => {
            const galleryItem = document.createElement('div');
            galleryItem.className = 'gallery-item';
            
            // Calcola l'indice globale
            const globalIndex = this.imagesShown - immagini.length + localIndex;
            galleryItem.setAttribute('data-image-index', globalIndex);

            const button = document.createElement('button');
            button.className = 'image-wrapper p-0 border-0 bg-transparent w-100';
            button.type = 'button';
            button.dataset.imageUrl = img.url;
            button.dataset.imageAlt = img.descrizione || 'Immagine della galleria';

            const imgElement = document.createElement('img');
            imgElement.src = img.url;
            imgElement.className = 'img-fluid rounded gallery-image w-100';
            imgElement.alt = img.descrizione || 'Immagine della galleria';

            const overlay = document.createElement('div');
            overlay.className = 'overlay';

            const span = document.createElement('span');
            span.className = 'btn btn-primary btn-sm';
            span.innerHTML = '<i class="bi bi-eye"></i> Visualizza';

            // Click handler
            button.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Salva la posizione corrente
                const scrollPosition = window.pageYOffset;
                sessionStorage.setItem('galleryScrollPosition', scrollPosition);
                sessionStorage.setItem('galleryImageIndex', globalIndex);
                
                const headerImg = this.page.querySelector('header .centered-image');
                if (headerImg) {
                    headerImg.src = img.url;
                    headerImg.alt = img.descrizione || 'Immagine della galleria';
                }
                window.scrollTo({ top: 0, behavior: 'smooth' });
                
                // Setup del pulsante per tornare alla galleria
                this.setupReturnToGallery(globalIndex);
            });

            overlay.appendChild(span);
            button.appendChild(imgElement);
            button.appendChild(overlay);
            galleryItem.appendChild(button);
            galleryRow.appendChild(galleryItem);
        });
    }

    setupUploadButton() {
        const uploadInput = this.page.querySelector('#uploadPhoto');
        const uploadBtn = this.page.querySelector('.upload-btn');
        if (!uploadInput || !uploadBtn) return;

        uploadInput.addEventListener('change', async (event) => {
            const file = event.target.files[0];
            if (!file) return;

            // Validazione lato client
            if (!file.type.startsWith('image/')) {
                ShowModal.showModalError('File non valido', 'Seleziona un file immagine valido.');
                return;
            }

            if (file.size > 5 * 1024 * 1024) {
                ShowModal.showModalError('File troppo grande', 'Il file è troppo grande. Dimensione massima: 5MB.');
                return;
            }

            ShowModal.showUploadModal(async (descrizione) => {
                const originalText = uploadBtn.innerHTML;
                uploadBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Caricamento...';
                uploadBtn.style.display = 'none';

                const formData = new FormData();
                formData.append('image', file);
                formData.append('descrizione', descrizione);

                try {
                    const response = await fetch('/UploadImmagine', {
                        method: 'POST',
                        body: formData
                    });

                    const result = await response.json();

                    if (response.ok) {
                        ShowModal.showModalSuccess('Foto caricata', 'La foto è stata caricata con successo!');
                        location.reload(); // Ricarica per mostrare la nuova immagine
                    } else {
                        ShowModal.showModalError('Errore durante il caricamento', result.error || 'Errore durante il caricamento');
                    }
                } catch (err) {
                    console.error('Errore upload:', err);
                    ShowModal.showModalError('Errore di rete', 'Errore durante il caricamento della foto. Riprova.');
                } finally {
                    // Ripristina pulsante
                    uploadBtn.innerHTML = originalText;
                    uploadBtn.style.display = '';
                    // Reset input file
                    uploadInput.value = '';
                }
            });
        });
    }

    setupImageClicks() {
        // For existing images in EJS
        const buttons = this.page.querySelectorAll('.image-wrapper');
        buttons.forEach((button, index) => {
            // Aggiungi attributo per identificare la posizione
            const galleryItem = button.closest('.gallery-item');
            if (galleryItem) {
                galleryItem.setAttribute('data-image-index', index);
            }
            
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const imageUrl = button.dataset.imageUrl;
                const imageAlt = button.dataset.imageAlt;

                // Salva la posizione corrente
                const scrollPosition = window.pageYOffset;
                sessionStorage.setItem('galleryScrollPosition', scrollPosition);
                sessionStorage.setItem('galleryImageIndex', index);

                // Cambia l'immagine nell'header
                const headerImage = this.page.querySelector('.centered-image');
                if (headerImage) {
                    headerImage.src = imageUrl;
                    headerImage.alt = imageAlt;
                    
                    // Scroll in alto per vedere l'immagine
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    
                    // Aggiungi listener per tornare alla posizione
                    this.setupReturnToGallery(index);
                }
            });
        });
    }
    
    setupReturnToGallery(imageIndex) {
        // Aggiungi pulsante o listener per tornare alla galleria
        const header = this.page.querySelector('header');
        if (!header) return;
        
        // Rimuovi eventuali pulsanti precedenti
        const existingBtn = header.querySelector('.return-to-gallery-btn');
        if (existingBtn) existingBtn.remove();
        
        // Crea pulsante per tornare alla galleria
        const returnBtn = document.createElement('button');
        returnBtn.className = 'btn btn-secondary return-to-gallery-btn';
        returnBtn.innerHTML = '<i class="bi bi-arrow-down"></i> Torna alla Galleria';
        returnBtn.style.cssText = 'position: absolute; bottom: 20px; right: 20px; z-index: 10;';
        
        returnBtn.addEventListener('click', () => {
            const savedIndex = sessionStorage.getItem('galleryImageIndex');
            const targetIndex = savedIndex || imageIndex;
            
            // Trova l'elemento della galleria
            const galleryItem = this.page.querySelector(`[data-image-index="${targetIndex}"]`);
            if (galleryItem) {
                galleryItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            
            // Rimuovi il pulsante
            returnBtn.remove();
            
            // Pulisci sessionStorage
            sessionStorage.removeItem('galleryScrollPosition');
            sessionStorage.removeItem('galleryImageIndex');
        });
        
        header.style.position = 'relative';
        header.appendChild(returnBtn);
    }
}
export default Galleria;