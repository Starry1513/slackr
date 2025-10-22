/**
 * UserManager - Manages user-related functionality
 * Responsible for: user profiles, inviting users to channels
 */
export class UserManager {
  constructor(api, auth, pageController) {
    this.api = api;
    this.auth = auth;
    this.pageController = pageController;

    // User cache
    this.userCache = new Map();

    // Current channel ID (will be set by channel manager)
    this.currentChannelId = null;

    // Cache DOM elements
    this.dom = {
      // Profile modal
      profileButton: document.getElementById("profile-button"),
      profileContainer: document.getElementById("profile-container"),
      profileClose: document.getElementById("profile-close"),
      profileCancel: document.getElementById("profile-cancel"),
      profileForm: document.getElementById("profile-form"),
      profileEmail: document.getElementById("profile-email"),
      profileName: document.getElementById("profile-name"),
      profileBio: document.getElementById("profile-bio"),
      profilePassword: document.getElementById("profile-password"),
      profileImage: document.getElementById("profile-image"),
      profileImagePreview: document.getElementById("profile-image-preview"),

      // View user profile modal
      viewUserProfileContainer: document.getElementById("view-user-profile-container"),
      viewUserProfileClose: document.getElementById("view-user-profile-close"),
      viewUserProfileOk: document.getElementById("view-user-profile-ok"),
      viewUserProfileName: document.getElementById("view-user-profile-name"),
      viewUserProfileEmail: document.getElementById("view-user-profile-email"),
      viewUserProfileBio: document.getElementById("view-user-profile-bio"),
      viewUserProfileImage: document.getElementById("view-user-profile-image"),
      viewUserProfilePlaceholder: document.getElementById("view-user-profile-placeholder"),


    };
  }

  /**
   * Initialize user manager
   */
  init() {
    this.setupEventListeners();
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Profile modal
    if (this.dom.profileButton) {
      this.dom.profileButton.addEventListener("click", () => {
        this.showProfileModal();
      });
    }

    if (this.dom.profileClose) {
      this.dom.profileClose.addEventListener("click", () => {
        this.hideProfileModal();
      });
    }

  }

  /**
   * Show profile modal
   */
  showProfileModal() {
    if (!this.dom.profileContainer) return;

    // Load current user data
    const userId = parseInt(this.auth.getUserId());
    const token = this.auth.getToken();

    this.api
      .getUserDetails(userId, token)
      .then((userData) => {
        // Fill form with current data
        if (this.dom.profileEmail) this.dom.profileEmail.value = userData.email || "";
        if (this.dom.profileName) this.dom.profileName.value = userData.name || "";
        if (this.dom.profileBio) this.dom.profileBio.value = userData.bio || "";
        if (this.dom.profilePassword) this.dom.profilePassword.value = "";

        // Show current profile image
        this.clearElement(this.dom.profileImagePreview);
        if (userData.image) {
          const img = document.createElement("img");
          img.src = userData.image;
          img.alt = "Current profile image";
          img.style.maxWidth = "200px";
          img.style.maxHeight = "200px";
          this.dom.profileImagePreview.appendChild(img);
        }

        this.dom.profileContainer.style.display = "flex";
      })
      .catch((error) => {
        this.pageController.showError(error.message || "Failed to load profile");
      });
  }

  /**
   * Hide profile modal
   */
  hideProfileModal() {
    if (this.dom.profileContainer) {
      this.dom.profileContainer.style.display = "none";
    }
  }

  /**
   * Handle image preview
   * @param {File} file - Image file
   */
  handleImagePreview(file) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      this.clearElement(this.dom.profileImagePreview);
      const img = document.createElement("img");
      img.src = e.target.result;
      img.alt = "Preview";
      img.style.maxWidth = "200px";
      img.style.maxHeight = "200px";
      this.dom.profileImagePreview.appendChild(img);
    };
    reader.readAsDataURL(file);
  }

  /**
   * Convert file to base64
   * @param {File} file - Image file
   * @returns {Promise<string>}
   */
  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Handle update profile
   */
  handleUpdateProfile() {

  }

  /**
   * Show invite user modal
   */
  showInviteUserModal() {

  }

  /**
   * Render invite user list
   * @param {Array} users - Array of available users
   */
  renderInviteUserList(users) {

  }

  /**
   * Hide invite user modal
   */
  hideInviteUserModal() {
    if (this.dom.inviteUserContainer) {
      this.dom.inviteUserContainer.style.display = "none";
    }
  }

  /**
   * Handle invite user
   */
  handleInviteUser() {

  }

  /**
   * Set current channel ID
   * @param {number} channelId - Channel ID
   */
  setCurrentChannelId(channelId) {
    this.currentChannelId = channelId;
  }

  /**
   * Get user details (with caching)
   * @param {number} userId - User ID
   * @returns {Promise<Object>}
   */
  getUserDetails(userId) {

  }

  /**
   * Clear user cache
   */
  clearCache() {
    this.userCache.clear();
  }

  /**
   * Show user profile modal
   * @param {number} userId - User ID to view
   */
  showViewUserProfileModal(userId) {

  }



}
