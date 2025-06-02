// public/js/views/HomePage.js
import AbstractView from './AbstractView.js';

export default class HomePage extends AbstractView {
  constructor() {
    super();
    this.setTitle('ASD BorgoVercelli - Home');
  }
  
  async fetchData() {
    try {
      const [newsResponse, eventsResponse, reviewsResponse] = await Promise.all([
        fetch('/api/news'),
        fetch('/api/events'),
        fetch('/api/reviews')
      ]);
      
      return {
        news: await newsResponse.json(),
        events: await eventsResponse.json(),
        reviews: await reviewsResponse.json()
      };
    } catch (error) {
      console.error('Error fetching home page data:', error);
      throw error;
    }
  }
  
  renderCards(items) {
    return items.map(item => `
      <div class="col px-4">
        <div class="card h-100">
          <div class="card-img-container" style="height: 200px; overflow: hidden;">
            <img src="${item.image}" class="card-img-top" alt="${item.title}" style="object-fit: cover; height: 100%; width: 100%;">
          </div>
          <div class="card-body d-flex flex-column">
            <h5 class="card-title overflow-hidden">${item.title}</h5>
            <p class="card-text">${item.intro}</p>
            <div class="mt-auto">
              <div class="text-muted mb-2">${item.date}</div>
              <a href="#" class="btn btn-primary btn-sm">Leggi di più</a>
            </div>
          </div>
        </div>
      </div>
    `).join('');
  }
  
  renderReviews(reviews) {
    // First row with 3 reviews
    const firstRow = reviews.slice(0, 3).map(review => `
      <div class="col-md-4">
        <div class="review-card bg-white">
          <div class="review-content">
            <div class="review-stars">
              ${this.renderStars(review.stars)}
            </div>
            <p class="review-text">"${review.text}"</p>
            <div class="reviewer-info">
              <img src="${review.image}" alt="Reviewer" class="reviewer-image">
              <div>
                <p class="reviewer-name">${review.reviewer}</p>
                <p class="review-date">${review.date}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `).join('');
    
    // Second row with 2 reviews
    const secondRow = reviews.slice(3, 5).map(review => `
      <div class="col-md-6">
        <div class="review-card bg-white">
          <div class="review-content">
            <div class="review-stars">
              ${this.renderStars(review.stars)}
            </div>
            <p class="review-text">"${review.text}"</p>
            <div class="reviewer-info">
              <img src="${review.image}" alt="Reviewer" class="reviewer-image">
              <div>
                <p class="reviewer-name">${review.reviewer}</p>
                <p class="review-date">${review.date}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `).join('');
    
    return `
      <div class="row">
        ${firstRow}
      </div>
      <div class="row mt-4">
        ${secondRow}
      </div>
      <div class="row mt-4">
        <div class="col-12 text-center">
          <button class="btn btn-outline-primary rounded-pill px-4 py-2">Più Recesioni</button>
          <button class="btn btn-outline-primary rounded-pill px-4 py-2">Scrivi Recensione</button>
        </div>
      </div>
    `;
  }
  
  renderStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    let stars = '';
    
    // Add full stars
    for (let i = 0; i < fullStars; i++) {
      stars += '<i class="bi bi-star-fill text-warning"></i> ';
    }
    
    // Add half star if needed
    if (hasHalfStar) {
      stars += '<i class="bi bi-star-half text-warning"></i> ';
    }
    
    // Add empty stars
    for (let i = 0; i < emptyStars; i++) {
      stars += '<i class="bi bi-star text-warning"></i> ';
    }
    
    return stars;
  }
  
  async getHtml() {
    try {
      const { news, events, reviews } = await this.fetchData();
      
      return `
        <header class="header container-fluid d-flex flex-column justify-content-center align-items-center vh-100">
          <h1 class="title">Asd BorgoVercelli 2022</h1>
          <p>La società del futuro</p>
        </header>
        
        <!-- News Section -->
        <section class="vw-100">
          <div class="container mt-5"> 
            <h2 class="section-title">Notizie</h2>
            <div class="row row-cols-1 row-cols-md-3 g-5 mt-2">
              ${this.renderCards(news)}
            </div>
          </div>
        </section>
        
        <!-- Events Section -->
        <section class="vw-100">
          <div class="container mt-5"> 
            <h2 class="section-title">Eventi</h2>
            <div class="row row-cols-1 row-cols-md-3 g-5 mt-2">
              ${this.renderCards(events)}
            </div>
          </div>
        </section>
        
        <!-- Reviews Section -->
        <section class="reviews-section mt-5 py-5">
          <div class="container">
            <div class="row text-center">
              <div class="col-12">
                <h2 class="section-title">Recesioni della struttura</h2>
              </div>
            </div>
            ${this.renderReviews(reviews)}
          </div>
        </section>
      `;
    } catch (error) {
      return `
        <div class="container mt-5">
          <div class="alert alert-danger">
            <h4 class="alert-heading">Errore di caricamento</h4>
            <p>Non è stato possibile caricare i contenuti della homepage. Riprova più tardi.</p>
          </div>
        </div>
      `;
    }
  }
  
  afterRender() {
    // Any JS that needs to run after the page is rendered
    console.log('Home page rendered');
  }
}