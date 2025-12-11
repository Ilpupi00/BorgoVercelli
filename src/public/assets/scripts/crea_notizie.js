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

        // React to theme changes at runtime
        window.addEventListener('themechange', (e) => {
            try {
                const themeIsDark = e && e.detail && e.detail.theme === 'dark';
                if (editorEl) {
                    if (themeIsDark) editorEl.classList.add('ql-dark');
                    else editorEl.classList.remove('ql-dark');
                }
            } catch (err) {
                // ignore
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
        const imageFileInput = document.getElementById('immagine_principale');
        const imagePreview = document.querySelector('.image-preview');

        if (!imagePreview) return;

        // Funzione per aggiornare l'anteprima
        const updatePreview = (url) => {
            if (url) {
                imagePreview.src = url;
            } else {
                imagePreview.src = '/assets/images/Campo.png';
            }
        };

        // Gestisci l'evento change per il file input
        if (imageFileInput) {
            imageFileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    // Crea un URL per l'anteprima
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        updatePreview(e.target.result);
                    };
                    reader.readAsDataURL(file);
                } else {
                    updatePreview(null);
                }
            });
        }

        // Gestisci l'evento input per l'ID immagine (solo se non c'è file selezionato)
        if (imageIdInput) {
            const updateFromId = () => {
                if (imageFileInput && imageFileInput.files.length > 0) return; // Priorità al file upload

                const imageId = imageIdInput.value.trim();
                if (!imageId || isNaN(imageId)) {
                    updatePreview(null);
                    return;
                }

                // Per ora, assumiamo che l'immagine sia in /uploads/ con il nome basato sull'ID
                // In futuro, puoi sostituire con una chiamata API reale
                const possibleUrl = `/uploads/image_${imageId}.jpg`;

                // Test se l'immagine esiste creando un'immagine temporanea
                const testImg = new Image();
                testImg.onload = () => {
                    // Immagine esiste, usa questa
                    updatePreview(possibleUrl);
                };
                testImg.onerror = () => {
                    // Immagine non esiste, usa quella di default
                    updatePreview(null);
                };
                testImg.src = possibleUrl;
            };

            // Gestisci l'evento input con debounce
            let timeoutId;
            imageIdInput.addEventListener('input', () => {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(updateFromId, 500);
            });

            // Gestisci l'evento blur
            imageIdInput.addEventListener('blur', updateFromId);
        }

        // Carica l'anteprima iniziale
        if (imageFileInput && imageFileInput.files.length > 0) {
            const file = imageFileInput.files[0];
            const reader = new FileReader();
            reader.onload = (e) => updatePreview(e.target.result);
            reader.readAsDataURL(file);
        } else if (imageIdInput && imageIdInput.value) {
            // Simula l'evento per caricare dall'ID
            imageIdInput.dispatchEvent(new Event('blur'));
        }
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
    initializeImageUpload();
    initializeImageEditor();
});

// Cleanup quando la pagina viene scaricata
window.addEventListener('beforeunload', () => {
    if (window.newsEditor) {
        window.newsEditor.destroy();
    }
});

// ===================================
// IMAGE UPLOAD & EDITOR SYSTEM
// ===================================

