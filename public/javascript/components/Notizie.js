

class Notizie{
    constructor(page,loadCSS){
        this.page=page;
        if(typeof(loadCSS)==='function') loadCSS();
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
            if (notizie.length === 0) {
                container.innerHTML = '<p class="no-news">Nessuna notizia disponibile.</p>';
            } else {
                notizie.forEach(notizia => {
                    const card = document.createElement('div');
                    card.className = 'notizia-card notizia-cliccabile';
                    card.innerHTML = `
                        <div class="notizia-img-wrap">
                            <img src="${notizia.immagine || 'images/default-news.jpg'}" alt="Immagine notizia" class="notizia-img" />
                        </div>
                        <div class="notizia-content">
                            <h2 class="notizia-titolo">${notizia.titolo}</h2>
                            <span class="notizia-data">${new Date(notizia.data).toLocaleDateString()}</span>
                            <p class="notizia-testo">${notizia.testo}</p>
                        </div>
                    `;
                    card.addEventListener('click', () => {
                        window.location.href = `/notizie/${notizia.id || notizia.N_id}`;
                    });
                    container.appendChild(card);
                });
            }
            this.page.innerHTML = '';
            this.page.appendChild(container);
    }
    async fetchNotizie(){
            try {
                const response = await fetch('/all');
                const data = await response.json();
                return data;
            } catch (error) {
                console.error('Errore fetch notizie:', error);
                return [];
            }
    }
}

export default Notizie;