
import FilterEventi from '../../utils/filterEventi.js';
import FilterNotizie from '../../utils/filterNotizie.js';
import FilterdRecensioni from '../../utils/filterRecensioni.js';

class Homepage {
    constructor(container,loader){
        if (typeof loader === 'function') loader(); 
        this.container = container;
        this.init();
    }

    init(){
        this.container.innerHTML = `
        <header class="header container-fluid d-flex flex-column justify-content-center align-items-center vh-100">
            <h1 class="title">Asd BorgoVercelli 2022</h1>
            <p>La società del futuro</p>
        </header>
        <section id="notizie-section"></section>
        <section id="eventi-section"></section>
        <section id="recensioni-section"></section>
        `;
        this.render();
    }

    async render(){
        const response = await fetch('/notizie');
        const data = await response.json();
        this.addNotizie(data);
        const responseEventi = await fetch('/eventi');
        const dataEventi = await responseEventi.json();
        this.addEventi(dataEventi);
        const responseRecensioni = await fetch('/recensioni');
        const recensioni = await responseRecensioni.json();
        this.addRecensioni(recensioni);
    }

    addNotizie(notizie){
        const notizieSection = this.container.querySelector('#notizie-section');
        new FilterNotizie(notizieSection,notizie);
    }
    addEventi(eventi){
        if (!eventi) {
            console.error('Eventi undefined in addEventi');
            return;
        }
        const eventiSection = this.container.querySelector('#eventi-section');
        new FilterEventi(eventiSection, eventi);
    }

    addRecensioni(recensioni) {
        const recensioniSection = this.container.querySelector('#recensioni-section');
        new FilterdRecensioni(recensioniSection,recensioni);
    }
}


export default Homepage;