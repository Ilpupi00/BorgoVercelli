
/**
 * carica un file CSS se non è già stato caricato
 * @param {string} url - URL del file CSS da caricare
 * @returns {void}
 */
export default function loadCSS(url){
    if(document.querySelector(`link[href="${url}"]`))return;
    const link = document.createElement('link');
    link.rel= 'stylesheet';
    link.href=url;
    link.type='text/css';
    document.head.appendChild(link);
}

