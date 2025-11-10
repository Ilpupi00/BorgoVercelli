/**
 * AdminSidebar.js
 * Gestione sidebar admin con highlight link attivo
 */

class AdminSidebar {
    constructor() {
        this.init();
    }

    init() {
        this.highlightActiveLink();
        this.setupMobileToggle();
    }

    highlightActiveLink() {
        const currentPath = window.location.pathname;
        const sidebarLinks = document.querySelectorAll('.admin-sidebar .nav-link.submenu, .admin-sidebar .site-link');
        
        sidebarLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href && currentPath.includes(href)) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    setupMobileToggle() {
        // Se serve un toggle per mobile
        const sidebarToggle = document.getElementById('sidebarToggle');
        const sidebar = document.querySelector('.admin-sidebar');
        
        if (sidebarToggle && sidebar) {
            sidebarToggle.addEventListener('click', () => {
                sidebar.classList.toggle('show');
            });
        }
    }
}

// Inizializza quando il DOM è pronto
document.addEventListener('DOMContentLoaded', () => {
    new AdminSidebar();
});
