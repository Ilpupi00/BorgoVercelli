/**
 * Classe per gestire la visualizzazione e interattività di una singola notizia
 * Utilizza approccio OOP per organizzare il codice in modo modulare e riutilizzabile
 */
class NotiziaVisualizer {
    constructor() {
        this.notiziaData = null;
        this.shareButtons = document.querySelectorAll('.share-btn');
        this.init();
    }

    /**
     * Inizializza gli event listener e le funzionalità
     */
    init() {
        this.setupShareButtons();
        this.setupLazyLoading();
        this.trackView();
    }

    /**
     * Configura i pulsanti di condivisione social
     */
    setupShareButtons() {
        this.shareButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const platform = button.dataset.platform;
                this.shareOnPlatform(platform);
            });
        });
    }

    /**
     * Gestisce la condivisione su diverse piattaforme
     * @param {string} platform - La piattaforma di condivisione (facebook, twitter, whatsapp, copy)
     */
    shareOnPlatform(platform) {
        const url = encodeURIComponent(window.location.href);
        const title = encodeURIComponent(document.title);
        const text = encodeURIComponent(this.getShareText());

        let shareUrl = '';

        switch (platform) {
            case 'facebook':
                shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
                break;
            case 'twitter':
                shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${title}`;
                break;
            case 'whatsapp':
                shareUrl = `https://wa.me/?text=${text}%20${url}`;
                break;
            case 'copy':
                this.copyToClipboard(window.location.href);
                this.showNotification('Link copiato negli appunti!', 'success');
                return;
            default:
                return;
        }

        window.open(shareUrl, '_blank', 'width=600,height=400');
    }

    /**
     * Ottiene il testo da condividere
     * @returns {string} Testo formattato per la condivisione
     */
    getShareText() {
        const title = document.querySelector('.display-4')?.textContent || 'Notizia da Borgo Vercelli';
        return `Guarda questa notizia: ${title}`;
    }

    /**
     * Copia il testo negli appunti
     * @param {string} text - Testo da copiare
     */
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
        } catch (err) {
            // Fallback per browser che non supportano Clipboard API
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
        }
    }

    /**
     * Mostra una notifica all'utente
     * @param {string} message - Messaggio da mostrare
     * @param {string} type - Tipo di notifica (success, error, info)
     */
    showNotification(message, type = 'info') {
        // Crea elemento notifica
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} position-fixed`;
        notification.style.cssText = `
            top: 20px;
            right: 20px;
            z-index: 9999;
            max-width: 300px;
            animation: slideInRight 0.3s ease-out;
        `;
        notification.innerHTML = `
            <i class="bi bi-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-triangle' : 'info-circle'} me-2"></i>
            ${message}
        `;

        document.body.appendChild(notification);

        // Rimuovi dopo 3 secondi
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    /**
     * Implementa lazy loading per le immagini
     */
    setupLazyLoading() {
        const images = document.querySelectorAll('img[data-src]');
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.classList.remove('lazy');
                        imageObserver.unobserve(img);
                    }
                });
            });

            images.forEach(img => imageObserver.observe(img));
        } else {
            // Fallback per browser senza IntersectionObserver
            images.forEach(img => {
                img.src = img.dataset.src;
            });
        }
    }

    /**
     * Traccia la visualizzazione della notizia (se necessario per analytics)
     */
    trackView() {
        // Qui potresti implementare tracking con Google Analytics o simile
        if (typeof gtag !== 'undefined') {
            gtag('event', 'page_view', {
                page_title: document.title,
                page_location: window.location.href
            });
        }
    }
}

// Inizializza quando il DOM è pronto
document.addEventListener('DOMContentLoaded', () => {
    new NotiziaVisualizer();
});

// Aggiungi stili CSS per le animazioni delle notifiche
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);