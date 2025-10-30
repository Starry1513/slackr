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
  constructor(api, auth, ErrorController, imageManager, offlineManager = null) {
    super(api, auth, ErrorController);

    // Store image manager and offline manager
    this.imageManager = imageManager;
    this.offlineManager = offlineManager;

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
      messageInputContainer: document.querySelector(".message-input-container"),
      viewPinnedButton: document.getElementById("view-pinned-messages-button"),
      pinnedMessagesContainer: document.getElementById("pinned-messages-container"),
      pinnedMessagesContent: document.getElementById("pinned-messages-content"),
      pinnedMessagesClose: document.getElementById("pinned-messages-close"),
      // Edit message modal
      editMessageContainer: document.getElementById("edit-message-container"),
      editMessageForm: document.getElementById("edit-message-form"),
      editMessageText: document.getElementById("edit-message-text"),
      editMessageClose: document.getElementById("edit-message-close"),
      editMessageCancel: document.getElementById("edit-message-cancel"),
    };

    // Current message being edited
    this.editingMessage = null;
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

    // Auto-resize textarea on input
    if (this.dom.messageInput) {
      this.dom.messageInput.addEventListener("input", () => {
        this.autoResizeTextarea(this.dom.messageInput);
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

    // Edit message modal
    if (this.dom.editMessageForm) {
      this.dom.editMessageForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleEditMessageSubmit();
      });
    }

    if (this.dom.editMessageClose) {
      this.dom.editMessageClose.addEventListener("click", () => {
        this.hideEditMessageModal();
      });
    }

    if (this.dom.editMessageCancel) {
      this.dom.editMessageCancel.addEventListener("click", () => {
        this.hideEditMessageModal();
      });
    }

    // Close modal when clicking outside
    if (this.dom.editMessageContainer) {
      this.dom.editMessageContainer.addEventListener("click", (e) => {
        if (e.target === this.dom.editMessageContainer) {
          this.hideEditMessageModal();
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

    // Check if offline
    if (this.offlineManager && !this.offlineManager.getOnlineStatus()) {
      // Load from cache
      const cachedMessages = this.offlineManager.getCachedMessages(channelId);
      if (cachedMessages) {
        return this.handleMessagesData(cachedMessages, channelId);
      } else {
        this.showError("Messages not available offline. Please connect to the internet.");
        return Promise.reject(new Error("Offline and no cache available"));
      }
    }

    // Online - fetch from API
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

        // Cache messages for offline use
        if (this.offlineManager) {
          this.offlineManager.cacheMessages(channelId, fullMessages);
        }

        // Update image manager with channel images
        if (this.imageManager) {
          this.imageManager.updateChannelImages(this.messages);
        }

        this.renderMessages();
        this.scroll.scrollToBottom();
        return this.messages;
      })
      .catch((error) => {
        // Try cache as fallback
        if (this.offlineManager) {
          const cachedMessages = this.offlineManager.getCachedMessages(channelId);
          if (cachedMessages) {
            console.log('[MessageManager] API failed, using cached messages');
            return this.handleMessagesData(cachedMessages, channelId);
          }
        }

        this.showError(error.message || "Failed to load messages");
        throw error;
      });
  }

  /**
   * Handle messages data (shared by online and offline paths)
   * @param {Array} messages - Messages array
   * @param {number} channelId - Channel ID
   */
  handleMessagesData(messages, channelId) {
    this.messages = messages;

    // Update image manager with channel images
    if (this.imageManager) {
      this.imageManager.updateChannelImages(this.messages);
    }

    this.renderMessages();
    this.scroll.scrollToBottom();
    return Promise.resolve(this.messages);
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
   * Auto-resize textarea based on content
   * @param {HTMLTextAreaElement} textarea - The textarea element to resize
   */
  autoResizeTextarea(textarea) {
    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = "auto";

    // Set height to scrollHeight (content height)
    textarea.style.height = textarea.scrollHeight + "px";
  }

  /**
   * Handle send message
   */
  handleSendMessage() {
    // Check if offline
    if (this.offlineManager && !this.offlineManager.getOnlineStatus()) {
      this.showError("Cannot send messages while offline. Please connect to the internet.");
      return;
    }

    const messageText = this.dom.messageInput.value.trim();

    this.actions
      .sendMessage(this.curChannelId, messageText)
      .then(() => {
        // Clear input
        this.dom.messageInput.value = "";

        // Reset textarea height
        this.autoResizeTextarea(this.dom.messageInput);

        // Reload messages
        return this.loadMessages(this.curChannelId);
      })
      .catch((error) => {
        this.showError(error.message || "Failed to send message");
      });
  }

  /**
   * Handle edit message - Show edit modal
   * @param {Object} message - Message to edit
   */
  handleEditMessage(message) {
    // Check if offline
    if (this.offlineManager && !this.offlineManager.getOnlineStatus()) {
      this.showError("Cannot edit messages while offline. Please connect to the internet.");
      return;
    }

    // Store the message being edited
    this.editingMessage = message;

    // Populate the textarea with current message text
    this.dom.editMessageText.value = message.message;

    // Show the modal
    this.showEditMessageModal();
  }

  /**
   * Handle edit message form submission
   */
  handleEditMessageSubmit() {
    if (!this.editingMessage) {
      return;
    }

    const newText = this.dom.editMessageText.value.trim();
    const originalText = this.editingMessage.message;

    // Validation: Check if empty
    if (newText === "") {
      this.showError("Message cannot be empty");
      return;
    }

    // Validation: Check if unchanged
    if (newText === originalText) {
      this.showError("Message content is unchanged");
      return;
    }

    // Send edit request
    this.actions
      .editMessage(this.curChannelId, this.editingMessage.id, newText)
      .then(() => {
        // Hide modal
        this.hideEditMessageModal();

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
    // Check if offline
    if (this.offlineManager && !this.offlineManager.getOnlineStatus()) {
      this.showError("Cannot delete messages while offline. Please connect to the internet.");
      return;
    }

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
    // Check if offline
    if (this.offlineManager && !this.offlineManager.getOnlineStatus()) {
      this.showError("Cannot pin/unpin messages while offline. Please connect to the internet.");
      return;
    }

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
    // Check if offline
    if (this.offlineManager && !this.offlineManager.getOnlineStatus()) {
      this.showError("Cannot add reactions while offline. Please connect to the internet.");
      return;
    }

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

  /**
   * Show join prompt for non-members
   * @param {Object} channelData - Channel data
   */
  showJoinPrompt(channelData) {
    if (!this.dom.messagesContainer) {
      return;
    }

    // Clear existing content
    this.clearElement(this.dom.messagesContainer);

    // Get template
    const template = document.getElementById("join-prompt-template");
    if (!template) {
      console.error("Join prompt template not found");
      return;
    }

    // Clone template
    const fragment = template.content.cloneNode(true);

    // Populate template elements
    const icon = fragment.querySelector(".join-prompt-icon");
    const title = fragment.querySelector(".join-prompt-title");
    const description = fragment.querySelector(".join-prompt-description");
    const message = fragment.querySelector(".join-prompt-message");
    const button = fragment.querySelector(".join-prompt-button");

    // Set content
    icon.textContent = channelData.private ? "🔒" : "#";
    title.textContent = channelData.name;
    description.textContent = channelData.description || "No description";

    // Set message based on channel type
    if (channelData.private) {
      message.textContent = "This is a private channel. You need an invitation to join.";
      // Hide button for private channels
      if (button) {
        button.style.display = "none";
      }
    } else {
      message.textContent = "You are not a member of this channel.";
      // Add click handler for public channels
      if (button) {
        button.addEventListener("click", () => {
          // Trigger the channel manager's join function
          window.dispatchEvent(new CustomEvent("join-channel-click"));
        });
      }
    }

    // Append to container
    this.dom.messagesContainer.appendChild(fragment);
  }

  /**
   * Hide message input
   */
  hideMessageInput() {
    if (this.dom.messageInputContainer) {
      this.dom.messageInputContainer.style.display = "none";
    }
  }

  /**
   * Show message input
   */
  showMessageInput() {
    if (this.dom.messageInputContainer) {
      this.dom.messageInputContainer.style.display = "flex";
    }
  }

  /**
   * Show edit message modal
   */
  showEditMessageModal() {
    if (this.dom.editMessageContainer) {
      this.dom.editMessageContainer.style.display = "flex";
      // Focus on textarea
      if (this.dom.editMessageText) {
        this.dom.editMessageText.focus();
        // Move cursor to end
        this.dom.editMessageText.setSelectionRange(
          this.dom.editMessageText.value.length,
          this.dom.editMessageText.value.length
        );
      }
    }
  }
  /**
   * Hide edit message modal
   */
  hideEditMessageModal() {
    if (this.dom.editMessageContainer) {
      this.dom.editMessageContainer.style.display = "none";
      // Clear form
      if (this.dom.editMessageText) {
        this.dom.editMessageText.value = "";
      }
      // Clear editing message reference
      this.editingMessage = null;
    }
  }
}
