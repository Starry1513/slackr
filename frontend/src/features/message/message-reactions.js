import { BaseManager } from "../base-manager.js";

/**
 * MessageReactions - Handles message reactions and emoji picker
 */
// Separation of Concerns: return which emoji was clicked by user
// dont know what to do with it, just return it to caller
export class MessageReactions extends BaseManager {
  constructor(api, auth, ErrorController) {
    super(api, auth, ErrorController);

    // curr message for emoji picker
    this.currEmojiMessage = null;

    // Common emojis for quick Reac
    this.someEmojis = ["👍", "❤️", "😄", "😮", "😢", "😡", "🎉", "🔥", "👏", "✅", "❌", "👀"];

    // Cache DOM elements
    this.dom = {
      emojiPickerModal: document.getElementById("emoji-picker-modal"),
      emojiPickerList: document.getElementById("emoji-picker-grid"),
      emojiPickerClose: document.getElementById("emoji-picker-close"),
    };
  }

  /**
   * Initialize Reac manager
   * @param {Function} onReacToggle - Callback when Reac is toggled
   */
  init(onReacToggle) {
    this.onReacToggle = onReacToggle;

    // Emoji picker close
    if (this.dom.emojiPickerClose) {
      this.dom.emojiPickerClose.addEventListener("click", () => this.hideEmojiPicker());
    }

    // Emoji grid click (delegation)
    if (this.dom.emojiPickerList) {
      this.dom.emojiPickerList.addEventListener("click", (e) => {
        const btn = e.target.closest("button[data-emoji]");
        if (!btn) return;
        const emoji = btn.dataset.emoji;
        if (!emoji) return;

        // when emoji is clicked, call the callback function
        if (this.currEmojiMessage && this.onReacToggle) {
          this.onReacToggle(this.currEmojiMessage, emoji);
        }
        this.hideEmojiPicker();
      });

      // Populate grid once
      this.renderEmojiGrid();
    }
  }

  /**
   * Toggle Reac on a message
   * @param {number} channelId - Channel ID
   * @param {Object} message - Message object
   * @param {string} emoji - Emoji Reac
   * @returns {Promise}
   */
  // handle the Reac toggling logic for emoji Reac
  toggleReac(channelId, message, emoji) {

  }

  /**
   * Show Reac picker modal
   * @param {Object} message - Message object
   */
  showReacPicker(message) {

  }

  /**
   * Hide emoji picker
   */
  hideEmojiPicker() {

  }

  /**
   * Render the emoji picker grid from someEmojis
   */
  renderEmojiGrid() {

  }
}
