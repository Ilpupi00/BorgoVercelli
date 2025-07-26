
class Squadre{
    constructor(page,loadCSS){
        if (typeof loadCSS === 'function') loadCss(); 
        this.page = page;
        this.init();
    }

    init(){
        this.page.innerHTML = `
        <div class="container d-flex flex-column justify-content-center align-items-center overflow-hidden p-5 m-auto">
            <h1 class="overflow-hidden"> WORKING ON IT</h1>
            <p>Stay tuned for updates!</p>
        </div>`;
    }
}

export default Squadre;