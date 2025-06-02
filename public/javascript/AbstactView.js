export default class AbstractView {
    constructor(){
        this.title='ASD Borgo Vercelli';
    }

    setTitle(title){
        document.title=title;
    }

    async getHtml(){
        return '';
    }
}