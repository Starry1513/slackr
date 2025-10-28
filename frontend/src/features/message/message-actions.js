import { BaseManager } from "../base-manager.js";

/**
 * MessageActions - Handles message operations (send, edit, delete)
 */
export class MessageActions extends BaseManager {
  constructor(api, auth, ErrorController) {
    super(api, auth, ErrorController);
  }

  /**
   * Send a message
   * @param {number} channelId - Channel ID
   * @param {string} messageText - Message text
   * @returns {Promise}
   */
  sendMessage(channelId, messageText) {
    if (!messageText || !messageText.trim()) {
      return Promise.reject(new Error("Message cannot be empty"));
    }

    if (!channelId) {
      return Promise.reject(new Error("Please select a channel first"));
    }

    const token = this.auth.getToken();

    return this.api.sendMessage(channelId, messageText, null, token);
  }

  /**
   * Edit a message
   * @param {number} channelId - Channel ID
   * @param {number} messageId - Message ID
   * @param {string} newText - New message text
   * @returns {Promise}
   */
  editMessage(channelId, messageId, newText) {
    if (!newText || !newText.trim()) {
      return Promise.reject(new Error("Message cannot be empty"));
    }

    const token = this.auth.getToken();

    return this.api.editMessage(channelId, messageId, newText, null, token);
  }

  /**
   * Delete a message
   * @param {number} channelId - Channel ID
   * @param {number} messageId - Message ID
   * @returns {Promise}
   */
  deleteMessage(channelId, messageId) {
    const token = this.auth.getToken();

    return this.api.deleteMessage(channelId, messageId, token);
  }

  /**
   * Pin a message
   * @param {number} channelId - Channel ID
   * @param {number} messageId - Message ID
   * @returns {Promise}
   */
  pinMessage(channelId, messageId) {
    const token = this.auth.getToken();

    return this.api.pinMessage(channelId, messageId, token);
  }

  /**
   * Unpin a message
   * @param {number} channelId - Channel ID
   * @param {number} messageId - Message ID
   * @returns {Promise}
   */
  unpinMessage(channelId, messageId) {
    const token = this.auth.getToken();

    return this.api.unpinMessage(channelId, messageId, token);
  }
}
