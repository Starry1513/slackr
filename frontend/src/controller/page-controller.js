
export class PageController {
  constructor() {
    this.pages = {
      login: document.getElementById('login-container'),
      register: document.getElementById('register-container'),
      dashboard: document.getElementById('dashboard-container'),
      error: document.getElementById('error-body')
    };
  }
  hideAll() {
    Object.values(this.pages).forEach(page => {
      if (page) {
        page.style.display = 'none';
      }
    });
  }

  showLogin() {
    console.log("show login")
    this.hideAll();
    this.pages.login.style.display = 'block';
  }

  showRegister() {
    console.log("show register");
    this.hideAll();
    this.pages.register.style.display = 'block';
  }

  showDashboard() {
    this.hideAll();
    this.pages.dashboard.style.display = 'flex';
  }

  /**
   * Show error popup (doesn't hide other pages)
   * @param {string} message - Error message to display
   */
  showError(message) {
    const errorMessage = document.getElementById('error-message');
    errorMessage.textContent = message;
    this.pages.error.style.display = 'flex';
  }

  /**
   * Hide error popup
   */
  hideError() {
    this.pages.error.style.display = 'none';
  }
}
