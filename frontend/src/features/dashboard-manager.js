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

  setupAllEventListeners = () => {
    this.dom.loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleLogin();
    });

    this.dom.registerForm.addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleRegister();
    });

    this.dom.registerLink.addEventListener("click", () => {
      this.showRegister();
    });

    this.dom.loginLink.addEventListener("click", () => {
      this.showLogin();
    });

    this.dom.logoutButton.addEventListener("click", () => {
      this.handleLogout();
    });

    this.dom.errorClose.addEventListener("click", () => {
      this.pageController.hideError();
    });
  };

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
    const email = this.dom.loginEmail.value.trim();
    const password = this.dom.loginPassword.value;

    if (!email || !password) {
      this.pageController.showError("Please fill in all fields");
      return;
    }

    // Call API to login
    this.api
      .login(email, password)
      .then((response) => {
        // Save token and userId
        this.auth.saveAuthToken(response.token, response.userId);

        // Show dashboard
        this.showDashboard();
      })
      .catch((error) => {
        this.pageController.showError(error.message || "Login failed");
      });
  }

  /**
   * Handle register form submission
   */
  handleRegister() {
    const email = this.dom.registerEmail.value.trim();
    const name = this.dom.registerName.value.trim();
    const password = this.dom.registerPassword.value;
    const confirmPassword = this.dom.registerPasswordConfirm.value;
    if (!email || !name || !password || !confirmPassword) {
      this.pageController.showError("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      this.pageController.showError("Passwords do not match");
      return;
    }

    // Call API to register
    this.api
      .register(email, password, name)
      .then((response) => {
        // Save token and userId
        this.auth.saveAuthToken(response.token, response.userId);

        // Show dashboard
        this.showDashboard();
      })
      .catch((error) => {
        this.pageController.showError(error.message || "Registration failed");
      });
  }

  /**
   * Handle logout
   */
  handleLogout() {

  }
}
