import { BaseManager } from "../base-manager.js";

/**
 * MessageNotifications - Handles push notifications for new messages
 */
export class MessageNotifications extends BaseManager {
  constructor(api, auth, ErrorController) {
    super(api, auth, ErrorController);

    // Push notification state
    // Map of channelId -> last checked message ID
    this.channelLastChecked = new Map();
    this.currChannelId = null;
    this.notificationPeriod = null;
    this.onNewMessageCallback = null;
  }

  /**
   * Start push notifications (polling for new messages)
   */
  start() {
    // Request notification permission
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    // Start polling every 1 second
    if (this.notificationPeriod) {
      clearInterval(this.notificationPeriod);
    }

    this.notificationPeriod = setInterval(() => {
      this.checkForNewMessages();
    }, 1000);
  }

  /**
   * Stop push notifications
   */
  stop() {
    if (this.notificationPeriod) {
      clearInterval(this.notificationPeriod);
      this.notificationPeriod = null;
    }
  }

  /**
   * Set curr channel for notification tracking
   * @param {number} channelId - Channel ID
   * @param {number} lastMessageId - Last message ID seen
   */
  setcurrChannel(channelId, lastMessageId) {
  }

  /**
   * Clear curr channel
   */
  clearChannel() {
    this.currChannelId = null;
  }

  /**
   * Set callback for new messages
   * @param {Function} callback - Called when new messages are detected
   */
  setOnNewMessageCallback(callback) {
  }

  /**
   * Check for new messages and send notifications
   * Checks all joined channels for new messages
   */
  checkForNewMessages() {

  }

  /**
   * Check a specific channel for new messages
   * @param {number} channelId - Channel ID
   * @param {string} token - Auth token
   * @param {number} curUserId - Current user ID
   */
  checkChannelForNewMessages(channelId, token, curUserId) {

  }

  /**
   * Show browser notification for a message
   * @param {Object} message - Message object
   * @param {number} channelId - Channel ID where message was sent
   */
  showNotification(message, channelId) {

  }
}
