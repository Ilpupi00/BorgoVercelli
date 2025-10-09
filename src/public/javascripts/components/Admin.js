// Admin Panel JavaScript

document.addEventListener('DOMContentLoaded', function() {
    console.log('Admin panel loaded');

    // Gestisce il toggle delle sezioni della sidebar
    const sectionHeaders = document.querySelectorAll('.section-header');

    sectionHeaders.forEach(header => {
        header.addEventListener('click', function() {
            // Trova il nav-item padre
            const navItem = this.closest('.nav-item');
            // Trova tutti i submenu successivi fino al prossimo header
            const submenuItems = [];
            let nextElement = navItem.nextElementSibling;

            while (nextElement && !nextElement.querySelector('.section-header')) {
                if (nextElement.classList.contains('nav-item') && nextElement.querySelector('.submenu')) {
                    submenuItems.push(nextElement);
                }
                nextElement = nextElement.nextElementSibling;
            }

            // Toggle la visibilità dei submenu
            submenuItems.forEach(item => {
                item.style.display = item.style.display === 'none' ? 'block' : 'none';
            });

            // Toggle una classe per l'icona (freccia)
            this.classList.toggle('collapsed');
        });
    });

    // Inizialmente nascondi tutti i submenu
    const allSubmenuItems = document.querySelectorAll('.nav-item .submenu');
    allSubmenuItems.forEach(item => {
        item.closest('.nav-item').style.display = 'none';
    });
});