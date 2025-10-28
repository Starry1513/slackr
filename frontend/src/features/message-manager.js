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
    this.reactions = new MessageReactions(api, auth, ErrorController);
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
    };
  }

  /**
   * Initialize message manager
   */
  init() {
    this.setupEventListeners();

    // Initialize sub-modules
    this.reactions.init((message, emoji) => this.handleReactionToggle(message, emoji));
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

    // Update image manager with current channel
    if (this.imageManager) {
      this.imageManager.setCurrentChannel(channelId);
    }

    const token = this.auth.getToken();

    return this.api
      .getMessages(channelId, 0, token)
      .then((response) => {
        this.messages = response.messages || [];

        // Set up notifications for this channel
        const lastMessageId = this.messages.length > 0
          ? Math.max(...this.messages.map(m => m.id))
          : null;
        this.notifications.setCurrentChannel(channelId, lastMessageId);

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
          this.scroll.maintainScrollPosition(previousScrollHeight);
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
      onReact: (message, emoji) => this.handleReactionToggle(message, emoji),
      onShowReactionPicker: (message) => this.reactions.showReactionPicker(message)
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
   * Handle reaction toggle
   * @param {Object} message - Message
   * @param {string} emoji - Emoji reaction
   */
  handleReactionToggle(message, emoji) {
    this.reactions
      .toggleReaction(this.curChannelId, message, emoji)
      .then(() => {
        // Reload messages
        return this.loadMessages(this.curChannelId);
      })
      .catch((error) => {
        this.showError(error.message || "Failed to update reaction");
      });
  }

  /**
   * Start push notifications
   */
  startPushNotifications() {
    this.notifications.start();

    // Set up callback for new messages
    const originalCheck = this.notifications.checkForNewMessages.bind(this.notifications);
    this.notifications.checkForNewMessages = () => {
      originalCheck((newMessages) => {
        if (this.curChannelId) {
          this.loadMessages(this.curChannelId);
        }
      });
    };
  }

  /**
   * Stop push notifications
   */
  stopPushNotifications() {
    this.notifications.stop();
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
