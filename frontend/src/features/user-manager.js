import { helperManager } from "./helper-manager.js";
import { BaseManager } from "./base-manager.js";

/**
 * UserManager - Manages user-related functionality
 * Responsible for: user profiles, inviting users to channels
 */
export class UserManager extends BaseManager {
  constructor(api, auth, ErrorController) {
    super(api, auth, ErrorController);

    // Helper manager for user images
    this.helperManager = new helperManager();

    // curr channel ID (will be set by channel manager)
    this.currChannelId = null;

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

      // Invite user modal
      inviteUserButton: document.getElementById("invite-user-button"),
      inviteUserContainer: document.getElementById("channel-invite-container"),
      inviteUserClose: document.getElementById("invite-user-close"),
      inviteUserCancel: document.getElementById("invite-user-cancel"),
      inviteUserForm: document.getElementById("invite-user-form"),
      inviteUserList: document.getElementById("invite-user-list"),
      inviteSubmitButton: document.getElementById("invite-submit-button"),
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

    if (this.dom.profileCancel) {
      this.dom.profileCancel.addEventListener("click", () => {
        this.hideProfileModal();
      });
    }

    if (this.dom.profileForm) {
      this.dom.profileForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleUpdateProfile();
      });
    }

    if (this.dom.profileImage) {
      this.dom.profileImage.addEventListener("change", (e) => {
        this.handleImagePreview(e.target.files[0]);
      });
    }

    // Close modal on outside click
    if (this.dom.profileContainer) {
      this.dom.profileContainer.addEventListener("click", (e) => {
        if (e.target === this.dom.profileContainer) {
          this.hideProfileModal();
        }
      });
    }

    // Invite user modal
    if (this.dom.inviteUserButton) {
      this.dom.inviteUserButton.addEventListener("click", () => {
        this.showInviteUserModal();
      });
    }

    if (this.dom.inviteUserClose) {
      this.dom.inviteUserClose.addEventListener("click", () => {
        this.hideInviteUserModal();
      });
    }

    if (this.dom.inviteUserCancel) {
      this.dom.inviteUserCancel.addEventListener("click", () => {
        this.hideInviteUserModal();
      });
    }

    if (this.dom.inviteUserForm) {
      this.dom.inviteUserForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleInviteUser();
      });
    }

    // Close modal on outside click
    if (this.dom.inviteUserContainer) {
      this.dom.inviteUserContainer.addEventListener("click", (e) => {
        if (e.target === this.dom.inviteUserContainer) {
          this.hideInviteUserModal();
        }
      });
    }

    // View user profile modal
    if (this.dom.viewUserProfileClose) {
      this.dom.viewUserProfileClose.addEventListener("click", () => {
        this.hideViewUserProfileModal();
      });
    }

    if (this.dom.viewUserProfileOk) {
      this.dom.viewUserProfileOk.addEventListener("click", () => {
        this.hideViewUserProfileModal();
      });
    }

    // Close modal on outside click
    if (this.dom.viewUserProfileContainer) {
      this.dom.viewUserProfileContainer.addEventListener("click", (e) => {
        if (e.target === this.dom.viewUserProfileContainer) {
          this.hideViewUserProfileModal();
        }
      });
    }
  }

  /**
   * Show profile modal
   */
  showProfileModal() {
    if (!this.dom.profileContainer) return;

    // Load curr user data
    const userId = parseInt(this.auth.getUserId());
    const token = this.auth.getToken();

    this.api
      .getUserDetails(userId, token)
      .then((userData) => {
        // Fill form with curr data
        if (this.dom.profileEmail) this.dom.profileEmail.value = userData.email || "";
        if (this.dom.profileName) this.dom.profileName.value = userData.name || "";
        if (this.dom.profileBio) this.dom.profileBio.value = userData.bio || "";
        if (this.dom.profilePassword) this.dom.profilePassword.value = "";

        // Show curr profile image
        this.clearElement(this.dom.profileImagePreview);
        if (userData.image) {
          const img = document.createElement("img");
          img.src = userData.image;
          img.alt = "curr profile image";
          img.style.maxWidth = "200px";
          img.style.maxHeight = "200px";
          this.dom.profileImagePreview.appendChild(img);
        }

        this.dom.profileContainer.style.display = "flex";
      })
      .catch((error) => {
        this.showError(error.message || "Failed to load profile");
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
    const email = this.dom.profileEmail.value.trim();
    const name = this.dom.profileName.value.trim();
    const bio = this.dom.profileBio.value.trim();
    const password = this.dom.profilePassword.value;

    if (!email || !name) {
      this.showError("Email and name are required");
      return;
    }

    const token = this.auth.getToken();

    // Convert image to base64 if selected
    let imagePromise;
    if (this.dom.profileImage.files && this.dom.profileImage.files[0]) {
      imagePromise = this.fileToBase64(this.dom.profileImage.files[0]);
    } else {
      imagePromise = Promise.resolve(null);
    }

    imagePromise
      .then((imageBase64) => {
        return this.api.updateUserProfile(email, name, bio, imageBase64, password, token);
      })
      .then(() => {
        this.hideProfileModal();
        alert("Profile updated successfully!");
      })
      .catch((error) => {
        this.showError(error.message || "Failed to update profile");
      });
  }

  /**
   * Show invite user modal
   */
  showInviteUserModal() {
    if (!this.dom.inviteUserContainer || !this.currChannelId) {
      return;
    }

    const token = this.auth.getToken();

    // Get all users and curr channel details in parallel
    Promise.all([
      this.api.getAllUsers(token),
      this.api.getChannelDetails(this.currChannelId, token)
    ])
      .then(([allUsersResponse, channelData]) => {
        const allUsers = allUsersResponse.users || [];
        const channelMembers = new Set(channelData.members);

        // Filter out users who are already in the channel
        const availableUsers = allUsers.filter(user =>
          user && user.id && !channelMembers.has(user.id)
        );

        // Get detailed user info (including name) for each user
        const userDetailPromises = availableUsers.map((user) => {
          return this.getUserDetails(user.id).then((details) => {
            return {
              id: user.id,
              email: user.email,
              name: details.name || user.email
            };
          });
        });

        return Promise.all(userDetailPromises);
      })
      .then((usersWithDetails) => {
        // Sort alphabetically by name
        usersWithDetails.sort((a, b) => {
          const nameA = a.name || '';
          const nameB = b.name || '';
          return nameA.localeCompare(nameB);
        });

        // Render user list
        this.renderInviteUserList(usersWithDetails);

        // Show modal
        this.dom.inviteUserContainer.style.display = "flex";
      })
      .catch((error) => {
        this.showError(error.message || "Failed to load users");
      });
  }

  /**
   * Render invite user list
   * @param {Array} users - Array of available users
   */
  renderInviteUserList(users) {
    if (!this.dom.inviteUserList) return;

    // Clear existing list
    this.clearElement(this.dom.inviteUserList);

    if (users.length === 0) {
      const emptyMsg = document.createElement("p");
      emptyMsg.textContent = "All users are already in this channel";
      emptyMsg.style.textAlign = "center";
      emptyMsg.style.padding = "2rem";
      emptyMsg.style.color = "#6b7280";
      this.dom.inviteUserList.appendChild(emptyMsg);
      return;
    }

    users.forEach(user => {
      const userItem = document.createElement("div");
      userItem.className = "invite-user-item";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "invite-member-checkbox";
      checkbox.value = user.id;
      checkbox.id = `invite-user-${user.id}`;

      const label = document.createElement("label");
      label.htmlFor = `invite-user-${user.id}`;
      label.className = "invite-member-name";
      label.textContent = user.name;

      userItem.appendChild(checkbox);
      userItem.appendChild(label);
      this.dom.inviteUserList.appendChild(userItem);
    });
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
    if (!this.currChannelId) {
      this.showError("Please select a channel first");
      return;
    }

    // Get all checked checkboxes
    const checkboxes = this.dom.inviteUserList.querySelectorAll('.invite-member-checkbox:checked');
    const userIds = Array.from(checkboxes).map(cb => parseInt(cb.value));

    if (userIds.length === 0) {
      this.showError("Please select at least one user to invite");
      return;
    }

    const token = this.auth.getToken();

    // Invite all selected users
    const invitePromises = userIds.map(userId =>
      this.api.inviteToChannel(this.currChannelId, userId, token)
    );

    Promise.all(invitePromises)
      .then(() => {
        this.hideInviteUserModal();
        alert(`Successfully invited ${userIds.length} user(s)!`);
      })
      .catch((error) => {
        this.showError(error.message || "Failed to invite users");
      });
  }

  /**
   * Set curr channel ID
   * @param {number} channelId - Channel ID
   */
  setcurrChannelId(channelId) {
    this.currChannelId = channelId;
  }

  /**
   * Show user profile modal
   * @param {number} userId - User ID to view
   */
  showViewUserProfileModal(userId) {
    if (!this.dom.viewUserProfileContainer) return;

    const token = this.auth.getToken();

    this.api
      .getUserDetails(userId, token)
      .then((userData) => {
        // Fill user info
        if (this.dom.viewUserProfileName) {
          this.dom.viewUserProfileName.textContent = userData.name || "Unknown User";
        }
        if (this.dom.viewUserProfileEmail) {
          this.dom.viewUserProfileEmail.textContent = userData.email || "N/A";
        }
        if (this.dom.viewUserProfileBio) {
          this.dom.viewUserProfileBio.textContent = userData.bio || "No bio available";
        }

        // Show profile image - use helperManager for unified handling
        // helperManager will use default image if userData.image is null
        this.helperManager.setUserImage(
          this.dom.viewUserProfileImage,
          userData.image,
          userData.name || "User"
        );

        this.dom.viewUserProfileContainer.style.display = "flex";
      })
      .catch((error) => {
        this.showError(error.message || "Failed to load user profile");
      });
  }

  /**
   * Hide view user profile modal
   */
  hideViewUserProfileModal() {
    if (this.dom.viewUserProfileContainer) {
      this.dom.viewUserProfileContainer.style.display = "none";
    }
  }
}
