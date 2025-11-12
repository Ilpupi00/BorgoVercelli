
class Navbar {
  constructor(navbar) {
    this.navbar = navbar;
    this.path = window.location.pathname.toLowerCase();
    this.init();
    // Ricarica la navbar quando avviene login/logout
    window.addEventListener('authChanged', () => this.render());
  }
  init(){
    this.render();
  }
  async render(){
    // Verifica autenticazione utente
    let isLogged = false;
    let user = null;
    try {
      const res = await fetch('/session/user');
      if (res.ok) {
        user = await res.json();
        isLogged = true;
      }
    } catch (err) {
      console.error('Error checking login status:', err);
    }
    let profilePic = null;
    if (isLogged) {
      try {
        const res = await fetch('/api/user/profile-pic');
        if (res.ok) {
          const data = await res.json();
          profilePic = data.profilePic; 
        }
      } catch (err) {
        profilePic = null;
      }
    }

    // Clear existing content
    this.navbar.innerHTML = '';

    // Create navbar element
    const nav = document.createElement('nav');
    nav.className = 'navbar sticky-top navbar-expand-lg bg-primary';
    nav.id = 'navbar';

    const container = document.createElement('div');
    container.className = 'container-fluid';

    // Logo
    const brandLink = document.createElement('a');
    brandLink.className = 'navbar-brand';
    brandLink.href = '/homepage';
    const logoImg = document.createElement('img');
    logoImg.src = '/assets/images/Logo.png';
    logoImg.alt = 'Logo';
    logoImg.width = 60;
    logoImg.height = 60;
  logoImg.className = 'navbar-logo d-inline-block align-text-top';
    brandLink.appendChild(logoImg);
    container.appendChild(brandLink);

    // Search Bar
    const searchForm = document.createElement('form');
    searchForm.className = 'd-flex me-auto mb-2 mb-lg-0 ms-4';
    searchForm.role = 'search';
    const searchInput = document.createElement('input');
    searchInput.className = 'form-control me-2';
    searchInput.type = 'search';
    searchInput.placeholder = 'Search';
    searchInput.setAttribute('aria-label', 'Search');
    searchForm.appendChild(searchInput);
    container.appendChild(searchForm);

    // Hamburger Menu
    const toggler = document.createElement('button');
    toggler.className = 'navbar-toggler ms-auto';
    toggler.type = 'button';
    toggler.setAttribute('data-bs-toggle', 'collapse');
    toggler.setAttribute('data-bs-target', '#navbarSupportedContent');
    toggler.setAttribute('aria-controls', 'navbarSupportedContent');
    toggler.setAttribute('aria-expanded', 'false');
    toggler.setAttribute('aria-label', 'Toggle navigation');
    const togglerIcon = document.createElement('span');
    togglerIcon.className = 'navbar-toggler-icon';
    toggler.appendChild(togglerIcon);
    container.appendChild(toggler);

    // Collapse div
    const collapseDiv = document.createElement('div');
    collapseDiv.className = 'collapse navbar-collapse';
    collapseDiv.id = 'navbarSupportedContent';

    // Navbar Links
    const navUl = document.createElement('ul');
    navUl.className = 'navbar-nav mb-3 mb-lg-0 ms-auto align-items-center justify-content-center';

    const links = [
      { href: '/homepage', text: 'Home' },
      { href: '/Squadre', text: 'Squadre' },
      { href: '/Campionato', text: 'Campionato' },
      { href: '/Galleria', text: 'Galleria' },
      { href: '/Societa', text: 'Società' },
      { href: '/Prenotazione', text: 'Prenotazione' }
    ];

    links.forEach(linkData => {
      const li = document.createElement('li');
      li.className = 'nav-item';
      const a = document.createElement('a');
      a.className = 'nav-link';
      a.href = linkData.href;
      a.textContent = linkData.text;
      li.appendChild(a);
      navUl.appendChild(li);
    });

    collapseDiv.appendChild(navUl);

    // Login/Profile Button
    const form = document.createElement('form');
    form.className = 'd-flex ms-auto mt-3 mt-lg-0 overflow-hidden';

    if (isLogged) {
      const profileLink = document.createElement('a');
      profileLink.href = '/profilo';
      profileLink.className = 'text-light d-flex justify-content-center align-items-center w-100';
      profileLink.id = 'Profilo';
      profileLink.title = 'Profilo';
      
      if (profilePic) {
        const img = document.createElement('img');
        img.src = profilePic;
        img.alt = 'Foto Profilo';
        img.className = 'rounded-circle';
        img.style.width = '40px';
        img.style.height = '40px';
        img.style.objectFit = 'cover';
        profileLink.appendChild(img);
      } else {
        const icon = document.createElement('i');
        icon.className = 'bi bi-person-circle';
        icon.style.fontSize = '1.8rem';
        profileLink.appendChild(icon);
      }
      
      form.appendChild(profileLink);
    } else {
      const loginBtn = document.createElement('a');
      loginBtn.href = '/profilo';
      loginBtn.className = 'btn btn-outline-light d-flex align-items-center justify-content-center gap-2 mx-auto mx-lg-0';
      loginBtn.id = 'Login';
      
      const icon = document.createElement('i');
      icon.className = 'bi bi-box-arrow-in-right';
      loginBtn.appendChild(icon);
      
      const span = document.createElement('span');
      span.textContent = 'Login';
      loginBtn.appendChild(span);
      
      form.appendChild(loginBtn);
    }

    collapseDiv.appendChild(form);
    container.appendChild(collapseDiv);
    nav.appendChild(container);
    this.navbar.appendChild(nav);

    this.links = this.navbar.querySelectorAll('.nav-link');
    this.updateActiveLink();
  }

  updateActiveLink() {
    this.links.forEach(link => {
      const linkPath = new URL(link.href).pathname.toLowerCase();
      if (linkPath === this.path) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }
}

export default Navbar;
