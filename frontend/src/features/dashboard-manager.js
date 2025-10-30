import { BaseManager } from "./base-manager.js";

export class Dashboard extends BaseManager {
  constructor(api, auth, pageController, ErrorController, channelManager, messageManager) {
    super(api, auth, ErrorController);
    // Cache commonly used DOM elements in a single object for easier access
    this.channelManager = channelManager;
    this.messageManager = messageManager;
    this.pageController = pageController;

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

      // Sidebar toggle elements
      sidebarToggle: document.getElementById("sidebar-toggle"),
      sidebarToggleFloating: document.getElementById("sidebar-toggle-floating"),
      sidebar: document.getElementById("dashboard-sidebar"),
      sidebarBackdrop: document.getElementById("sidebar-backdrop"),
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
      this.ErrorController.hideError();
    });

    // Sidebar toggle buttons
    this.dom.sidebarToggle.addEventListener("click", () => {
      this.toggleSidebar();
    });

    if (this.dom.sidebarToggleFloating) {
      this.dom.sidebarToggleFloating.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.toggleSidebar();
      });
    }

    this.dom.sidebarBackdrop.addEventListener("click", () => {
      this.closeSidebar();
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
      this.showError("Please fill in all fields");
      return;
    }

    // Call API to login
    this.api
      .login(email, password)
      .then((response) => {
        // Save token and userId
        this.auth.saveAuthToken(response.token, response.userId);

        // Start push notifications
        this.messageManager.startPushNotifications();

        // Show dashboard
        this.showDashboard();
      })
      .catch((error) => {
        this.showError(error.message || "Login failed");
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
      this.showError("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      this.showError("Passwords do not match");
      return;
    }

    // Call API to register
    this.api
      .register(email, password, name)
      .then((response) => {
        // Save token and userId
        this.auth.saveAuthToken(response.token, response.userId);

        // Start push notifications
        this.messageManager.startPushNotifications();

        // Show dashboard
        this.showDashboard();
      })
      .catch((error) => {
        this.showError(error.message || "Registration failed");
      });
  }

  /**
   * Handle logout
   */
  handleLogout() {
    const token = this.auth.getToken();

    // Stop push notifications
    this.messageManager.stopPushNotifications();

    // Clear messages
    this.messageManager.clearMessages();

    // Clear channels
    this.channelManager.clearChannels();

    this.api
      .logout(token)
      .then(() => {
        // Clear auth data
        this.auth.cleanAuthToken();

        // Show login page
        this.showLogin();
      })
      .catch((error) => {
        // Even if logout fails, clear local auth and show login
        this.auth.cleanAuthToken();
        this.showLogin();
        console.error("Logout error:", error);
      });
  }

  /**
   * Toggle sidebar visibility
   * Desktop: collapse/expand sidebar
   * Mobile: show/hide overlay sidebar
   */
  toggleSidebar() {
    const isMobile = window.innerWidth <= 768;

    if (isMobile) {
      // Mobile: toggle overlay
      this.dom.sidebar.classList.toggle("visible");
      this.dom.sidebarBackdrop.classList.toggle("visible");
    } else {
      // Desktop: toggle collapse
      this.dom.sidebar.classList.toggle("hidden");
    }
  }

  /**
   * Close sidebar (primarily for mobile backdrop click)
   */
  closeSidebar() {
    this.dom.sidebar.classList.remove("visible");
    this.dom.sidebarBackdrop.classList.remove("visible");
  }
}
