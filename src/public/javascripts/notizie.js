// notizie.js - Gestione OOP della pagina notizie con ricerca e filtri
// Basato sulla struttura di EventiManager

class NotizieManager {
    constructor(container) {
        this.container = container;
        this.newsGrid = document.getElementById('newsGrid');
        this.authorFilter = document.getElementById('authorFilter');
        this.dateFilter = document.getElementById('dateFilter');
        this.clearFiltersBtn = document.getElementById('clearFilters');
        this.loadMoreBtn = document.getElementById('loadMoreBtn');
        this.loadingSpinner = document.getElementById('loadingSpinner');
        this.noResults = document.getElementById('noResults');

        this.currentPage = 1;
        this.isLoading = false;
        this.hasMoreNews = true;
        this.allNews = [];
        this.filteredNews = [];
        this.allNewsLoaded = false;
        this.initialDataLoaded = false;

        this.init();
    }

    // Helper function to parse Italian date strings
    parseItalianDate(dateString) {
        // Italian months mapping
        const months = {
            'gennaio': 0, 'febbraio': 1, 'marzo': 2, 'aprile': 3, 'maggio': 4, 'giugno': 5,
            'luglio': 6, 'agosto': 7, 'settembre': 8, 'ottobre': 9, 'novembre': 10, 'dicembre': 11
        };

        // Match pattern: "DD mese YYYY" (e.g., "20 ottobre 2025")
        const match = dateString.match(/^(\d{1,2})\s+(\w+)\s+(\d{4})$/);
        if (!match) {
            console.warn('Invalid date format:', dateString);
            return new Date(); // Return current date as fallback
        }

        const [, day, monthName, year] = match;
        const month = months[monthName.toLowerCase()];

        if (month === undefined) {
            console.warn('Unknown month:', monthName);
            return new Date(); // Return current date as fallback
        }

        return new Date(parseInt(year), month, parseInt(day));
    }

    init() {
        this.extractNewsFromDOM();
        this.setupEventListeners();
        this.populateAuthorFilter();
        this.checkForMoreNews();
        // Non caricare automaticamente le notizie - usa il rendering lato server
        // this.loadNews();
    }

    extractNewsFromDOM() {
        // Estrai le notizie già renderizzate lato server dal DOM
        const newsCards = this.newsGrid.querySelectorAll('.notizia-card');
        this.allNews = [];
        this.filteredNews = [];

        newsCards.forEach((card, index) => {
            const img = card.querySelector('img');
            const title = card.querySelector('.card-title');
            const excerpt = card.querySelector('.card-excerpt');
            const dateElement = card.querySelector('.date');
            const link = card.querySelector('.read-full-btn');

            if (title && dateElement && link) {
                // Estrai l'ID dalla URL del link
                const linkHref = link.getAttribute('href');
                const idMatch = linkHref.match(/\/notizia\/(\d+)/);
                const id = idMatch ? parseInt(idMatch[1]) : null;

                // Estrai la data dal testo
                const dateText = dateElement.textContent.replace(/📅|📅/g, '').trim();
                const newsDate = this.parseItalianDate(dateText);

                // Estrai l'autore dal contenuto o usa un valore di default
                // Nota: l'autore non è mostrato nel DOM, dovremo caricarlo dopo se necessario
                const autore = 'Redazione'; // Valore di default, sarà aggiornato quando necessario

                const newsItem = {
                    id: id,
                    titolo: title.textContent.trim(),
                    contenuto: excerpt.textContent.trim(),
                    data_pubblicazione: newsDate.toISOString(),
                    autore: autore,
                    immagine: {
                        url: img ? img.src : '/images/default-news.jpg'
                    }
                };

                this.allNews.push(newsItem);
            }
        });

        this.filteredNews = [...this.allNews];
        console.log('📄 Estratte', this.allNews.length, 'notizie dal DOM');
    }

    setupEventListeners() {
        // Filter changes
        this.authorFilter.addEventListener('change', () => this.handleFilters());
        this.dateFilter.addEventListener('change', () => this.handleFilters());

        // Clear filters
        this.clearFiltersBtn.addEventListener('click', () => this.clearFilters());

        // Load more button
        if (this.loadMoreBtn) {
            this.loadMoreBtn.addEventListener('click', () => this.loadMoreNews());
        }

        // Infinite scroll
        window.addEventListener('scroll', () => this.handleScroll());
    }

