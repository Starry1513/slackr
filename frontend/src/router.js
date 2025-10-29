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
   * Parse current URL hash and route to appropriate handler
   */
  handleRoute() {
    const hash = window.location.hash;

    if (!hash || hash === '#') {
      // No hash, do nothing (stay on current page)
      return;
    }

    // Parse hash
    if (hash.startsWith('#channel=')) {
      const channelId = parseInt(hash.replace('#channel=', ''));
      if (!isNaN(channelId) && this.handlers.channel) {
        this.handlers.channel(channelId);
      }
    } else if (hash.startsWith('#profile=')) {
      const userId = parseInt(hash.replace('#profile=', ''));
      if (!isNaN(userId) && this.handlers.profile) {
        this.handlers.profile(userId);
      }
    } else if (hash === '#profile') {
      if (this.handlers.profile) {
        this.handlers.profile(null); // null = own profile
      }
    }
  }

  /**
   * Navigate to a channel (updates URL)
   * @param {number} channelId - Channel ID
   */
  navigateToChannel(channelId) {
    window.location.hash = `#channel=${channelId}`;
  }

  /**
   * Navigate to a profile (updates URL)
   * @param {number|null} userId - User ID (null for own profile)
   */
  navigateToProfile(userId) {
    if (userId === null) {
      window.location.hash = '#profile';
    } else {
      window.location.hash = `#profile=${userId}`;
    }
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
