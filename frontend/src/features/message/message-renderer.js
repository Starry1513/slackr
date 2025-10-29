import { BaseManager } from "../base-manager.js";
import { helperManager } from "../helper-manager.js";

/**
 * MessageRenderer - Handles rendering of message UI
 */
export class MessageRenderer extends BaseManager {
  constructor(api, auth, ErrorController) {
    super(api, auth, ErrorController);
    this.helperManager = new helperManager();

    // Cache templates
    this.templates = {
      message: document.getElementById("message-template"),
      ReacBtn: document.getElementById("reaction-btn-template"),
      addReacBtn: document.getElementById("add-reaction-btn-template"),
      emptyMessages: document.getElementById("empty-messages-template"),
      senderImage: document.getElementById("sender-image-template"),
      senderPlaceholder: document.getElementById("sender-placeholder-template"),
      editedSpan: document.getElementById("edited-span-template"),

    };
  }

  /**
   * Render all messages in a container
   * @param {HTMLElement} container - Container element
   * @param {Array} messages - Array of messages
   * @param {Object} handlers - Event handlers { onEdit, onDelete, onReact, onShowReacPicker }
   * @param {Object} imageManager - Image manager for handling images
   */
  renderMessages(container, messages, handlers, imageManager) {
    if (!container) {
      return;
    }

    // Clear messages container
    this.clearElement(container);
    // If no messages, show empty state
    if (messages.length === 0) {
      const emptyMessage = this.templates.emptyMessages.content.cloneNode(true);
      container.appendChild(emptyMessage);
      return;
    }
    // Render each message
    messages.forEach((message) => {
      const messageElement = this.createMessageElement(message, handlers, imageManager);
      container.appendChild(messageElement);
    });
  }

  /**
   * Create a message element
   * @param {Object} message - Message data
   * @param {Object} handlers - Event handlers
   * @param {Object} imageManager - Image manager
   * @returns {HTMLElement}
   */
  createMessageElement(message, handlers, imageManager) {
    // Clone template
    const messageFragment = this.templates.message.content.cloneNode(true);
    const messageDiv = messageFragment.querySelector(".message");

    // Set message ID
    messageDiv.dataset.messageId = message.id;

    // Check if curr user is the sender
    const curUserId = parseInt(this.getUserId());
    const isOwnMessage = message.sender === curUserId;
    if (isOwnMessage) {
      this.addClass(messageDiv, "own-message");
    }

    // Get elements
    const imageContainer = messageDiv.querySelector(".message-sender-image-container");
    const senderName = messageDiv.querySelector(".message-sender-name");
    const timestamp = messageDiv.querySelector(".message-timestamp");
    const textElem = messageDiv.querySelector(".message-text");
    const imageElem = messageDiv.querySelector(".message-image");
    const ReacDiv = messageDiv.querySelector(".message-reactions");
    const pinnedBadge = messageDiv.querySelector(".message-pinned-badge");
    const actionsDiv = messageDiv.querySelector(".message-actions");


    // Sender image - use helperManager for unified handling
    this.helperManager.renderUserImageFromTemplate(
      imageContainer,
      this.templates.senderImage,
      message.senderImage,
      message.senderName || "User"
    );

    // Sender name and timestamp
    senderName.textContent = message.senderName || "Unknown User";
    timestamp.textContent = this.formatTimestamp(message.sentAt);

    // Message actions (pin, edit, delete)
    if (isOwnMessage && handlers.onEdit && handlers.onDelete && handlers.onPin) {
      this.showElement(actionsDiv, "flex");
      const pinBtn = actionsDiv.querySelector(".pin-message-btn");
      const editBtn = actionsDiv.querySelector(".edit-message-btn");
      const deleteBtn = actionsDiv.querySelector(".delete-message-btn");

      // Update pin button text based on pinned state
      if (message.pinned) {
        pinBtn.textContent = "📌 Unpin";
      } else {
        pinBtn.textContent = "📌 Pin";
      }

      pinBtn.onclick = () => handlers.onPin(message);
      editBtn.onclick = () => handlers.onEdit(message);
      deleteBtn.onclick = () => handlers.onDelete(message);
    }

    // Message text
    if (message.message) {
      this.showElement(textElem, "block");
      textElem.textContent = message.message;
      // if message is edited, append edited indicator
      if (message.edited) {
        const editedFragment = this.templates.editedSpan.content.cloneNode(true);
        const editedSpan = editedFragment.querySelector(".edited-indicator");

        // Add edited timestamp if available
        if (editedSpan) {
          // Hello, world! (edited 5 minutes ago)
          const editedTime = this.formatTimestamp(message.editedAt);
          editedSpan.textContent = `(edited ${editedTime})`;
        }

        textElem.appendChild(editedFragment);
      }
    }

    // Message image
    if (message.image) {
      this.showElement(imageElem, "block");
      imageElem.src = message.image;
      // Make image clickable to open viewer
      if (imageManager) {
        imageManager.makeImageClickable(imageElem, message.image);
      }
    }

    // Reac - always show to allow adding Reac and display default emojis
    if (handlers.onReact && handlers.onShowReacPicker) {
      this.showElement(ReacDiv, "flex");
      this.populateReac(ReacDiv, message, handlers);
    }

    // Pinned indicator
    if (message.pinned) {
      this.showElement(pinnedBadge, "inline-block");
    }

    return messageFragment;
  }

