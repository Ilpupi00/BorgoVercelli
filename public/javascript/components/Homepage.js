

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
        const notizie= this.addNotizie();
        this.container.appendChild(notizie);
        const eventi = this.addEventi();
        this.container.appendChild(eventi);
        const recensioni= this.addRecensioni();
        this.container.appendChild(recensioni);
    }

    addNotizie(){
        const notizie = document.createElement('div');
        notizie.className = 'notizie container';
        notizie.innerHTML = `
            <h2>Ultime Notizie</h2>
            <ul>
                <li>La squadra ha vinto il campionato!</li>
                <li>Nuovo allenatore in arrivo.</li>
                <li>Iscrizioni aperte per la nuova stagione.</li>
            </ul>
        `;
        return notizie;
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