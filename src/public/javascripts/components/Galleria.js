
class Galleria{
    constructor(page,loadCSS){
        if (typeof loadCSS === 'function') loadCSS(); 
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
    }

    async fetchImages() {
        try {
            const response = await fetch('/GetImmagini');
            if (!response.ok) {
                console.error('Errore nel recupero delle immagini:', response.statusText);
                return;
            }
            const data = await response.json();
            this.allImages = data.immagini || [];
            // Update header image if available
            if (this.allImages.length > 0) {
                const headerImg = this.page.querySelector('header .centered-image');
                if (headerImg) {
                    headerImg.src = this.allImages[0].url;
                    headerImg.alt = this.allImages[0].descrizione || 'Immagine della galleria';
                }
            }
            // Clear and reload gallery if needed, but since EJS has initial, perhaps only add more
            // For simplicity, assume EJS has first 8, and JS handles load more
        } catch (error) {
            console.error('Errore nel recupero delle immagini:', error);
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
        if (!uploadInput) return;
        uploadInput.addEventListener('change', async (event) => {
            const file = event.target.files[0];
            if (!file) return;
            const formData = new FormData();
            formData.append('image', file);
            const descrizione = prompt('Inserisci una descrizione per la foto (opzionale):');
            if (descrizione) formData.append('descrizione', descrizione);
            try {
                const response = await fetch('/UploadImmagine', {
                    method: 'POST',
                    body: formData
                });
                if (!response.ok) {
                    alert('Errore durante il caricamento della foto');
                    return;
                }
                // Reload page or update
                location.reload(); // Simple way
            } catch (err) {
                alert('Errore durante il caricamento della foto');
            }
        });
    }

    setupImageClicks() {
        // For existing images in EJS
        const buttons = this.page.querySelectorAll('.image-wrapper');
        buttons.forEach(button => {
            const span = button.querySelector('.btn');
            if (span) {
                span.addEventListener('click', (e) => {
                    e.preventDefault();
                    const img = button.querySelector('img');
                    if (img) {
                        const headerImg = this.page.querySelector('header .centered-image');
                        if (headerImg) {
                            headerImg.src = img.src;
                            headerImg.alt = img.alt;
                        }
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                });
            }
        });
    }
}
export default Galleria;