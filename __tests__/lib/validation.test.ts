import { Validator } from '../../lib/validation';

describe('Validator', () => {
  describe('validate', () => {
    it('should validate required field correctly', () => {
      const result = Validator.validate('', { required: true });
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('This field is required');
    });

    it('should pass validation for non-empty required field', () => {
      const result = Validator.validate('test', { required: true });
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });

    it('should validate minimum length', () => {
      const result = Validator.validate('ab', { minLength: 3 });
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Must be at least 3 characters long');
    });

    it('should validate maximum length', () => {
      const result = Validator.validate('abcdef', { maxLength: 5 });
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Must be no more than 5 characters long');
    });

    it('should validate pattern', () => {
      const result = Validator.validate('abc', { pattern: /^\d+$/ });
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid format');
    });

    it('should validate custom rule', () => {
      const result = Validator.validate('test', {
        custom: (value) => (value === 'valid' ? null : 'Custom error'),
      });
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Custom error');
    });
  });

  describe('validateEmail', () => {
    it('should validate valid email', () => {
      const result = Validator.validateEmail('test@example.com');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });

    it('should reject invalid email format', () => {
      const result = Validator.validateEmail('invalid-email');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid format');
    });

    it('should reject empty email', () => {
      const result = Validator.validateEmail('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('This field is required');
    });

    it('should reject overly long email', () => {
      const longEmail = 'a'.repeat(255) + '@example.com';
      const result = Validator.validateEmail(longEmail);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Email address is too long');
    });
  });

  describe('validateCommitmentTitle', () => {
    it('should validate valid commitment title', () => {
      const result = Validator.validateCommitmentTitle('My Daily Exercise');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });

    it('should reject title that is too short', () => {
      const result = Validator.validateCommitmentTitle('Hi');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Must be at least 3 characters long');
    });

    it('should reject title with invalid characters', () => {
      const result = Validator.validateCommitmentTitle('Title with <script>');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe(
        'Only letters, numbers, and basic punctuation allowed'
      );
    });
  });

  describe('validateCommitmentDescription', () => {
    it('should validate valid commitment description', () => {
      const result = Validator.validateCommitmentDescription(
        'This is a detailed description of my commitment that I will follow through with dedication.'
      );
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });

    it('should reject description that is too short', () => {
      const result = Validator.validateCommitmentDescription('Too short');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Please provide more detail');
    });
  });

  describe('sanitizeInput', () => {
    it('should remove HTML tags', () => {
      const result = Validator.sanitizeInput(
        'Hello <script>alert("xss")</script> World'
      );
      expect(result).toBe('Hello alert("xss") World');
    });

    it('should remove JavaScript protocols', () => {
      const result = Validator.sanitizeInput('javascript:alert("xss")');
      expect(result).toBe('alert("xss")');
    });

    it('should remove event handlers', () => {
      const result = Validator.sanitizeInput('onclick=alert("xss")');
      expect(result).toBe('alert("xss")');
    });

    it('should trim whitespace', () => {
      const result = Validator.sanitizeInput('  hello world  ');
      expect(result).toBe('hello world');
    });
  });
});
