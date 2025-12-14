/**
 * Image Editor Common - Sistema condiviso per editing immagini
 * Utilizzato da Eventi e Notizie
 * Supporta crop, resize, rotate, flip con Cropper.js
 */

// Inizializza il modale dell'editor al caricamento della pagina
document.addEventListener('DOMContentLoaded', () => {
    initializeImageEditorModal();
    bindImageEditorButtons();
});

/**
 * Crea il modale dell'editor se non esiste
 */
function initializeImageEditorModal() {
    if (document.getElementById('imageEditorModal')) return;
    
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
                            <input type="range" id="zoomSlider" min="0" max="2" step="0.01" value="0">
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

/**
 * Associa i pulsanti "Modifica" all'apertura dell'editor
 */
function bindImageEditorButtons() {
    // Bind per pulsanti esistenti e nuovi
    document.addEventListener('click', (e) => {
        const editBtn = e.target.closest('.edit-image-btn');
        if (editBtn) {
            e.preventDefault();
            const imageUrl = editBtn.dataset.imageUrl || editBtn.closest('.image-preview-wrapper').querySelector('img')?.src;
            if (imageUrl) {
                openImageEditor(imageUrl);
            }
        }
        
        const editPreviewBtn = e.target.closest('#editPreviewBtn');
        if (editPreviewBtn) {
            e.preventDefault();
            const previewImg = document.getElementById('previewImg');
            if (previewImg && previewImg.src) {
                openImageEditor(previewImg.src);
            }
        }
    });
}

let cropperInstance = null;
let currentScaleX = 1;
let currentScaleY = 1;

/**
 * Apre l'editor di immagini con l'immagine specificata
 * @param {string} imageUrl - URL dell'immagine da modificare
 */
function openImageEditor(imageUrl) {
    const modal = document.getElementById('imageEditorModal');
    const editorImage = document.getElementById('editorImage');
    
    if (!modal || !editorImage) {
        console.error('Image editor modal not found');
        return;
    }
    
    // Reset scales
    currentScaleX = 1;
    currentScaleY = 1;
    
    // Set image source
    editorImage.src = imageUrl;
    
    // Show modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent background scroll
    
    // Initialize cropper after image loads
    editorImage.onload = () => {
        initializeCropper(editorImage);
        bindEditorControls();
    };
}

/**
 * Inizializza Cropper.js sull'immagine
 */
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
        responsive: true,
        modal: true,
        background: false,
    });
}

/**
 * Associa i controlli dell'editor
 */
