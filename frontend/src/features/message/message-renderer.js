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

  }

  /**
   * Populate Reac in a Reac container
   * @param {HTMLElement} ReacDiv - Reac container
   * @param {Object} message - Message data
   * @param {Object} handlers - Event handlers { onReact, onShowReacPicker }
   */
  populateReac(ReacDiv, message, handlers) {

  }

  /**
   * Format timestamp
   * @param {string} timestamp - ISO timestamp
   * @returns {string}
   */
  formatTimestamp(timestamp) {

  }
}
