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

  }


}
