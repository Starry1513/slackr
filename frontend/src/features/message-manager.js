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
    if (!this.currentChannelId || this.isLoadingMore) {
      return;
    }

    this.isLoadingMore = true;
    this.messageStart += 25; // Assuming 25 messages per page

    const token = this.auth.getToken();
    const scrollHeight = this.dom.messagesContainer.scrollHeight;

    this.api
      .getMessages(this.currentChannelId, this.messageStart, token)
      .then((response) => {
        const newMessages = response.messages || [];
        if (newMessages.length > 0) {
          this.messages = [...newMessages, ...this.messages];
          this.renderMessages();
          // Maintain scroll position
          this.dom.messagesContainer.scrollTop =
            this.dom.messagesContainer.scrollHeight - scrollHeight;
        }
        this.isLoadingMore = false;
      })
      .catch((error) => {
        this.pageController.showError(error.message || "Failed to load more messages");
        this.isLoadingMore = false;
      });
  }

  /**
   * Render all messages
   */
  renderMessages() {
    if (!this.dom.messagesContainer) {
      return;
    }

    // Clear messages container
    this.clearElement(this.dom.messagesContainer);

    if (this.messages.length === 0) {
      const emptyMessage = this.templates.emptyMessages.content.cloneNode(true);
      this.dom.messagesContainer.appendChild(emptyMessage);
      return;
    }

    this.messages.forEach((message) => {
      const messageElement = this.createMessageElement(message);
      this.dom.messagesContainer.appendChild(messageElement);
    });
  }

  /**
   * Create a message element
   * @param {Object} message - Message data
   * @returns {HTMLElement}
   */
  createMessageElement(message) {
    // Clone template
    const messageFragment = this.templates.message.content.cloneNode(true);
    const messageDiv = messageFragment.querySelector(".message");

    // Set message ID
    messageDiv.dataset.messageId = message.id;

    // Check if current user is the sender
    const currentUserId = parseInt(this.getUserId());
    const isOwnMessage = message.sender === currentUserId;
    if (isOwnMessage) {
      this.addClass(messageDiv, "own-message");
    }

    // Get elements
    const imageContainer = messageDiv.querySelector(".message-sender-image-container");
    const senderName = messageDiv.querySelector(".message-sender-name");
    const timestamp = messageDiv.querySelector(".message-timestamp");
    const actionsDiv = messageDiv.querySelector(".message-actions");
    const textElem = messageDiv.querySelector(".message-text");
    const imageElem = messageDiv.querySelector(".message-image");
    const reactionsDiv = messageDiv.querySelector(".message-reactions");
    const pinnedBadge = messageDiv.querySelector(".message-pinned-badge");


  }

  /**
   * Populate reactions in a reactions container
   * @param {HTMLElement} reactionsDiv - Reactions container
   * @param {Object} message - Message data
   */
  populateReactions(reactionsDiv, message) {
    // Clear existing reactions
    this.clearElement(reactionsDiv);

    // Group reactions by emoji
    const reactionCounts = {};
    const currentUserId = parseInt(this.getUserId());
    const userReactions = new Set();

   

  /**
   * Handle send message
   */
  handleSendMessage() {
    
  }

  /**
   * Handle edit message
   * @param {Object} message - Message to edit
   */
  handleEditMessage(message) {

  }

  /**
   * Handle delete message
   * @param {Object} message - Message to delete
   */
  handleDeleteMessage(message) {

  }

  /**
   * Toggle reaction
   * @param {Object} message - Message
   * @param {string} emoji - Emoji reaction
   */
  toggleReaction(message, emoji) {

  }

  /**
   * Show reaction picker (simple prompt for now)
   * @param {Object} message - Message
   */
  showReactionPicker(message) {

  }
  /**
   * Clear messages
   */
  clearMessages() {
    this.currentChannelId = null;
    this.messages = [];
    this.messageStart = 0;
    if (this.dom.messagesContainer) {
      this.clearElement(this.dom.messagesContainer);
    }
  }
}
