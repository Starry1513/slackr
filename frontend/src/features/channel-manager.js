import { BaseManager } from "./base-manager.js";

/**
 * ChannelManager - Manages all channel-related functionality
 * Responsible for: channel list, create/edit/delete channels, channel details
 */
export class ChannelManager extends BaseManager {
  constructor(api, auth, pageController, messageManager, userManager) {
    super(api, auth, pageController);
    this.messageManager = messageManager;
    this.userManager = userManager;

    // Current channel state
    this.currentChannelId = null;
    this.currentChannelData = null;

    // Cache channel-related DOM elements
    this.dom = {
      // Channel list
      channelList: document.getElementById("channel-list"),

      // Create channel modal
      createChannelButton: document.getElementById("create-channel-button"),
      createChannelContainer: document.getElementById("create-channel-container"),
      createChannelForm: document.getElementById("create-channel-form"),
      createChannelName: document.getElementById("create-channel-name"),
      createChannelDescription: document.getElementById("create-channel-description"),
      createChannelIsPrivate: document.getElementById("create-channel-is-private"),
      createChannelClose: document.getElementById("create-channel-close"),
      createChannelCancel: document.getElementById("create-channel-cancel"),

      // Edit channel modal
      editChannelContainer: document.getElementById("edit-channel-container"),
      editChannelForm: document.getElementById("edit-channel-form"),
      editChannelName: document.getElementById("edit-channel-name"),
      editChannelDescription: document.getElementById("edit-channel-description"),
      editChannelClose: document.getElementById("edit-channel-close"),
      editChannelCancel: document.getElementById("edit-channel-cancel"),
      editChannelButton: document.getElementById("edit-channel-button"),

      // Channel view
      welcomeScreen: document.getElementById("welcome-screen"),
      channelView: document.getElementById("channel-view"),
      channelName: document.getElementById("channel-name"),
      channelDetailsToggle: document.getElementById("channel-details-toggle"),
      channelDetailsContainer: document.getElementById("channel-details-container"),
      channelDetailsBackdrop: document.getElementById("channel-details-backdrop"),
      channelDetailsClose: document.getElementById("channel-details-close"),

      // Channel details
      channelDetailName: document.getElementById("channel-detail-name"),
      channelDetailDescription: document.getElementById("channel-detail-description"),
      channelDetailType: document.getElementById("channel-detail-type"),
      channelDetailCreated: document.getElementById("channel-detail-created"),
      channelDetailCreator: document.getElementById("channel-detail-creator"),

      // Channel actions
      joinChannelButton: document.getElementById("join-channel-button"),
      leaveChannelButton: document.getElementById("leave-channel-button"),
      inviteUserButton: document.getElementById("invite-user-button"),
    };
  }

  /**
   * Initialize channel manager - set up event listeners
   */
  init() {
    this.setupEventListeners();
  }

