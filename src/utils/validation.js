import apiService from '../services/api';

// Mock email database for testing (remove this when backend is ready)
const MOCK_EXISTING_EMAILS = [
  'test@example.com',
  'admin@turfease.com',
  'user@gmail.com',
  'owner@turfease.com',
  'demo@test.com'
];

// Validation patterns
export const VALIDATION_PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[6-9]\d{9}$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  name: /^[a-zA-Z\s]{2,50}$/,
  businessName: /^[a-zA-Z0-9\s&.-]{2,100}$/,
  pincode: /^[1-9][0-9]{5}$/
};

// Validation messages
export const VALIDATION_MESSAGES = {
  required: (field) => `${field} is required`,
  email: 'Please enter a valid email address',
  emailExists: 'This email is already registered',
  phone: 'Please enter a valid 10-digit mobile number',
  password: 'Password must be at least 8 characters with uppercase, lowercase, number and special character',
  passwordMatch: 'Passwords do not match',
  name: 'Name must be 2-50 characters and contain only letters',
  businessName: 'Business name must be 2-100 characters',
  pincode: 'Please enter a valid 6-digit pincode',
  minLength: (field, min) => `${field} must be at least ${min} characters`,
  maxLength: (field, max) => `${field} must not exceed ${max} characters`,
  numeric: (field) => `${field} must be a number`,
  positive: (field) => `${field} must be a positive number`
};

// Basic validation functions
export const validators = {
  required: (value) => {
    if (typeof value === 'string') return value.trim().length > 0;
    return value !== null && value !== undefined && value !== '';
  },

  email: (value) => {
    if (!value) return true; // Allow empty for optional fields
    return VALIDATION_PATTERNS.email.test(value);
  },

  phone: (value) => {
    if (!value) return true; // Allow empty for optional fields
    return VALIDATION_PATTERNS.phone.test(value.replace(/\s+/g, ''));
  },

  password: (value) => {
    if (!value) return true; // Allow empty for optional fields
    return VALIDATION_PATTERNS.password.test(value);
  },

  name: (value) => {
    if (!value) return true; // Allow empty for optional fields
    return VALIDATION_PATTERNS.name.test(value);
  },

  businessName: (value) => {
    if (!value) return true; // Allow empty for optional fields
    return VALIDATION_PATTERNS.businessName.test(value);
  },

  pincode: (value) => {
    if (!value) return true; // Allow empty for optional fields
    return VALIDATION_PATTERNS.pincode.test(value);
  },

  minLength: (value, min) => {
    if (!value) return true; // Allow empty for optional fields
    return value.length >= min;
  },

  maxLength: (value, max) => {
    if (!value) return true; // Allow empty for optional fields
    return value.length <= max;
  },

  numeric: (value) => {
    if (!value) return true; // Allow empty for optional fields
    return !isNaN(value) && !isNaN(parseFloat(value));
  },

  positive: (value) => {
    if (!value) return true; // Allow empty for optional fields
    const num = parseFloat(value);
    return !isNaN(num) && num > 0;
  },

  passwordMatch: (password, confirmPassword) => {
    return password === confirmPassword;
  }
};

// Real-time email existence check
let emailCheckTimeout = null;
export const checkEmailExists = async (email) => {
  return new Promise((resolve) => {
    // Clear previous timeout
    if (emailCheckTimeout) {
      clearTimeout(emailCheckTimeout);
    }

    // Debounce the API call
    emailCheckTimeout = setTimeout(async () => {
      try {
        if (!email || !validators.email(email)) {
          resolve({ exists: false, error: null });
          return;
        }

        console.log('🔍 Checking email existence for:', email);

        try {
          const response = await apiService.checkEmailExists(email);
          console.log('📧 Email check response:', response);

          resolve({
            exists: response.exists || false,
            error: null,
            message: response.message || (response.exists ? 'Email already exists' : 'Email is available')
          });
        } catch (apiError) {
          console.warn('⚠️ API endpoint not available, using mock validation');

          // Use mock validation when API is not available
          const emailExists = MOCK_EXISTING_EMAILS.includes(email.toLowerCase());
          resolve({
            exists: emailExists,
            error: null,
            message: emailExists ? 'This email is already registered' : 'Email is available',
            isMock: true
          });
        }
      } catch (error) {
        console.error('❌ Email check error:', error);
        resolve({ exists: false, error: 'Unable to verify email' });
      }
    }, 1000); // 1000ms debounce to reduce blinking
  });
};

