// Classe per gestire la pagina delle notizie con ricerca e filtri
class NotizieManager {
    constructor() {
        console.log('NotizieManager constructor');
        this.allNews = [];
        this.filteredNews = [];
        this.loadedNews = 6;
        this.newsPerLoad = 6;
        this.isLoading = false;
        this.currentFilters = {
            search: '',
            author: '',
            dateRange: null
        };
        this.init();
    }

    async init() {
        console.log('NotizieManager init');
        document.title = "Notizie";
        await this.loadInitialNews();
        this.setupEventListeners();
        this.setupEmailFormListener();
    }

    async loadInitialNews() {
        console.log('Loading initial news');
        try {
            const response = await fetch('/api/notizie?limit=12');
            console.log('Fetch response status:', response.status);
            if (!response.ok) throw new Error('Errore nel caricamento');

            const data = await response.json();
            console.log('Data received:', data.notizie ? data.notizie.length : 'no notizie property', 'items');
            this.allNews = data.notizie || [];
            this.filteredNews = [...this.allNews];
            console.log('allNews length:', this.allNews.length);
            this.populateAuthorFilter();
            this.renderNews();
        } catch (error) {
            console.error('Errore nel caricamento delle notizie:', error);
            this.showError('Errore nel caricamento delle notizie. Riprova più tardi.');
        }
    }

