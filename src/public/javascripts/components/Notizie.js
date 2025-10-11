import { setupEmailFormListener } from './send_email.js';

class Notizie {
    constructor(page) {
        this.page = page;
        this.loadedNews = 6; // Inizialmente caricate 6
        this.newsPerLoad = 6; // Carica 6 alla volta
        this.isLoading = false;
        this.init();
    }

    async init() {
        document.title = "Notizie";
        setupEmailFormListener();
        this.setupLoadMore();
    }

    setupLoadMore() {
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => this.loadMoreNews());
        }
    }

    async loadMoreNews() {
        if (this.isLoading) return;

        this.isLoading = true;
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        const originalText = loadMoreBtn.innerHTML;
        loadMoreBtn.innerHTML = '<i class="bi bi-arrow-clockwise"></i> Caricamento...';
        loadMoreBtn.disabled = true;

        try {
            const response = await fetch(`/api/notizie?offset=${this.loadedNews}&limit=${this.newsPerLoad}`);
            if (!response.ok) throw new Error('Errore nel caricamento');

            const data = await response.json();
            const newNews = data.notizie || [];

            if (newNews.length > 0) {
                this.appendNews(newNews);
                this.loadedNews += newNews.length;

                // Se non ci sono più notizie, nascondi il bottone
                if (newNews.length < this.newsPerLoad) {
                    loadMoreBtn.style.display = 'none';
                }
            } else {
                loadMoreBtn.style.display = 'none';
            }
        } catch (error) {
            console.error('Errore nel caricamento delle notizie:', error);
            // Mostra un messaggio di errore
            this.showError('Errore nel caricamento delle notizie. Riprova più tardi.');
        } finally {
            this.isLoading = false;
            loadMoreBtn.innerHTML = originalText;
            loadMoreBtn.disabled = false;
        }
    }

    appendNews(news) {
        const container = document.getElementById('notizieContainer');

        news.forEach(notizia => {
            const article = this.createNewsCard(notizia);
            container.appendChild(article);
        });
    }

    createNewsCard(notizia) {
        const article = document.createElement('article');
        article.className = 'notizia-card animate__animated animate__fadeInUp';

        const imageUrl = notizia.immagine && notizia.immagine.url ? notizia.immagine.url : '/images/default-news.jpg';
        const dateStr = new Date(notizia.data_pubblicazione).toLocaleDateString('it-IT', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const excerpt = notizia.contenuto.length > 120 ? notizia.contenuto.substring(0, 120) + '...' : notizia.contenuto;
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
                <a href="/notizia/${linkId}" class="read-full-link">
                    Leggi tutto <i class="bi bi-arrow-right"></i>
                </a>
            </div>
        `;

        return article;
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
}

export default Notizie;