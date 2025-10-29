import { BaseManager } from "./base-manager.js";
import { MessageRenderer } from "./message/message-renderer.js";
import { MessageActions } from "./message/message-actions.js";
import { MessageReactions } from "./message/message-reactions.js";
import { MessageNotifications } from "./message/message-notifications.js";
import { MessageScroll } from "./message/message-scroll.js";

/**
 * MessageManager - Main coordinator for message functionality
 * Delegates to specialized modules for different concerns
 */
export class MessageManager extends BaseManager {
  constructor(api, auth, ErrorController, imageManager) {
    super(api, auth, ErrorController);

    // Store image manager
    this.imageManager = imageManager;

    // Initialize specialized modules
    this.renderer = new MessageRenderer(api, auth, ErrorController);
    this.actions = new MessageActions(api, auth, ErrorController);
    this.Reac = new MessageReactions(api, auth, ErrorController);
    this.notifications = new MessageNotifications(api, auth, ErrorController);
    this.scroll = new MessageScroll(api, auth, ErrorController);

    // Message state
    this.curChannelId = null;
    this.messages = [];

    // Cache DOM elements
    this.dom = {
      messagesContainer: document.getElementById("channel-messages"),
      messageInput: document.getElementById("message-input"),
      messageForm: document.getElementById("message-form"),
      viewPinnedButton: document.getElementById("view-pinned-messages-button"),
      pinnedMessagesContainer: document.getElementById("pinned-messages-container"),
      pinnedMessagesContent: document.getElementById("pinned-messages-content"),
      pinnedMessagesClose: document.getElementById("pinned-messages-close"),
    };
  }

  /**
   * Initialize message manager
   */
  init() {
    this.setupEventListeners();

    // Initialize sub-modules
    // handle what to do when Reac is toggled
    this.Reac.init((message, emoji) => this.handleReacToggle(message, emoji));
    this.scroll.init(this.dom.messagesContainer, (newMessages, previousScrollHeight) => {
      this.handleLoadMoreMessages(newMessages, previousScrollHeight);
    });
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

    // View pinned messages button
    if (this.dom.viewPinnedButton) {
      this.dom.viewPinnedButton.addEventListener("click", () => {
        this.handleViewPinnedMessages();
      });
    }

    // Close pinned messages modal
    if (this.dom.pinnedMessagesClose) {
      this.dom.pinnedMessagesClose.addEventListener("click", () => {
        this.hidePinnedMessagesModal();
      });
    }

    // Close modal when clicking outside
    if (this.dom.pinnedMessagesContainer) {
      this.dom.pinnedMessagesContainer.addEventListener("click", (e) => {
        if (e.target === this.dom.pinnedMessagesContainer) {
          this.hidePinnedMessagesModal();
        }
      });
    }
  }

  /**
   * Load messages for a channel
   * @param {number} channelId - Channel ID
   */
  loadMessages(channelId) {
    this.curChannelId = channelId;
    this.messages = [];

    // Reset scroll state for new channel
    this.scroll.reset(channelId);

    // Update image manager with curr channel
    if (this.imageManager) {
      this.imageManager.setcurrChannel(channelId);
    }

    const token = this.auth.getToken();

    return this.api
      .getMessages(channelId, 0, token)
      .then((response) => {
        this.messages = response.messages || [];

        // Sort messages by time (oldest first, newest last)
        this.messages.sort((a, b) => new Date(a.sentAt) - new Date(b.sentAt));

        // Set up notifications for this channel
        const lastMessageId = this.messages.length > 0
          ? Math.max(...this.messages.map(m => m.id))
          : null;
        this.notifications.setcurrChannel(channelId, lastMessageId);

        // Fetch user details for all senders
        return this.enrichMessagesWithUserData(this.messages);
      })
      .then((fullMessages) => {
        this.messages = fullMessages;

        // Update image manager with channel images
        if (this.imageManager) {
          this.imageManager.updateChannelImages(this.messages);
        }

        this.renderMessages();
        this.scroll.scrollToBottom();
        return this.messages;
      })
      .catch((error) => {
        this.showError(error.message || "Failed to load messages");
        throw error;
      });
  }

  /**
   * Enrich messages with user data (name and image)
   * @param {Array} messages - Array of message objects
   * @returns {Promise<Array>} - Messages with senderName and senderImage
   */
  enrichMessagesWithUserData(messages) {
    if (!messages || messages.length === 0) {
      return Promise.resolve([]);
    }

    // Get unique sender IDs
    const senderIds = [...new Set(messages.map(msg => msg.sender))];

    // Fetch user details for all senders in parallel
    const userDetailsPromises = senderIds.map(senderId =>
      this.getUserDetails(senderId)
    );

    return Promise.all(userDetailsPromises)
      .then((users) => {
        // Create a map of senderId -> userData
        const userMap = new Map();
        senderIds.forEach((senderId, index) => {
          userMap.set(senderId, users[index]);
        });

        // Enrich each message with sender data
        return messages.map(msg => {
          const userDetail = userMap.get(msg.sender);
          return {
            ...msg,
            senderName: userDetail ? userDetail.name : "Unknown User",
            senderImage: userDetail ? userDetail.image : null
          };
        });
      });
  }