    setupEventListeners() {
        console.log('Setting up event listeners');
        // Ricerca
        const searchInput = document.getElementById('searchInput');
        const clearSearch = document.getElementById('clearSearch');
        console.log('searchInput:', searchInput);
        console.log('clearSearch:', clearSearch);

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                console.log('Search input event:', e.target.value);
                this.currentFilters.search = e.target.value.toLowerCase();
                this.applyFilters();
                clearSearch.style.display = e.target.value ? 'block' : 'none';
            });

            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    console.log('Enter key pressed in search');
                    e.preventDefault(); // Previene il submit del form se presente
                    this.currentFilters.search = e.target.value.toLowerCase();
                    this.applyFilters();
                }
            });
        }

        // Bottone cerca
        const searchBtn = document.getElementById('searchBtn');
        console.log('searchBtn:', searchBtn);
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                console.log('Search button clicked');
                const searchInput = document.getElementById('searchInput');
                this.currentFilters.search = searchInput.value.toLowerCase();
                this.applyFilters();
            });
        }

        if (clearSearch) {
            clearSearch.addEventListener('click', () => {
                console.log('Clear search clicked');
                searchInput.value = '';
                this.currentFilters.search = '';
                clearSearch.style.display = 'none';
                this.applyFilters();
            });
        }

        // Filtro autore
        const authorFilter = document.getElementById('authorFilter');
        console.log('authorFilter:', authorFilter);
        if (authorFilter) {
            authorFilter.addEventListener('change', (e) => {
                console.log('Author filter changed:', e.target.value);
                this.currentFilters.author = e.target.value;
                this.applyFilters();
            });
        }

        // Filtro data
        const dateFilter = document.getElementById('dateFilter');
        console.log('dateFilter:', dateFilter);
        if (dateFilter) {
            dateFilter.addEventListener('change', (e) => {
                console.log('Date filter changed:', e.target.value);
                const value = e.target.value;
                const customRange = document.getElementById('customDateRange');

                if (value === 'custom') {
                    if (customRange) customRange.style.display = 'flex';
                    return;
                } else {
                    if (customRange) customRange.style.display = 'none';
                    this.currentFilters.dateRange = this.getDateRange(value);
                    this.applyFilters();
                }
            });
        }

        // Filtro data personalizzata
        const applyDateFilter = document.getElementById('applyDateFilter');
        if (applyDateFilter) {
            applyDateFilter.addEventListener('click', () => {
                const startDate = document.getElementById('startDate').value;
                const endDate = document.getElementById('endDate').value;

                if (startDate && endDate) {
                    this.currentFilters.dateRange = {
                        start: new Date(startDate),
                        end: new Date(endDate)
                    };
                    this.applyFilters();
                }
            });
        }

        // Carica più notizie
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => this.loadMoreNews());
        }
    }

    getDateRange(filter) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        switch (filter) {
            case 'oggi':
                return { start: today, end: new Date(today.getTime() + 24 * 60 * 60 * 1000) };
            case 'settimana':
                const weekStart = new Date(today.getTime() - today.getDay() * 24 * 60 * 60 * 1000);
                return { start: weekStart, end: new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000) };
            case 'mese':
                const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
                return { start: monthStart, end: monthEnd };
            case 'anno':
                const yearStart = new Date(now.getFullYear(), 0, 1);
                const yearEnd = new Date(now.getFullYear() + 1, 0, 1);
                return { start: yearStart, end: yearEnd };
            default:
                return null;
        }
    }

    async applyFilters() {
        console.log('Applying filters with currentFilters:', this.currentFilters);

        try {
            // Costruisci l'URL con i parametri di ricerca
            const params = new URLSearchParams();

            if (this.currentFilters.search) {
                params.append('search', this.currentFilters.search);
            }

            if (this.currentFilters.author) {
                params.append('author', this.currentFilters.author);
            }

            if (this.currentFilters.dateRange) {
                params.append('dateFrom', this.currentFilters.dateRange.start.toISOString().split('T')[0]);
                params.append('dateTo', this.currentFilters.dateRange.end.toISOString().split('T')[0]);
            }

            // Limite per paginazione
            params.append('limit', '50');

            const url = `/api/notizie?${params.toString()}`;
            console.log('Fetching filtered news from:', url);

            const response = await fetch(url);
            if (!response.ok) throw new Error('Errore nella ricerca');

            const data = await response.json();
            this.filteredNews = data.notizie || [];
            console.log('Filtered results:', this.filteredNews.length, 'notizie');

            this.renderNews();
        } catch (error) {
            console.error('Errore nell\'applicazione dei filtri:', error);
            this.showError('Errore nella ricerca. Riprova più tardi.');
        }
    }

    updateActiveFilters() {
        const activeFiltersDiv = document.getElementById('activeFilters');
        activeFiltersDiv.innerHTML = '';

        if (this.currentFilters.search) {
            this.addFilterTag(`Ricerca: "${this.currentFilters.search}"`, 'search');
        }

        if (this.currentFilters.author) {
            this.addFilterTag(`Autore: ${this.currentFilters.author}`, 'author');
        }

        if (this.currentFilters.dateRange) {
            const dateStr = this.formatDateRange(this.currentFilters.dateRange);
            this.addFilterTag(`Data: ${dateStr}`, 'date');
        }
    }

    addFilterTag(text, type) {
        const tag = document.createElement('span');
        tag.className = 'filter-tag';
        tag.innerHTML = `${text} <span class="remove-filter" data-type="${type}">&times;</span>`;

        tag.querySelector('.remove-filter').addEventListener('click', () => {
            this.removeFilter(type);
        });

        document.getElementById('activeFilters').appendChild(tag);
    }

    removeFilter(type) {
        switch (type) {
            case 'search':
                document.getElementById('searchInput').value = '';
                this.currentFilters.search = '';
                document.getElementById('clearSearch').style.display = 'none';
                break;
            case 'author':
                document.getElementById('authorFilter').value = '';
                this.currentFilters.author = '';
                break;
            case 'date':
                document.getElementById('dateFilter').value = '';
                this.currentFilters.dateRange = null;
                document.getElementById('customDateRange').style.display = 'none';
                break;
        }
        this.applyFilters();
    }

    formatDateRange(range) {
        const formatDate = (date) => date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
        return `${formatDate(range.start)} - ${formatDate(range.end)}`;
    }

    async populateAuthorFilter() {
        try {
            // Ottieni tutti gli autori unici dall'API
            const response = await fetch('/api/notizie/authors');
            if (response.ok) {
                const data = await response.json();
                const authors = data.authors || [];
                const authorSelect = document.getElementById('authorFilter');

                // Aggiungi l'opzione "Tutti gli autori" se non presente
                if (authorSelect.querySelector('option[value=""]')) {
                    authorSelect.innerHTML = '<option value="">Tutti gli autori</option>';
                }

                authors.forEach(author => {
                    if (author && author.trim()) {
                        const option = document.createElement('option');
                        option.value = author;
                        option.textContent = author;
                        authorSelect.appendChild(option);
                    }
                });
            }
        } catch (error) {
            console.error('Errore nel caricamento degli autori:', error);
            // Fallback: usa gli autori delle notizie caricate
            const authors = [...new Set(this.allNews.map(n => n.autore).filter(a => a && a.trim()))];
            const authorSelect = document.getElementById('authorFilter');

            authors.forEach(author => {
                const option = document.createElement('option');
                option.value = author;
                option.textContent = author;
                authorSelect.appendChild(option);
            });
        }
    }

    renderNews() {
        console.log('Rendering news, filteredNews count:', this.filteredNews.length);
        const container = document.getElementById('notizieContainer');
        console.log('News container:', container);
        container.innerHTML = '';

        const newsToShow = this.filteredNews.slice(0, this.loadedNews);

        if (newsToShow.length === 0) {
            container.innerHTML = `
                <div class="no-news text-center">
                    <i class="bi bi-search display-1 text-muted mb-4"></i>
                    <h3 class="text-muted">Nessuna notizia trovata</h3>
                    <p class="text-muted">Prova a modificare i filtri di ricerca.</p>
                </div>
            `;
            this.hideLoadMoreButton();
            return;
        }

        newsToShow.forEach(notizia => {
            const article = this.createNewsCard(notizia);
            container.appendChild(article);
        });

        if (this.filteredNews.length > this.loadedNews) {
            this.showLoadMoreButton();
        } else {
            this.hideLoadMoreButton();
        }
        console.log('News rendered successfully');
    }

    createNewsCard(notizia) {
        const article = document.createElement('article');
        article.className = 'notizia-card animate__animated animate__fadeInUp';

        const imageUrl = notizia.immagine && notizia.immagine.url && notizia.immagine.url.trim() !== '' 
            ? notizia.immagine.url 
            : '/images/default-news.jpg';
        const dateStr = new Date(notizia.data_pubblicazione).toLocaleDateString('it-IT', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const excerpt = notizia.contenuto ? notizia.contenuto.replace(/<[^>]*>/g, '').substring(0, 120) + '...' : 'Nessuna descrizione';
        const linkId = notizia.id || notizia.N_id;

        article.innerHTML = `
            <div class="card-image">
                <img src="${imageUrl}" alt="${notizia.titolo}" class="card-img">
                <div class="card-overlay">
                    <span class="read-more-btn">
                        <i class="bi bi-eye"></i> Leggi
                    </span>
                </div>
            </div>
            <div class="card-content">
                <div class="card-meta">
                    <span class="date">
                        <i class="bi bi-calendar-event"></i> ${dateStr}
                    </span>
                </div>
                <h3 class="card-title">${notizia.titolo}</h3>
                <p class="card-excerpt">${excerpt}</p>
                <a href="/notizia/${linkId}" class="btn btn-primary read-full-btn">
                    <i class="bi bi-arrow-right me-2"></i>Leggi tutto
                </a>
            </div>
        `;

        return article;
    }

    async loadMoreNews() {
        if (this.isLoading) return;

        this.isLoading = true;
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        const originalText = loadMoreBtn.innerHTML;
        loadMoreBtn.innerHTML = '<i class="bi bi-arrow-clockwise"></i> Caricamento...';
        loadMoreBtn.disabled = true;

        try {
            // Simula caricamento con un delay per UX
            await new Promise(resolve => setTimeout(resolve, 500));

            this.loadedNews += this.newsPerLoad;
            this.renderNews();
        } catch (error) {
            console.error('Errore nel caricamento delle notizie:', error);
            this.showError('Errore nel caricamento delle notizie. Riprova più tardi.');
        } finally {
            this.isLoading = false;
            loadMoreBtn.innerHTML = originalText;
            loadMoreBtn.disabled = false;
        }
    }

    showLoadMoreButton() {
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (loadMoreBtn) {
            loadMoreBtn.style.display = 'inline-block';
        }
    }

    hideLoadMoreButton() {
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (loadMoreBtn) {
            loadMoreBtn.style.display = 'none';
        }
    }

    showError(message) {
        const container = document.getElementById('notizieContainer');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-danger text-center mt-3';
        errorDiv.innerHTML = `<i class="bi bi-exclamation-triangle"></i> ${message}`;
        container.appendChild(errorDiv);

        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }

    setupEmailFormListener() {
        // Implementazione semplificata del listener email
        const emailForm = document.querySelector('form[action*="/email"]');
        if (emailForm) {
            emailForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                // Logica di invio email qui
                console.log('Email form submitted');
            });
        }
    }
}

// Inizializza quando il DOM è pronto
document.addEventListener('DOMContentLoaded', () => {
    new NotizieManager();
});
