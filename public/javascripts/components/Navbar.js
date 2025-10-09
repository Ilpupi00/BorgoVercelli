
class Navbar {
  constructor(navbar,loadCSS) {
    if(typeof loadCSS ==='function')loadCSS();
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

    this.navbar.innerHTML = `
<nav class="navbar sticky-top navbar-expand-lg bg-primary" id="navbar">
  <div class="container-fluid">

    <a class="navbar-brand" href="/Homepage">
      <img src="/images/Logo.png" alt="Logo" width="60" height="60" class="d-inline-block align-text-top">
    </a>

    <!-- Search Bar -->
    <form class="d-flex me-auto mb-2 mb-lg-0 ms-4" role="search">
      <input class="form-control me-2" type="search" placeholder="Search" aria-label="Search">
    </form>

    <!-- Hamburger Menu for Mobile View -->
    <button class="navbar-toggler ms-auto" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
      <span class="navbar-toggler-icon"></span>
    </button>

    <div class="collapse navbar-collapse" id="navbarSupportedContent">

      <!-- Navbar Links -->
      <ul class="navbar-nav mb-3 mb-lg-0 ms-auto align-items-center justify-content-center">
        <li class="nav-item">
          <a class="nav-link" aria-current="page" href="/Homepage">Home</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="/Squadre">Squadre</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="/Campionato">Campionato</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="/Galleria">Galleria</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="/Societa">Società</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="/Prenotazione">Prenotazione</a>
        </li>
      </ul>

      <!-- Login/Profile Button -->
      <form class="d-flex ms-auto mt-3 mt-lg-0 overflow-hidden">
          ${
          isLogged
          ? profilePic
            ? `<a href="/profilo" class="text-light d-flex justify-content-center align-items-center w-100" id="Profilo" title="Profilo">
                <img src="${profilePic}" alt="Foto Profilo" class="rounded-circle" style="width: 40px; height: 40px; object-fit: cover;">
              </a>`
            : `<a href="/profilo" class="text-light d-flex justify-content-center align-items-center w-100" id="Profilo" title="Profilo">
                <i class="bi bi-person-circle" style="font-size: 1.8rem;"></i>
              </a>`
            : `<a href="/profilo" class="btn btn-outline-light d-flex align-items-center justify-content-center gap-2 mx-auto mx-lg-0" id="Login">
                <i class="bi bi-box-arrow-in-right"></i>
                <span>Login</span>
            </a>`
        }
  </form>

    </div>

  </div>
</nav>
    `;
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