  /**
   * Handle loading more messages from infinite scroll
   * @param {Array} newMessages - New messages loaded
   * @param {number} previousScrollHeight - Previous scroll height
   */
  handleLoadMoreMessages(newMessages, previousScrollHeight) {
    if (newMessages.length === 0) {
      return;
    }

    // Enrich new messages with user data
    this.enrichMessagesWithUserData(newMessages)
      .then((fullMessages) => {
        if (fullMessages.length > 0) {
          // Prepend older messages to the array
          this.messages = [...fullMessages, ...this.messages];
          this.renderMessages();

          // Maintain scroll position to prevent jumping
          this.scroll.unchangeScrollPosition(previousScrollHeight);
        }
      })
      .catch((error) => {
        this.showError(error.message || "Failed to load more messages");
      });
  }

  /**
   * Render all messages
   */
  renderMessages() {
    const handlers = {
      onEdit: (message) => this.handleEditMessage(message),
      onDelete: (message) => this.handleDeleteMessage(message),
      onReact: (message, emoji) => this.handleReacToggle(message, emoji),
      onShowReacPicker: (message) => this.Reac.showReacPicker(message),
      onPin: (message) => this.handlePinMessage(message),
    };

    this.renderer.renderMessages(
      this.dom.messagesContainer,
      this.messages,
      handlers,
      this.imageManager
    );
  }

  /**
   * Handle send message
   */
  handleSendMessage() {
    const messageText = this.dom.messageInput.value.trim();

    this.actions
      .sendMessage(this.curChannelId, messageText)
      .then(() => {
        // Clear input
        this.dom.messageInput.value = "";

        // Reload messages
        return this.loadMessages(this.curChannelId);
      })
      .catch((error) => {
        this.showError(error.message || "Failed to send message");
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

    this.actions
      .editMessage(this.curChannelId, message.id, newText)
      .then(() => {
        // Reload messages
        return this.loadMessages(this.curChannelId);
      })
      .catch((error) => {
        this.showError(error.message || "Failed to edit message");
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

    this.actions
      .deleteMessage(this.curChannelId, message.id)
      .then(() => {
        // Reload messages
        return this.loadMessages(this.curChannelId);
      })
      .catch((error) => {
        this.showError(error.message || "Failed to delete message");
      });
  }

  /**
   * Handle pin/unpin message
   * @param {Object} message - Message to pin/unpin
   */
  handlePinMessage(message) {

    const action = message.pinned ? this.actions.unpinMessage(this.curChannelId, message.id) :
    this.actions.pinMessage(this.curChannelId, message.id);
    action
      .then(() => {
        // Reload messages
        return this.loadMessages(this.curChannelId);
      })
      .catch((error) => {
        this.showError(error.message || "Failed to pin/unpin message");
      });
  }

  /**
   * Handle Reac toggle
   * @param {Object} message - Message
   * @param {string} emoji - Emoji Reac
   */
  handleReacToggle(message, emoji) {
    this.Reac
      .toggleReac(this.curChannelId, message, emoji)
      .then(() => {
        // Reload messages
        return this.loadMessages(this.curChannelId);
      })
      .catch((error) => {
        this.showError(error.message || "Failed to update Reac");
      });
  }

  /**
   * Start push notifications
   */
  startPushNotifications() {
    // Set up callback for when new messages arrive in current channel
    this.notifications.setOnNewMessageCallback(() => {
      if (this.curChannelId) {
        this.loadMessages(this.curChannelId);
      }
    });

    // Start the notification polling
    this.notifications.start();
  }

  /**
   * Stop push notifications
   */
  stopPushNotifications() {
    this.notifications.stop();
  }

  /**
   * Handle view pinned messages
   */
  handleViewPinnedMessages() {
    // Filter pinned messages from current messages
    const pinnedMessages = this.messages.filter(msg => msg.pinned);

    // Clear pinned messages container
    this.clearElement(this.dom.pinnedMessagesContent);

    if (pinnedMessages.length === 0) {
      // Show empty state
      const emptyDiv = document.createElement("div");
      emptyDiv.className = "empty-messages";
      emptyDiv.textContent = "No pinned messages in this channel.";
      this.dom.pinnedMessagesContent.appendChild(emptyDiv);
    } else {
      // Render pinned messages (no handlers needed for modal view)
      const handlers = {
        onEdit: null,
        onDelete: null,
        onPin: null,
        onReact: null,
        onShowReacPicker: null
      };

      pinnedMessages.forEach((message) => {
        const messageElement = this.renderer.createMessageElement(message, handlers, this.imageManager);
        this.dom.pinnedMessagesContent.appendChild(messageElement);
      });
    }

    // Show modal
    this.showElement(this.dom.pinnedMessagesContainer, "flex");
  }

  /**
   * Hide pinned messages modal
   */
  hidePinnedMessagesModal() {
    this.hideElement(this.dom.pinnedMessagesContainer);
  }

  /**
   * Clear messages
   */
  clearMessages() {
    this.curChannelId = null;
    this.messages = [];
    this.scroll.reset(null);
    this.notifications.clearChannel();

    if (this.dom.messagesContainer) {
      this.clearElement(this.dom.messagesContainer);
    }
  }
}
