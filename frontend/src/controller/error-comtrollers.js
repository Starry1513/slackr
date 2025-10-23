
export class ErrorController {
  constructor() {
    this.pages = {
      error: document.getElementById('error-body')
    };
  }

  showError(message) {
    const errorMessage = document.getElementById('error-message');
    errorMessage.textContent = message;
    this.pages.error.style.display = 'flex';
  }

  /**
   * Hide error popup
   */
  hideError() {
    this.pages.error.style.display = 'none';
  }
}
