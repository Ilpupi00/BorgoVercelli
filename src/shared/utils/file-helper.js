/**
 * Helper per eliminazione fisica file immagini
 * Usato quando si sostituisce o elimina un'immagine
 */

const fs = require('fs');
const path = require('path');

/**
 * Elimina un file immagine dal filesystem
 * @param {string} imageUrl - URL dell'immagine (es. '/uploads/file.jpg')
 * @returns {boolean} true se eliminato, false se non trovato
 */
function deleteImageFile(imageUrl) {
    if (!imageUrl) return false;
    
    // Rimuovi lo slash iniziale se presente
    const relativeUrl = imageUrl.startsWith('/') ? imageUrl.slice(1) : imageUrl;
    
    // Determina il path base in base all'ambiente
    const uploadsBasePath = process.env.RAILWAY_ENVIRONMENT 
        ? '/data' 
        : path.join(process.cwd(), 'src', 'public');
    
    // Percorsi candidati da provare
    const candidates = [
        // Primary: environment-aware path
        path.join(uploadsBasePath, relativeUrl),
        // Fallback per compatibilità
        path.join(process.cwd(), 'src', 'public', relativeUrl),
        path.join(process.cwd(), 'public', relativeUrl)
    ];
    
    let fileFound = false;
    for (const filePath of candidates) {
        if (fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
                console.log('[DELETE-FILE] File eliminato:', filePath);
                fileFound = true;
                break;
            } catch (err) {
                console.error('[DELETE-FILE] Errore eliminazione:', err.message);
                // Non blocca l'operazione se fallisce
            }
        }
    }
    
    if (!fileFound) {
        console.warn('[DELETE-FILE] File non trovato:', imageUrl);
    }
    
    return fileFound;
}

module.exports = {
    deleteImageFile
};
