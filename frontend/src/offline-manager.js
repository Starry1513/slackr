/**
 * OfflineManager - Handles offline access and caching
 * Caches channel data in localStorage and detects online/offline state
 */
export class OfflineManager {
  constructor() {
    this.isOnline = navigator.onLine;
    this.onlineStatusChangeCallbacks = [];

    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('[Offline Manager] Back online');
      this.notifyStatusChange(true);
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('[Offline Manager] Gone offline');
      this.notifyStatusChange(false);
    });
  }

  /**
   * Check if currently online
   * @returns {boolean} True if online
   */
  getOnlineStatus() {
    return this.isOnline;
  }

  /**
   * Register callback for online/offline status changes
   * @param {Function} callback - Function(isOnline)
   */
  onStatusChange(callback) {
    this.onlineStatusChangeCallbacks.push(callback);
  }

  /**
   * Notify all callbacks of status change
   * @param {boolean} isOnline - Current online status
   */
  notifyStatusChange(isOnline) {
    this.onlineStatusChangeCallbacks.forEach(callback => {
      callback(isOnline);
    });
  }

  /**
   * Cache channels data to localStorage
   * @param {Array} channels - Array of channel objects
   */
  cacheChannels(channels) {
    try {
      localStorage.setItem('slackr_cached_channels', JSON.stringify(channels));
      localStorage.setItem('slackr_cache_timestamp', Date.now().toString());
      console.log(`[Offline Manager] Cached ${channels.length} channels`);
    } catch (error) {
      console.error('[Offline Manager] Failed to cache channels:', error);
    }
  }

  /**
   * Get cached channels from localStorage
   * @returns {Array|null} Cached channels or null if none
   */
  getCachedChannels() {
    try {
      const cached = localStorage.getItem('slackr_cached_channels');
      if (cached) {
        const channels = JSON.parse(cached);
        const timestamp = localStorage.getItem('slackr_cache_timestamp');
        console.log(`[Offline Manager] Retrieved ${channels.length} cached channels from ${new Date(parseInt(timestamp))}`);
        return channels;
      }
    } catch (error) {
      console.error('[Offline Manager] Failed to retrieve cached channels:', error);
    }
    return null;
  }

  /**
   * Cache channel details to localStorage
   * @param {number} channelId - Channel ID
   * @param {Object} channelData - Channel details object
   */
  cacheChannelDetails(channelId, channelData) {
    try {
      const key = `slackr_cached_channel_${channelId}`;
      localStorage.setItem(key, JSON.stringify(channelData));
      console.log(`[Offline Manager] Cached channel ${channelId} details`);
    } catch (error) {
      console.error('[Offline Manager] Failed to cache channel details:', error);
    }
  }

  /**
   * Get cached channel details from localStorage
   * @param {number} channelId - Channel ID
   * @returns {Object|null} Cached channel details or null
   */
  getCachedChannelDetails(channelId) {
    try {
      const key = `slackr_cached_channel_${channelId}`;
      const cached = localStorage.getItem(key);
      if (cached) {
        console.log(`[Offline Manager] Retrieved cached channel ${channelId} details`);
        return JSON.parse(cached);
      }
    } catch (error) {
      console.error('[Offline Manager] Failed to retrieve cached channel details:', error);
    }
    return null;
  }

  /**
   * Cache messages for a channel
   * @param {number} channelId - Channel ID
   * @param {Array} messages - Array of message objects
   */
  cacheMessages(channelId, messages) {
    try {
      const key = `slackr_cached_messages_${channelId}`;
      localStorage.setItem(key, JSON.stringify(messages));
      console.log(`[Offline Manager] Cached ${messages.length} messages for channel ${channelId}`);
    } catch (error) {
      console.error('[Offline Manager] Failed to cache messages:', error);
    }
  }

  /**
   * Get cached messages for a channel
   * @param {number} channelId - Channel ID
   * @returns {Array|null} Cached messages or null
   */
  getCachedMessages(channelId) {
    try {
      const key = `slackr_cached_messages_${channelId}`;
      const cached = localStorage.getItem(key);
      if (cached) {
        const messages = JSON.parse(cached);
        console.log(`[Offline Manager] Retrieved ${messages.length} cached messages for channel ${channelId}`);
        return messages;
      }
    } catch (error) {
      console.error('[Offline Manager] Failed to retrieve cached messages:', error);
    }
    return null;
  }

  /**
   * Clear all cached data
   */
  clearCache() {
    try {
      // Remove all slackr_cached_* items
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('slackr_cached_')) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key));
      console.log(`[Offline Manager] Cleared ${keysToRemove.length} cached items`);
    } catch (error) {
      console.error('[Offline Manager] Failed to clear cache:', error);
    }
  }
}