  /**
   * Set up all channel-related event listeners
   */
  setupEventListeners() {
    // Create channel modal
    this.dom.createChannelButton.addEventListener("click", () => {
      this.showCreateChannelModal();
    });

    this.dom.createChannelForm.addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleCreateChannel();
    });

    this.dom.createChannelClose.addEventListener("click", () => {
      this.hideCreateChannelModal();
    });

    this.dom.createChannelCancel.addEventListener("click", () => {
      this.hideCreateChannelModal();
    });

    // Edit channel modal
    this.dom.editChannelButton.addEventListener("click", () => {
      this.showEditChannelModal();
    });

    this.dom.editChannelForm.addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleEditChannel();
    });

    this.dom.editChannelClose.addEventListener("click", () => {
      this.hideEditChannelModal();
    });

    this.dom.editChannelCancel.addEventListener("click", () => {
      this.hideEditChannelModal();
    });

    // Channel details toggle
    this.dom.channelDetailsToggle.addEventListener("click", () => {
      this.toggleChannelDetails();
    });

    // Channel details close button
    this.dom.channelDetailsClose.addEventListener("click", () => {
      this.hideChannelDetails();
    });

    // Channel details backdrop click (close when clicking outside)
    this.dom.channelDetailsBackdrop.addEventListener("click", () => {
      this.hideChannelDetails();
    });

    // Join/Leave channel buttons
    this.dom.joinChannelButton.addEventListener("click", () => {
      this.handleJoinChannel();
    });

    this.dom.leaveChannelButton.addEventListener("click", () => {
      this.handleLeaveChannel();
    });
  }

  /**
   * Load and display all channels
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
        this.pageController.showError(error.message || "Failed to load channels");
        throw error;
      });
  }

  /**
   * Render channel list in sidebar
   * @param {Array} channels - Array of channel objects
   */
  renderChannelList(channels) {
    // Clear existing list
    this.dom.channelList.innerHTML = "";

    if (!channels || channels.length === 0) {
      const emptyMessage = document.createElement("p");
      emptyMessage.textContent = "No channels available";
      emptyMessage.style.padding = "1rem";
      emptyMessage.style.color = "var(--text-muted)";
      emptyMessage.style.fontSize = "0.875rem";
      this.dom.channelList.appendChild(emptyMessage);
      return;
    }

    // Sort channels: public first, then private
    const sortedChannels = channels.sort((a, b) => {
      if (a.private === b.private) {
        return a.name.localeCompare(b.name);
      }
      return a.private ? 1 : -1;
    });

    // Render each channel
    sortedChannels.forEach((channel) => {
      const channelElement = document.createElement("div");
      channelElement.className = "channel-container";
      if (channel.private) {
        channelElement.classList.add("private");
      }
      if (this.currentChannelId === channel.id) {
        channelElement.classList.add("active");
      }

      channelElement.textContent = channel.name;
      channelElement.addEventListener("click", () => {
        this.selectChannel(channel.id);
      });

      this.dom.channelList.appendChild(channelElement);
    });
  }

  /**
   * Select and display a channel
   * @param {number} channelId - Channel ID to select
   */
  selectChannel(channelId) {
    const token = this.auth.getToken();

    this.api
      .getChannelDetails(channelId, token)
      .then((channelData) => {
        this.currentChannelId = channelId;
        this.currentChannelData = channelData;

        // Set channel ID for user manager
        if (this.userManager) {
          this.userManager.setCurrentChannelId(channelId);
        }

        // Update UI
        this.showChannelView();
        this.renderChannelHeader(channelData);
        this.renderChannelDetails(channelData);
        this.updateChannelActions(channelData);

        // Show channel details sidebar
        this.dom.channelDetailsContainer.style.display = "flex";

        // Load messages for this channel
        if (this.messageManager) {
          this.messageManager.loadMessages(channelId);
        }

        // Update active state in channel list
        document.querySelectorAll(".channel-container").forEach((el) => {
          el.classList.remove("active");
        });
        document.querySelectorAll(".channel-container").forEach((el) => {
          if (el.textContent === channelData.name || el.textContent === "🔒 " + channelData.name) {
            el.classList.add("active");
          }
        });
      })
      .catch((error) => {
        this.pageController.showError(error.message || "Failed to load channel");
      });
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
    this.dom.channelDetailsContainer.style.display = "none";
    this.currentChannelId = null;
    this.currentChannelData = null;
  }

  /**
   * Render channel header
   * @param {Object} channelData - Channel data
   */
  renderChannelHeader(channelData) {
    this.dom.channelName.textContent = channelData.name;
  }

  /**
   * Render channel details panel
   * @param {Object} channelData - Channel data
   */
  renderChannelDetails(channelData) {
    this.dom.channelDetailName.textContent = channelData.name;
    this.dom.channelDetailDescription.textContent = channelData.description || "No description";
    this.dom.channelDetailType.textContent = channelData.private ? "Private" : "Public";

    // Format creation date
    const createdDate = new Date(channelData.createdAt);
    this.dom.channelDetailCreated.textContent = createdDate.toLocaleDateString();

    // Get creator name (need to fetch user data)
    const token = this.auth.getToken();
    this.api
      .getUserDetails(channelData.creator, token)
      .then((userData) => {
        this.dom.channelDetailCreator.textContent = userData.name;
      })
      .catch(() => {
        this.dom.channelDetailCreator.textContent = "Unknown";
      });
  }

  /**
   * Update channel action buttons based on membership
   * @param {Object} channelData - Channel data
   */
  updateChannelActions(channelData) {
    const currentUserId = parseInt(this.auth.getUserId());
    const isMember = channelData.members.includes(currentUserId);

    // Show/hide join/leave buttons
    if (isMember) {
      this.dom.joinChannelButton.style.display = "none";
      this.dom.leaveChannelButton.style.display = "block";
      this.dom.inviteUserButton.style.display = "block";
      this.dom.editChannelButton.style.display = "block";
    } else {
      this.dom.joinChannelButton.style.display = "block";
      this.dom.leaveChannelButton.style.display = "none";
      this.dom.inviteUserButton.style.display = "none";
      this.dom.editChannelButton.style.display = "none";
    }
  }

  /**
   * Show channel details panel
   */
  showChannelDetails() {
    this.dom.channelDetailsContainer.classList.add("show");
    this.dom.channelDetailsBackdrop.classList.add("show");
  }

  /**
   * Hide channel details panel
   */
  hideChannelDetails() {
    this.dom.channelDetailsContainer.classList.remove("show");
    this.dom.channelDetailsBackdrop.classList.remove("show");
  }

  /**
   * Toggle channel details panel visibility
   */
  toggleChannelDetails() {
    const isVisible = this.dom.channelDetailsContainer.classList.contains("show");
    if (isVisible) {
      this.hideChannelDetails();
    } else {
      this.showChannelDetails();
    }
  }

  /**
   * Show create channel modal
   */
  showCreateChannelModal() {
    this.dom.createChannelContainer.style.display = "flex";
    this.dom.createChannelName.value = "";
    this.dom.createChannelDescription.value = "";
    this.dom.createChannelIsPrivate.checked = false;
  }

  /**
   * Hide create channel modal
   */
  hideCreateChannelModal() {
    this.dom.createChannelContainer.style.display = "none";
  }

  /**
   * Handle create channel form submission
   */
  handleCreateChannel() {
    const name = this.dom.createChannelName.value.trim();
    const description = this.dom.createChannelDescription.value.trim();
    const isPrivate = this.dom.createChannelIsPrivate.checked;

    if (!name) {
      this.pageController.showError("Channel name is required");
      return;
    }

    const token = this.auth.getToken();

    this.api
      .createChannel(name, description || "", isPrivate, token)
      .then(() => {
        this.hideCreateChannelModal();
        // Reload channel list
        return this.loadChannels();
      })
      .then(() => {
        // Optionally select the newly created channel
        // Note: API doesn't return the new channel ID, so we can't auto-select
      })
      .catch((error) => {
        this.pageController.showError(error.message || "Failed to create channel");
      });
  }

  /**
   * Show edit channel modal
   */
  showEditChannelModal() {
    if (!this.currentChannelData) {
      return;
    }

    this.dom.editChannelName.value = this.currentChannelData.name;
    this.dom.editChannelDescription.value = this.currentChannelData.description || "";
    this.dom.editChannelContainer.style.display = "flex";
  }

  /**
   * Hide edit channel modal
   */
  hideEditChannelModal() {
    this.dom.editChannelContainer.style.display = "none";
  }

  /**
   * Handle edit channel form submission
   */
  handleEditChannel() {
    const name = this.dom.editChannelName.value.trim();
    const description = this.dom.editChannelDescription.value.trim();

    if (!name) {
      this.pageController.showError("Channel name is required");
      return;
    }

    const token = this.auth.getToken();

    this.api
      .updateChannel(this.currentChannelId, name, description || "", token)
      .then(() => {
        this.hideEditChannelModal();
        // Reload channel data
        return this.selectChannel(this.currentChannelId);
      })
      .then(() => {
        // Reload channel list to update sidebar
        return this.loadChannels();
      })
      .catch((error) => {
        this.pageController.showError(error.message || "Failed to update channel");
      });
  }

  /**
   * Handle join channel
   */
  handleJoinChannel() {
    if (!this.currentChannelId) {
      return;
    }

    const token = this.auth.getToken();

    this.api
      .joinChannel(this.currentChannelId, token)
      .then(() => {
        // Reload channel data to update UI
        return this.selectChannel(this.currentChannelId);
      })
      .catch((error) => {
        this.pageController.showError(error.message || "Failed to join channel");
      });
  }

  /**
   * Handle leave channel
   */
  handleLeaveChannel() {
    if (!this.currentChannelId) {
      return;
    }

    const token = this.auth.getToken();

    this.api
      .leaveChannel(this.currentChannelId, token)
      .then(() => {
        // Show welcome screen
        this.showWelcomeScreen();
        // Reload channel list
        return this.loadChannels();
      })
      .catch((error) => {
        this.pageController.showError(error.message || "Failed to leave channel");
      });
  }

  /**
   * Get current channel ID
   * @returns {number|null} Current channel ID
   */
  getCurrentChannelId() {
    return this.currentChannelId;
  }

  /**
   * Get current channel data
   * @returns {Object|null} Current channel data
   */
  getCurrentChannelData() {
    return this.currentChannelData;
  }
}
