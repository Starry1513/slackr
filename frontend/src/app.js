import { ApiService } from "./api.js";
import { AuthManager } from "./auth/auth.js";
import { PageController } from "./controller/page-controller.js";
import { ChannelManager } from "./features/channel-manager.js";
import { Dashboard } from "./features/dashboard-manager.js";
import { MessageManager } from "./features/message-manager.js";
import { UserManager } from "./features/user-manager.js";
import { ImageManager } from "./features/image-manager.js";
import { ErrorController } from "./controller/error-controller.js";
import { helperManager} from "./features/helper-manager.js";
import { Router } from "./router.js";
import { OfflineManager } from "./features/offline-manager.js";

export class App {
  constructor() {
    this.api = new ApiService();
    this.auth = new AuthManager();
    this.pageController = new PageController();
    this.ErrorController = new ErrorController();
    this.helperManager = new helperManager();
    this.router = new Router();
    this.offlineManager = new OfflineManager();

    // Initialize managers
    this.user = new UserManager(this.api, this.auth, this.ErrorController);
    this.image = new ImageManager(this.api, this.auth, this.ErrorController);
    this.message = new MessageManager(this.api, this.auth, this.ErrorController, this.image, this.offlineManager);
    this.channel = new ChannelManager(this.api, this.auth, this.ErrorController, this.message, this.user, this.offlineManager);
    this.dashboard = new Dashboard(this.api, this.auth, this.pageController, this.ErrorController, this.channel, this.message);

    // Set up image upload callback to refresh messages
    this.image.setOnImageUploadedCallback(() => {
      if (this.message.curChannelId) {
        return this.message.loadMessages(this.message.curChannelId);
      }
      return Promise.resolve();
    });

    // Set up URL update callbacks
    this.channel.setOnChannelSelectedCallback((channelId) => {
      this.router.navigateToChannel(channelId);
      // Close sidebar on mobile when channel is selected
      this.dashboard.closeSidebar();
    });

    this.user.setOnProfileViewedCallback((userId) => {
      this.router.navigateToProfile(userId);
    });

    // Set up offline manager
    this.setupOfflineManager();

    // Set up router handlers
    this.setupRouter();
  }

  init() {
    // Initialize all managers
    this.image.init();
    this.message.init();
    this.user.init();
    this.dashboard.init();

    // Start push notifications if user is logged in
    if (this.auth.checkLogin()) {
      this.message.startPushNotifications();
    }

    // Initialize router (handle initial hash if present)
    this.router.init();

    console.log(this.auth.getUserId());
  }

  /**
   * Set up router handlers for URL navigation
   */
  setupRouter() {
    // Handle channel routing
    this.router.onChannelRoute((channelId) => {
      // Only route if user is logged in
      if (!this.auth.checkLogin()) {
        return;
      }

      // Navigate to channel
      this.channel.selectChannel(channelId);
    });

    // Handle profile routing
    this.router.onProfileRoute((userId) => {
      // Only route if user is logged in
      if (!this.auth.checkLogin()) {
        return;
      }

      // Show profile
      if (userId === null) {
        // Show own profile
        this.user.showOwnProfile();
      } else {
        // Show other user's profile
        this.user.showUserProfile(userId);
      }
    });
  }

  /**
   * Get router instance
   */
  getRouter() {
    return this.router;
  }

  /**
   * Set up offline manager handlers
   */
  setupOfflineManager() {
    const offlineIndicator = document.getElementById('offline-indicator');

    // Show/hide offline indicator based on online status
    this.offlineManager.onStatusChange((isOnline) => {
      if (offlineIndicator) {
        offlineIndicator.style.display = isOnline ? 'none' : 'block';
      }

      if (!isOnline) {
        console.log('[App] Offline mode activated - using cached data');
      } else {
        console.log('[App] Online - syncing data');
        // Refresh data when back online
        if (this.auth.checkLogin()) {
          this.channel.loadChannels();
        }
      }
    });

    // Show indicator if starting offline
    if (!this.offlineManager.getOnlineStatus() && offlineIndicator) {
      offlineIndicator.style.display = 'block';
    }
  }

  /**
   * Get offline manager instance
   */
  getOfflineManager() {
    return this.offlineManager;
  }

}