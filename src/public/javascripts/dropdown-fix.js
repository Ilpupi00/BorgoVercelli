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

    // If popper mounting causes issues, we can force append to body by moving menu
    var menu = toggle.nextElementSibling;
    if (menu && menu.classList.contains('dropdown-menu')) {
      // ensure proper classes
      menu.classList.add('dropdown-menu');
      // no automatic move here; rely on Bootstrap's Popper positioning
    }

    // As an accessibility/fallback: toggle via keyboard Enter
    toggle.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        dd.toggle();
      }
    });
  });
});