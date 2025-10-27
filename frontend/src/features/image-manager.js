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

  }




}
