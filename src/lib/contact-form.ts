import { FormValidator, type ValidationRule } from './form-validation';
import { UIMessages } from './ui-messages';

export interface ContactFormData extends Record<string, string> {
  name: string;
  user: string;
  email: string;
  country: string;
  services: string;
  message: string;
}

const VALIDATION_RULES: Record<string, ValidationRule> = {
  name: { required: true, minLength: 2, maxLength: 50 },
  user: { required: true, minLength: 3, maxLength: 30 },
  email: { required: true, email: true, maxLength: 100 },
  country: { required: true, minLength: 2, maxLength: 50 },
  services: { required: true },
  message: { required: true, minLength: 10, maxLength: 1000 }
}

export class ContactFormHandler {
  private form: HTMLFormElement;
  private uiMessages: UIMessages;
  private validationRules: Record<string, ValidationRule>;

  constructor(formId: string) {
    const form = document.getElementById(formId) as HTMLFormElement;
    if (!form) {
      throw new Error(`Form with id "${formId}" not found`);
    }
    this.form = form;
    this.uiMessages = new UIMessages();
    this.validationRules = VALIDATION_RULES;
    this.init();
  }

  private init(): void {
    this.form.addEventListener('submit', this.handleSubmit.bind(this));
  }

  private async handleSubmit(e: Event): Promise<void> {
    e.preventDefault();
    
    const formData = new FormData(this.form);
    const data: ContactFormData = {
      name: formData.get('name') as string,
      user: formData.get('user') as string,
      email: formData.get('email') as string,
      country: formData.get('country') as string,
      services: formData.get('services') as string,
      message: formData.get('message') as string,
    };

    const validation = FormValidator.validateForm(data, this.validationRules);
    
    if (!validation.isValid) {
      this.uiMessages.showError(`Errores de validación: ${validation.errors.join('; ')}`);
      return;
    }

    try {
      const response = await fetch('/api/forms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        this.uiMessages.showSuccess('¡Mensaje enviado correctamente! Te contactaremos pronto.', { autoHide: true, duration: 5000 });
        this.form.reset();
      } else {
        throw new Error('Error en la respuesta del servidor');
      }
    } catch (error) {
      this.uiMessages.showError('Error al enviar el mensaje. Por favor, inténtalo de nuevo.');
    }
  }
}