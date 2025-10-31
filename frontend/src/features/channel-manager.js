import { BaseManager } from "./base-manager.js";
import { ChannelList } from "./channel/channel-list.js";
import { ChannelDetails } from "./channel/channel-details.js";
import { ChannelActions } from "./channel/channel-actions.js";

/**
 * ChannelManager - Coordinator for all channel-related functionality
 * Delegates work to specialized sub-managers:
 * - ChannelList: List rendering and selection
 * - ChannelDetails: Details sidebar panel
 * - ChannelActions: Create/edit/join/leave operations
 */
export class ChannelManager extends BaseManager {
  constructor(api, auth, ErrorController, messageManager, userManager, offlineManager = null) {
    super(api, auth, ErrorController);
    this.messageManager = messageManager;
    this.userManager = userManager;
    this.offlineManager = offlineManager;

    // Current channel state
    this.currChannelId = null;
    this.currChannelData = null;

    // All channels cache (from channel list)
    this.allChannels = [];

    // Callback for when channel is selected (for URL routing)
    this.onChannelSelectedCallback = null;

    // Initialize sub-managers
    this.channelList = new ChannelList(api, auth, ErrorController);
    this.channelDetails = new ChannelDetails(api, auth, ErrorController);
    this.channelActions = new ChannelActions(api, auth, ErrorController);

    // Cache DOM elements for view control
    this.dom = {
      welcomeScreen: document.getElementById("welcome-screen"),
      channelView: document.getElementById("channel-view"),
      channelName: document.getElementById("channel-name"),
      inviteUserButton: document.getElementById("invite-user-button"),
    };

    this.setupCallbacks();
  }

  /**
   * Set up callbacks between sub-managers
   */
  setupCallbacks() {
    // Channel list callbacks
    this.channelList.setOnChannelSelectCallback((channelId) => {
      this.selectChannel(channelId);
    });

    // Channel actions callbacks
    this.channelActions.setOnChannelCreatedCallback((channelId) => {
      this.loadChannels().then(() => {
        // Add a small delay to ensure backend has fully processed the creation
        setTimeout(() => {
          this.selectChannel(channelId, true); // Force reload
        }, 100);
      });
    });

    this.channelActions.setOnChannelUpdatedCallback((channelId) => {
      this.selectChannel(channelId, true); // Force reload to show updates
      this.loadChannels(); // Refresh channel list
    });

    this.channelActions.setOnChannelJoinedCallback((channelId) => {
      this.selectChannel(channelId, true); // Force reload to show as member
      this.loadChannels(); // Refresh channel list
    });

    this.channelActions.setOnChannelLeftCallback(() => {
      this.showWelcomeScreen();
      this.loadChannels(); // Refresh channel list
    });
  }

  /**
   * Initialize channel manager
   */
  init() {
    // No event listeners needed here - sub-managers handle their own
  }

  /**
   * Load all channels from API
   * @returns {Promise}
   */
  loadChannels() {
    return this.channelList.loadChannels().then((channels) => {
      // Cache all channels data
      this.allChannels = channels || [];
      return channels;
    });
  }

