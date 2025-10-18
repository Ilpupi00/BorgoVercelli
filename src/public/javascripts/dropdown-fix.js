// Small helper to initialize Bootstrap dropdowns and ensure they are appended to body
document.addEventListener('DOMContentLoaded', function () {
  console.log('dropdown-fix.js loaded');
  if (typeof bootstrap === 'undefined') {
    console.warn('Bootstrap not found - using manual toggle');
  } else {
    console.log('Bootstrap found, initializing dropdowns');
  }

  // Manual toggle for dropdowns if Bootstrap fails
  document.querySelectorAll('.dropdown-toggle').forEach(function (toggle) {
    console.log('Found dropdown toggle:', toggle);
    var menu = toggle.nextElementSibling;
    if (menu && menu.classList.contains('dropdown-menu')) {
      // Ensure menu is positioned
      menu.style.position = 'absolute';
      menu.style.top = '100%';
      menu.style.left = '0';
      menu.style.zIndex = '2050';
      menu.style.display = 'none'; // start hidden

      // Add click handler
      toggle.addEventListener('click', function (e) {
        e.preventDefault();
        console.log('Toggle clicked');
        if (menu.style.display === 'none') {
          menu.style.display = 'block';
          console.log('Menu shown');
        } else {
          menu.style.display = 'none';
          console.log('Menu hidden');
        }
      });

      // Hide on click outside
      document.addEventListener('click', function (e) {
        if (!toggle.contains(e.target) && !menu.contains(e.target)) {
          menu.style.display = 'none';
        }
      });
    }
  });
});