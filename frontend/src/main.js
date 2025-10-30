import { App } from "./app.js";
import { StarfieldController } from "./starfield-controller.js";

console.log("Slackr loaded!");

document.addEventListener("DOMContentLoaded", () => {
  const app = new App();
  app.init();

  // Initialize starfield background for auth pages
  const starfield = new StarfieldController("starfield-canvas");

  // Cleanup on page unload
  window.addEventListener("beforeunload", () => {
    starfield.destroy();
  });
});
