// Robust dropdown fallback: toggles `.show`, syncs aria-expanded, supports ESC and outside click
document.addEventListener('DOMContentLoaded', function () {
  // If Bootstrap's dropdown is available, prefer it and exit
  if (typeof bootstrap !== 'undefined' && bootstrap.Dropdown) {
    // Let Bootstrap manage dropdowns. No further action required.
    console.log('Bootstrap Dropdown available - using native implementation');
    return;
  }

  console.log('Bootstrap Dropdown not found - using fallback dropdown implementation');

  var openDropdown = null;

  function closeDropdown(dropdownToggle, dropdownMenu) {
    if (!dropdownToggle || !dropdownMenu) return;
    dropdownMenu.classList.remove('show');
    dropdownToggle.classList.remove('show');
    dropdownToggle.setAttribute('aria-expanded', 'false');
    openDropdown = null;
  }

  function openDropdownMenu(dropdownToggle, dropdownMenu) {
    if (!dropdownToggle || !dropdownMenu) return;
    dropdownMenu.classList.add('show');
    dropdownToggle.classList.add('show');
    dropdownToggle.setAttribute('aria-expanded', 'true');
    openDropdown = { toggle: dropdownToggle, menu: dropdownMenu };
  }

  // Initialize all dropdown toggles
  document.querySelectorAll('.dropdown-toggle').forEach(function (toggle) {
    var menu = toggle.nextElementSibling;
    if (!menu || !menu.classList.contains('dropdown-menu')) return;

    // Ensure menu has correct positioning only if not set by CSS
    if (!menu.style.position) {
      menu.style.position = 'absolute';
      menu.style.top = '100%';
      menu.style.left = '0';
      menu.style.zIndex = '2050';
    }

    // Make sure aria attributes exist
    if (!toggle.hasAttribute('aria-expanded')) toggle.setAttribute('aria-expanded', 'false');

    // Click toggles dropdown
    toggle.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (openDropdown && openDropdown.toggle === toggle) {
        closeDropdown(toggle, menu);
        return;
      }

      // Close any other open dropdown
      if (openDropdown) closeDropdown(openDropdown.toggle, openDropdown.menu);

      openDropdownMenu(toggle, menu);
    });
  });

  // Close when clicking outside
  document.addEventListener('click', function (e) {
    if (!openDropdown) return;
    var t = e.target;
    if (!openDropdown.toggle.contains(t) && !openDropdown.menu.contains(t)) {
      closeDropdown(openDropdown.toggle, openDropdown.menu);
    }
  });

  // Close on ESC
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' || e.key === 'Esc') {
      if (openDropdown) {
        closeDropdown(openDropdown.toggle, openDropdown.menu);
      }
    }
  });
});