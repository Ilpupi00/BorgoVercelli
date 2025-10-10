class Notizie{
    constructor(page){
        this.page=page;
        this.init();
    }

    async init(){
        document.title = "Notizie";
        await this.render();
    }

    async render(){
        const notizie = await this.fetchNotizie();
        const container = document.createElement('div');
        container.className = 'notizie-container';
        this.page.innerHTML = '<h1 class="text-center my-4 overflow-hidden">Tutte le notizie</h1>';
        this.page.appendChild(container);

        let shown = 9;
        function renderCards() {
            container.innerHTML = '';
            if (notizie.length === 0) {
                container.innerHTML = '<p class="no-news">Nessuna notizia disponibile.</p>';
                return;
            }
            notizie.slice(0, shown).forEach(notizia => {
                const card = document.createElement('div');
                card.className = 'notizia-card notizia-cliccabile';
                card.innerHTML = `
                    <div class="notizia-img-wrap">
                        <img src="${notizia.immagine && notizia.immagine.url ? notizia.immagine.url : '/images/default-news.jpg'}" alt="Immagine notizia" class="notizia-img" />
                    </div>
                    <div class="notizia-content">
                        <h2 class="notizia-titolo">${notizia.titolo}</h2>
                        <span class="notizia-data">${new Date(notizia.data_pubblicazione).toLocaleDateString()}</span>
                        <p class="notizia-testo">${notizia.contenuto}</p>
                    </div>
                `;
                card.addEventListener('click', () => {
                    window.location.href = `/notizie/${notizia.id || notizia.N_id}`;
                });
                container.appendChild(card);
            });
        }

        renderCards();

        // Bottone per caricare altre notizie
        if (notizie.length > shown) {
            const loadMoreBtn = document.createElement('button');
            loadMoreBtn.textContent = 'Carica altre notizie';
            loadMoreBtn.className = 'btn btn-primary d-block mx-auto my-4';
            loadMoreBtn.addEventListener('click', () => {
                shown += 9;
                renderCards();
                if (shown >= notizie.length) {
                    loadMoreBtn.style.display = 'none';
                }
            });
            this.page.appendChild(loadMoreBtn);
        }

    // Bottone "Torna su" sticky animato
    const scrollBtn = document.createElement('button');
    scrollBtn.textContent = '↑';
    scrollBtn.className = 'scroll-top-btn';
    scrollBtn.title = 'Torna su';
    document.body.appendChild(scrollBtn);

    const footer = document.getElementById('footer');
    function updateScrollBtnPosition() {
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
    }
    window.addEventListener('scroll', updateScrollBtnPosition);
    window.addEventListener('resize', updateScrollBtnPosition);
    scrollBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    updateScrollBtnPosition();
    }
    async fetchNotizie(){
            try {
                const response = await fetch('/all');
                const data = await response.json();
                console.log(data[0].immagine);
                return data;
            } catch (error) {
                console.error('Errore fetch notizie:', error);
                return [];
            }
    }
}

export default Notizie;