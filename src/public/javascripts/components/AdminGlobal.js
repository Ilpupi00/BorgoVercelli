/**
 * ADMIN GLOBAL JAVASCRIPT - MODERN WEB 2.0
 * Sistema di funzioni comuni per tutte le pagine admin
 */

// ==================== UTILITY FUNCTIONS ====================

/**
 * Debounce function per ottimizzare le performance
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function per limitare le chiamate
 */
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// ==================== MODAL SYSTEM ====================

class ModalManager {
    constructor() {
        this.activeModal = null;
        this.initModalListeners();
    }

    /**
     * Mostra un modal
     */
    show(modalId, options = {}) {
        const modal = document.getElementById(modalId);
        if (!modal) {
            console.error(`Modal ${modalId} non trovato`);
            return;
        }

        // Chiudi modal attivo
        if (this.activeModal) {
            this.hide(this.activeModal.id);
        }

        modal.classList.add('show');
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        this.activeModal = modal;

        // Trigger callback
        if (options.onShow) {
            options.onShow(modal);
        }

        // Focus sul primo input
        const firstInput = modal.querySelector('input, textarea, select');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 300);
        }
    }

    /**
     * Nascondi un modal
     */
    hide(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }, 250);

        if (this.activeModal === modal) {
            this.activeModal = null;
        }
    }

    /**
     * Conferma modal
     */
    confirm(options = {}) {
        const {
            title = 'Conferma',
            message = 'Sei sicuro?',
            confirmText = 'Conferma',
            cancelText = 'Annulla',
            type = 'danger', // danger, warning, success, info
            onConfirm = () => {},
            onCancel = () => {}
        } = options;

        // Crea modal di conferma
        const modalId = 'confirmModal_' + Date.now();
        const modalHTML = `
            <div id="${modalId}" class="modal fade">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header bg-${type}">
                            <h5 class="modal-title">
                                <i class="bi bi-exclamation-triangle"></i>
                                ${title}
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <p>${message}</p>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">
                                ${cancelText}
                            </button>
                            <button type="button" class="btn btn-${type}" data-confirm="true">
                                ${confirmText}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Aggiungi al DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        const modal = document.getElementById(modalId);

        // Event listeners
        modal.querySelectorAll('[data-dismiss="modal"]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.hide(modalId);
                onCancel();
                setTimeout(() => modal.remove(), 300);
            });
        });

        modal.querySelector('[data-confirm="true"]').addEventListener('click', () => {
            this.hide(modalId);
            onConfirm();
            setTimeout(() => modal.remove(), 300);
        });

        // Mostra modal
        this.show(modalId);
    }

    /**
     * Inizializza listeners per i modal
     */
    initModalListeners() {
        // Click fuori dal modal per chiuderlo
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.hide(e.target.id);
            }
        });

        // Escape per chiudere modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.activeModal) {
                this.hide(this.activeModal.id);
            }
        });
    }
}

// Istanza globale
const modalManager = new ModalManager();

// ==================== TOAST NOTIFICATIONS ====================

class ToastManager {
    constructor() {
        this.container = null;
        this.initContainer();
    }

    /**
     * Inizializza container dei toast
     */
    initContainer() {
        if (!document.querySelector('.toast-container')) {
            const container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
        this.container = document.querySelector('.toast-container');
    }

    /**
     * Mostra un toast
     */
    show(message, options = {}) {
        const {
            type = 'info', // success, danger, warning, info
            duration = 3000,
            title = null
        } = options;

        const toastId = 'toast_' + Date.now();
        const icon = this.getIcon(type);

        const toastHTML = `
            <div id="${toastId}" class="toast toast-${type}">
                <div class="toast-icon">
                    <i class="${icon}"></i>
                </div>
                <div class="toast-content">
                    ${title ? `<div class="toast-title">${title}</div>` : ''}
                    <div class="toast-message">${message}</div>
                </div>
                <button class="toast-close" aria-label="Chiudi">
                    <i class="bi bi-x"></i>
                </button>
            </div>
        `;

        this.container.insertAdjacentHTML('beforeend', toastHTML);
        const toast = document.getElementById(toastId);

        // Close button
        toast.querySelector('.toast-close').addEventListener('click', () => {
            this.hide(toastId);
        });

        // Auto hide
        if (duration > 0) {
            setTimeout(() => this.hide(toastId), duration);
        }

        return toastId;
    }

    /**
     * Nascondi toast
     */
    hide(toastId) {
        const toast = document.getElementById(toastId);
        if (!toast) return;

        toast.style.animation = 'slideOutRight 0.3s ease-out forwards';
        setTimeout(() => toast.remove(), 300);
    }

    /**
     * Get icon per tipo
     */
    getIcon(type) {
        const icons = {
            success: 'bi bi-check-circle-fill text-success',
            danger: 'bi bi-x-circle-fill text-danger',
            warning: 'bi bi-exclamation-triangle-fill text-warning',
            info: 'bi bi-info-circle-fill text-info'
        };
        return icons[type] || icons.info;
    }

    /**
     * Shortcut methods
     */
    success(message, title) {
        return this.show(message, { type: 'success', title });
    }

    error(message, title) {
        return this.show(message, { type: 'danger', title });
    }

    warning(message, title) {
        return this.show(message, { type: 'warning', title });
    }

    info(message, title) {
        return this.show(message, { type: 'info', title });
    }
}

// Istanza globale
const toastManager = new ToastManager();

// ==================== SEARCH & FILTER ====================

class SearchFilter {
    constructor(options = {}) {
        this.searchInput = options.searchInput || null;
        this.searchableElements = options.searchableElements || [];
        this.filters = options.filters || {};
        this.onFilter = options.onFilter || null;
        this.debounceTime = options.debounceTime || 300;
        
        this.init();
    }

    init() {
        // Search input listener
        if (this.searchInput) {
            this.searchInput.addEventListener('input', debounce((e) => {
                this.applyFilters();
            }, this.debounceTime));
        }

        // Filter listeners
        Object.entries(this.filters).forEach(([key, filterElement]) => {
            filterElement.addEventListener('change', () => {
                this.applyFilters();
            });
        });
    }

    /**
     * Applica filtri
     */
    applyFilters() {
        const searchTerm = this.searchInput ? this.searchInput.value.toLowerCase().trim() : '';
        const filterValues = {};

        // Ottieni valori filtri
        Object.entries(this.filters).forEach(([key, filterElement]) => {
            filterValues[key] = filterElement.value;
        });

        let visibleCount = 0;

        // Applica filtri agli elementi
        this.searchableElements.forEach(element => {
            let isVisible = true;

            // Controllo ricerca
            if (searchTerm) {
                const text = element.textContent.toLowerCase();
                if (!text.includes(searchTerm)) {
                    isVisible = false;
                }
            }

            // Controllo filtri
            Object.entries(filterValues).forEach(([key, value]) => {
                if (value && value !== 'all') {
                    const elementValue = element.dataset[key];
                    if (elementValue !== value) {
                        isVisible = false;
                    }
                }
            });

            // Mostra/nascondi elemento
            element.style.display = isVisible ? '' : 'none';
            if (isVisible) visibleCount++;
        });

        // Callback
        if (this.onFilter) {
            this.onFilter({
                searchTerm,
                filterValues,
                visibleCount,
                totalCount: this.searchableElements.length
            });
        }

        return visibleCount;
    }

    /**
     * Reset filtri
     */
    reset() {
        if (this.searchInput) {
            this.searchInput.value = '';
        }
        Object.values(this.filters).forEach(filter => {
            filter.value = 'all';
        });
        this.applyFilters();
    }
}

// ==================== LOADING OVERLAY ====================

const LoadingOverlay = {
    show(message = 'Caricamento...') {
        if (document.querySelector('.loading-overlay')) return;

        const overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        overlay.innerHTML = `
            <div class="text-center">
                <div class="loading-spinner mb-3"></div>
                <p class="fw-semibold text-dark">${message}</p>
            </div>
        `;
        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden';
    },

    hide() {
        const overlay = document.querySelector('.loading-overlay');
        if (overlay) {
            overlay.style.animation = 'fadeOut 0.2s ease-out forwards';
            setTimeout(() => {
                overlay.remove();
                document.body.style.overflow = '';
            }, 200);
        }
    }
};

// ==================== API HELPER ====================

class ApiHelper {
    /**
     * Fetch wrapper con gestione errori
     */
    static async request(url, options = {}) {
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            },
            ...options
        };

        try {
            const response = await fetch(url, defaultOptions);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return { success: true, data };
        } catch (error) {
            console.error('API Error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * GET request
     */
    static async get(url) {
        return this.request(url, { method: 'GET' });
    }

    /**
     * POST request
     */
    static async post(url, data) {
        return this.request(url, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    /**
     * PUT request
     */
    static async put(url, data) {
        return this.request(url, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    /**
     * DELETE request
     */
    static async delete(url) {
        return this.request(url, { method: 'DELETE' });
    }
}

// ==================== FORM VALIDATION ====================

class FormValidator {
    constructor(formElement) {
        this.form = formElement;
        this.errors = {};
    }

    /**
     * Valida un campo
     */
    validateField(field, rules) {
        const value = field.value.trim();
        const errors = [];

        if (rules.required && !value) {
            errors.push('Questo campo è obbligatorio');
        }

        if (rules.minLength && value.length < rules.minLength) {
            errors.push(`Minimo ${rules.minLength} caratteri richiesti`);
        }

        if (rules.maxLength && value.length > rules.maxLength) {
            errors.push(`Massimo ${rules.maxLength} caratteri consentiti`);
        }

        if (rules.pattern && !rules.pattern.test(value)) {
            errors.push(rules.patternMessage || 'Formato non valido');
        }

        if (rules.email && value && !this.isValidEmail(value)) {
            errors.push('Email non valida');
        }

        return errors;
    }

    /**
     * Mostra errore campo
     */
    showFieldError(field, message) {
        field.classList.add('is-invalid');
        
        let errorElement = field.nextElementSibling;
        if (!errorElement || !errorElement.classList.contains('invalid-feedback')) {
            errorElement = document.createElement('div');
            errorElement.className = 'invalid-feedback';
            field.parentNode.insertBefore(errorElement, field.nextSibling);
        }
        errorElement.textContent = message;
    }

    /**
     * Rimuovi errore campo
     */
    clearFieldError(field) {
        field.classList.remove('is-invalid');
        const errorElement = field.nextElementSibling;
        if (errorElement && errorElement.classList.contains('invalid-feedback')) {
            errorElement.remove();
        }
    }

    /**
     * Valida email
     */
    isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    /**
     * Reset form
     */
    reset() {
        this.form.reset();
        this.form.querySelectorAll('.is-invalid').forEach(field => {
            this.clearFieldError(field);
        });
        this.errors = {};
    }
}

// ==================== DATA TABLE ====================

class DataTable {
    constructor(tableElement, options = {}) {
        this.table = tableElement;
        this.tbody = tableElement.querySelector('tbody');
        this.options = {
            sortable: options.sortable !== false,
            searchable: options.searchable !== false,
            pageSize: options.pageSize || 10,
            ...options
        };
        
        this.currentPage = 1;
        this.sortColumn = null;
        this.sortDirection = 'asc';
        
        if (this.options.sortable) {
            this.initSorting();
        }
    }

    /**
     * Inizializza ordinamento
     */
    initSorting() {
        const headers = this.table.querySelectorAll('thead th');
        headers.forEach((header, index) => {
            if (!header.classList.contains('no-sort')) {
                header.style.cursor = 'pointer';
                header.addEventListener('click', () => {
                    this.sortByColumn(index);
                });
            }
        });
    }

    /**
     * Ordina per colonna
     */
    sortByColumn(columnIndex) {
        const rows = Array.from(this.tbody.querySelectorAll('tr'));
        
        if (this.sortColumn === columnIndex) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = columnIndex;
            this.sortDirection = 'asc';
        }

        rows.sort((a, b) => {
            const aValue = a.cells[columnIndex].textContent.trim();
            const bValue = b.cells[columnIndex].textContent.trim();
            
            const comparison = aValue.localeCompare(bValue, 'it', { numeric: true });
            return this.sortDirection === 'asc' ? comparison : -comparison;
        });

        // Riordina righe
        rows.forEach(row => this.tbody.appendChild(row));
        
        // Aggiorna icone ordinamento
        this.updateSortIcons();
    }

    /**
     * Aggiorna icone ordinamento
     */
    updateSortIcons() {
        const headers = this.table.querySelectorAll('thead th');
        headers.forEach((header, index) => {
            const icon = header.querySelector('.sort-icon');
            if (icon) icon.remove();
            
            if (index === this.sortColumn) {
                const iconClass = this.sortDirection === 'asc' ? 'bi-arrow-up' : 'bi-arrow-down';
                header.insertAdjacentHTML('beforeend', `<i class="bi ${iconClass} sort-icon ms-1"></i>`);
            }
        });
    }
}

// ==================== EXPORT FUNCTIONS ====================

// Esporta funzioni e classi globalmente
window.AdminGlobal = {
    modalManager,
    toastManager,
    LoadingOverlay,
    ApiHelper,
    SearchFilter,
    FormValidator,
    DataTable,
    debounce,
    throttle
};
// Aliases per compatibilità con codice esistente (ModalManager / ToastManager maiuscole)
window.AdminGlobal.ModalManager = modalManager;
window.AdminGlobal.ToastManager = toastManager;
// For backward compatibility expose modalManager under different name
window.AdminGlobal.Modal = modalManager;

// ==================== INIT ON DOM READY ====================

document.addEventListener('DOMContentLoaded', () => {
    // Aggiungi animazioni CSS personalizzate
    const style = document.createElement('style');
    style.textContent = `
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
        
        @keyframes fadeOut {
            from {
                opacity: 1;
            }
            to {
                opacity: 0;
            }
        }
        
        .invalid-feedback {
            display: block;
            margin-top: 0.25rem;
            font-size: 0.875rem;
            color: var(--danger);
        }
        
        .is-invalid {
            border-color: var(--danger) !important;
        }
    `;
    document.head.appendChild(style);
    
    console.log('Admin Global JS initialized');
});
