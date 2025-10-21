import { ApiService } from "./api.js";
import { AuthManager } from "./auth.js";
import { PageController } from "./page-controller.js";

export class App {
  constructor() {
    this.api = new ApiService();
    this.auth = new AuthManager();
    this.pageController = new PageController();

    // Current channel state
    this.currentChannelId = null;
    this.currentChannelData = null;

    // Cache commonly used DOM elements in a single object for easier access
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

      // Channel elements
      channelList: document.getElementById("channel-list"),
      createChannelButton: document.getElementById("create-channel-button"),
      createChannelContainer: document.getElementById("create-channel-container"),
      createChannelForm: document.getElementById("create-channel-form"),
      createChannelName: document.getElementById("create-channel-name"),
      createChannelDescription: document.getElementById("create-channel-description"),
      createChannelIsPrivate: document.getElementById("create-channel-is-private"),
      closeCreateChannel: document.getElementById("close-create-channel"),
      cancelCreateChannel: document.getElementById("cancel-create-channel"),

      editChannelContainer: document.getElementById("edit-channel-container"),
      editChannelForm: document.getElementById("edit-channel-form"),
      editChannelName: document.getElementById("edit-channel-name"),
      editChannelDescription: document.getElementById("edit-channel-description"),
      closeEditChannel: document.getElementById("close-edit-channel"),
      cancelEditChannel: document.getElementById("cancel-edit-channel"),
      editChannelButton: document.getElementById("edit-channel-button"),

      welcomeScreen: document.getElementById("welcome-screen"),
      channelView: document.getElementById("channel-view"),
      channelNameDisplay: document.getElementById("channel-name-display"),
      channelDescriptionDisplay: document.getElementById("channel-description-display"),
      channelTypeDisplay: document.getElementById("channel-type-display"),
      channelCreatedDisplay: document.getElementById("channel-created-display"),
      channelCreatorDisplay: document.getElementById("channel-creator-display"),

      joinChannelButton: document.getElementById("join-channel-button"),
      leaveChannelButton: document.getElementById("leave-channel-button"),
    };
  }

  init() {
    console.log("Start page");

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
    const token = this.auth.getToken();

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
}
