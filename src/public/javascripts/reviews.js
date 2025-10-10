class Reviews {
    constructor() {
        this.allReviews = window.reviews || [];
        this.shownReviews = 6;
        this.reviewsContainer = document.getElementById('reviewsContainer');
        this.filterStars = document.getElementById('filterStars');
        this.loadMoreBtn = document.getElementById('loadMoreBtn');
        this.init();
    }

    init() {
        this.setupScrollButton();
        this.setupEventListeners();
        this.renderReviews();
    }

    setupScrollButton() {
        const scrollBtn = document.createElement('button');
        scrollBtn.textContent = '↑';
        scrollBtn.className = 'scroll-top-btn';
        scrollBtn.title = 'Torna su';
        document.body.appendChild(scrollBtn);

        const footer = document.getElementById('footer');
        const updateScrollBtnPosition = () => {
            const footerRect = footer.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            if (window.scrollY > 300) {
                scrollBtn.style.display = 'block';
            } else {
                scrollBtn.style.display = 'none';
            }
            let targetBottom = 40;
            if (footerRect.top < windowHeight) {
                const overlap = windowHeight - footerRect.top;
                targetBottom = overlap + 40;
            }
            scrollBtn.style.transition = 'bottom 0.3s cubic-bezier(.4,0,.2,1)';
            scrollBtn.style.bottom = targetBottom + 'px';
        };

        window.addEventListener('scroll', updateScrollBtnPosition);
        window.addEventListener('resize', updateScrollBtnPosition);
        scrollBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        updateScrollBtnPosition();
    }

    setupEventListeners() {
        if (this.filterStars) {
            this.filterStars.addEventListener('change', () => {
                this.shownReviews = 6;
                this.renderReviews();
            });
        }

        if (this.loadMoreBtn) {
            this.loadMoreBtn.addEventListener('click', () => {
                this.shownReviews += 6;
                this.renderReviews();
            });
        }
    }

    renderReviews() {
        if (!this.reviewsContainer) return;

        this.reviewsContainer.innerHTML = '';
        let filtered = this.allReviews;
        const selected = this.filterStars ? this.filterStars.value : 'all';
        if (selected !== 'all') {
            filtered = filtered.filter(r => String(r.valutazione) === selected);
        }
        filtered.slice(0, this.shownReviews).forEach(review => {
            const card = document.createElement('div');
            card.className = 'card mb-3 review-card';
            card.setAttribute('data-rating', review.valutazione);
            card.innerHTML = `
                <div class="card-body">
                    <h5 class="card-title overflow-hidden">${review.titolo}</h5>
                    <p class="card-text">${review.contenuto}</p>
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            ${[1,2,3,4,5].map(i => `<i class="bi ${i <= review.valutazione ? 'bi-star-fill' : 'bi-star'} text-warning"></i>`).join('')}
                        </div>
                        <small class="text-muted">${new Date(review.data_recensione).toLocaleDateString('it-IT')}</small>
                    </div>
                </div>
            `;
            this.reviewsContainer.appendChild(card);
        });
        if (this.loadMoreBtn) {
            this.loadMoreBtn.style.display = filtered.length > this.shownReviews ? 'inline-block' : 'none';
        }
    }
}

// Inizializza quando il DOM è pronto
document.addEventListener('DOMContentLoaded', () => {
    new Reviews();
});