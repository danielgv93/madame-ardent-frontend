export type MessageType = 'success' | 'error' | 'warning' | 'info';

export interface MessageOptions {
  autoHide?: boolean;
  duration?: number;
  className?: string;
}

export class UIMessages {
  private successElement: HTMLElement | null;
  private errorElement: HTMLElement | null;

  constructor(successId: string = 'success-message', errorId: string = 'error-message') {
    this.successElement = document.getElementById(successId);
    this.errorElement = document.getElementById(errorId);
  }

  showSuccess(message?: string, options?: MessageOptions): void {
    if (message && this.successElement) {
      this.successElement.textContent = message;
    }
    this.show(this.successElement, options);
    this.hide(this.errorElement);
  }

  showError(message?: string, options?: MessageOptions): void {
    if (message && this.errorElement) {
      this.errorElement.textContent = message;
    }
    this.show(this.errorElement, options);
    this.hide(this.successElement);
  }

  hideAll(): void {
    this.hide(this.successElement);
    this.hide(this.errorElement);
  }

  private show(element: HTMLElement | null, options?: MessageOptions): void {
    if (!element) return;

    element.classList.remove('hidden');
    
    if (options?.className) {
      element.className = options.className;
    }

    if (options?.autoHide) {
      const duration = options.duration || 5000;
      setTimeout(() => {
        this.hide(element);
      }, duration);
    }
  }

  private hide(element: HTMLElement | null): void {
    if (!element) return;
    element.classList.add('hidden');
  }

  static createMessage(type: MessageType, message: string, containerId?: string): HTMLElement {
    const messageDiv = document.createElement('div');
    
    const baseClasses = 'mt-6 p-4 border rounded-md';
    const typeClasses = {
      success: 'bg-green-100 border-green-400 text-green-700',
      error: 'bg-red-100 border-red-400 text-red-700',
      warning: 'bg-yellow-100 border-yellow-400 text-yellow-700',
      info: 'bg-blue-100 border-blue-400 text-blue-700'
    };

    messageDiv.className = `${baseClasses} ${typeClasses[type]}`;
    messageDiv.textContent = message;

    if (containerId) {
      const container = document.getElementById(containerId);
      container?.appendChild(messageDiv);
    }

    return messageDiv;
  }
}