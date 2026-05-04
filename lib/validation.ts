// Input validation utilities

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: string) => string | null;
}

export interface ValidationResult {
  isValid: boolean;
  error: string | null;
}

export class Validator {
  static validate(value: string, rules: ValidationRule): ValidationResult {
    if (rules.required && (!value || value.trim().length === 0)) {
      return { isValid: false, error: 'This field is required' };
    }

    if (rules.minLength && value.length < rules.minLength) {
      return {
        isValid: false,
        error: `Must be at least ${rules.minLength} characters long`,
      };
    }

    if (rules.maxLength && value.length > rules.maxLength) {
      return {
        isValid: false,
        error: `Must be no more than ${rules.maxLength} characters long`,
      };
    }

    if (rules.pattern && !rules.pattern.test(value)) {
      return { isValid: false, error: 'Invalid format' };
    }

    if (rules.custom) {
      const customError = rules.custom(value);
      if (customError) {
        return { isValid: false, error: customError };
      }
    }

    return { isValid: true, error: null };
  }

  static validateEmail(email: string): ValidationResult {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return this.validate(email, {
      required: true,
      pattern: emailPattern,
      custom: (value) => {
        if (value.length > 254) return 'Email address is too long';
        return null;
      },
    });
  }

  static validateCommitmentTitle(title: string): ValidationResult {
    return this.validate(title, {
      required: true,
      minLength: 3,
      maxLength: 100,
      custom: (value) => {
        if (!/^[a-zA-Z0-9\s\-_.,!?]+$/.test(value)) {
          return 'Only letters, numbers, and basic punctuation allowed';
        }
        return null;
      },
    });
  }

  static validateCommitmentDescription(description: string): ValidationResult {
    return this.validate(description, {
      required: true,
      minLength: 10,
      maxLength: 500,
      custom: (value) => {
        if (value.trim().split(/\s+/).length < 3) {
          return 'Please provide more detail';
        }
        return null;
      },
    });
  }

  static sanitizeInput(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove potential JS protocols
      .replace(/on\w+=/gi, ''); // Remove potential event handlers
  }
}
