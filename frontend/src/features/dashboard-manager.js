export class Dashboard {
  constructor(api, auth, pageController, channelManager) {
    // Cache commonly used DOM elements in a single object for easier access
    this.api = api;
    this.auth = auth;
    this.pageController = pageController;
    this.channelManager = channelManager;

    this.dom = {
      loginForm: document.getElementById("login-form"),
      loginEmail: document.getElementById("login-email"),
      loginPassword: document.getElementById("login-password"),

      registerForm: document.getElementById("register-form"),
      registerEmail: document.getElementById("register-email"),
      registerName: document.getElementById("register-name"),
      registerPassword: document.getElementById("register-password"),
      registerPasswordConfirm: document.getElementById(
        "register-password-confirm"
      ),

      registerLink: document.getElementById("register-link"),
      loginLink: document.getElementById("login-link"),
      logoutButton: document.getElementById("logout-button"),
      errorClose: document.getElementById("error-close"),
    };
  }
    init() {
    console.log("Start page");

    // Initialize channel manager
    this.channelManager.init();

    // Check if user is already logged in
    if (this.auth.checkLogin()) {
      this.showDashboard();
    } else {
      this.showLogin();
    }
    // Set up all event listeners
    this.setupAllEventListeners();
  }


  /**
   * Show login page
   */
  showLogin() {
    this.pageController.showLogin();
    this.dom.loginEmail.value = "";
    this.dom.loginPassword.value = "";
  }

  /**
   * Show register page
   */
  showRegister() {
    this.pageController.showRegister();
    this.dom.registerEmail.value = "";

    this.dom.registerName.value = "";
    this.dom.registerPassword.value = "";
    this.dom.registerPasswordConfirm.value = "";
  }

  /**
   * Show dashboard page
   */
  showDashboard() {
    this.pageController.showDashboard();
    // Load channels when showing dashboard
    this.channelManager.loadChannels();
  }

  /**
   * Handle login form submission
   */
  handleLogin() {

  }

  /**
   * Handle register form submission
   */
  handleRegister() {

  }

  /**
   * Handle logout
   */
  handleLogout() {

  }
}