    async checkForMoreNews() {
        try {
            let totalNews = 0;

            if (this.allNewsLoaded) {
                // Usa i dati già caricati
                totalNews = this.allNews.length;
                console.log('Controllo notizie aggiuntive: usando dati già caricati,', totalNews, 'notizie totali');
            } else if (this.initialDataLoaded) {
                // Usa i dati caricati da populateAuthorFilter
                totalNews = this.allNews.length;
                console.log('Controllo notizie aggiuntive: usando dati iniziali,', totalNews, 'notizie totali');
            } else {
                // Carica dalla API
                const response = await fetch('/api/notizie');
                const data = await response.json();
                const news = data.notizie || [];
                totalNews = news.length;
                this.initialDataLoaded = true; // Marca che abbiamo caricato i dati iniziali
                console.log('Controllo notizie aggiuntive: trovate', totalNews, 'notizie totali dalla API');
            }

            // Se ci sono più di 6 notizie, mostra il bottone "carica altri"
            if (totalNews > 6) {
                this.hasMoreNews = true;
            } else {
                this.hasMoreNews = false;
            }

            this.updateLoadMoreButton();
        } catch (error) {
            console.error('Errore nel controllo notizie aggiuntive:', error);
        }
    }

    async loadAllNews() {
        try {
            const response = await fetch('/api/notizie');
            const data = await response.json();
            const newsFromApi = data.notizie || [];

            // Aggiorna this.allNews con i dati completi dalla API
            this.allNews = newsFromApi.map(apiNews => {
                // Cerca se abbiamo già questa notizia nel DOM
                const existingNews = this.allNews.find(n => (n.id || n.N_id) == (apiNews.id || apiNews.N_id));
                if (existingNews) {
                    // Mantieni i dati esistenti ma aggiorna con quelli dalla API
                    return { ...existingNews, ...apiNews };
                } else {
                    // È una nuova notizia dalla API
                    return apiNews;
                }
            });

            this.allNewsLoaded = true;
            console.log('📥 Caricate', this.allNews.length, 'notizie totali');
        } catch (error) {
            console.error('Errore nel caricamento di tutte le notizie:', error);
            this.allNews = [];
        }
    }

    // Funzione rimossa - non utilizzata
    // async loadNews() { ... }

    async loadMoreNews() {
        console.log('🔄 loadMoreNews chiamato');
        if (this.isLoading || !this.hasMoreNews) {
            console.log('❌ Rifiutato: isLoading=', this.isLoading, 'hasMoreNews=', this.hasMoreNews);
            return;
        }

        this.isLoading = true;
        this.showLoading();

        try {
            // Se non abbiamo ancora caricato tutte le notizie, caricale prima
            if (!this.allNewsLoaded) {
                console.log('📥 Caricamento tutte le notizie...');
                await this.loadAllNews();
                // Riapplica i filtri dopo aver caricato
                this.doApplyFilters();
            }

            // Conta quante notizie sono già mostrate (escludi eventuali duplicati)
            const existingCards = this.newsGrid.querySelectorAll('.notizia-card');
            const existingIds = new Set();
            existingCards.forEach(card => {
                const link = card.querySelector('.read-full-btn');
                if (link) {
                    const href = link.getAttribute('href');
                    const idMatch = href.match(/\/notizia\/(\d+)/);
                    if (idMatch) {
                        existingIds.add(parseInt(idMatch[1]));
                    }
                }
            });

            console.log('📊 Notizie esistenti nel DOM:', existingIds.size, 'IDs:', Array.from(existingIds));

            // Trova le notizie filtrate che non sono ancora nel DOM
            const newsToAdd = this.filteredNews.filter(news => {
                const newsId = news.id || news.N_id;
                return newsId && !existingIds.has(newsId);
            });

            console.log('✅ Notizie filtrate totali:', this.filteredNews.length);
            console.log('➕ Notizie da aggiungere:', newsToAdd.length);

            if (newsToAdd.length === 0) {
                this.hasMoreNews = false;
                this.loadMoreBtn.classList.add('d-none');
                console.log('🏁 Nessuna nuova notizia da mostrare');
                return;
            }

            // Prendi il prossimo batch (max 6)
            const nextBatch = newsToAdd.slice(0, 6);
            console.log('📦 Batch da aggiungere:', nextBatch.length, 'notizie');

            // Ottieni il template per creare le carte notizia
            const template = document.getElementById('newsCardTemplate');
            console.log('🎨 Template trovato:', !!template);

            // Aggiungi le notizie al container
            nextBatch.forEach((news, index) => {
                const newsCard = this.createNewsCard(news, template, existingIds.size + index);
                this.newsGrid.appendChild(newsCard);
                console.log('➕ Aggiunta notizia:', news.titolo, '(ID:', news.id || news.N_id, ')');
            });

            // Controlla se ci sono ancora notizie filtrate da mostrare
            const remainingNews = newsToAdd.length - nextBatch.length;
            if (remainingNews <= 0) {
                this.hasMoreNews = false;
                console.log('🏁 Nessuna altra notizia da mostrare, nascondo pulsante');
            } else {
                console.log('⏭️ Rimangono ancora', remainingNews, 'notizie da mostrare');
            }

            this.updateLoadMoreButton();

        } catch (error) {
            console.error('❌ Errore nel caricamento di più notizie:', error);
        } finally {
            this.hideLoading();
            this.isLoading = false;
        }
    }

