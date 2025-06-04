
class Navbar {
  constructor(navbar) {
    this.navbar = navbar;
    this.links = this.navbar.querySelectorAll('.nav-link');
    this.path = window.location.pathname.toLowerCase();
    this.updateActiveLink();
  }

  updateActiveLink() {
    this.links.forEach(link => {
      // Prendi solo il pathname del link e rendilo minuscolo
      const linkPath = new URL(link.href).pathname.toLowerCase();
      if (linkPath === this.path) {
        link.classList.add('active');
      } 
      else {
        link.classList.remove('active');
      }
    });
  }
}

export default Navbar;
