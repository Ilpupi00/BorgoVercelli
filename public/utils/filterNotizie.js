

class FilterNotizie{
    /**
     * 
     * @param {*} section dove inserire le notizie filtrate
     * @param {*} Notizie notizie da filtrare
     */
    constructor(section,Notizie){
        this.section= section;
        this.Notizie = Notizie;
    }

    filterByDate(date) {
        const filteredNotizie = this.Notizie.filter(notizia => {
            const notiziaDate = new Date(notizia.data);
            return notiziaDate >= date;
        });
        this.render(filteredNotizie);
    }

    render(filteredNotizie) {
        const section = document.querySelector(this.section);
        section.innerHTML = `    
            <section class="vw-100">
                <div class="container mt-5"> 
                    <h2 class="section-title">Notizie</h2>`; // Clear previous content
        if(filteredNotizie){
            for(let i=0;i<3; i++){
                if (filteredNotizie[i]) {
                    const notizia = filteredNotizie[i];
                    const notiziaElement = document.createElement('div');
                    notiziaElement.className = 'notizia';
                    notiziaElement.innerHTML = `
                        <div class="col px-4">
                            <div class="card h-100">
                                <div class="card-img-container" style="height: 200px; overflow: hidden;">
                                    <img src="${notizia.immagine}" class="card-img-top" alt="Evento Tech" style="object-fit: cover; height: 100%; width: 100%;">
                                </div>
                            <div class="card-body d-flex flex-column">
                                <h5 class="card-title overflow-hidden">${notizia.titolo}</h5>
                                <p class="card-text">${notizia.sottotitolo}</p>
                                <div class="mt-auto">
                                    <div class="text-muted mb-2">09/04/2025</div>
                                        <a href="/Notizia/id" class="btn btn-primary btn-sm">Leggi di più</a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                    section.appendChild(notiziaElement);
                }
            }
        }
        section.innerHTML += `
                </div>
            </section>
        `;
    }
}

export default FilterNotizie;