    handleFilters() {
        // Auto-apply filters when select changes
        this.applyFilters();
    }

    applyFilters() {
        // Se abbiamo già caricato tutte le notizie, applichiamo direttamente i filtri
        if (this.allNewsLoaded) {
            this.doApplyFilters();
        } else {
            // Carica tutte le notizie prima di applicare i filtri
            this.loadAllNews().then(() => {
                this.doApplyFilters();
            });
        }
    }

    doApplyFilters() {
        const selectedAuthor = this.authorFilter.value;
        const selectedDate = this.dateFilter.value;

        console.log('🔍 Applicando filtri - Autore selezionato:', selectedAuthor, 'Data selezionata:', selectedDate);
        console.log('📊 Notizie totali da filtrare:', this.allNews.length);

        this.filteredNews = this.allNews.filter(news => {
            // Author filter
            const matchesAuthor = !selectedAuthor || news.autore === selectedAuthor;
            // Date filter
            const matchesDate = this.matchesDateFilter(news, selectedDate);

            if (!matchesAuthor) {
                console.log('❌ Notizia esclusa per autore:', news.titolo, '- Autore notizia:', news.autore, '- Autore selezionato:', selectedAuthor);
            }
            if (!matchesDate) {
                console.log('❌ Notizia esclusa per data:', news.titolo, '- Data notizia:', news.data_pubblicazione);
            }

            return matchesAuthor && matchesDate;
        });

        console.log('✅ Notizie filtrate:', this.filteredNews.length);

        this.currentPage = 1;
        this.hasMoreNews = this.filteredNews.length > 6; // Initial 6 are shown
        this.renderNewsList(this.filteredNews.slice(0, 6), true);
        this.updateLoadMoreButton();
    }

    matchesDateFilter(news, filter) {
        if (!filter) return true;

        const newsDate = new Date(news.data_pubblicazione);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        const weekFromNow = new Date(today);
        weekFromNow.setDate(today.getDate() + 7);

        const monthFromNow = new Date(today);
        monthFromNow.setMonth(today.getMonth() + 1);

        switch (filter) {
            case 'oggi':
                return newsDate.toDateString() === today.toDateString();
            case 'settimana':
                return newsDate >= today && newsDate <= weekFromNow;
            case 'mese':
                return newsDate >= today && newsDate <= monthFromNow;
            case 'anno':
                const yearStart = new Date(today.getFullYear(), 0, 1);
                const yearEnd = new Date(today.getFullYear() + 1, 0, 1);
                return newsDate >= yearStart && newsDate <= yearEnd;
            default:
                return true;
        }
    }

    async populateAuthorFilter() {
        try {
            let news = [];

            // Se abbiamo già caricato tutte le notizie, usale
            if (this.allNewsLoaded && this.allNews.length > 0) {
                console.log('📋 Usando notizie già caricate per gli autori');
                news = this.allNews;
            } else {
                // Altrimenti carica dalla API
                console.log('📥 Caricando notizie per gli autori dalla API');
                const response = await fetch('/api/notizie');
                if (response.ok) {
                    const data = await response.json();
                    news = data.notizie || [];
                    // Salva i dati anche in allNews per usi futuri
                    this.allNews = news;
                    this.initialDataLoaded = true; // Marca che abbiamo caricato i dati iniziali
                } else {
                    console.error('Errore nel caricamento degli autori: risposta non ok');
                    return;
                }
            }

            const authors = [...new Set(news.map(n => n.autore).filter(a => a && a.trim() && a !== 'Redazione'))];
            console.log('Autori trovati:', authors);
            this.updateAuthorSelect(authors);

            // Aggiorna anche le notizie esistenti con gli autori corretti
            if (this.allNews && this.allNews.length > 0) {
                this.allNews.forEach((newsItem, index) => {
                    const apiNews = news.find(n => n.id == newsItem.id || n.N_id == newsItem.id);
                    if (apiNews && apiNews.autore && apiNews.autore.trim() && apiNews.autore !== 'Redazione') {
                        this.allNews[index].autore = apiNews.autore;
                        console.log(`Aggiornato autore per notizia ${newsItem.id}: ${apiNews.autore}`);
                    }
                });
                this.filteredNews = [...this.allNews];
            }
        } catch (error) {
            console.error('Errore nel caricamento degli autori:', error);
        }
    }

