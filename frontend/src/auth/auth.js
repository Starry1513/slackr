export class AuthManager {
  constructor() {
    this.TOKEN_KEY = "slackr_token";
    this.USER_ID_KEY = "slackr_user_id";
    this.name="Unkowned name";
  }

  saveAuthToken(token, userId) {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_ID_KEY, userId.toString());
  }
  saveName(name) {
    localStorage.setItem(this.name, name);
  }
  getName() {
    return localStorage.getItem(this.name);
  }

  getToken() {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getUserId() {
    const userId = localStorage.getItem(this.USER_ID_KEY);
    return userId ? parseInt(userId) : null;
  }

  checkLogin() {
    return this.getToken() !== null;
  }

  cleanAuthToken() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_ID_KEY);
  }
}
