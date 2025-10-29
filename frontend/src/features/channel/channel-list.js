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


}
