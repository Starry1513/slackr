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

export class App {
  constructor() {
    this.api = new ApiService();
    this.auth = new AuthManager();
    this.pageController = new PageController();
    this.ErrorController = new ErrorController();
    this.helperManager = new helperManager();

    // Initialize managers
    this.user = new UserManager(this.api, this.auth, this.ErrorController);
    this.image = new ImageManager(this.api, this.auth, this.ErrorController);
    this.message = new MessageManager(this.api, this.auth, this.ErrorController, this.image);
    this.channel = new ChannelManager(this.api, this.auth, this.ErrorController, this.message, this.user);
    this.dashboard = new Dashboard(this.api, this.auth, this.pageController, this.ErrorController, this.channel, this.message);

    // Set up image upload callback to refresh messages
    this.image.setOnImageUploadedCallback(() => {
      if (this.message.curChannelId) {
        return this.message.loadMessages(this.message.curChannelId);
      }
      return Promise.resolve();
    });
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

    console.log(this.auth.getUserId());
  }

}