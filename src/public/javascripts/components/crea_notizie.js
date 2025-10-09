// Funzione globale per il submit del form con Quill
window.submitQuillContent = function() {
    var quill = window.CreaNotizie && window.CreaNotizie.prototype.quill;
    var contenuto = document.querySelector('#contenuto');
    if (quill) {
        contenuto.value = quill.root.innerHTML;
    } else if (window.Quill && window.Quill.find) {
        var q = window.Quill.find(document.querySelector('#editor'));
        if (q) contenuto.value = q.root.innerHTML;
        else contenuto.value = document.querySelector('#editor').innerHTML;
    } else {
        contenuto.value = document.querySelector('#editor').innerHTML;
    }
    return true;
}
// Quill deve essere caricato come script esterno, non import locale
class CreaNotizie{
    constructor(){
        this.init();
    }
    init(){
        this.setupQuill();
    }
    setupQuill(){
        // Assicurati che Quill sia disponibile globalmente
        if (window.Quill) {
            this.quill = new window.Quill('#editor', {
                theme: 'snow',
                placeholder: 'Scrivi la notizia...'
            });
        } else {
            console.error('Quill non trovato!');
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new CreaNotizie();
});