  /**
   * Populate Reac in a Reac container
   * @param {HTMLElement} ReacDiv - Reac container
   * @param {Object} message - Message data
   * @param {Object} handlers - Event handlers { onReact, onShowReacPicker }
   */
  populateReac(ReacDiv, message, handlers) {
    // Clear existing Reac
    this.clearElement(ReacDiv);

    const commonEmojis = ["👍", "❤️", "😄", "😮", "😢", "😡", "🎉", "🔥", "👏", "✅", "❌", "👀"];

    // Group Reac by emoji
    const ReacCounts = {};
    const curUserId = parseInt(this.getUserId());
    const userReac = new Set();

    if (message.reacts && message.reacts.length > 0) {
      message.reacts.forEach((react) => {
        const emoji = react.react;
        if (!ReacCounts[emoji]) {
          ReacCounts[emoji] = 0;
        }
        ReacCounts[emoji]++;
        if (react.user === curUserId) {
          userReac.add(emoji);
        }
      });
    }

    // Create Reac buttons for existing Reac (with counts)
    Object.entries(ReacCounts).forEach(([emoji, count]) => {
      const ReacFragment = this.templates.ReacBtn.content.cloneNode(true);
      const ReacBtn = ReacFragment.querySelector(".reaction-btn");

      if (userReac.has(emoji)) {
        this.addClass(ReacBtn, "reacted");
      }
      ReacBtn.textContent = `${emoji} ${count}`;
      ReacBtn.onclick = () => handlers.onReact(message, emoji);

      ReacDiv.appendChild(ReacFragment);
    });

    // Add default emoji buttons (first 3 common emojis that haven't been used)
    const defaultEmojiCount = 3;
    let addedDefaults = 0;
    for (const emoji of commonEmojis) {
      if (addedDefaults >= defaultEmojiCount) break;
      if (ReacCounts[emoji]) continue; // Skip if already has Reac

      const ReacFragment = this.templates.ReacBtn.content.cloneNode(true);
      const ReacBtn = ReacFragment.querySelector(".reaction-btn");
      ReacBtn.textContent = emoji;
      ReacBtn.onclick = () => handlers.onReact(message, emoji);

      ReacDiv.appendChild(ReacFragment);
      addedDefaults++;
    }

    // Add Reac button from template (at the end)
    const addReacFragment = this.templates.addReacBtn.content.cloneNode(true);
    const addReacBtn = addReacFragment.querySelector(".add-reaction-btn");
    addReacBtn.onclick = () => handlers.onShowReacPicker(message);

    ReacDiv.appendChild(addReacFragment);
  }

  /**
   * Format timestamp
   * @param {string} timestamp - ISO timestamp
   * @returns {string}
   */
  formatTimestamp(timestamp) {

  }
}
