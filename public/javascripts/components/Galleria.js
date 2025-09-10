
class Galleria{
    constructor(page,loadCSS){
        if (typeof loadCSS === 'function') loadCSS(); 
        this.page = page;
        this.allImages = [];
        this.imagesShown = 0;
        this.imagesPerPage = 6;
        this.init();
    }

    async init(){
        document.title = "Galleria";
        await this.render();
    }

    async render(){
        this.page.innerHTML = `
        <header class="text-center py-3 text-white overflow-hidden">
            <div class="row">
              <div class="img-container">
                    <img alt="Descrizione dell'immagine" class="centered-image">
                </div>
            </div>
        </header>
        <section class="gallery-section mt-0">
            <div class="container">
                <h2 class="text-center mb-5 overflow-hidden">La Nostra Galleria</h2>
                <div class="text-center mb-4">
                <label for="uploadPhoto" class="btn btn-success upload-btn">
                    <i class="bi bi-cloud-upload"></i> Carica Foto
                </label>
                <input type="file" id="uploadPhoto" class="d-none" accept="image/*">
            </div>
                <div class="gallery-container row g-4"></div>
                <div class="row mt-4">
                    <div class="col-12 text-center">
                        <button id="loadMoreBtn" class="btn btn-outline-primary rounded-pill px-4 py-2">Più Immagini</button>
                    </div>
                </div>
            </div>
        </section>
        `;

        this.setupUploadButton();
        this.fetchImages();
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
            this.imagesShown = 0;
            // Mostra la prima immagine nell'header se presente
            if (this.allImages.length > 0) {
                const headerImg = document.querySelector('header .centered-image');
                if (headerImg) {
                    headerImg.src = this.allImages[0].url;
                    headerImg.alt = this.allImages[0].descrizione || 'Immagine della galleria';
                }
            }
            this.clearGallery();
            this.showNextImages();
            this.setupLoadMoreButton();
        } catch (error) {
            console.error('Errore nel recupero delle immagini:', error);
        }
    }

    clearGallery() {
        let galleryRow = document.querySelector('.gallery-container');
        if (galleryRow) galleryRow.innerHTML = '';
    }

    showNextImages() {
        const nextImages = this.allImages.slice(this.imagesShown, this.imagesShown + this.imagesPerPage);
        this.addImage(nextImages);
        this.imagesShown += nextImages.length;
        // Nascondi il pulsante se non ci sono più immagini
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (loadMoreBtn) {
            if (this.imagesShown >= this.allImages.length) {
                loadMoreBtn.style.display = 'none';
            } else {
                loadMoreBtn.style.display = '';
            }
        }
    }

    setupLoadMoreButton() {
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (loadMoreBtn) {
            loadMoreBtn.onclick = () => this.showNextImages();
        }
    }

    async addImage(immagini) {
        let galleryRow = document.querySelector('.gallery-container');
        if (!galleryRow) {
            galleryRow = document.createElement('div');
            galleryRow.className = 'gallery-container row g-4';
            document.body.appendChild(galleryRow);
        }
        immagini.forEach((img) => {
            const colDiv = document.createElement('div');
            colDiv.className = 'col-12 col-sm-6 col-lg-4';

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

            // Click su "Visualizza": mostra l'immagine grande nell'header
            span.addEventListener('click', (e) => {
                e.preventDefault();
                const headerImg = document.querySelector('header .centered-image');
                if (headerImg) {
                    headerImg.src = img.url;
                    headerImg.alt = img.descrizione || 'Immagine della galleria';
                }
                // Scrolla in alto per vedere l'header
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });

            overlay.appendChild(span);
            button.appendChild(imgElement);
            button.appendChild(overlay);
            galleryItem.appendChild(button);
            colDiv.appendChild(galleryItem);
            galleryRow.appendChild(colDiv);
        });
    }

    setupUploadButton() {
        const uploadInput = document.getElementById('uploadPhoto');
        if (!uploadInput) return;
        uploadInput.addEventListener('change', async (event) => {
            const file = event.target.files[0];
            if (!file) return;
            const formData = new FormData();
            formData.append('image', file);
            // opzionale: chiedi descrizione
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
                this.fetchImages(); // ricarica la galleria
            } catch (err) {
                alert('Errore durante il caricamento della foto');
            }
        });
    }
}
export default Galleria;