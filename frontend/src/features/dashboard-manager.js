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

}