function bindEditorControls() {
    const modal = document.getElementById('imageEditorModal');
    if (!modal) return;
    
    // Close handlers
    const closeBtn = modal.querySelector('.editor-close');
    const cancelBtn = modal.querySelector('.editor-cancel');
    
    const closeEditor = () => {
        modal.classList.remove('active');
        document.body.style.overflow = ''; // Restore scroll
        
        if (cropperInstance) {
            cropperInstance.destroy();
            cropperInstance = null;
        }
        
        // Reset controls
        resetEditorControls();
    };
    
    if (closeBtn) closeBtn.onclick = closeEditor;
    if (cancelBtn) cancelBtn.onclick = closeEditor;
    
    // Close on escape key
    const handleEscape = (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeEditor();
        }
    };
    document.addEventListener('keydown', handleEscape);
    
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
                    const ratio = eval(aspect);
                    cropperInstance.setAspectRatio(ratio);
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
    
    // Flip horizontal
    const flipHBtn = modal.querySelector('#flipHBtn');
    if (flipHBtn && cropperInstance) {
        flipHBtn.onclick = () => {
            currentScaleX = -currentScaleX;
            cropperInstance.scaleX(currentScaleX);
        };
    }
    
    // Flip vertical
    const flipVBtn = modal.querySelector('#flipVBtn');
    if (flipVBtn && cropperInstance) {
        flipVBtn.onclick = () => {
            currentScaleY = -currentScaleY;
            cropperInstance.scaleY(currentScaleY);
        };
    }
    
    // Reset button
    const resetBtn = modal.querySelector('#resetBtn');
    if (resetBtn && cropperInstance) {
        resetBtn.onclick = () => {
            cropperInstance.reset();
            resetEditorControls();
        };
    }
    
    // Save button
    const saveBtn = modal.querySelector('.editor-save');
    if (saveBtn && cropperInstance) {
        saveBtn.onclick = async () => {
            try {
                const canvas = cropperInstance.getCroppedCanvas({
                    maxWidth: 1920,
                    maxHeight: 1080,
                    fillColor: '#fff',
                    imageSmoothingEnabled: true,
                    imageSmoothingQuality: 'high',
                });
                
                canvas.toBlob(async (blob) => {
                    // Converti il blob in un File object con un nome appropriato
                    const timestamp = Date.now();
                    const fileName = `edited-image-${timestamp}.jpg`;
                    const editedFile = new File([blob], fileName, { type: 'image/jpeg' });
                    
                    // Update preview image
                    const previewImg = document.getElementById('previewImg');
                    if (previewImg) {
                        const url = URL.createObjectURL(blob);
                        previewImg.src = url;
                    }
                    
                    // Update current image preview if exists
                    const currentImagePreview = document.querySelector('#currentImagePreview img');
                    if (currentImagePreview) {
                        const url = URL.createObjectURL(blob);
                        currentImagePreview.src = url;
                    }
                    
                    // Aggiorna la variabile globale selectedFile (se esiste in crea_evento.js)
                    if (typeof window.selectedFile !== 'undefined') {
                        window.selectedFile = editedFile;
                        console.log('✅ selectedFile aggiornato con immagine modificata');
                    }
                    
                    // Se stiamo modificando un evento esistente, fai l'upload immediato
                    const eventoForm = document.getElementById('eventoForm');
                    if (eventoForm) {
                        const eventoId = eventoForm.getAttribute('data-evento-id');
                        if (eventoId && typeof window.uploadImageToServer === 'function') {
                            console.log('📤 Upload automatico immagine modificata per evento ID:', eventoId);
                            await window.uploadImageToServer(editedFile, eventoId);
                        }
                    }
                    
                    // Se stiamo modificando una notizia esistente, fai l'upload immediato
                    const notiziaForm = document.getElementById('notiziaForm');
                    if (notiziaForm) {
                        const notiziaId = notiziaForm.getAttribute('data-notizia-id');
                        if (notiziaId && typeof window.uploadImageToServer === 'function') {
                            console.log('📤 Upload automatico immagine modificata per notizia ID:', notiziaId);
                            await window.uploadImageToServer(editedFile, notiziaId);
                        }
                    }
                    
                    // Close editor
                    closeEditor();
                    
                    // Show success message
                    if (eventoForm?.getAttribute('data-evento-id') || notiziaForm?.getAttribute('data-notizia-id')) {
                        showSuccessToast('Modifiche salvate e caricate con successo!');
                    } else {
                        showSuccessToast('Modifiche salvate! Salva il form per applicare le modifiche.');
                    }
                }, 'image/jpeg', 0.95);
                
            } catch (error) {
                console.error('Error saving cropped image:', error);
                alert('Errore durante il salvataggio delle modifiche');
            }
        };
    }
}

/**
 * Reset dei controlli dell'editor
 */
function resetEditorControls() {
    const zoomSlider = document.querySelector('#zoomSlider');
    const rotateSlider = document.querySelector('#rotateSlider');
    const zoomValue = document.querySelector('.zoom-value');
    const rotateValue = document.querySelector('.rotate-value');
    
    if (zoomSlider) zoomSlider.value = 0;
    if (rotateSlider) rotateSlider.value = 0;
    if (zoomValue) zoomValue.textContent = '100%';
    if (rotateValue) rotateValue.textContent = '0°';
    
    currentScaleX = 1;
    currentScaleY = 1;
}

/**
 * Mostra un messaggio di successo
 */
function showSuccessToast(message) {
    // Check if there's an existing alert container
    let alertContainer = document.querySelector('.alert-container');
    
    if (!alertContainer) {
        alertContainer = document.createElement('div');
        alertContainer.className = 'alert-container';
        alertContainer.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 10000; max-width: 400px;';
        document.body.appendChild(alertContainer);
    }
    
    const alert = document.createElement('div');
    alert.className = 'alert alert-success alert-dismissible fade show shadow-lg';
    alert.innerHTML = `
        <i class="bi bi-check-circle me-2"></i>${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    alertContainer.appendChild(alert);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        alert.classList.remove('show');
        setTimeout(() => alert.remove(), 150);
    }, 3000);
}

// Export functions for use in other scripts
window.openImageEditor = openImageEditor;
window.initializeImageEditorModal = initializeImageEditorModal;
