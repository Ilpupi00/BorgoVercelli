// Small helper to initialize Bootstrap dropdowns and ensure they are appended to body
document.addEventListener('DOMContentLoaded', function () {
  if (typeof bootstrap === 'undefined') {
    console.warn('Bootstrap not found - dropdown-fix.js will not run');
    return;
  }

  // Initialize all dropdown toggles
  document.querySelectorAll('.dropdown-toggle').forEach(function (toggle) {
    // Remove existing instance
    try {
      bootstrap.Dropdown.getInstance(toggle)?.dispose();
    } catch (e) {}

    // Create new Dropdown with boundary viewport to prevent clipping
    var dd = new bootstrap.Dropdown(toggle, { boundary: 'viewport' });

    // Move menu to body on show to prevent clipping by transformed parents
    toggle.addEventListener('show.bs.dropdown', function () {
      var menu = toggle.nextElementSibling;
      if (menu && menu.classList.contains('dropdown-menu')) {
        document.body.appendChild(menu);
        menu.style.position = 'absolute';
        menu.style.zIndex = '2050';
      }
    });

    // Move back on hide
    toggle.addEventListener('hide.bs.dropdown', function () {
      var menu = document.querySelector('.dropdown-menu[aria-labelledby="' + toggle.id + '"]');
      if (menu) {
        toggle.parentNode.appendChild(menu);
        menu.style.position = '';
        menu.style.zIndex = '';
      }
    });

    // As an accessibility/fallback: toggle via keyboard Enter
    toggle.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        dd.toggle();
      }
    });
  });
});