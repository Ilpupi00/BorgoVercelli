

class Notizie{
    constructor(page,loadCSS){
        this.page=page;
        if(typeof(loadCSS)==='function') loadCSS();
        this.init();
    }

    async init(){
        await this.render();
    }

    async render(){
        const notizie=await this.fetchNotizie();
    }
    async fetchNotizie(){
        try{
            const response=fetch('notizie/all');
            const data=response.json();
            return data;
        }
        catch(error){
            console.error('Errore fetch notizie:',error);
            return [];
        }
    }
}