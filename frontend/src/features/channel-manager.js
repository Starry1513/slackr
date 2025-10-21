/**
 * ChannelManager - Manages all channel-related functionality
 * Responsible for: channel list, create/edit/delete channels, channel details
 */
export class ChannelManager {
  constructor(api, auth, pageController) {
    this.api = api;
    this.auth = auth;
    this.pageController = pageController;

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

 
}
