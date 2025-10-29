import { BaseManager } from "../base-manager.js";

/**
 * ChannelDetails - Manages channel details sidebar panel
 */
export class ChannelDetails extends BaseManager {
  constructor(api, auth, ErrorController) {
    super(api, auth, ErrorController);

    // Cache DOM elements
    this.dom = {
      channelDetailsToggle: document.getElementById("channel-details-toggle"),
      channelDetailsBackdrop: document.getElementById("channel-details-backdrop"),
      channelDetailsClose: document.getElementById("channel-details-close"),
      channelDetailsContainer: document.getElementById("channel-details-container"),


      // Channel details fields
      channelDetailName: document.getElementById("channel-detail-name"),
      channelDetailCreated: document.getElementById("channel-detail-created"),
      channelDetailCreator: document.getElementById("channel-detail-creator"),
      channelDetailDescription: document.getElementById("channel-detail-description"),
      channelDetailType: document.getElementById("channel-detail-type"),

    };

    this.setupEventListeners();
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
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
      .catch((error) => {
        this.dom.channelDetailCreator.textContent = "Unknown";
        console.error("Failed to fetch creator details:", error);
      });
  }

  /**
   * Toggle channel details sidebar
   */
  toggleChannelDetails() {
    const isVisible = this.dom.channelDetailsContainer.classList.contains("show");
    if (isVisible) {
      this.hideChannelDetails();
    } else {
      this.showChannelDetails();
    }
  }

