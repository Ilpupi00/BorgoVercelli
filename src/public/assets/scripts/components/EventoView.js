// EventoView.js - Gestione OOP della visualizzazione singolo evento

class EventoView {
    constructor(container) {
        this.container = container;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeAnimations();
    }

    setupEventListeners() {
        // Add any interactive elements here
        this.setupImageErrorHandling();
        this.setupShareFunctionality();
    }

    setupImageErrorHandling() {
        // Handle broken images
        const images = this.container.querySelectorAll('img');
        images.forEach(img => {
            img.addEventListener('error', () => {
                if (!img.src.includes('Campo.png')) {
                    img.src = '/assets/images/Campo.png';
                }
            });
        });
    }

    setupShareFunctionality() {
        // Add share buttons if they exist
        const shareButtons = this.container.querySelectorAll('.share-btn');
        shareButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleShare(btn.dataset.platform);
            });
        });
    }

    handleShare(platform) {
        const url = window.location.href;
        const title = document.title;

        switch (platform) {
            case 'facebook':
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
                break;
            case 'twitter':
                window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`, '_blank');
                break;
            case 'whatsapp':
                window.open(`https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`, '_blank');
                break;
            default:
                // Copy to clipboard as fallback
                navigator.clipboard.writeText(url).then(() => {
                    this.showNotification('Link copiato negli appunti!');
                });
        }
    }

    initializeAnimations() {
        // Add scroll animations
        this.setupScrollAnimations();
    }

    setupScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate__animated', 'animate__fadeInUp');
                }
            });
        }, observerOptions);

        // Observe elements that should animate on scroll
        const animateElements = this.container.querySelectorAll('.event-details-card, .event-description-card');
        animateElements.forEach(el => observer.observe(el));
    }

    showNotification(message) {
        // Prefer global ToastManager for consistent UI
        try {
            if (window.AdminGlobal && window.AdminGlobal.ToastManager && typeof window.AdminGlobal.ToastManager.success === 'function') {
                window.AdminGlobal.ToastManager.success(message);
                return;
            }
            if (typeof toastManager !== 'undefined' && typeof toastManager.success === 'function') {
                toastManager.success(message);
                return;
            }
        } catch (e) {
            // fallback to DOM alert
        }

        // Fallback: simple DOM alert
        const notification = document.createElement('div');
        notification.className = 'alert alert-success alert-dismissible fade show position-fixed';
        notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) notification.remove();
        }, 3000);
    }
}

// Export for module usage
export default EventoView;