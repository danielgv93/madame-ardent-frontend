export interface ValidationRule {
  required?: boolean;
  email?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class FormValidator {
  static validateField(value: string, rules: ValidationRule): ValidationResult {
    const errors: string[] = [];

    if (rules.required && (!value || value.trim().length === 0)) {
      errors.push('Este campo es requerido');
    }

    if (value && rules.email && !this.isValidEmail(value)) {
      errors.push('Ingresa un correo electrónico válido');
    }

    if (value && rules.minLength && value.length < rules.minLength) {
      errors.push(`Debe tener al menos ${rules.minLength} caracteres`);
    }

    if (value && rules.maxLength && value.length > rules.maxLength) {
      errors.push(`No puede tener más de ${rules.maxLength} caracteres`);
    }

    if (value && rules.pattern && !rules.pattern.test(value)) {
      errors.push('El formato no es válido');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateForm(formData: Record<string, string>, rules: Record<string, ValidationRule>): ValidationResult {
    const allErrors: string[] = [];

    for (const [field, fieldRules] of Object.entries(rules)) {
      const value = formData[field] || '';
      const result = this.validateField(value, fieldRules);
      
      if (!result.isValid) {
        allErrors.push(`${field}: ${result.errors.join(', ')}`);
      }
    }

    return {
      isValid: allErrors.length === 0,
      errors: allErrors
    };
  }

  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}