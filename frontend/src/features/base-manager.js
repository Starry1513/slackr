/**
 * BaseManager - Base class for all managers
 * Provides common functionality shared across managers
 */
export class BaseManager {
  constructor(api, auth, ErrorController) {
    this.api = api;
    this.auth = auth;
    this.ErrorController = ErrorController;

    this.userCache = new Map();
  }

  /**
   * Initialize the manager - to be overridden by child classes
   */
  init() {
    // Override in child classes
  }

  /**
   * Clear element (remove all children)
   * @param {HTMLElement} element - Element to clear
   */
  clearElement(element) {
    if (!element) return;
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  }

  /**
   * Show element
   * @param {HTMLElement} element - Element to show
   * @param {string} display - Display style (default: 'flex')
   */
  showElement(element, display = "flex") {
    if (element) {
      element.style.display = display;
    }
  }

  /**
   * Hide element
   * @param {HTMLElement} element - Element to hide
   */
  hideElement(element) {
    if (element) {
      element.style.display = "none";
    }
  }

  /**
   * Toggle element visibility
   * @param {HTMLElement} element - Element to toggle
   * @param {string} display - Display style when showing (default: 'flex')
   */
  toggleElement(element, display = "flex") {
    if (!element) return;
    if (element.style.display === "none" || !element.style.display) {
      this.showElement(element, display);
    } else {
      this.hideElement(element);
    }
  }

  /**
   * Add class to element
   * @param {HTMLElement} element - Element
   * @param {string} className - Class name to add
   */
  addClass(element, className) {
    if (element) {
      element.classList.add(className);
    }
  }

  /**
   * Remove class from element
   * @param {HTMLElement} element - Element
   * @param {string} className - Class name to remove
   */
  removeClass(element, className) {
    if (element) {
      element.classList.remove(className);
    }
  }

  /**
   * Toggle class on element
   * @param {HTMLElement} element - Element
   * @param {string} className - Class name to toggle
   */
  toggleClass(element, className) {
    if (element) {
      element.classList.toggle(className);
    }
  }

  /**
   * Get token from auth
   * @returns {string|null} Auth token
   */
  getToken() {
    return this.auth.getToken();
  }

  /**
   * Get user ID from auth
   * @returns {string|null} User ID
   */
  getUserId() {
    return this.auth.getUserId();
  }

  /**
   * Show error message
   * @param {string} message - Error message
   */
  showError(message) {
    this.ErrorController.showError(message);
  }

  /**
   * Create element with attributes
   * @param {string} tag - HTML tag
   * @param {Object} attributes - Attributes object
   * @param {string} textContent - Text content
   * @returns {HTMLElement}
   */
  createElement(tag, attributes = {}, textContent = null) {
    const element = document.createElement(tag);

    // Set attributes
    Object.keys(attributes).forEach((key) => {
      if (key === "className") {
        element.className = attributes[key];
      } else if (key === "style" && typeof attributes[key] === "object") {
        Object.assign(element.style, attributes[key]);
      } else {
        element.setAttribute(key, attributes[key]);
      }
    });

    // Set text content
    if (textContent) {
      element.textContent = textContent;
    }

    return element;
  }

  /**
   * Get user details by user ID (with caching)
   * @param {number} userId - User ID (optional, defaults to current user)
   * @returns {Promise<Object>} User data
   */
  getUserDetails(userId = null) {
    // Default to current user if no userId provided
    const targetUserId = userId !== null ? userId : parseInt(this.getUserId());

    // Check cache first
    if (this.userCache.has(targetUserId)) {
      return Promise.resolve(this.userCache.get(targetUserId));
    }

    const token = this.auth.getToken();

    return this.api
      .getUserDetails(targetUserId, token)
      .then((userData) => {
        this.userCache.set(targetUserId, userData);
        return userData;
      })
      .catch((error) => {
        console.error("Failed to get user details:", error);
        return { id: targetUserId, name: "Unknown User", image: null };
      });
  }
  /**
   * Clear user cache
   */
  clearCache() {
    this.userCache.clear();
  }
}
