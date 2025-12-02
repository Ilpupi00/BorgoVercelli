import { setupEmailFormListener } from './send_email.js';

class FooterButtons {
  constructor() {
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
      // Ensure footer email form is handled by our email component
      try { setupEmailFormListener(); } catch (e) { /* ignore */ }
      // Keep other light button fixes if needed in future
    } catch (err) {
      console.error('FooterButtons run error:', err);
    }
  }
}

// Instantiate to run immediately when module is loaded
new FooterButtons();

export default FooterButtons;
