
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
        immagini.forEach((img) => {
            const galleryItem = document.createElement('div');
            galleryItem.className = 'gallery-item';

            const button = document.createElement('button');
            button.className = 'image-wrapper p-0 border-0 bg-transparent w-100';
            button.type = 'button';

            const imgElement = document.createElement('img');
            imgElement.src = img.url;
            imgElement.className = 'img-fluid rounded gallery-image w-100';
            imgElement.alt = img.descrizione || 'Immagine della galleria';

            const overlay = document.createElement('div');
            overlay.className = 'overlay';

            const span = document.createElement('span');
            span.className = 'btn btn-primary btn-sm';
            span.textContent = 'Visualizza';

            // Click handler
            span.addEventListener('click', (e) => {
                e.preventDefault();
                const headerImg = this.page.querySelector('header .centered-image');
                if (headerImg) {
                    headerImg.src = img.url;
                    headerImg.alt = img.descrizione || 'Immagine della galleria';
                }
                window.scrollTo({ top: 0, behavior: 'smooth' });
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
        buttons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const imageUrl = button.dataset.imageUrl;
                const imageAlt = button.dataset.imageAlt;

                // Apri modal con l'immagine
                const modal = new bootstrap.Modal(document.getElementById('imageModal'));
                const modalImage = document.getElementById('modalImage');
                const modalDescription = document.getElementById('modalDescription');

                modalImage.src = imageUrl;
                modalImage.alt = imageAlt;
                modalDescription.textContent = imageAlt;

                modal.show();
            });
        });
    }
}
export default Galleria;