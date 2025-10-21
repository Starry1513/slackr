import { BACKEND_PORT } from "./config.js";

/**
 * ApiService provides methods to interact with the backend API, including
 * user authentication (register, login, logout) and a generic request handler.
 *
 * @class
 * @example
 * const api = new ApiService();
 * api.login('email@example.com', 'password123').then(data => { ... });
 */
export class ApiService {
  constructor() {
    this.baseUrl = `http://localhost:${BACKEND_PORT}`;
  }

  /**
   * Generic request method
   * @param {string} endpoint - API endpoint
   * @param {string} method - HTTP method
   * @param {object} body - Request body (optional)
   * @param {string} token - Auth token (optional)
   * @returns {Promise} Promise that resolves to response data
   */
  request(endpoint, method = "GET", body = null, token = null) {
    const options = {
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    if (token) {
      options.headers["Authorization"] = `Bearer ${token}`;
    }

    if (body) {
      options.body = JSON.stringify(body);
    }

    return fetch(`${this.baseUrl}${endpoint}`, options).then((response) => {
      return response.json().then((data) => {
        if (!response.ok) {
          throw new Error(data.error || "Request failed");
        }
        return data;
      });
    });
  }

  /**
   * Register a new user
   * @param {string} email
   * @param {string} password
   * @param {string} name
   * @returns {Promise<{token: string, userId: number}>}
   */
  register(email, password, name) {
    return this.request("/auth/register", "POST", { email, password, name });
  }

  /**
   * Login a user
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{token: string, userId: number}>}
   */
  login(email, password) {
    return this.request("/auth/login", "POST", { email, password });
  }

  /**
   * Logout a user
   * @param {string} token
   * @returns {Promise}
   */
  logout(token) {
    return this.request("/auth/logout", "POST", null, token);
  }

  /**
   * Get all channels
   * @param {string} token
   * @returns {Promise<{channels: Array}>}
   */
  getChannels(token) {
    return this.request("/channel", "GET", null, token);
  }

  /**
   * Create a new channel
   * @param {string} name
   * @param {string} description
   * @param {boolean} isPrivate
   * @param {string} token
   * @returns {Promise<{channelId: number}>}
   */
  createChannel(name, description, isPrivate, token) {
    return this.request("/channel", "POST", { name, description, private: isPrivate }, token);
  }

  /**
   * Get channel details
   * @param {number} channelId
   * @param {string} token
   * @returns {Promise<Channel>}
   */
  getChannelDetails(channelId, token) {
    return this.request(`/channel/${channelId}`, "GET", null, token);
  }

  /**
   * Update channel details
   * @param {number} channelId
   * @param {string} name
   * @param {string} description
   * @param {string} token
   * @returns {Promise}
   */
  updateChannel(channelId, name, description, token) {
    return this.request(`/channel/${channelId}`, "PUT", { name, description }, token);
  }

  /**
   * Join a channel
   * @param {number} channelId
   * @param {string} token
   * @returns {Promise}
   */
  joinChannel(channelId, token) {
    return this.request(`/channel/${channelId}/join`, "POST", null, token);
  }

  /**
   * Leave a channel
   * @param {number} channelId
   * @param {string} token
   * @returns {Promise}
   */
  leaveChannel(channelId, token) {
    return this.request(`/channel/${channelId}/leave`, "POST", null, token);
  }

  /**
   * Get user details
   * @param {number} userId
   * @param {string} token
   * @returns {Promise<User>}
   */
  getUserDetails(userId, token) {
    return this.request(`/user/${userId}`, "GET", null, token);
  }
}
