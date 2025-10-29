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
    // Cache notification elements
    this.notificationContainer = document.getElementById('notification-banner-container');
    this.notificationTemplate = document.getElementById('notification-banner-template');

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

        // Debug: Log polling activity (comment out in production)
        // console.log(`[Polling] Checking ${joinedChannels.length} channels for new messages`);

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
          if (othersMessages.length > 0) {
            console.log(`[Notification] ${othersMessages.length} new message(s) in channel ${channelId}`);
            othersMessages.forEach(msg => {
              this.showNotification(msg, channelId);
            });
          }

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
   * Show in-app notification banner for a message
   * @param {Object} message - Message object
   * @param {number} channelId - Channel ID where message was sent
   */
  showNotification(message, channelId) {
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

        // Clone the template
        const banner = this.notificationTemplate.cloneNode(true);
        banner.removeAttribute('id');
        banner.style.display = 'flex';
        banner.dataset.messageId = message.id;
        banner.dataset.channelId = channelId;

        // Fill in content
        const title = banner.querySelector('.notification-banner-title');
        const messageDiv = banner.querySelector('.notification-banner-message');
        const avatar = banner.querySelector('.notification-banner-avatar');
        const emoji = banner.querySelector('.notification-banner-emoji');
        const closeBtn = banner.querySelector('.notification-banner-close');

        title.textContent = `New message in ${channelName}`;
        messageDiv.textContent = `${senderName}: ${messageText}`;

        // Set avatar or emoji
        if (user && user.image) {
          avatar.src = user.image;
          avatar.alt = senderName;
          avatar.style.display = 'block';
          emoji.style.display = 'none';
        } else {
          avatar.style.display = 'none';
          emoji.style.display = 'flex';
        }

        // Add to container
        this.notificationContainer.style.display = 'block';
        this.notificationContainer.appendChild(banner);

        // Click handler - navigate to channel (optional)
        banner.addEventListener('click', (e) => {
          if (e.target !== closeBtn) {
            console.log(`Navigate to channel ${channelId}`);
            this.removeBanner(banner);
          }
        });

        // Close button handler
        closeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.removeBanner(banner);
        });

        // Auto-dismiss after 5 seconds
        setTimeout(() => {
          if (banner.parentElement) {
            this.removeBanner(banner);
          }
        }, 5000);
      })
      .catch((error) => {
        console.error("Error showing notification:", error);
      });
  }

  /**
   * Remove a notification banner with animation
   * @param {HTMLElement} banner - Banner element to remove
   */
  removeBanner(banner) {
    banner.classList.add('closing');
    setTimeout(() => {
      if (banner.parentElement) {
        banner.parentElement.removeChild(banner);

        // Hide container if no more banners (only template left)
        const visibleBanners = Array.from(this.notificationContainer.children)
          .filter(child => child.id !== 'notification-banner-template');
        if (visibleBanners.length === 0) {
          this.notificationContainer.style.display = 'none';
        }
      }
    }, 300); // Match animation duration
  }
}
