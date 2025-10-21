import { ApiService } from "./api.js";
import { AuthManager } from "./auth/auth.js";
import { PageController } from "./page-controller.js";
import { ChannelManager } from "./features/channel-manager.js";
import { Dashboard } from "./features/dashboard-manager.js";
import { MessageManager } from "./features/message-manager.js";
import { UserManager } from "./features/user-manager.js";

export class App {
  constructor() {
    this.api = new ApiService();
    this.auth = new AuthManager();
    this.pageController = new PageController();

    // Initialize managers
    this.message = new MessageManager(this.api, this.auth, this.pageController);
    this.user = new UserManager(this.api, this.auth, this.pageController);
    this.channel = new ChannelManager(this.api, this.auth, this.pageController, this.message, this.user);
    this.dashboard = new Dashboard(this.api, this.auth, this.pageController, this.channel);
  }

  init() {
    // Initialize all managers
    this.message.init();
    this.user.init();
    this.dashboard.init();
  }

}