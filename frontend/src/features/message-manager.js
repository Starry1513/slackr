import { BaseManager } from "./base-manager.js";

/**
 * MessageManager - Manages all message-related functionality
 * Responsible for: displaying messages, sending messages, editing/deleting messages, reactions, pinning
 */
export class MessageManager extends BaseManager {
  constructor(api, auth, pageController) {
    super(api, auth, pageController);

    // Message state
    this.currentChannelId = null;
    this.messageStart = 0;
    this.isLoadingMore = false;
    this.messages = [];

    // Current message for emoji picker
    this.currentEmojiMessage = null;

    // Common emojis for quick reactions
    this.commonEmojis = ["👍", "❤️", "😄", "😮", "😢", "😡", "🎉", "🔥", "👏", "✅", "❌", "👀"];
    
    // Cache DOM elements
    this.dom = {
      messagesContainer: document.getElementById("channel-messages"),
      messageInput: document.getElementById("message-input"),
      sendButton: document.getElementById("send-message-button"),
      messageForm: document.getElementById("message-form"),
      emojiPickerModal: document.getElementById("emoji-picker-modal"),
      emojiPickerGrid: document.getElementById("emoji-picker-grid"),
      emojiPickerClose: document.getElementById("emoji-picker-close"),
    };

    // Cache templates
    this.templates = {
      message: document.getElementById("message-template"),
      reactionBtn: document.getElementById("reaction-btn-template"),
      senderPlaceholder: document.getElementById("sender-placeholder-template"),
      editedSpan: document.getElementById("edited-span-template"),
      addReactionBtn: document.getElementById("add-reaction-btn-template"),
      emptyMessages: document.getElementById("empty-messages-template"),
      senderImage: document.getElementById("sender-image-template"),
    };
  }

  /**
   * Initialize message manager
   */
  init() {
    this.setupEventListeners();
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Send message form
    if (this.dom.messageForm) {
      this.dom.messageForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleSendMessage();
      });
    }

    // Scroll to load more messages
    if (this.dom.messagesContainer) {
      this.dom.messagesContainer.addEventListener("scroll", () => {
        if (this.dom.messagesContainer.scrollTop === 0 && !this.isLoadingMore) {
          this.loadMoreMessages();
        }
      });
    }
  }

  /**
   * Load messages for a channel
   * @param {number} channelId - Channel ID
   */
  loadMessages(channelId) {
    this.currentChannelId = channelId;
    this.messageStart = 0;
    this.messages = [];

    const token = this.auth.getToken();

    return this.api
      .getMessages(channelId, this.messageStart, token)
      .then((response) => {
        this.messages = response.messages || [];
        this.renderMessages();
        this.scrollToBottom();
        return this.messages;
      })
      .catch((error) => {
        this.pageController.showError(error.message || "Failed to load messages");
        throw error;
      });
  }

  /**
   * Load more messages (pagination)
   */
  loadMoreMessages() {
  }

  /**
   * Render all messages
   */
  renderMessages() {

  }
}
