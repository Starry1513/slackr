import { App } from "./app.js";

console.log("Slackr loaded!");

document.addEventListener("DOMContentLoaded", () => {
  const app = new App();
  app.init();
});
