// Search component for global search functionality

class Search {
  constructor() {
    this.currentQuery = '';
    this.init();
  }

  init() {
    // Wait for DOM to be fully ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.setupSearch();
      });
    } else {
      // DOM already loaded
      this.setupSearch();
    }
  }

  setupSearch() {
    if (this.initializeElements()) {
      this.bindEvents();
      this.handleInitialSearch();
    } else {
      // Retry after a short delay
      setTimeout(() => this.setupSearch(), 100);
    }
  }

  initializeElements() {
    this.resultsContainer = document.getElementById('results-container');
    this.loadingState = document.getElementById('loading-state');
    this.noResults = document.getElementById('no-results');

    return true;
  }

  bindEvents() {
    // Handle browser back/forward navigation - reload page for server-side rendering
    window.addEventListener('popstate', (e) => {
      if (e.state && e.state.query) {
        window.location.href = `/search?q=${encodeURIComponent(e.state.query)}`;
      }
    });
  }

  handleInitialSearch() {
    // Check if there's an initial query to search for
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q');
    
    // If there are already server-rendered results, don't do AJAX search
    const hasServerResults = document.querySelector('.results-section') !== null;
    
    if (query && query.trim().length >= 1 && !hasServerResults) {
      this.performSearch(query.trim());
    }
  }

  updateURL(query) {
    const url = new URL(window.location);
    url.searchParams.set('q', query);
    window.history.pushState({ query }, '', url);
  }

  async performSearch(query) {
    if (!query || query.length < 1) return;

    this.currentQuery = query;
    this.showLoading();

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error('Errore nella ricerca');
      }

      const data = await response.json();
      this.displayResults(data, query);
    } catch (error) {
      console.error('Search error:', error);
      this.showError();
    }
  }

  showLoading() {
    this.resultsContainer.innerHTML = '';
    this.loadingState.classList.remove('d-none');
    this.noResults.classList.add('d-none');
  }

  showError() {
    this.loadingState.classList.add('d-none');
    this.noResults.classList.remove('d-none');
    this.noResults.innerHTML = `
      <i class="fas fa-exclamation-triangle fa-4x text-danger mb-4"></i>
      <h3 class="text-danger">Errore nella ricerca</h3>
      <p class="text-muted">Si è verificato un errore. Riprova più tardi.</p>
    `;
  }

  displayResults(data, query) {
    this.loadingState.classList.add('d-none');

    const hasResults = this.hasAnyResults(data);

    if (!hasResults) {
      this.showNoResults(query);
      return;
    }

    const resultsHTML = this.buildResultsHTML(data, query);
    this.resultsContainer.innerHTML = resultsHTML;

    // Add animation to results
    this.animateResults();
  }

  hasAnyResults(data) {
    return (data.notizie && data.notizie.length > 0) ||
           (data.eventi && data.eventi.length > 0) ||
           (data.squadre && data.squadre.length > 0) ||
           (data.campi && data.campi.length > 0);
  }

  showNoResults(query) {
    this.noResults.classList.remove('d-none');
    this.noResults.innerHTML = `
      <i class="fas fa-search fa-4x text-muted mb-4"></i>
      <h3 class="text-muted">Nessun risultato trovato</h3>
      <p class="text-muted">Non abbiamo trovato risultati per "<strong>${this.escapeHtml(query)}</strong>"</p>
      <p class="text-muted">Prova con termini di ricerca diversi o più generici</p>
    `;
  }

  buildResultsHTML(data, query) {
    let html = '';

    // Notizie
    if (data.notizie && data.notizie.length > 0) {
      html += this.buildSectionHTML('notizie', 'Notizie', data.notizie, query, 'newspaper', 'notizia');
    }

    // Eventi
    if (data.eventi && data.eventi.length > 0) {
      html += this.buildSectionHTML('eventi', 'Eventi', data.eventi, query, 'calendar-alt', 'evento');
    }

    // Squadre
    if (data.squadre && data.squadre.length > 0) {
      html += this.buildSectionHTML('squadre', 'Squadre', data.squadre, query, 'users', 'squadra');
    }

    // Campi
    if (data.campi && data.campi.length > 0) {
      html += this.buildSectionHTML('campi', 'Campi', data.campi, query, 'map-marker-alt', 'campo');
    }

    return html;
  }

  buildSectionHTML(type, title, items, query, icon, itemType) {
    let html = `
      <div class="results-section">
        <h2><i class="fas fa-${icon} me-2"></i>${title}</h2>
        <div class="row">
    `;

    items.forEach(item => {
      html += this.buildResultCard(item, query, itemType);
    });

    html += `
        </div>
      </div>
    `;

    return html;
  }

  buildResultCard(item, query, type) {
    const title = this.getItemTitle(item, type);
    const description = this.getItemDescription(item, type);
    const image = this.getItemImage(item, type);
    const link = this.getItemLink(item, type);
    const meta = this.getItemMeta(item, type);

    return `
      <div class="col-12 col-md-6 col-lg-4">
        <div class="result-card">
          <div class="card-img-container">
            <img src="${this.escapeHtml(image)}" alt="${this.escapeHtml(title)}" loading="lazy">
            <div class="result-category">
              <i class="fas fa-tag me-1"></i>${type}
            </div>
          </div>
          <div class="card-body">
            <h5 class="card-title">${this.highlightText(title, query)}</h5>
            <p class="card-text">${this.highlightText(description, query)}</p>
            <div class="result-meta">
              ${meta}
            </div>
            <a href="${this.escapeHtml(link)}" class="btn btn-primary btn-sm mt-3">
              <i class="fas fa-eye me-1"></i>Vedi dettagli
            </a>
          </div>
        </div>
      </div>
    `;
  }

  getItemTitle(item, type) {
    switch (type) {
      case 'notizia': return item.titolo || 'Notizia';
      case 'evento': return item.titolo || 'Evento';
      case 'squadra': return item.nome || 'Squadra';
      case 'campo': return item.nome || 'Campo';
      default: return 'Elemento';
    }
  }

  getItemDescription(item, type) {
    switch (type) {
      case 'notizia': return item.sottotitolo || item.titolo || 'Nessuna descrizione';
      case 'evento': return item.descrizione ? item.descrizione.substring(0, 150) + '...' : 'Nessuna descrizione';
      case 'squadra': return `Squadra dell'anno ${item.Anno || 'N/A'}`;
      case 'campo': return item.descrizione || item.indirizzo || 'Nessuna descrizione';
      default: return 'Nessuna descrizione';
    }
  }

  getItemImage(item, type) {
    switch (type) {
      case 'notizia':
        // Prima controlla se c'è un'immagine nel database
        if (item.immagine?.url && item.immagine.url !== '/images/default-news.jpg') {
          return item.immagine.url;
        }
        return '/images/Campo.png';
      case 'evento':
        // Gli eventi potrebbero avere immagini in futuro
        return '/images/Campo.png';
      case 'squadra':
        // Le squadre potrebbero avere immagini in futuro
        return '/images/Logo.png';
      case 'campo':
        // Controlla se c'è un'immagine nel database
        if (item.immagine && item.immagine !== '/images/campo-default.jpg') {
          return item.immagine;
        }
        return '/images/campo-default.jpg';
      default: return '/images/Campo.jpg';
    }
  }

  getItemLink(item, type) {
    switch (type) {
      case 'notizia': return `/notizia/${item.id}`;
      case 'evento': return `/evento/${item.id}`;
      case 'squadra': return `/squadre`;
      case 'campo': return `/prenotazione`;
      default: return '#';
    }
  }

  getItemMeta(item, type) {
    switch (type) {
      case 'notizia':
        return `<i class="fas fa-user"></i> ${this.escapeHtml(item.autore || 'Redazione')} <i class="fas fa-calendar ms-3"></i> ${this.formatDate(item.data_pubblicazione)}`;
      case 'evento':
        return `<i class="fas fa-map-marker-alt"></i> ${this.escapeHtml(item.luogo || 'Luogo non specificato')} <i class="fas fa-calendar ms-3"></i> ${this.formatDate(item.data_inizio)}`;
      case 'squadra':
        return `<i class="fas fa-calendar"></i> Anno ${item.Anno || 'N/A'}`;
      case 'campo':
        return `<i class="fas fa-map-marker-alt"></i> ${this.escapeHtml(item.indirizzo || 'Indirizzo non disponibile')}`;
      default:
        return '';
    }
  }

  formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('it-IT');
    } catch {
      return dateString;
    }
  }

  highlightText(text, query) {
    if (!text || !query) return this.escapeHtml(text || '');
    const escapedQuery = this.escapeRegex(query);
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    return this.escapeHtml(text).replace(regex, '<mark>$1</mark>');
  }

  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  animateResults() {
    const cards = document.querySelectorAll('.result-card');
    cards.forEach((card, index) => {
      card.style.opacity = '0';
      setTimeout(() => {
        card.style.transition = 'opacity 0.2s ease';
        card.style.opacity = '1';
      }, index * 30);
    });
  }
}

// Make Search available globally
window.Search = Search;