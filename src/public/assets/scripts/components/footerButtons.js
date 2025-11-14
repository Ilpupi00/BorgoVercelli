class FooterButtons {
  constructor() {
    this.btnSelector = '#footer form button[type="submit"]';
    this.fixSelectors = [
      '#footer .btn',
      'a.btn',
      '.btn-outline-primary',
      '.btn-outline-light',
      '.card-button',
      '.read-full-btn',
      '.news-card .btn',
      '.notizia-card .btn',
      '.btn-lg'
    ];
    this._observer = null;
    this._themeObserver = null;
    this.init();
  }

  init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.run());
    } else {
      this.run();
    }
  }

  run() {
    try {
      this.applyDarkButtonFix();
      this.setupHoverHide();
      this.observeThemeChanges();
    } catch (err) {
      // swallow to avoid breaking page scripts
      // eslint-disable-next-line no-console
      console.error('FooterButtons run error:', err);
    }
  }

  applyDarkButtonFix() {
    // Theme detection removed - no dark mode support
  }

  setupHoverHide() {
    try {
      const btn = document.querySelector(this.btnSelector);
      if (!btn) return;

      // ensure we have a saved original HTML to restore
      if (!btn.dataset.originalHtml) btn.dataset.originalHtml = btn.innerHTML;

      const hideText = () => {
        // do not hide while loading/disabled
        if (btn.disabled || btn.classList.contains('btn-loading')) return;

        // collect icon html (svg, i, bi/fa classes)
        const icons = Array.from(btn.querySelectorAll('svg, i, .bi, .fa, .fas, .far, .fab'))
          .map(el => el.outerHTML)
          .join('');

        if (icons) {
          btn.innerHTML = icons;
        } else {
          // if no icons, clear text but keep accessible label
          btn.textContent = '';
        }
      };

      const restoreText = () => {
        if (btn.dataset.originalHtml) {
          btn.innerHTML = btn.dataset.originalHtml;
        }
      };

      btn.addEventListener('mouseenter', hideText);
      btn.addEventListener('focus', hideText);
      btn.addEventListener('mouseleave', restoreText);
      btn.addEventListener('blur', restoreText);

      // Observe changes to the button (other scripts may update innerHTML on submit)
      const observer = new MutationObserver(mutations => {
        // If the button is not in loading state, update the stored originalHtml
        if (!btn.classList.contains('btn-loading') && !btn.disabled) {
          btn.dataset.originalHtml = btn.innerHTML;
        }
      });

      observer.observe(btn, { childList: true, subtree: true, characterData: true });
      this._observer = observer;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('setupHoverHide error:', err);
    }
  }

  observeThemeChanges() {
    // Theme observer removed - no dark mode support
  }
}

// Instantiate to run immediately when module is loaded
new FooterButtons();

export default FooterButtons;
