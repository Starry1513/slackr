import { BaseManager } from "../base-manager.js";

/**
 * ChannelList - Manages channel list rendering and selection
 */
export class ChannelList extends BaseManager {
  constructor(api, auth, ErrorController) {
    super(api, auth, ErrorController);

    // Cache templates
    this.templates = {
      channelItem: document.getElementById("channel-item-template"),
      privateChannelItem: document.getElementById("private-channel-item-template"),
    };

    // Cache DOM elements
    this.dom = {
      channelList: document.getElementById("channel-list"),
    };

    // Callback for when channel is selected
    this.onChannelSelectCallback = null;
  }

  /**
   * Set callback for when a channel is selected
   * @param {Function} callback - Function(channelId)
   */
  setOnChannelSelectCallback(callback) {
    this.onChannelSelectCallback = callback;
  }

  /**
   * Load and render all channels from API
   * @returns {Promise}
   */
  loadChannels() {
    const token = this.auth.getToken();

    return this.api
      .getChannels(token)
      .then((response) => {
        this.renderChannelList(response.channels);
        return response.channels;
      })
      .catch((error) => {
        this.showError(error.message || "Failed to load channels");
        throw error;
      });
  }

  /**
   * Render channel list in sidebar
   * @param {Array} channels - Array of channel objects
   */
  renderChannelList(channels) {
    // Clear existing list
    this.clearElement(this.dom.channelList);

    if (!channels || channels.length === 0) {
      const emptyTemplate = document.getElementById("empty-channel-list-template");
      if (emptyTemplate) {
        const emptyFragment = emptyTemplate.content.cloneNode(true);
        this.dom.channelList.appendChild(emptyFragment);
      }
      return;
    }

    const currUserId = parseInt(this.getUserId());

    // Filter channels: show all public channels and only private channels user is a member of
    const visibleChannels = channels.filter((channel) => {
      if (!channel.private) {
        return true; // Show all public channels
      }
      // For private channels, only show if user is a member
      return channel.members && channel.members.includes(currUserId);
    });

    // Sort channels: public first, then private
    const sortedChannels = visibleChannels.sort((a, b) => {
      if (a.private === b.private) {
        return a.name.localeCompare(b.name);
      }
      return a.private ? 1 : -1;
    });

    if (sortedChannels.length === 0) {
      const emptyTemplate = document.getElementById("empty-channel-list-template");
      if (emptyTemplate) {
        const emptyFragment = emptyTemplate.content.cloneNode(true);
        this.dom.channelList.appendChild(emptyFragment);
      }
      return;
    }

    // Render each channel using templates
    sortedChannels.forEach((channel) => {
      this.renderChannelItem(channel);
    });
  }

}
