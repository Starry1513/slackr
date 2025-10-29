/**
 * Router - Handles fragment-based URL routing
 * Supports:
 * - /#channel={channelId}
 * - /#profile (own profile)
 * - /#profile={userId} (other user's profile)
 */
export class Router {
  constructor() {
    this.handlers = {
      channel: null,
      profile: null,
    };

    // Listen for hash changes (back/forward buttons)
    window.addEventListener('hashchange', () => {
      this.handleRoute();
    });

    // Listen for popstate (back/forward buttons)
    window.addEventListener('popstate', () => {
      this.handleRoute();
    });
  }

  /**
   * Register a handler for channel navigation
   * @param {Function} handler - Function(channelId)
   */
  onChannelRoute(handler) {
    this.handlers.channel = handler;
  }

  /**
   * Register a handler for profile navigation
   * @param {Function} handler - Function(userId or null for own profile)
   */
  onProfileRoute(handler) {
    this.handlers.profile = handler;
  }

  /**
   * Clear hash (go to dashboard home)
   */
  clearHash() {
    if (window.location.hash) {
      history.pushState('', document.title, window.location.pathname + window.location.search);
    }
  }

  /**
   * Initialize router - handle initial route on page load
   */
  init() {
    // Handle initial route if hash exists
    if (window.location.hash) {
      this.handleRoute();
    }
  }
}
