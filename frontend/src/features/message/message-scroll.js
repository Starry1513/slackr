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
    // If there's no channel selected or already loading or no more messages
    if (!this.currChannelId || this.ifLoadingMore || !this.hasMoreMessages) {
      return;
    }

    this.ifLoadingMore = true;
    this.messageStart += 25; // Load next 25 messages

    const token = this.auth.getToken();
    const previousScrollHeight = this.messagesContainer.scrollHeight;

    // Show loading indicator
    this.showLoadingIndicator();

    this.api
      .getMessages(this.currChannelId, this.messageStart, token)
      .then((response) => {
        // only responsible for fetching messages
        const nextMessages = response.messages || [];

        // If we got fewer than 25 messages, we've reached the end
        if (nextMessages.length < 25) {
          this.hasMoreMessages = false;
        }

        this.ifLoadingMore = false;
        this.hideLoadingIndicator();

        // after fetching messages, call the callback
        if (this.onLoadMore) {
          this.onLoadMore(nextMessages, previousScrollHeight);
        }

        return nextMessages;
      })
      .catch((error) => {
        this.showError(error.message || "Failed to load more messages");
        this.ifLoadingMore = false;
        this.hideLoadingIndicator();
      });
  }

  /**
   * Scroll to bottom of messages
   */
  scrollToBottom() {
    if (this.messagesContainer) {
      this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
  }

  /**
   * Maintain scroll position after loading older messages
   * @param {number} previousScrollHeight - Previous scroll height
   */
  unchangeScrollPosition(previousScrollHeight) {
    if (this.messagesContainer) {
      const newScrollHeight = this.messagesContainer.scrollHeight;
      // Adjust scrollTop to maintain position
      this.messagesContainer.scrollTop = newScrollHeight - previousScrollHeight;
    }
  }

  /**
   * Show loading indicator at top of messages
   */
  showLoadingIndicator() {
    if (!this.messagesContainer) return;

    // Check if loading indicator already exists
    let loadingDiv = this.messagesContainer.querySelector(".loading-indicator");
    if (!loadingDiv) {
      loadingDiv = document.createElement("div");
      loadingDiv.className = "loading-indicator";
      loadingDiv.textContent = "Loading more messages...";
      this.messagesContainer.insertBefore(loadingDiv, this.messagesContainer.firstChild);
    }
  }

  /**
   * Hide loading indicator
   */
  hideLoadingIndicator() {
    if (!this.messagesContainer) return;

    const loadingDiv = this.messagesContainer.querySelector(".loading-indicator");
    if (loadingDiv) {
      loadingDiv.remove();
    }
  }
}
