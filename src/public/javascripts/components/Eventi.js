

class Eventi{
    constructor(page){
        this.page=page;
        this.init();
    }

    async init(){
        document.title = "Eventi";
        await this.render();
    }

    async render(){
        const eventi = await this.fetchEventi();
        const container = document.createElement('div');
        container.className = 'eventi-container';
        this.page.innerHTML = '<h1 class="text-center my-4 overflow-hidden">Tutti gli eventi</h1>';
        this.page.appendChild(container);

        let show=9;

        this.renderCards(show,eventi,container);

        if(eventi.length>show){
            const loadMoreBtn = document.createElement('button');
            loadMoreBtn.textContent = 'Carica altri eventi';
            loadMoreBtn.className = 'btn btn-primary d-block mx-auto my-4';
            loadMoreBtn.addEventListener('click',()=>{
                show+=9;
                this.renderCards(show,eventi,container);
                if(show>=eventi.length){
                    loadMoreBtn.style.display='none';
                }
            });
            this.page.appendChild(loadMoreBtn);
        }
        await this.caricaBotttoneScrollTop();
    }
    

    async renderCards(show,eventi,container){
        container.innerHTML = '';
        if(eventi.length===0){
            container.innerHTML = '<p class="no-events">Nessun evento disponibile.</p>';
            return;
        }
        eventi.slice(0,show).forEach(evento=>{
        const card = document.createElement('div');
        card.className = 'evento-card evento-cliccabile';
        card.innerHTML = `
            <div class="evento-img-wrap">
                <img src="${evento.immagine && evento.immagine.url ? evento.immagine.url : '/images/default-news.jpg'}" alt="Immagine evento" class="evento-img" />
            </div>
            <div class="evento-content">
                <h2 class="evento-titolo">${evento.titolo}</h2>
                <span class="evento-data">${new Date(evento.data_inizio).toLocaleDateString()}</span>
                <p class="evento-descrizione">${evento.descrizione}</p>
            </div>
        `;
        card.addEventListener('click',()=>{
            window.location.href=`/eventi/${evento.id || evento.E_id}`;
        });
        container.appendChild(card);
        });
    }

    async fetchEventi(){
        try{
            const response = await fetch('/eventi');
            if(!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            return data;
        }catch(error){
            console.error('Fetch error:',error);
            return [];
        }
    }

    async caricaBotttoneScrollTop(){
        const scrollBtn = document.createElement('button');
        scrollBtn.textContent = '↑';
        scrollBtn.className = 'scroll-top-btn';
        scrollBtn.title = 'Torna su';
        document.body.appendChild(scrollBtn);

        const footer= document.getElementById('footer');
        this.updateScrollButtonPosition(footer,scrollBtn);
        window.addEventListener('scroll', () => {
            this.updateScrollButtonPosition(footer, scrollBtn);
        });
        window.addEventListener('resize', () => {
            this.updateScrollButtonPosition(footer, scrollBtn);
        });
        scrollBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

    }

    updateScrollButtonPosition(footer,scrollBtn){
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
}

export default Eventi;