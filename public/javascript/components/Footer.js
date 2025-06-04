


class Footer{
    constructor(footer){
        this.footer=footer;
        this.updateVisable();
    }

    updateVisable() {
        const path = window.location.pathname.toLowerCase();
        if (path === '/login' || path === '/registrazione') {
            this.footer.classList.add('hide');
        } else {
            this.footer.classList.remove('hide');
        }
    }
}

export default Footer;