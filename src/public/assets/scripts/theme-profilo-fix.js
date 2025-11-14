(function(){
  const STYLE_ID = 'profilo-light-override';
  const css = `
/* Profile light-mode forced overrides */
:root[data-theme="light"] .profile-container,
body[data-theme="light"] .profile-container,
body.theme-light .profile-container {
  color: var(--profile-text-primary) !important;
}
/* Keep header white */
:root[data-theme="light"] .profile-header-card,
body[data-theme="light"] .profile-header-card,
body.theme-light .profile-header-card {
  color: #ffffff !important;
}
`;

  function ensureStyle() {
    let el = document.getElementById(STYLE_ID);
    if (!el) {
      el = document.createElement('style');
      el.id = STYLE_ID;
      el.type = 'text/css';
      el.appendChild(document.createTextNode(css));
      // append at end to have higher precedence
      document.head.appendChild(el);
    }
  }

  function removeStyle() {
    const el = document.getElementById(STYLE_ID);
    if (el) el.parentNode.removeChild(el);
  }

  // When switching to light, remove accidental .text-white in profile content
  // and store state so we can restore it when going back to dark.
  function normalizeProfileForLight() {
    const container = document.querySelector('.profile-container');
    if (!container) return;
    // find elements with text-white inside container but not inside header
    const whites = Array.from(container.querySelectorAll('.text-white'));
    whites.forEach(el => {
      if (!el.closest('.profile-header-card')) {
        // store that we removed the class
        const removed = el.getAttribute('data-removed-text-white');
        if (!removed) {
          el.setAttribute('data-removed-text-white', '1');
          el.classList.remove('text-white');
          // ensure readable color inline fallback
          el.style.setProperty('color', 'var(--profile-text-primary)', 'important');
        }
      }
    });
  }

  function restoreProfileForDark() {
    const container = document.querySelector('.profile-container');
    if (!container) return;
    const els = Array.from(container.querySelectorAll('[data-removed-text-white]'));
    els.forEach(el => {
      el.removeAttribute('data-removed-text-white');
      el.classList.add('text-white');
      el.style.removeProperty('color');
    });
  }

  function applyIfLight() {
    const htmlTheme = document.documentElement.getAttribute('data-theme');
    const bodyTheme = document.body.getAttribute('data-theme');
    const bodyClass = document.body.classList.contains('theme-light');
    const isLight = htmlTheme === 'light' || bodyTheme === 'light' || bodyClass || (!htmlTheme && !bodyTheme && window.matchMedia && !window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isLight) {
      ensureStyle();
      normalizeProfileForLight();
    } else {
      // dark
      removeStyle();
      restoreProfileForDark();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyIfLight);
  } else {
    applyIfLight();
  }

  // Listen to themechange custom event dispatched by ThemeManager
  window.addEventListener('themechange', applyIfLight);
  // Also listen to storage in case other tab changed theme
  window.addEventListener('storage', (e) => {
    if (e.key === 'site-theme-preference') applyIfLight();
  });
})();
