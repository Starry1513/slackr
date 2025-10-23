import { BaseManager } from "./base-manager.js";

/**
 * MessageManager - Manages all message-related functionality
 * Responsible for: displaying messages, sending messages, editing/deleting messages, reactions, pinning
 */
export class MessageManager extends BaseManager {
  constructor(api, auth, ErrorController) {
    super(api, auth, ErrorController);

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
    // Emoji picker close
    if (this.dom.emojiPickerClose) {
      this.dom.emojiPickerClose.addEventListener("click", () => this.hideEmojiPicker());
    }

    // Emoji grid click (delegation)
    if (this.dom.emojiPickerGrid) {
      this.dom.emojiPickerGrid.addEventListener("click", (e) => {
        const btn = e.target.closest("button[data-emoji]");
        if (!btn) return;
        const emoji = btn.dataset.emoji;
        if (!emoji) return;
        if (this.currentEmojiMessage) {
          this.toggleReaction(this.currentEmojiMessage, emoji);
        }
        this.hideEmojiPicker();
      });

      // populate grid once
      this.renderEmojiGrid();
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
        this.ErrorController.showError(error.message || "Failed to load messages");
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
        this.ErrorController.showError(error.message || "Failed to load more messages");
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

    // Sender image
    if (message.senderImage) {
      const imgFragment = this.templates.senderImage.content.cloneNode(true);
      const img = imgFragment.querySelector(".message-sender-image");
      img.src = message.senderImage;
      img.alt = message.senderName || "User";
      imageContainer.appendChild(imgFragment);
    } else {
      const placeholderFragment = this.templates.senderPlaceholder.content.cloneNode(true);
      const placeholder = placeholderFragment.querySelector(".message-sender-image");
      placeholder.textContent = (message.senderName || "U")[0].toUpperCase();
      imageContainer.appendChild(placeholderFragment);
    }

    // Sender name and timestamp
    senderName.textContent = message.senderName || "Unknown User";
    timestamp.textContent = this.formatTimestamp(message.sentAt);

    // Message actions (edit, delete)
    if (isOwnMessage) {
      this.showElement(actionsDiv, "flex");
      const editBtn = actionsDiv.querySelector(".edit-message-btn");
      const deleteBtn = actionsDiv.querySelector(".delete-message-btn");

      editBtn.onclick = () => this.handleEditMessage(message);
      deleteBtn.onclick = () => this.handleDeleteMessage(message);
    }

    // Message text
    if (message.message) {
      this.showElement(textElem, "block");
      textElem.textContent = message.message;

      if (message.edited) {
        const editedFragment = this.templates.editedSpan.content.cloneNode(true);
        textElem.appendChild(editedFragment);
      }
    }

    // Message image
    if (message.image) {
      this.showElement(imageElem, "block");
      imageElem.src = message.image;
    }

    // Reactions - always show to allow adding reactions and display default emojis
    this.showElement(reactionsDiv, "flex");
    this.populateReactions(reactionsDiv, message);

    // Pinned indicator
    if (message.pinned) {
      this.showElement(pinnedBadge, "inline-block");
    }

    return messageFragment;
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

    if (message.reacts && message.reacts.length > 0) {
      message.reacts.forEach((react) => {
        const emoji = react.react;
        if (!reactionCounts[emoji]) {
          reactionCounts[emoji] = 0;
        }
        reactionCounts[emoji]++;
        if (react.user === currentUserId) {
          userReactions.add(emoji);
        }
      });
    }

    // Create reaction buttons for existing reactions (with counts)
    Object.entries(reactionCounts).forEach(([emoji, count]) => {
      const reactionFragment = this.templates.reactionBtn.content.cloneNode(true);
      const reactionBtn = reactionFragment.querySelector(".reaction-btn");

      if (userReactions.has(emoji)) {
        this.addClass(reactionBtn, "reacted");
      }
      reactionBtn.textContent = `${emoji} ${count}`;
      reactionBtn.onclick = () => this.toggleReaction(message, emoji);

      reactionsDiv.appendChild(reactionFragment);
    });

    // Add default emoji buttons (first 3 common emojis that haven't been used)
    const defaultEmojiCount = 3;
    let addedDefaults = 0;
    for (const emoji of this.commonEmojis) {
      if (addedDefaults >= defaultEmojiCount) break;
      if (reactionCounts[emoji]) continue; // Skip if already has reactions

      const reactionFragment = this.templates.reactionBtn.content.cloneNode(true);
      const reactionBtn = reactionFragment.querySelector(".reaction-btn");
      reactionBtn.textContent = emoji;
      reactionBtn.onclick = () => this.toggleReaction(message, emoji);

      reactionsDiv.appendChild(reactionFragment);
      addedDefaults++;
    }

    // Add reaction button from template (at the end)
    const addReactionFragment = this.templates.addReactionBtn.content.cloneNode(true);
    const addReactionBtn = addReactionFragment.querySelector(".add-reaction-btn");
    addReactionBtn.onclick = () => this.showReactionPicker(message);

    reactionsDiv.appendChild(addReactionFragment);
  }

  /**
   * Format timestamp
   * @param {string} timestamp - ISO timestamp
   * @returns {string}
   */
  formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    // Less than a minute
    if (diff < 60000) {
      return "Just now";
    }

    // Less than an hour
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    }