// Field validation function
export const validateField = (fieldName, value, rules = [], additionalData = {}) => {
  const errors = [];

  for (const rule of rules) {
    let isValid = true;
    let errorMessage = '';

    switch (rule.type) {
      case 'required':
        isValid = validators.required(value);
        errorMessage = VALIDATION_MESSAGES.required(rule.field || fieldName);
        break;

      case 'email':
        isValid = validators.email(value);
        errorMessage = VALIDATION_MESSAGES.email;
        break;

      case 'phone':
        isValid = validators.phone(value);
        errorMessage = VALIDATION_MESSAGES.phone;
        break;

      case 'password':
        isValid = validators.password(value);
        errorMessage = VALIDATION_MESSAGES.password;
        break;

      case 'passwordMatch':
        isValid = validators.passwordMatch(additionalData.password, value);
        errorMessage = VALIDATION_MESSAGES.passwordMatch;
        break;

      case 'name':
        isValid = validators.name(value);
        errorMessage = VALIDATION_MESSAGES.name;
        break;

      case 'businessName':
        isValid = validators.businessName(value);
        errorMessage = VALIDATION_MESSAGES.businessName;
        break;

      case 'pincode':
        isValid = validators.pincode(value);
        errorMessage = VALIDATION_MESSAGES.pincode;
        break;

      case 'minLength':
        isValid = validators.minLength(value, rule.min);
        errorMessage = VALIDATION_MESSAGES.minLength(rule.field || fieldName, rule.min);
        break;

      case 'maxLength':
        isValid = validators.maxLength(value, rule.max);
        errorMessage = VALIDATION_MESSAGES.maxLength(rule.field || fieldName, rule.max);
        break;

      case 'numeric':
        isValid = validators.numeric(value);
        errorMessage = VALIDATION_MESSAGES.numeric(rule.field || fieldName);
        break;

      case 'positive':
        isValid = validators.positive(value);
        errorMessage = VALIDATION_MESSAGES.positive(rule.field || fieldName);
        break;

      default:
        console.warn(`Unknown validation rule: ${rule.type}`);
        continue;
    }

    if (!isValid) {
      errors.push(errorMessage);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Form validation
export const validateForm = (formData, validationRules) => {
  const errors = {};
  let isFormValid = true;

  for (const [fieldName, rules] of Object.entries(validationRules)) {
    const fieldValue = formData[fieldName];
    const validation = validateField(fieldName, fieldValue, rules, formData);
    
    if (!validation.isValid) {
      errors[fieldName] = validation.errors;
      isFormValid = false;
    }
  }

  return {
    isValid: isFormValid,
    errors
  };
};

// Password strength checker
export const getPasswordStrength = (password) => {
  if (!password) return { score: 0, feedback: [] };

  const feedback = [];
  let score = 0;

  // Length check
  if (password.length >= 8) score += 1;
  else feedback.push('Use at least 8 characters');

  // Lowercase check
  if (/[a-z]/.test(password)) score += 1;
  else feedback.push('Add lowercase letters');

  // Uppercase check
  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push('Add uppercase letters');

  // Number check
  if (/\d/.test(password)) score += 1;
  else feedback.push('Add numbers');

  // Special character check
  if (/[@$!%*?&]/.test(password)) score += 1;
  else feedback.push('Add special characters (@$!%*?&)');

  const strength = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'][score];
  const color = ['#ef4444', '#f59e0b', '#eab308', '#22c55e', '#16a34a'][score];

  return {
    score,
    strength,
    color,
    feedback,
    isValid: score >= 4
  };
};

const validationUtils = {
  validators,
  validateField,
  validateForm,
  checkEmailExists,
  getPasswordStrength,
  VALIDATION_PATTERNS,
  VALIDATION_MESSAGES
};

export default validationUtils;
