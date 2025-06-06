
import FilterNotizie from '../../utils/filterNotizie.js';
class Homepage {
    constructor(container,loader){
        if (typeof loader === 'function') loader(); 
        this.container = container;
        this.init();
    }

    init(){
        this.render();
    }

    render(){
        this.container.innerHTML = `
            <header class="header container-fluid d-flex flex-column justify-content-center align-items-center vh-100">
                <h1 class="title">Asd BorgoVercelli 2022</h1>
                <p>La società del futuro</p>
            </header>
        `;
        fetch('/notizie')
            .then(response => response.json())
            .then(data => {
                this.addNotizie(data);
            }).catch(error=>{
                this.addNotizie([]);
                console.error(`Errore nel recupero delle notizie:${error}`);
            })
        const eventi = this.addEventi();
        this.container.appendChild(eventi);
        const recensioni= this.addRecensioni();
        this.container.appendChild(recensioni);
    }

    addNotizie(notizie){
        new FilterNotizie(this.container,notizie);
    }
    
    addEventi(){
        const eventi = document.createElement('div');
        eventi.className = 'eventi container';
        eventi.innerHTML = `
            <h2>Prossimi Eventi</h2>
            <ul>
                <li>Partita contro il Rivale FC - 15 Marzo</li>
                <li>Torneo di Primavera - 22 Marzo</li>
                <li>Festa di fine stagione - 30 Giugno</li>
            </ul>
        `;
        return eventi;
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