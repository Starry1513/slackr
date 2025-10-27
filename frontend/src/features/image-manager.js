import { BaseManager } from "./base-manager.js";
import { fileToDataUrl } from "../helpers.js";

/**
 * ImageManager - Manages all image-related functionality
 * Responsible for: image uploads, image viewing modal with navigation
 */
export class ImageManager extends BaseManager {
  constructor(api, auth, ErrorController) {
    super(api, auth, ErrorController);

    // Image viewing state
    this.channelImages = [];
    this.currentImageIndex = 0;
    this.currentChannelId = null;

    // Cache DOM elements
    this.dom = {
      messageImageInput: document.getElementById("message-image-input"),
      imageViewerModal: document.getElementById("image-viewer-modal"),
      imageViewerImage: document.getElementById("image-viewer-image"),
      imageViewerClose: document.getElementById("image-viewer-close"),
      imageViewerPrev: document.getElementById("image-viewer-prev"),
      imageViewerNext: document.getElementById("image-viewer-next"),
      imageViewerCounter: document.getElementById("image-viewer-counter"),
    };
  }

  /**
   * Initialize image manager
   */
  init() {
    this.setupEventListeners();
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Image upload input
    if (this.dom.messageImageInput) {
      this.dom.messageImageInput.addEventListener("change", (e) => {
        this.handleImageUpload(e);
      });
    }

    // Image viewer event listeners
    if (this.dom.imageViewerClose) {
      this.dom.imageViewerClose.addEventListener("click", () => this.closeImageViewer());
    }

    if (this.dom.imageViewerPrev) {
      this.dom.imageViewerPrev.addEventListener("click", () => this.showPreviousImage());
    }

    if (this.dom.imageViewerNext) {
      this.dom.imageViewerNext.addEventListener("click", () => this.showNextImage());
    }

    // Close image viewer when clicking on overlay
    if (this.dom.imageViewerModal) {
      this.dom.imageViewerModal.addEventListener("click", (e) => {
        if (e.target === this.dom.imageViewerModal) {
          this.closeImageViewer();
        }
      });
    }

    // Keyboard navigation for image viewer
    document.addEventListener("keydown", (e) => {
      if (this.dom.imageViewerModal && this.dom.imageViewerModal.style.display === "flex") {
        if (e.key === "Escape") {
          this.closeImageViewer();
        } else if (e.key === "ArrowLeft") {
          this.showPreviousImage();
        } else if (e.key === "ArrowRight") {
          this.showNextImage();
        }
      }
    });
  }

  /**
   * Handle image upload
   * @param {Event} event - Change event from file input
   * @returns {Promise} - Resolves when image is uploaded successfully
   */
  handleImageUpload(event) {
    const file = event.target.files[0];

    if (!file) {
      return Promise.reject(new Error("No file selected"));
    }

    if (!this.currentChannelId) {
      this.showError("Please select a channel first");
      event.target.value = "";
      return Promise.reject(new Error("No channel selected"));
    }

    const token = this.auth.getToken();

    // Convert file to data URL
    return fileToDataUrl(file)
      .then((dataUrl) => {
        // Send image message (no text, just image)
        return this.api.sendMessage(this.currentChannelId, "", dataUrl, token);
      })
      .then(() => {
        // Clear file input
        event.target.value = "";
        return Promise.resolve();
      })
      .catch((error) => {
        this.showError(error.message || "Failed to send image");
        event.target.value = "";
        return Promise.reject(error);
      });
  }

  /**
   * Set current channel ID for image uploads
   * @param {number} channelId - Channel ID
   */
  setCurrentChannel(channelId) {
    this.currentChannelId = channelId;
  }

  /**
   * Update channel images list from messages
   * @param {Array} messages - Array of message objects
   */
  updateChannelImages(messages) {
    // Extract all images from messages in order
    this.channelImages = messages
      .filter(msg => msg.image)
      .map(msg => msg.image);
  }

  /**
   * Open image viewer modal
   * @param {string} imageUrl - URL of the image to display
   */
  openImageViewer(imageUrl) {
    // Find the index of this image in the channel images
    this.currentImageIndex = this.channelImages.indexOf(imageUrl);

    if (this.currentImageIndex === -1) {
      // If image not found in list, add it and set as current
      this.channelImages.push(imageUrl);
      this.currentImageIndex = this.channelImages.length - 1;
    }

    this.displayCurrentImage();
    this.showElement(this.dom.imageViewerModal, "flex");
  }

  /**
   * Close image viewer modal
   */
  closeImageViewer() {
    this.hideElement(this.dom.imageViewerModal);
  }

  /**
   * Show previous image in the channel
   */
  showPreviousImage() {
    if (this.currentImageIndex > 0) {
      this.currentImageIndex--;
      this.displayCurrentImage();
    }
  }

  /**
   * Show next image in the channel
   */
  showNextImage() {
    if (this.currentImageIndex < this.channelImages.length - 1) {
      this.currentImageIndex++;
      this.displayCurrentImage();
    }
  }

  /**
   * Display the current image and update navigation
   */
  displayCurrentImage() {
    if (!this.channelImages || this.channelImages.length === 0) {
      return;
    }

    // Update image src
    this.dom.imageViewerImage.src = this.channelImages[this.currentImageIndex];

    // Update counter
    this.dom.imageViewerCounter.textContent =
      `${this.currentImageIndex + 1} / ${this.channelImages.length}`;

    // Update navigation buttons
    if (this.currentImageIndex === 0) {
      this.dom.imageViewerPrev.disabled = true;
    } else {
      this.dom.imageViewerPrev.disabled = false;
    }

    if (this.currentImageIndex === this.channelImages.length - 1) {
      this.dom.imageViewerNext.disabled = true;
    } else {
      this.dom.imageViewerNext.disabled = false;
    }
  }

  /**
   * Make an image element clickable to open viewer
   * @param {HTMLElement} imageElement - Image element to make clickable
   * @param {string} imageUrl - URL of the image
   */
  makeImageClickable(imageElement, imageUrl) {
    imageElement.style.cursor = "pointer";
    imageElement.onclick = () => this.openImageViewer(imageUrl);
  }
}
