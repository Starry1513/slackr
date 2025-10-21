import { ApiService } from "./api.js";
import { AuthManager } from "./auth/auth.js";
import { PageController } from "./page-controller.js";
import { ChannelManager } from "./features/channel-manager.js";
import { Dashboard } from "./features/dashboard-manager.js";

export class App {
  constructor() {
    this.api = new ApiService();
    this.auth = new AuthManager();
    this.pageController = new PageController();
    this.channel = new ChannelManager(this.api, this.auth, this.pageController);
    this.dashboard = new Dashboard(this.api, this.auth, this.pageController, this.channel);

  }

  init() {
    this.dashboard.init();
  }

}