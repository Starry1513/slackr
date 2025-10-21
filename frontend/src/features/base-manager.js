/**
 * BaseManager - Base class for all managers
 * Provides common functionality shared across managers
 */
export class BaseManager {
  constructor(api, auth, pageController) {
    this.api = api;
    this.auth = auth;
    this.pageController = pageController;
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
}