    // Less than a day
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    }

    // More than a day
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  /**
   * Handle send message
   */
  handleSendMessage() {
    const messageText = this.dom.messageInput.value.trim();

    if (!messageText) {
      return;
    }

    if (!this.currentChannelId) {
      this.ErrorController.showError("Please select a channel first");
      return;
    }

    const token = this.auth.getToken();

    this.api
      .sendMessage(this.currentChannelId, messageText, null, token)
      .then(() => {
        // Clear input
        this.dom.messageInput.value = "";

        // Reload messages
        return this.loadMessages(this.currentChannelId);
      })
      .catch((error) => {
        this.ErrorController.showError(error.message || "Failed to send message");
      });
  }

  /**
   * Handle edit message
   * @param {Object} message - Message to edit
   */
  handleEditMessage(message) {
    const newText = prompt("Edit message:", message.message);
    if (newText === null || newText.trim() === "") {
      return;
    }

    const token = this.auth.getToken();

    this.api
      .editMessage(this.currentChannelId, message.id, newText, null, token)
      .then(() => {
        // Reload messages
        return this.loadMessages(this.currentChannelId);
      })
      .catch((error) => {
        this.ErrorController.showError(error.message || "Failed to edit message");
      });
  }

  /**
   * Handle delete message
   * @param {Object} message - Message to delete
   */
  handleDeleteMessage(message) {
    if (!confirm("Are you sure you want to delete this message?")) {
      return;
    }

    const token = this.auth.getToken();

    this.api
      .deleteMessage(this.currentChannelId, message.id, token)
      .then(() => {
        // Reload messages
        return this.loadMessages(this.currentChannelId);
      })
      .catch((error) => {
        this.ErrorController.showError(error.message || "Failed to delete message");
      });
  }

  /**
   * Toggle reaction
   * @param {Object} message - Message
   * @param {string} emoji - Emoji reaction
   */
  toggleReaction(message, emoji) {
    const token = this.auth.getToken();
    const currentUserId = parseInt(this.auth.getUserId());

    // Check if user already reacted with this emoji
    const hasReacted = message.reacts.some(
      (react) => react.user === currentUserId && react.react === emoji
    );

    const apiCall = hasReacted
      ? this.api.unreactToMessage(this.currentChannelId, message.id, emoji, token)
      : this.api.reactToMessage(this.currentChannelId, message.id, emoji, token);

    apiCall
      .then(() => {
        // Reload messages
        return this.loadMessages(this.currentChannelId);
      })
      .catch((error) => {
        this.ErrorController.showError(error.message || "Failed to update reaction");
      });
  }

  /**
   * Show reaction picker (simple prompt for now)
   * @param {Object} message - Message
   */
  showReactionPicker(message) {
    // Open emoji picker modal and remember the message
    this.currentEmojiMessage = message;
    if (this.dom.emojiPickerModal) {
      this.dom.emojiPickerModal.style.display = "flex";
    }
    // ensure grid is populated
    this.renderEmojiGrid();
  }

  /**
   * Render the emoji picker grid from commonEmojis
   */
  renderEmojiGrid() {
    if (!this.dom.emojiPickerGrid) return;
    // Clear existing
    this.clearElement(this.dom.emojiPickerGrid);

    this.commonEmojis.forEach((emoji) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "emoji-btn";
      btn.dataset.emoji = emoji;
      btn.textContent = emoji;
      this.dom.emojiPickerGrid.appendChild(btn);
    });
  }

  /**
   * Hide emoji picker
   */
  hideEmojiPicker() {
    this.currentEmojiMessage = null;
    if (this.dom.emojiPickerModal) {
      this.dom.emojiPickerModal.style.display = "none";
    }
  }

  /**
   * Scroll to bottom of messages
   */
  scrollToBottom() {
    if (this.dom.messagesContainer) {
      this.dom.messagesContainer.scrollTop = this.dom.messagesContainer.scrollHeight;
    }
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
