class ReviewsManager {
    constructor() {
        this.reviews = [];
        this.currentPage = 1;
        this.reviewsPerPage = 5;
        this.filterValue = 'all';

        this.loadMoreBtn = document.getElementById('loadMoreBtn');
        this.filterStars = document.getElementById('filterStars');
        this.reviewsContainer = document.getElementById('reviewsContainer');

        this.setupEventListeners();
    }

    async init() {
        await this.fetchReviews();
        this.renderRatingBars();
        this.renderReviews();
    }

    async fetchReviews() {
        try {
            const response = await fetch('/api/reviews');
            this.reviews = await response.json();
        } catch (error) {
            console.error('Error fetching reviews:', error);
        }
    }

    renderRatingBars() {
        const ratingCounts = this.reviews.reduce((acc, review) => {
            acc[review.rating] = (acc[review.rating] || 0) + 1;
            return acc;
        }, {});

        const totalReviews = this.reviews.length;
        const ratingBarsHtml = [5, 4, 3, 2, 1].map(stars => {
            const count = ratingCounts[stars] || 0;
            const percentage = (count / totalReviews) * 100;
            return `
                <div class="rating-bar d-flex align-items-center mb-2">
                    <span class="me-2">${stars} <i class="bi bi-star-fill text-warning"></i></span>
                    <div class="progress flex-grow-1">
                        <div class="progress-bar bg-warning" role="progressbar" style="width: ${percentage}%" aria-valuenow="${percentage}" aria-valuemin="0" aria-valuemax="100"></div>
                    </div>
                    <span class="ms-2">${count}</span>
                </div>
            `;
        }).join('');

        document.getElementById('ratingBars').innerHTML = ratingBarsHtml;
    }

    renderReviews() {
        let filteredReviews = this.filterValue === 'all' 
            ? this.reviews 
            : this.reviews.filter(review => review.rating === parseInt(this.filterValue));

        const reviewsToShow = filteredReviews.slice(0, this.currentPage * this.reviewsPerPage);

        const reviewsHtml = reviewsToShow.map(review => `
            <div class="card mb-3 review-card" data-rating="${review.rating}">
                <div class="card-body">
                    <h5 class="card-title">${review.title}</h5>
                    <p class="card-text">${review.content}</p>
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            ${this.getStarRating(review.rating)}
                        </div>
                        <small class="text-muted">${review.date}</small>
                    </div>
                </div>
            </div>
        `).join('');

        this.reviewsContainer.innerHTML = reviewsHtml;
        this.updateLoadMoreButton();
    }

    getStarRating(rating) {
        return Array(5).fill().map((_, index) => 
            `<i class="bi ${index < rating ? 'bi-star-fill' : 'bi-star'} text-warning"></i>`
        ).join('');
    }

    setupEventListeners() {
        this.filterStars.addEventListener('change', () => this.filterReviews());
        this.loadMoreBtn.addEventListener('click', () => this.loadMoreReviews());
    }

    filterReviews() {
        const filterValue = this.filterStars.value;
        const reviews = this.reviewsContainer.querySelectorAll('.review-card');
        
        reviews.forEach(review => {
            if (filterValue === 'all' || review.dataset.rating === filterValue) {
                review.style.display = '';
            } else {
                review.style.display = 'none';
            }
        });

        this.updateLoadMoreButton();
    }

    loadMoreReviews() {
        // Implementa la logica per caricare più recensioni dal server
        // Questo potrebbe coinvolgere una chiamata AJAX al server per ottenere più recensioni
        console.log('Carica altre recensioni');
    }

    updateLoadMoreButton() {
        const visibleReviews = this.reviewsContainer.querySelectorAll('.review-card:not([style*="display: none"])');
        this.loadMoreBtn.style.display = visibleReviews.length >= this.reviewsPerPage ? 'block' : 'none';
    }
}

document.addEventListener('DOMContentLoaded', () => new ReviewsManager());