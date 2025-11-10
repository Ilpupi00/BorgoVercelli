// eventiManager.js - Gestione OOP della pagina eventi con ricerca e filtri
// Precedentemente chiamato crea_eventi.js

class EventiManager {
    constructor(container) {
        this.container = container;
        this.eventsGrid = document.getElementById('eventsGrid');
        this.searchInput = document.getElementById('searchInput');
        this.tipoFilter = document.getElementById('tipoFilter');
        this.dateFilter = document.getElementById('dateFilter');
        this.clearFiltersBtn = document.getElementById('clearFilters');
        this.loadMoreBtn = document.getElementById('loadMoreBtn');
        this.loadingSpinner = document.getElementById('loadingSpinner');
        this.noResults = document.getElementById('noResults');

        this.currentPage = 1;
        this.isLoading = false;
        this.hasMoreEvents = true;
        this.allEvents = [];
        this.filteredEvents = [];

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkForMoreEvents();
        // Non caricare automaticamente gli eventi - usa il rendering lato server
        // this.loadEvents();
    }

    setupEventListeners() {
        // Search input with debounce
        let searchTimeout;
        this.searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => this.handleSearch(), 300);
        });

        // Filter changes
        this.tipoFilter.addEventListener('change', () => this.handleFilters());
        this.dateFilter.addEventListener('change', () => this.handleFilters());

        // Clear filters
        this.clearFiltersBtn.addEventListener('click', () => this.clearFilters());

        // Load more button
        if (this.loadMoreBtn) {
            this.loadMoreBtn.addEventListener('click', () => this.loadMoreEvents());
        }

        // Infinite scroll
        window.addEventListener('scroll', () => this.handleScroll());
    }

    async checkForMoreEvents() {
        try {
            const response = await fetch('/all');
            const data = await response.json();
            const publishedEvents = data.eventi.filter(event => event.pubblicato === 1 || event.pubblicato === true);

            // Se ci sono più di 6 eventi pubblicati, mostra il bottone "carica altri"
            if (publishedEvents.length > 6) {
                this.loadMoreBtn.classList.remove('d-none');
                this.hasMoreEvents = true;
            } else {
                this.loadMoreBtn.classList.add('d-none');
                this.hasMoreEvents = false;
            }
        } catch (error) {
            console.error('Errore nel controllo eventi aggiuntivi:', error);
        }
    }

    async loadAllEvents() {
        try {
            const response = await fetch('/all');
            const data = await response.json();
            this.allEvents = data.eventi || [];
        } catch (error) {
            console.error('Errore nel caricamento di tutti gli eventi:', error);
            this.allEvents = [];
        }
    }

    async loadEvents() {
        if (this.isLoading) return;

        this.isLoading = true;
        this.showLoading();

        try {
            const response = await fetch('/all');
            const data = await response.json();
            const allEvents = data.eventi || [];

            // Filtra solo gli eventi pubblicati
            this.allEvents = allEvents.filter(event => event.pubblicato === 1 || event.pubblicato === true);
            this.filteredEvents = [...this.allEvents];
            this.currentPage = 1;
            this.hasMoreEvents = this.allEvents.length > 12; // Assuming 12 events per page

            this.renderEvents();
        } catch (error) {
            console.error('Errore nel caricamento degli eventi:', error);
            this.showError('Errore nel caricamento degli eventi');
        } finally {
            this.hideLoading();
            this.isLoading = false;
        }
    }

    async loadMoreEvents() {
        console.log('🔄 loadMoreEvents chiamato');
        if (this.isLoading || !this.hasMoreEvents) {
            console.log('❌ Rifiutato: isLoading=', this.isLoading, 'hasMoreEvents=', this.hasMoreEvents);
            return;
        }

        this.isLoading = true;
        this.showLoading();

        try {
            // Se non abbiamo ancora caricato tutti gli eventi, caricali prima
            if (!this.allEvents || this.allEvents.length === 0) {
                console.log('📥 Caricamento tutti gli eventi...');
                await this.loadAllEvents();
            }

            // Conta quanti eventi sono già mostrati (inizialmente 6 dal server)
            const currentEventCards = this.eventsGrid.querySelectorAll('.event-card').length;
            console.log('📊 Eventi attualmente mostrati:', currentEventCards);
            const nextBatchStart = currentEventCards;
            const nextBatchEnd = nextBatchStart + 6;

            // Filtra solo gli eventi pubblicati
            const publishedEvents = this.allEvents.filter(event => event.pubblicato === 1 || event.pubblicato === true);
            console.log('✅ Eventi pubblicati totali:', publishedEvents.length);

            // Ottieni il prossimo batch di eventi
            const nextBatch = publishedEvents.slice(nextBatchStart, nextBatchEnd);
            console.log('📦 Prossimo batch:', nextBatch.length, 'eventi (da', nextBatchStart, 'a', nextBatchEnd, ')');

            // Ottieni il template per creare le carte evento
            const template = document.getElementById('eventCardTemplate');
            console.log('🎨 Template trovato:', !!template);

            // Aggiungi gli eventi al container
            nextBatch.forEach((event, index) => {
                const eventCard = this.createEventCard(event, template, nextBatchStart + index);
                this.eventsGrid.appendChild(eventCard);
                console.log('➕ Aggiunto evento:', event.titolo);
            });

            // Controlla se ci sono ancora eventi da mostrare
            if (nextBatchEnd >= publishedEvents.length) {
                this.hasMoreEvents = false;
                this.loadMoreBtn.classList.add('d-none');
                console.log('🏁 Nessun altro evento da mostrare, nascondo pulsante');
            } else {
                console.log('⏭️ Rimangono ancora eventi da mostrare');
            }

        } catch (error) {
            console.error('❌ Errore nel caricamento di più eventi:', error);
        } finally {
            this.hideLoading();
            this.isLoading = false;
        }
    }

    handleSearch() {
        const searchTerm = this.searchInput.value.toLowerCase().trim();
        if (this.allEvents.length === 0) {
            // Carica eventi se non sono ancora stati caricati
            this.loadEvents().then(() => this.applyFilters(searchTerm));
        } else {
            this.applyFilters(searchTerm);
        }
    }

    handleFilters() {
        const searchTerm = this.searchInput.value.toLowerCase().trim();
        if (this.allEvents.length === 0) {
            // Carica eventi se non sono ancora stati caricati
            this.loadEvents().then(() => this.applyFilters(searchTerm));
        } else {
            this.applyFilters(searchTerm);
        }
    }

    applyFilters(searchTerm = '') {
        this.filteredEvents = this.allEvents.filter(event => {
            // Search filter
            const matchesSearch = !searchTerm ||
                event.titolo.toLowerCase().includes(searchTerm) ||
                (event.descrizione && event.descrizione.toLowerCase().includes(searchTerm)) ||
                (event.luogo && event.luogo.toLowerCase().includes(searchTerm));

            // Type filter
            const selectedType = this.tipoFilter.value;
            const matchesType = !selectedType || event.tipo_evento === selectedType;

            // Date filter
            const selectedDate = this.dateFilter.value;
            const matchesDate = this.matchesDateFilter(event, selectedDate);

            return matchesSearch && matchesType && matchesDate;
        });

        this.currentPage = 1;
        this.hasMoreEvents = this.filteredEvents.length > 12;
        this.renderEvents();
    }

    matchesDateFilter(event, filter) {
        if (!filter) return true;

        const eventDate = new Date(event.data_inizio);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        const weekFromNow = new Date(today);
        weekFromNow.setDate(today.getDate() + 7);

        const monthFromNow = new Date(today);
        monthFromNow.setMonth(today.getMonth() + 1);

        switch (filter) {
            case 'oggi':
                return eventDate.toDateString() === today.toDateString();
            case 'domani':
                return eventDate.toDateString() === tomorrow.toDateString();
            case 'settimana':
                return eventDate >= today && eventDate <= weekFromNow;
            case 'mese':
                return eventDate >= today && eventDate <= monthFromNow;
            case 'futuri':
                return eventDate >= today;
            default:
                return true;
        }
    }

    clearFilters() {
        this.searchInput.value = '';
        this.tipoFilter.value = '';
        this.dateFilter.value = '';
        if (this.allEvents.length === 0) {
            // Carica eventi se non sono ancora stati caricati
            this.loadEvents().then(() => this.applyFilters());
        } else {
            this.applyFilters();
        }
    }

    renderEvents(eventsToRender = null, clearGrid = true) {
        const events = eventsToRender || this.filteredEvents.slice(0, this.currentPage * 12);

        if (clearGrid) {
            this.eventsGrid.innerHTML = '';
        }

        if (events.length === 0) {
            this.showNoResults();
            return;
        }

        this.hideNoResults();

        const template = document.getElementById('eventCardTemplate');
        const fragment = document.createDocumentFragment();

        events.forEach((event, index) => {
            const eventCard = this.createEventCard(event, template, index);
            fragment.appendChild(eventCard);
        });

        this.eventsGrid.appendChild(fragment);

        // Update load more button visibility
        if (this.loadMoreBtn) {
            if (this.hasMoreEvents && this.filteredEvents.length > this.currentPage * 12) {
                this.loadMoreBtn.classList.remove('d-none');
            } else {
                this.loadMoreBtn.classList.add('d-none');
            }
        }
    }

    createEventCard(event, template, index) {
        const cardClone = template.content.cloneNode(true);
        const card = cardClone.querySelector('.col-12');

        // Set animation delay
        card.style.setProperty('--index', index);

        // Image
        const img = card.querySelector('img');
        img.src = event.immagine_url || '/assets/images/Campo.png';
        img.alt = event.titolo;

        // Event type badge
        const typeBadge = card.querySelector('.event-type-badge');
        typeBadge.textContent = event.tipo_evento || 'Evento';

        // Date
        const dateText = card.querySelector('.date-text');
        const eventDate = new Date(event.data_inizio);
        dateText.textContent = eventDate.toLocaleDateString('it-IT', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // Title
        const title = card.querySelector('.card-title');
        title.textContent = event.titolo;

        // Description
        const description = card.querySelector('.card-text');
        const strippedDesc = event.descrizione ? this.stripHtml(event.descrizione) : '';
        description.textContent = strippedDesc.substring(0, 120) + (strippedDesc.length > 120 ? '...' : '');

        // Location
        const locationText = card.querySelector('.location-text');
        locationText.textContent = event.luogo || 'Luogo da definire';

        // Participants
        const participantsText = card.querySelector('.participants-text');
        if (event.max_partecipanti) {
            participantsText.textContent = `Max ${event.max_partecipanti}`;
        } else {
            participantsText.textContent = 'Numero illimitato';
        }

        // Link
        const link = card.querySelector('.card-button');
        link.href = `/evento/${event.id}`;

        return card;
    }

    stripHtml(html) {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    }

    handleScroll() {
        if (this.isLoading || !this.hasMoreEvents) return;

        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;

        // Load more when user is near bottom (100px threshold)
        if (scrollTop + windowHeight >= documentHeight - 100) {
            this.loadMoreEvents();
        }
    }

    showLoading() {
        this.loadingSpinner.classList.remove('d-none');
    }

    hideLoading() {
        this.loadingSpinner.classList.add('d-none');
    }

    showNoResults() {
        this.noResults.classList.remove('d-none');
        this.eventsGrid.innerHTML = '';
        if (this.loadMoreBtn) {
            this.loadMoreBtn.classList.add('d-none');
        }
    }

    hideNoResults() {
        this.noResults.classList.add('d-none');
    }

    showError(message) {
        console.error('Errore EventiManager:', message);

        // Mostra un messaggio di errore nell'interfaccia invece di un alert
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-danger alert-dismissible fade show position-fixed';
        errorDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        errorDiv.innerHTML = `
            <i class="fas fa-exclamation-triangle me-2"></i>
            <strong>Errore:</strong> ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        document.body.appendChild(errorDiv);

        // Rimuovi automaticamente dopo 5 secondi
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 5000);
    }
}

export default EventiManager;