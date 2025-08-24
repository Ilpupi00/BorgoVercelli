class Campionato{
    constructor(page,loadCSS){
        if (typeof loadCSS === 'function') loadCSS(); 
        this.page = page;
        this.container = page;
        this.init();
    }
    init(){
        document.title = "Campionato";
        this.container.innerHTML = `
        <div class="container d-flex flex-column justify-content-center align-items-center overflow-hidden p-5 m-auto">
            <h1 class="overflow-hidden"> WORKING ON IT</h1>
            <p>Stay tuned for updates!</p>
        </div>`;
    }
}
export default Campionato;