class ReviewsManager {
    constructor() {
        this.reviewsPerPage = 6;
        this.currentVisible = this.reviewsPerPage;
        this.reviews = document.querySelectorAll('.review-card');
        this.loadMoreBtn = document.getElementById('loadMoreBtn');
        this.init();
    }

    init() {
        // Nascondi tutte le recensioni tranne le prime 6
        this.reviews.forEach((review, idx) => {
            if (idx >= this.reviewsPerPage) {
                review.classList.add('d-none');
            }
        });

        if (this.loadMoreBtn) {
            this.loadMoreBtn.addEventListener('click', () => this.loadMoreReviews());
        }
    }

    loadMoreReviews() {
        let mostrati = 0;
        for (let i = this.currentVisible; i < this.reviews.length && mostrati < this.reviewsPerPage; i++) {
            this.reviews[i].classList.remove('d-none');
            mostrati++;
        }
        this.currentVisible += mostrati;
        // Il bottone resta sempre visibile
    }
}

document.addEventListener('DOMContentLoaded', () => new ReviewsManager());