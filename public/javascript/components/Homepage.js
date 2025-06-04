

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
    }
}

export default Homepage;