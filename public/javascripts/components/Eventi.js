import { off } from "../../../app";

class Eventi{
    constructor(page,loadCSS){
        if(typeof(loadCSS)==='function')loadCSS();
        this.page=page;
        this.init();
    }

    async init(){
        await this.render();
    }

    async render(){

    }
}