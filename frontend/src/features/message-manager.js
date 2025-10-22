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

  }

  /**
   * Load messages for a channel
   * @param {number} channelId - Channel ID
   */
  loadMessages(channelId) {

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
