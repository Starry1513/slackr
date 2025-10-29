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
    this.currChannelId = channelId;
    if (lastMessageId !== null) {
      this.channelLastChecked.set(channelId, lastMessageId);
    }
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
    this.onNewMessageCallback = callback;
  }

  /**
   * Check for new messages and send notifications
   * Checks all joined channels for new messages
   */
  checkForNewMessages() {
    const token = this.auth.getToken();
    const curUserId = parseInt(this.getUserId());

    // Get all channels the user has joined
    this.api
      .getChannels(token)
      .then((response) => {
        const channels = response.channels || [];

        // Filter to only joined channels
        const joinedChannels = channels.filter(channel =>
          channel.members && channel.members.includes(curUserId)
        );

        // Check each joined channel for new messages
        const checkPromises = joinedChannels.map(channel =>
          this.checkChannelForNewMessages(channel.id, token, curUserId)
        );

        return Promise.all(checkPromises);
      })
      .catch((error) => {
        // Silently fail for polling errors
        console.error("Error checking for new messages:", error);
      });
  }

  /**
   * Check a specific channel for new messages
   * @param {number} channelId - Channel ID
   * @param {string} token - Auth token
   * @param {number} curUserId - Current user ID
   */
  checkChannelForNewMessages(channelId, token, curUserId) {
    return this.api
      .getMessages(channelId, 0, token)
      .then((response) => {
        const theLatestMessages = response.messages || [];

        if (theLatestMessages.length === 0) {
          return;
        }

        // Get the last checked message ID for this channel
        const lastCheckedId = this.channelLastChecked.get(channelId);

        // Find messages newer than last checked
        const newMessages = theLatestMessages.filter(msg => {
          return lastCheckedId === undefined || msg.id > lastCheckedId;
        });

        if (newMessages.length > 0) {
          // Update last checked ID for this channel
          const maxMessageId = Math.max(...theLatestMessages.map(m => m.id));
          this.channelLastChecked.set(channelId, maxMessageId);

          // Filter out messages sent by curr user
          const othersMessages = newMessages.filter(msg => msg.sender !== curUserId);

          // Show notifications for messages from others
          othersMessages.forEach(msg => {
            this.showNotification(msg, channelId);
          });

          // If new messages in current channel, trigger callback to reload
          if (channelId === this.currChannelId && this.onNewMessageCallback) {
            this.onNewMessageCallback(newMessages);
          }
        }
      })
      .catch((error) => {
        // Silently fail for individual channel errors
        console.error(`Error checking channel ${channelId}:`, error);
      });
  }

  /**
   * Show browser notification for a message
   * @param {Object} message - Message object
   * @param {number} channelId - Channel ID where message was sent
   */
  showNotification(message, channelId) {
    if ("Notification" in window && Notification.permission === "granted") {
      // Fetch channel and user details
      const token = this.auth.getToken();

      Promise.all([
        this.getUserDetails(message.sender),
        this.api.getChannelDetails(channelId, token)
      ])
        .then(([user, channel]) => {
          const senderName = user ? user.name : "Someone";
          const channelName = channel ? channel.name : "a channel";
          const messageText = message.message || "(Image)";
          const notificationTitle = `New message in ${channelName}`;
          const notificationBody = `${senderName}: ${messageText}`;

          const notification = new Notification(notificationTitle, {
            body: notificationBody,
            icon: user && user.image ? user.image : null,
            tag: `message-${message.id}`, // Prevent duplicate notifications
          });

          // Handle notification click - could focus the window
          notification.onclick = () => {
            window.focus();
            notification.close();
          };
        })
        .catch((error) => {
          console.error("Error showing notification:", error);
        });
    }
  }
}
