
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

}
