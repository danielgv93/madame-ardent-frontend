export type MessageType = 'success' | 'error' | 'warning' | 'info';

export interface MessageOptions {
    autoHide?: boolean;
    duration?: number;
    className?: string;
}

const MESSAGE_STYLES: Record<MessageType, string> = {
    success: 'bg-green-100 border border-green-200 text-green-700',
    error: 'bg-red-100 border border-red-200 text-red-700',
    warning: 'bg-yellow-100 border border-yellow-400 text-yellow-700',
    info: 'bg-blue-100 border border-blue-400 text-blue-700',
};

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

        messageDiv.className = `mt-6 p-4 border rounded-md ${MESSAGE_STYLES[type]}`;
        messageDiv.textContent = message;

        if (containerId) {
            const container = document.getElementById(containerId);
            container?.appendChild(messageDiv);
        }

        return messageDiv;
    }

    /**
     * Shows a typed message in a single container element.
     * Replaces the ad-hoc showMessage() functions found in pages.
     */
    static showInContainer(
        container: HTMLElement,
        message: string,
        type: MessageType,
        options?: MessageOptions,
    ): void {
        container.textContent = message;
        container.className = `rounded-md p-4 ${MESSAGE_STYLES[type]}`;
        container.classList.remove('hidden');

        if (options?.autoHide !== false) {
            const duration = options?.duration || 5000;
            setTimeout(() => {
                container.classList.add('hidden');
            }, duration);
        }
    }
}
