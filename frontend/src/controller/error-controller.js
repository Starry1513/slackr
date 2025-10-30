
export class ErrorController {
  constructor() {
    this.pages = {
      error: document.getElementById('error-body')
    };
    this.errorCloseButton = document.getElementById('error-close');

    // Set up keyboard event listener
    this.setupKeyboardHandler();
  }

  /**
   * Set up keyboard event handler for Enter key
   */
  setupKeyboardHandler() {
    document.addEventListener('keydown', (e) => {
      // Check if error popup is visible and Enter key is pressed
      if (this.pages.error.style.display === 'flex' && e.key === 'Enter') {
        e.preventDefault();
        this.hideError();
      }
    });
  }

  showError(message) {
    const errorMessage = document.getElementById('error-message');
    errorMessage.textContent = message;
    this.pages.error.style.display = 'flex';

    // Auto-focus the close button for keyboard accessibility
    if (this.errorCloseButton) {
      // Use setTimeout to ensure the display change is applied first
      setTimeout(() => {
        this.errorCloseButton.focus();
      }, 10);
    }
  }

  /**
   * Hide error popup
   */
  hideError() {
    this.pages.error.style.display = 'none';
  }
}
