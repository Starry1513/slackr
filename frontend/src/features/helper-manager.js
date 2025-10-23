/**
 * helperManager - Centralized manager for all user image displays
 * Responsible for: rendering user profile images with fallback to default image
 */
export class helperManager {
  constructor() {
    // Default image path for users without profile images
    this.defaultUserImage = "./src/resourse/test2.png";
  }

  /**
   * Set an <img> element's source, alt text, and make it visible.
   *
   * If imageElement is falsy, the function returns immediately and performs no changes.
   * If imageUrl is provided (truthy) it will be assigned to imageElement.src; otherwise
   * this.defaultUserImage is used as a fallback. The element's alt attribute will be set
   * to the provided userName (defaults to "User"), and the element's display style will
   * be set to "block".
   *
   * Note: This method expects to be invoked with a `this` context that contains a
   * `defaultUserImage` property when imageUrl is not supplied.
   *
   * @param {HTMLImageElement|null|undefined} imageElement - The <img> element to update. If falsy, no action is taken.
   * @param {string|null|undefined} imageUrl - URL to set as the image source. If falsy, `this.defaultUserImage` is used.
   * @param {string} [userName="User"] - Text to set as the image's alt attribute.
   * @returns {void}
   */
  setUserImage(imageElement, imageUrl, userName = "User") {
    if (!imageElement) return;
      imageElement.src = imageUrl ? imageUrl : this.defaultUserImage;
      imageElement.alt = userName;
      imageElement.style.display = "block";
    }

  /**
   * Create and append user image to a container
   * @param {HTMLElement} container - Container to append image to
   * @param {Object} template - Template element with cloneNode
   * @param {string|null} imageUrl - User's profile image URL
   * @param {string} userName - User's name
   */
  renderUserImageFromTemplate(container, template, imageUrl, userName = "User") {
    if (!container || !template) return;

    const imgFragment = template.content.cloneNode(true);
    const img = imgFragment.querySelector(".message-sender-image");

    if (img) {
      if (imageUrl) {
        img.src = imageUrl;
        img.alt = userName;
      } else {
        img.src = this.defaultUserImage;
        img.alt = userName;
      }
      container.appendChild(imgFragment);
    }
  }


}
