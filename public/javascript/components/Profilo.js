class Profilo{
    constructor(){
        this.user = user;
        this.render();
    }

    render(){ 
        document.addEventListener('DOMContentLoaded', function() {
            const detailsItems = document.querySelectorAll('.profile-details dt, .profile-details dd');
                    
            detailsItems.forEach(item => {
            item.addEventListener('mouseenter', function() {
             if (this.tagName === 'DT') {
                his.nextElementSibling.classList.add('text-primary');
            } else if (this.tagName === 'DD') {
                this.previousElementSibling.classList.add('text-primary');
            }
        });
                        
        item.addEventListener('mouseleave', function() {
                if (this.tagName === 'DT') {
                    his.nextElementSibling.classList.remove('text-primary');
                } else if (this.tagName === 'DD') {
                    this.previousElementSibling.classList.remove('text-primary');
                }
            });
        });
                    
                    // Avatar animation on click
        const avatar = document.querySelector('.profile-avatar');
        avatar.addEventListener('click', function() {
            this.classList.add('animate__animated', 'animate__rubberBand');
                        
            this.addEventListener('animationend', () => {
            this.classList.remove('animate__animated', 'animate__rubberBand');
            }, {once: true});
                    
        });
                
                
        });
    }

}

export default Profilo;