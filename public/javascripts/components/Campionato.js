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
        <h1 class='text-center my-4 overflow-hidden'>Classifica</h1>
        <div class='d-flex justify-content-center align-items-center div-classifica'>
            <iframe class='overflow-hidden classifica' src='https://www.tuttocampo.it/WidgetV2/Classifica/0f1bd2cf-7c88-494d-a5ce-32d32064429e'  scrolling='no' frameborder='0' loading='lazy'></iframe>
        </div>
        <div class='d-flex justify-content-center align-items-center div-calendario'>
            <div class='calendario-wrapper'>
                <h2 class='calendario-title overflow-hidden'>Calendario partite</h2>
            <iframe class='calendario' src='https://www.tuttocampo.it/WidgetV2/Risultati/0f1bd2cf-7c88-494d-a5ce-32d32064429e' scrolling='no'></iframe>
            </div>
        </div>
        `;
    }
}
export default Campionato;