function initializeImageUpload() {
    const immagineInput = document.getElementById('immagineInput');
    const selectImageBtn = document.getElementById('selectImageBtn');
    const dropZone = document.getElementById('dropZone');
    const uploadArea = document.getElementById('uploadArea');
    const newImagePreview = document.getElementById('newImagePreview');
    const previewImg = document.getElementById('previewImg');
    const removePreviewBtn = document.getElementById('removePreviewBtn');
    const editPreviewBtn = document.getElementById('editPreviewBtn');
    const deleteImageBtns = document.querySelectorAll('.delete-image-btn');
    const editImageBtns = document.querySelectorAll('.edit-image-btn');

    if (!immagineInput) return;

    let selectedFile = null;
    let currentImageUrl = null;

    // Click to select file
    if (selectImageBtn) {
        selectImageBtn.addEventListener('click', (e) => {
            e.preventDefault();
            immagineInput.click();
        });
    }

    if (dropZone) {
        dropZone.addEventListener('click', () => {
            immagineInput.click();
        });
    }

    // File input change
    immagineInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            handleFileSelect(file);
        }
    });

    // Drag and drop
    if (uploadArea) {
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('drag-over');
        });

        uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('drag-over');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('drag-over');
            
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                handleFileSelect(file);
            } else {
                showImageError('Per favore, seleziona un file immagine valido');
            }
        });
    }

    // Remove preview
    if (removePreviewBtn) {
        removePreviewBtn.addEventListener('click', () => {
            selectedFile = null;
            currentImageUrl = null;
            immagineInput.value = '';
            newImagePreview.classList.add('d-none');
            uploadArea.classList.remove('d-none', 'success', 'error');
        });
    }

    // Edit preview
    if (editPreviewBtn) {
        editPreviewBtn.addEventListener('click', () => {
            if (currentImageUrl) {
                openImageEditor(currentImageUrl);
            }
        });
    }

    // Delete existing image
    deleteImageBtns.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            const notiziaId = btn.dataset.notiziaId;
            
            if (confirm('Sei sicuro di voler eliminare questa immagine?')) {
                await deleteNotiziaImage(notiziaId);
            }
        });
    });

    // Edit existing image
    editImageBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const imageUrl = btn.dataset.imageUrl;
            openImageEditor(imageUrl);
        });
    });

    // Handle file selection
    function handleFileSelect(file) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            showImageError('Per favore, seleziona un file immagine valido');
            return;
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            showImageError('Il file è troppo grande. Dimensione massima: 5MB');
            return;
        }

        selectedFile = file;

        // Show preview
        const reader = new FileReader();
        reader.onload = (e) => {
            currentImageUrl = e.target.result;
            previewImg.src = currentImageUrl;
            uploadArea.classList.add('d-none');
            newImagePreview.classList.remove('d-none');
        };
        reader.readAsDataURL(file);

        // Auto-upload if editing existing notizia
        const notiziaId = getNotiziaIdFromPage();
        if (notiziaId) {
            uploadImageToServer(file, notiziaId);
        }
    }

    // Upload image to server
    async function uploadImageToServer(file, notiziaId) {
        const formData = new FormData();
        formData.append('immagine', file);

        const progressBar = newImagePreview.querySelector('.progress-bar');
        const uploadProgress = newImagePreview.querySelector('.upload-progress');
        
        if (uploadProgress) {
            uploadProgress.classList.remove('d-none');
        }

        try {
            const response = await fetch(`/notizia/${notiziaId}/upload-immagine`, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (progressBar) {
                progressBar.style.width = '100%';
            }

            setTimeout(() => {
                if (uploadProgress) {
                    uploadProgress.classList.add('d-none');
                }
            }, 500);

            if (result.success) {
                showSuccessMessage('Immagine caricata con successo!');
                uploadArea.classList.add('success');
                
                // Reload after short delay
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                showImageError(result.error || 'Errore durante il caricamento');
                uploadArea.classList.add('error');
            }
        } catch (error) {
            console.error('Errore upload:', error);
            showImageError('Errore di connessione durante il caricamento');
            uploadArea.classList.add('error');
            
            if (uploadProgress) {
                uploadProgress.classList.add('d-none');
            }
        }
    }

    // Delete image from server
    async function deleteNotiziaImage(notiziaId) {
        try {
            const response = await fetch(`/notizia/${notiziaId}/immagine`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();

            if (result.success) {
                showSuccessMessage('Immagine eliminata con successo!');
                
                // Hide current preview and show upload area
                const currentImagePreview = document.getElementById('currentImagePreview');
                if (currentImagePreview) {
                    currentImagePreview.remove();
                }
                
                uploadArea.classList.remove('d-none');
            } else {
                showImageError(result.error || 'Errore durante l\'eliminazione');
            }
        } catch (error) {
            console.error('Errore eliminazione:', error);
            showImageError('Errore di connessione durante l\'eliminazione');
        }
    }

    // Helper functions
    function getNotiziaIdFromPage() {
        // Try to get from URL query parameter
        const urlParams = new URLSearchParams(window.location.search);
        const id = urlParams.get('id');
        if (id) return id;

        // Try to get from window.notiziaData
        if (window.notiziaData && window.notiziaData.id) {
            return window.notiziaData.id;
        }

        return null;
    }

    function showImageError(message) {
        if (uploadArea) {
            uploadArea.classList.add('error');
            setTimeout(() => uploadArea.classList.remove('error'), 3000);
        }
        alert(message);
    }

    function showSuccessMessage(message) {
        // Create success alert
        const alert = document.createElement('div');
        alert.className = 'alert alert-success alert-dismissible fade show';
        alert.innerHTML = `
            <i class="bi bi-check-circle me-2"></i>${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        const form = document.querySelector('form');
        if (form) {
            form.insertBefore(alert, form.firstChild);
            setTimeout(() => alert.remove(), 3000);
        }
    }
}

// ===================================
// IMAGE EDITOR WITH CROPPER.JS
// ===================================

function initializeImageEditor() {
    // Create modal HTML if it doesn't exist
    if (!document.getElementById('imageEditorModal')) {
        const modalHTML = `
            <div id="imageEditorModal" class="image-editor-modal">
                <div class="image-editor-container">
                    <div class="editor-header">
                        <h3><i class="bi bi-scissors me-2"></i>Modifica Immagine</h3>
                        <button type="button" class="editor-close" aria-label="Chiudi">×</button>
                    </div>
                    
                    <div class="editor-canvas">
                        <img id="editorImage" src="" alt="Image to crop">
                    </div>
                    
                    <div class="editor-controls">
                        <div class="control-group">
                            <div class="control-group-title">Proporzioni</div>
                            <div class="aspect-ratio-buttons">
                                <button type="button" class="aspect-btn" data-aspect="free">
                                    <span class="aspect-btn-icon">🔓</span>
                                    <span class="aspect-btn-label">Libero</span>
                                </button>
                                <button type="button" class="aspect-btn active" data-aspect="16/9">
                                    <span class="aspect-btn-icon">📺</span>
                                    <span class="aspect-btn-label">16:9</span>
                                </button>
                                <button type="button" class="aspect-btn" data-aspect="4/3">
                                    <span class="aspect-btn-icon">🖼️</span>
                                    <span class="aspect-btn-label">4:3</span>
                                </button>
                                <button type="button" class="aspect-btn" data-aspect="1">
                                    <span class="aspect-btn-icon">⬜</span>
                                    <span class="aspect-btn-label">1:1</span>
                                </button>
                                <button type="button" class="aspect-btn" data-aspect="3/4">
                                    <span class="aspect-btn-icon">📱</span>
                                    <span class="aspect-btn-label">3:4</span>
                                </button>
                            </div>
                        </div>
                        
                        <div class="control-group">
                            <div class="control-group-title">Zoom</div>
                            <div class="zoom-control">
                                <label>Zoom:</label>
                                <input type="range" id="zoomSlider" min="0" max="1" step="0.01" value="0">
                                <span class="zoom-value">100%</span>
                            </div>
                        </div>
                        
                        <div class="control-group">
                            <div class="control-group-title">Rotazione</div>
                            <div class="rotate-control">
                                <label>Rotazione:</label>
                                <input type="range" id="rotateSlider" min="-180" max="180" step="1" value="0">
                                <span class="rotate-value">0°</span>
                            </div>
                        </div>
                        
                        <div class="control-group">
                            <div class="control-group-title">Trasformazioni</div>
                            <div class="flip-buttons">
                                <button type="button" class="flip-btn" id="flipHBtn">
                                    <i class="bi bi-arrow-left-right"></i>
                                    Flip Orizzontale
                                </button>
                                <button type="button" class="flip-btn" id="flipVBtn">
                                    <i class="bi bi-arrow-down-up"></i>
                                    Flip Verticale
                                </button>
                                <button type="button" class="reset-btn" id="resetBtn">
                                    <i class="bi bi-arrow-counterclockwise"></i>
                                    Reset
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="editor-actions">
                        <button type="button" class="btn btn-secondary editor-cancel">
                            <i class="bi bi-x-circle me-2"></i>Annulla
                        </button>
                        <button type="button" class="btn btn-primary editor-save">
                            <i class="bi bi-check-circle me-2"></i>Salva Modifiche
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
}

// Open image editor
window.openImageEditor = function(imageUrl) {
    const modal = document.getElementById('imageEditorModal');
    const editorImage = document.getElementById('editorImage');
    
    if (!modal || !editorImage) return;
    
    // Set image source
    editorImage.src = imageUrl;
    
    // Show modal
    modal.classList.add('active');
    
    // Initialize cropper
    setTimeout(() => {
        initializeCropper(editorImage);
    }, 100);
    
    // Bind controls
    bindEditorControls();
};

let cropperInstance = null;

function initializeCropper(imageElement) {
    // Destroy existing instance
    if (cropperInstance) {
        cropperInstance.destroy();
    }
    
    // Create new cropper instance
    cropperInstance = new Cropper(imageElement, {
        aspectRatio: 16 / 9,
        viewMode: 1,
        dragMode: 'move',
        autoCropArea: 1,
        restore: false,
        guides: true,
        center: true,
        highlight: true,
        cropBoxMovable: true,
        cropBoxResizable: true,
        toggleDragModeOnDblclick: false,
    });
}

function bindEditorControls() {
    const modal = document.getElementById('imageEditorModal');
    if (!modal) return;
    
    // Close button
    const closeBtn = modal.querySelector('.editor-close');
    const cancelBtn = modal.querySelector('.editor-cancel');
    
    const closeEditor = () => {
        modal.classList.remove('active');
        if (cropperInstance) {
            cropperInstance.destroy();
            cropperInstance = null;
        }
    };
    
    closeBtn.onclick = closeEditor;
    cancelBtn.onclick = closeEditor;
    
    // Aspect ratio buttons
    const aspectBtns = modal.querySelectorAll('.aspect-btn');
    aspectBtns.forEach(btn => {
        btn.onclick = () => {
            aspectBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const aspect = btn.dataset.aspect;
            if (cropperInstance) {
                if (aspect === 'free') {
                    cropperInstance.setAspectRatio(NaN);
                } else {
                    cropperInstance.setAspectRatio(eval(aspect));
                }
            }
        };
    });
    
    // Zoom control
    const zoomSlider = modal.querySelector('#zoomSlider');
    const zoomValue = modal.querySelector('.zoom-value');
    
    if (zoomSlider && cropperInstance) {
        zoomSlider.oninput = () => {
            const zoom = parseFloat(zoomSlider.value);
            cropperInstance.zoomTo(zoom);
            zoomValue.textContent = Math.round(zoom * 100) + '%';
        };
    }
    
    // Rotate control
    const rotateSlider = modal.querySelector('#rotateSlider');
    const rotateValue = modal.querySelector('.rotate-value');
    
    if (rotateSlider && cropperInstance) {
        rotateSlider.oninput = () => {
            const angle = parseInt(rotateSlider.value);
            cropperInstance.rotateTo(angle);
            rotateValue.textContent = angle + '°';
        };
    }
    
    // Flip buttons
    const flipHBtn = modal.querySelector('#flipHBtn');
    const flipVBtn = modal.querySelector('#flipVBtn');
    
    let scaleX = 1, scaleY = 1;
    
    if (flipHBtn && cropperInstance) {
        flipHBtn.onclick = () => {
            scaleX = -scaleX;
            cropperInstance.scaleX(scaleX);
        };
    }
    
    if (flipVBtn && cropperInstance) {
        flipVBtn.onclick = () => {
            scaleY = -scaleY;
            cropperInstance.scaleY(scaleY);
        };
    }
    
    // Reset button
    const resetBtn = modal.querySelector('#resetBtn');
    if (resetBtn && cropperInstance) {
        resetBtn.onclick = () => {
            cropperInstance.reset();
            zoomSlider.value = 0;
            rotateSlider.value = 0;
            zoomValue.textContent = '100%';
            rotateValue.textContent = '0°';
            scaleX = 1;
            scaleY = 1;
        };
    }
    
    // Save button
    const saveBtn = modal.querySelector('.editor-save');
    if (saveBtn && cropperInstance) {
        saveBtn.onclick = async () => {
            const canvas = cropperInstance.getCroppedCanvas();
            canvas.toBlob(async (blob) => {
                // Update preview
                const previewImg = document.getElementById('previewImg');
                if (previewImg) {
                    previewImg.src = URL.createObjectURL(blob);
                }
                
                // Close editor
                closeEditor();
                
                // Show success message
                alert('Modifiche salvate! L\'immagine verrà caricata al salvataggio della notizia.');
            });
        };
    }
}