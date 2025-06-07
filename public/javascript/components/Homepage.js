
import FilterNotizie from '../../utils/filterNotizie.js';
import FilterEventi from '../../utils/filterEventi.js';
class Homepage {
    constructor(container,loader){
        if (typeof loader === 'function') loader(); 
        this.container = container;
        this.init();
    }

    init(){
        this.render();
    }

async render(){
    this.container.innerHTML = `
        <header class="header container-fluid d-flex flex-column justify-content-center align-items-center vh-100">
            <h1 class="title">Asd BorgoVercelli 2022</h1>
            <p>La società del futuro</p>
        </header>
    `;
    
    try {
        const response = await fetch('/notizie');
        const data = await response.json();
        console.log('Notizie ricevute:', data);
        this.addNotizie(data);
        
        const responseEventi = await fetch('/eventi');
        const dataEventi = await responseEventi.json();
        this.addEventi(dataEventi);
        const recensioni = this.addRecensioni();
        this.container.appendChild(recensioni);
    } catch (error) {
        console.error('Errore nel caricamento delle notizie:', error);
    }
}

    addNotizie(notizie){
        new FilterNotizie(this.container,notizie);
    }
    addEventi(eventi){
        if (!eventi) {
            console.error('Eventi undefined in addEventi');
            return;
        }
        console.log('Rendering eventi:', eventi);
        new FilterEventi(this.container, eventi);
    }

    addRecensioni(){
        const recensioni = document.createElement('div');
        recensioni.className = 'recensioni container';
        recensioni.innerHTML = `
            <h2>Recensioni</h2>
            <ul>
                <li>"La migliore squadra della regione!" - Marco</li>
                <li>"Allenatori competenti e appassionati." - Lucia</li>
                <li>"Ottima organizzazione e spirito di squadra." - Giovanni</li>
            </ul>
        `;
        return recensioni;
    }
}

export default Homepage;