    updateAuthorSelect(authors) {
        const authorSelect = document.getElementById('authorFilter');
        // Rimuovi le opzioni esistenti tranne "Tutti gli autori"
        while (authorSelect.children.length > 1) {
            authorSelect.removeChild(authorSelect.lastChild);
        }

        authors.forEach(author => {
            const option = document.createElement('option');
            option.value = author;
            option.textContent = author;
            authorSelect.appendChild(option);
        });
    }

    clearFilters() {
        this.authorFilter.value = '';
        this.dateFilter.value = '';
        // Se abbiamo già caricato tutte le notizie, applichiamo direttamente i filtri
        if (this.allNewsLoaded) {
            this.doApplyFilters();
        } else {
            // Carica tutte le notizie prima di applicare i filtri
            this.loadAllNews().then(() => {
                this.doApplyFilters();
            });
        }
    }

    renderNewsList(newsList, clearGrid = true) {
        if (clearGrid) {
            this.newsGrid.innerHTML = '';
        }

        if (newsList.length === 0) {
            this.showNoResults();
            return;
        }

        this.hideNoResults();

        const template = document.getElementById('newsCardTemplate');
        const fragment = document.createDocumentFragment();

        newsList.forEach((newsItem, index) => {
            const newsCard = this.createNewsCard(newsItem, template, index);
            fragment.appendChild(newsCard);
        });

        this.newsGrid.appendChild(fragment);
    }

    updateLoadMoreButton() {
        if (!this.loadMoreBtn) return;

        const shouldShow = this.hasMoreNews && this.filteredNews.length > 6;
        if (shouldShow) {
            this.loadMoreBtn.classList.remove('d-none');
        } else {
            this.loadMoreBtn.classList.add('d-none');
        }
    }

    createNewsCard(news, template, index) {
        const cardClone = template.content.cloneNode(true);
        const card = cardClone.querySelector('.col-12');

        // Set animation delay
        card.style.setProperty('--index', index);

        // Image
        const img = card.querySelector('img');
        const imageUrl = news.immagine && news.immagine.url && news.immagine.url.trim() !== ''
            ? news.immagine.url
            : '/images/default-news.jpg';
        img.src = imageUrl;
        img.alt = news.titolo;

        // Date
        const dateElement = card.querySelector('.date');
        const newsDate = new Date(news.data_pubblicazione);
        const dateString = newsDate.toLocaleDateString('it-IT', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        dateElement.innerHTML = `<i class="bi bi-calendar-event"></i> ${dateString}`;

        // Title
        const title = card.querySelector('.card-title');
        title.textContent = news.titolo;

        // Description (excerpt)
        const description = card.querySelector('.card-excerpt');
        const excerpt = news.contenuto ? this.stripHtml(news.contenuto).substring(0, 120) + '...' : 'Nessuna descrizione';
        description.textContent = excerpt;

        // Link
        const link = card.querySelector('.read-full-btn');
        const linkId = news.id || news.N_id;
        link.href = `/notizia/${linkId}`;

        return card;
    }

    stripHtml(html) {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    }

    handleScroll() {
        if (this.isLoading || !this.hasMoreNews) return;

        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;

        // Load more when user is near bottom (100px threshold)
        if (scrollTop + windowHeight >= documentHeight - 100) {
            this.loadMoreNews();
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
        this.newsGrid.innerHTML = '';
        this.hasMoreNews = false;
        this.updateLoadMoreButton();
    }

    hideNoResults() {
        this.noResults.classList.add('d-none');
    }

    showError(message) {
        console.error('Errore NotizieManager:', message);

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
export default NotizieManager;
// Inizializza quando il DOM è pronto
document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('.notizie-section') || document.body;
    new NotizieManager(container);
});