  /**
   * Select and display a channel
   * @param {number} channelId - Channel ID to select
   * @param {boolean} forceReload - Force reload even if already viewing this channel
   */
  selectChannel(channelId, forceReload = false) {
    // Skip if already viewing this channel (unless forceReload is true)
    if (this.currChannelId === channelId && !forceReload) {
      return;
    }

    const token = this.auth.getToken();

    // Check if offline
    if (this.offlineManager && !this.offlineManager.getOnlineStatus()) {
      // Load from cache
      const cachedData = this.offlineManager.getCachedChannelDetails(channelId);
      if (cachedData) {
        this.handleChannelData(channelId, cachedData);
        return Promise.resolve(cachedData);
      } else {
        this.showError("Channel details not available offline. Please connect to the internet.");
        return Promise.reject(new Error("Offline and no cache available"));
      }
    }

    // Online - fetch from API
    this.api
      .getChannelDetails(channelId, token)
      .then((channelData) => {
        // Cache channel details
        if (this.offlineManager) {
          this.offlineManager.cacheChannelDetails(channelId, channelData);
        }

        this.handleChannelData(channelId, channelData);
      })
      .catch((error) => {
        // Try cache as fallback
        if (this.offlineManager) {
          const cachedData = this.offlineManager.getCachedChannelDetails(channelId);
          if (cachedData) {
            this.handleChannelData(channelId, cachedData);
            return;
          }
        }

        // Check if error is due to not being a member
        const errorMsg = error.message || "";
        if (errorMsg.includes("not a member") || errorMsg.includes("Authorised user is not a member")) {
          // Find channel data from cached channel list
          const channelIdNum = parseInt(channelId);
          const channelFromList = this.allChannels.find(ch => parseInt(ch.id) === channelIdNum);
          if (channelFromList) {
            // Check if user is the creator - auto join if so
            const curUserId = parseInt(this.auth.getUserId());
            if (channelFromList.creator === curUserId) {
              console.log('[ChannelManager] Creator not yet member, auto-joining channel', channelIdNum);
              // Auto-join creator to their newly created channel
              this.api.joinChannel(channelIdNum, token)
                .then(() => {
                  console.log('[ChannelManager] Auto-join successful, retrying channel load');
                  // Retry loading the channel after joining
                  this.selectChannel(channelIdNum, true);
                })
                .catch((joinError) => {
                  console.error('[ChannelManager] Auto-join failed:', joinError);
                  this.showError("Failed to join newly created channel");
                });
              return;
            }

            // Not the creator - show join prompt
            // Ensure the cached data includes the id field
            const channelDataWithId = {
              ...channelFromList,
              id: channelIdNum
            };
            // Use basic channel data from list to show join prompt
            this.handleChannelData(channelIdNum, channelDataWithId);
            return;
          }
        }

        // Other errors - show error message
        this.showError(error.message || "Failed to load channel");
      });
  }

  /**
   * Handle channel data (shared by online and offline paths)
   * @param {number} channelId - Channel ID
   * @param {Object} channelData - Channel data
   */
  handleChannelData(channelId, channelData) {
    this.currChannelId = channelId;
    this.currChannelData = channelData;

    // Update sub-managers with current channel data
    this.channelActions.setCurrentChannelData(channelData);

    // Set channel ID for user manager
    if (this.userManager) {
      this.userManager.setcurrChannelId(channelId);
    }

    // Check if user is a member
    const curUserId = parseInt(this.auth.getUserId());
    const isMember = channelData.members.includes(curUserId);

    // Update UI
    this.showChannelView();
    this.renderChannelHeader(channelData);
    this.channelDetails.renderChannelDetails(channelData);
    this.channelActions.updateChannelActions(channelData);

    // Update invite button visibility
    this.dom.inviteUserButton.style.display = isMember ? "inline-block" : "none";

    // Load messages only if member
    if (this.messageManager) {
      if (isMember) {
        this.messageManager.loadMessages(channelId);
        this.messageManager.showMessageInput();
      } else {
        // Non-member: show join prompt instead of messages
        this.messageManager.showJoinPrompt(channelData);
        this.messageManager.hideMessageInput();
      }
    }

    // Update active state in channel list
    this.channelList.updateActiveChannel(channelId, channelData.name);

    // Notify callback (for URL routing)
    if (this.onChannelSelectedCallback) {
      this.onChannelSelectedCallback(channelId);
    }
  }

  /**
   * Set callback for when channel is selected
   * @param {Function} callback - Function(channelId)
   */
  setOnChannelSelectedCallback(callback) {
    this.onChannelSelectedCallback = callback;
  }

  /**
   * Show channel view (hide welcome screen)
   */
  showChannelView() {
    this.dom.welcomeScreen.style.display = "none";
    this.dom.channelView.style.display = "flex";
  }

  /**
   * Show welcome screen (hide channel view)
   */
  showWelcomeScreen() {
    this.dom.welcomeScreen.style.display = "flex";
    this.dom.channelView.style.display = "none";
    this.channelDetails.hideChannelDetails();
    this.currChannelId = null;
    this.currChannelData = null;
  }

  /**
   * Render channel header
   * @param {Object} channelData - Channel data
   */
  renderChannelHeader(channelData) {
    this.dom.channelName.textContent = channelData.name;
  }

  /**
   * Get current channel ID
   * @returns {number|null}
   */
  getcurrChannelId() {
    return this.currChannelId;
  }

  /**
   * Get current channel data
   * @returns {Object|null}
   */
  getcurrChannelData() {
    return this.currChannelData;
  }

  /**
   * Clear channel list
   */
  clearChannels() {
    this.channelList.clearChannels();
    this.showWelcomeScreen();
  }
}
