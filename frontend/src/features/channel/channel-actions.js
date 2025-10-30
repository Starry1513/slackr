import { BaseManager } from "../base-manager.js";

/**
 * ChannelActions - Manages channel CRUD operations
 * (Create, Edit, Join, Leave channels)
 */
export class ChannelActions extends BaseManager {
  constructor(api, auth, ErrorController) {
    super(api, auth, ErrorController);

    // Current channel data for editing
    this.currentChannelData = null;

    // Callbacks
    this.onChannelCreatedCallback = null;
    this.onChannelUpdatedCallback = null;
    this.onChannelJoinedCallback = null;
    this.onChannelLeftCallback = null;

    // Cache DOM elements
    this.dom = {
      // Create channel modal
      createChannelButton: document.getElementById("create-channel-button"),
      createChannelContainer: document.getElementById("create-channel-container"),
      createChannelDescription: document.getElementById("create-channel-description"),
      createChannelIsPrivate: document.getElementById("create-channel-is-private"),
      createChannelClose: document.getElementById("create-channel-close"),
      createChannelCancel: document.getElementById("create-channel-cancel"),
      createChannelForm: document.getElementById("create-channel-form"),
      createChannelName: document.getElementById("create-channel-name"),


      // Edit channel modal
      editChannelContainer: document.getElementById("edit-channel-container"),
      editChannelForm: document.getElementById("edit-channel-form"),
      editChannelDescription: document.getElementById("edit-channel-description"),
      editChannelClose: document.getElementById("edit-channel-close"),
      editChannelCancel: document.getElementById("edit-channel-cancel"),
      editChannelName: document.getElementById("edit-channel-name"),
      editChannelButton: document.getElementById("edit-channel-button"),

      // Channel actions
      joinChannelButton: document.getElementById("join-channel-button"),
      leaveChannelButton: document.getElementById("leave-channel-button"),
    };

    this.setupEventListeners();
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Create channel modal
    this.dom.createChannelButton.addEventListener("click", () => {
      this.showCreateChannelModal();
    });
    this.dom.createChannelClose.addEventListener("click", () => {
      this.hideCreateChannelModal();
    });

    this.dom.createChannelCancel.addEventListener("click", () => {
      this.hideCreateChannelModal();
    });

    this.dom.createChannelForm.addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleCreateChannel();
    });


    // Edit channel modal
    this.dom.editChannelButton.addEventListener("click", () => {
      this.showEditChannelModal();
    });
    this.dom.editChannelCancel.addEventListener("click", () => {
      this.hideEditChannelModal();
    });

    this.dom.editChannelForm.addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleEditChannel();
    });
    this.dom.editChannelClose.addEventListener("click", () => {
      this.hideEditChannelModal();
    });

    // Listen for join button click from message prompt
    window.addEventListener("join-channel-click", () => {
      this.handleJoinChannel();
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
   * Set callbacks
   */
  setOnChannelUpdatedCallback(callback) {
    this.onChannelUpdatedCallback = callback;
  }

  setOnChannelJoinedCallback(callback) {
    this.onChannelJoinedCallback = callback;
  }
  setOnChannelCreatedCallback(callback) {
    this.onChannelCreatedCallback = callback;
  }

  setOnChannelLeftCallback(callback) {
    this.onChannelLeftCallback = callback;
  }

  /**
   * Set current channel data for editing
   */
  setCurrentChannelData(channelData) {
    this.currentChannelData = channelData;
  }

  /**
   * Update channel action buttons based on membership
   */
  updateChannelActions(channelData) {
    const curUserId = parseInt(this.auth.getUserId());
    const isMember = channelData.members.includes(curUserId);
    const isCreator = channelData.creator === curUserId;

    // Show/hide buttons based on membership
    if (isMember) {
      this.dom.joinChannelButton.style.display = "none";
      this.dom.leaveChannelButton.style.display = "inline-block";
      this.dom.editChannelButton.style.display = isCreator ? "inline-block" : "none";
    } else {
      this.dom.joinChannelButton.style.display = channelData.private ? "none" : "inline-block";
      this.dom.editChannelButton.style.display = "none";
      this.dom.leaveChannelButton.style.display = "none";
    }
  }

  /**
   * Show create channel modal
   */
  showCreateChannelModal() {
    this.dom.createChannelContainer.style.display = "flex";
    this.dom.createChannelName.focus();
  }

  /**
   * Hide create channel modal
   */
  hideCreateChannelModal() {
    this.dom.createChannelContainer.style.display = "none";
    // Clear form
    this.dom.createChannelName.value = "";
    this.dom.createChannelDescription.value = "";
    this.dom.createChannelIsPrivate.checked = false;
  }

  /**
   * Handle create channel form submission
   */
  handleCreateChannel() {
    const name = this.dom.createChannelName.value.trim();
    const description = this.dom.createChannelDescription.value.trim();
    const isPrivate = this.dom.createChannelIsPrivate.checked;

    if (!name) {
      this.showError("Channel name is required");
      return;
    }

    const token = this.auth.getToken();

    this.api
      .createChannel(name, description, isPrivate, token)
      .then((response) => {
        this.hideCreateChannelModal();
        if (this.onChannelCreatedCallback) {
          this.onChannelCreatedCallback(response.channelId);
        }
      })
      .catch((error) => {
        this.showError(error.message || "Failed to create channel");
      });
  }

  /**
   * Show edit channel modal
   */
  showEditChannelModal() {
    if (!this.currentChannelData) {
      this.showError("No channel selected");
      return;
    }

    // Populate form with current data
    this.dom.editChannelName.value = this.currentChannelData.name;
    this.dom.editChannelDescription.value = this.currentChannelData.description || "";

    this.dom.editChannelContainer.style.display = "flex";
    this.dom.editChannelName.focus();
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
    if (!this.currentChannelData) {
      this.showError("No channel selected");
      return;
    }

    const name = this.dom.editChannelName.value.trim();
    const description = this.dom.editChannelDescription.value.trim();

    if (!name) {
      this.showError("Channel name is required");
      return;
    }

    const token = this.auth.getToken();
    const channelId = this.currentChannelData.id;

    this.api
      .updateChannel(channelId, name, description, token)
      .then(() => {
        this.hideEditChannelModal();
        if (this.onChannelUpdatedCallback) {
          this.onChannelUpdatedCallback(channelId);
        }
      })
      .catch((error) => {
        this.showError(error.message || "Failed to update channel");
      });
  }

  /**
   * Handle join channel
   */
  handleJoinChannel() {
    if (!this.currentChannelData) {
      this.showError("No channel selected");
      return;
    }

    if (!this.currentChannelData.id) {
      console.error('[ChannelActions] Invalid channel data - missing id:', this.currentChannelData);
      this.showError("Invalid channel ID");
      return;
    }

    const token = this.auth.getToken();
    const channelId = parseInt(this.currentChannelData.id);

    if (isNaN(channelId)) {
      console.error('[ChannelActions] Invalid channel ID type:', this.currentChannelData.id);
      this.showError("Invalid channel ID");
      return;
    }

    this.api
      .joinChannel(channelId, token)
      .then(() => {
        if (this.onChannelJoinedCallback) {
          this.onChannelJoinedCallback(channelId);
        }
      })
      .catch((error) => {
        this.showError(error.message || "Failed to join channel");
      });
  }

  /**
   * Handle leave channel
   */
  handleLeaveChannel() {
    if (!this.currentChannelData) {
      this.showError("No channel selected");
      return;
    }

    const confirmLeave = confirm(`Are you sure you want to leave #${this.currentChannelData.name}?`);
    if (!confirmLeave) {
      return;
    }

    const token = this.auth.getToken();
    const channelId = this.currentChannelData.id;

    this.api
      .leaveChannel(channelId, token)
      .then(() => {
        if (this.onChannelLeftCallback) {
          this.onChannelLeftCallback(channelId);
        }
      })
      .catch((error) => {
        this.showError(error.message || "Failed to leave channel");
      });
  }
}
