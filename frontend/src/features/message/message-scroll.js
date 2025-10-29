import { BaseManager } from "../base-manager.js";

/**
 * MessageScroll - Handles infinite scroll for messages
 */
export class MessageScroll extends BaseManager {
  constructor(api, auth, ErrorController) {
    super(api, auth, ErrorController);

    // Scroll state
    this.messageStart = 0;
    this.ifLoadingMore = false;
    this.hasMoreMessages = true;
    this.currChannelId = null;

    // DOM elements
    this.messagesContainer = null;
  }

  /**
   * Initialize scroll manager
   * @param {HTMLElement} messagesContainer - Messages container element
   * @param {Function} onLoadMore - Callback when more messages are loaded
   */
  init(messagesContainer, onLoadMore) {
    this.messagesContainer = messagesContainer;
    this.onLoadMore = onLoadMore;

    // Set up scroll listener
    if (this.messagesContainer) {
      this.messagesContainer.addEventListener("scroll", () => {
        // when scrolled to top, trigger load more
        if (this.messagesContainer.scrollTop === 0 && !this.ifLoadingMore) {
          this.loadMoreMessages();
        }
      });
    }
  }

  /**
   * Reset scroll state for a new channel
   * @param {number} channelId - Channel ID
   */
  reset(channelId) {
    this.currChannelId = channelId;
    this.messageStart = 0;
    this.hasMoreMessages = true;
    this.ifLoadingMore = false;
  }

  /**
   * Load more messages (infinite scroll)
   */
  loadMoreMessages() {

  }

  /**
   * Scroll to bottom of messages
   */
  scrollToBottom() {

  }

  /**
   * Maintain scroll position after loading older messages
   * @param {number} previousScrollHeight - Previous scroll height
   */
  unchangeScrollPosition(previousScrollHeight) {

  }

  /**
   * Show loading indicator at top of messages
   */
  showLoadingIndicator() {

  }


}
