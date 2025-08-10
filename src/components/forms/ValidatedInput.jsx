import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  EyeIcon, 
  EyeSlashIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';
import { validateField, checkEmailExists, getPasswordStrength } from '../../utils/validation';

const ValidatedInput = ({
  type = 'text',
  name,
  label,
  value,
  onChange,
  onBlur,
  validationRules = [],
  placeholder,
  className = '',
  disabled = false,
  required = false,
  showPasswordStrength = false,
  checkEmailAvailability = false,
  debounceMs = 300,
  additionalValidationData = {},
  ...props
}) => {
  const [errors, setErrors] = useState([]);
  const [isValid, setIsValid] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [emailStatus, setEmailStatus] = useState(null); // null, 'checking', 'available', 'taken'
  const [passwordStrength, setPasswordStrength] = useState(null);
  const [isFocused, setIsFocused] = useState(false);
  const [hasBlurred, setHasBlurred] = useState(false);
  const [isMockValidation, setIsMockValidation] = useState(false);
  const [lastCheckedEmail, setLastCheckedEmail] = useState('');

  const debounceRef = useRef(null);
  const emailCheckRef = useRef(null);
  const lastValidationRef = useRef({ value: '', errors: [], isValid: true });

  // Validate field on value change
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      if (value !== undefined && value !== null) {
        // Check if validation result would be different to prevent unnecessary updates
        const currentValidation = JSON.stringify({ value, additionalValidationData });
        const lastValidation = JSON.stringify({
          value: lastValidationRef.current.value,
          additionalValidationData: lastValidationRef.current.additionalValidationData
        });

        if (currentValidation !== lastValidation) {
          const validation = validateField(name, value, validationRules, additionalValidationData);

          // Only update state if validation result actually changed
          if (JSON.stringify(validation.errors) !== JSON.stringify(lastValidationRef.current.errors) ||
              validation.isValid !== lastValidationRef.current.isValid) {
            setErrors(validation.errors);
            setIsValid(validation.isValid);

            lastValidationRef.current = {
              value,
              errors: validation.errors,
              isValid: validation.isValid,
              additionalValidationData
            };
          }

          // Check email availability if needed (only if email changed)
          if (checkEmailAvailability && type === 'email' && validation.isValid && value.trim() && value !== lastCheckedEmail) {
            handleEmailCheck(value);
            setLastCheckedEmail(value);
          }

          // Check password strength if needed
          if (showPasswordStrength && type === 'password') {
            const strength = getPasswordStrength(value);
            setPasswordStrength(strength);
          }
        }
      }
    }, debounceMs);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [value, validationRules, name, checkEmailAvailability, type, showPasswordStrength, debounceMs, additionalValidationData, lastCheckedEmail]);

  const handleEmailCheck = async (email) => {
    if (emailCheckRef.current) {
      clearTimeout(emailCheckRef.current);
    }

    // Don't show checking state immediately to prevent blinking
    let checkingTimeout = setTimeout(() => {
      setEmailStatus('checking');
    }, 100);

    emailCheckRef.current = setTimeout(async () => {
      clearTimeout(checkingTimeout);

      try {
        const result = await checkEmailExists(email);
        console.log('📧 Email check result:', result);

        if (result.error) {
          console.warn('⚠️ Email check error:', result.error);
          setEmailStatus(null);
          setIsMockValidation(false);
        } else if (result.skipCheck) {
          // If email check is not available, skip it silently
          console.log('⏭️ Skipping email check - endpoint not available');
          setEmailStatus(null);
          setIsMockValidation(false);
        } else {
          setEmailStatus(result.exists ? 'taken' : 'available');
          setIsMockValidation(result.isMock || false);

          if (result.exists) {
            setErrors(prev => {
              const newErrors = prev.filter(err => !err.includes('email') && !err.includes('registered'));
              return [...newErrors, result.message || 'This email is already registered'];
            });
            setIsValid(false);
          } else {
            // Remove any existing email errors when email is available
            setErrors(prev => prev.filter(err => !err.includes('email') && !err.includes('registered')));
          }
        }
      } catch (error) {
        console.error('❌ Email check failed:', error);
        setEmailStatus(null);
        setIsMockValidation(false);
      }
    }, 800); // Increased delay to reduce blinking
  };

  const handleInputChange = (e) => {
    onChange(e);

    // Reset email status when user types (only if email actually changed)
    if (checkEmailAvailability && type === 'email' && e.target.value !== lastCheckedEmail) {
      setEmailStatus(null);
      setLastCheckedEmail(''); // Reset to trigger new check
      // Also remove any existing email-related errors
      setErrors(prev => prev.filter(err => !err.includes('email') && !err.includes('registered')));
    }
  };

  const handleInputBlur = (e) => {
    setIsFocused(false);
    setHasBlurred(true);
    if (onBlur) {
      onBlur(e);
    }
  };

  const handleInputFocus = () => {
    setIsFocused(true);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const getInputType = () => {
    if (type === 'password') {
      return showPassword ? 'text' : 'password';
    }
    return type;
  };

  const getValidationIcon = () => {
    if (checkEmailAvailability && type === 'email') {
      if (emailStatus === 'checking') {
        return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>;
      }
      if (emailStatus === 'available' && isValid) {
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      }
      if (emailStatus === 'taken' || !isValid) {
        return <XCircleIcon className="h-4 w-4 text-red-500" />;
      }
    }

    if (hasBlurred && value) {
      if (isValid && errors.length === 0) {
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      }
      if (!isValid || errors.length > 0) {
        return <XCircleIcon className="h-4 w-4 text-red-500" />;
      }
    }

    return null;
  };

  const getBorderColor = () => {
    if (isFocused) return 'border-blue-500 ring-2 ring-blue-200';
    if (hasBlurred && value) {
      if (checkEmailAvailability && type === 'email') {
        if (emailStatus === 'taken' || !isValid) return 'border-red-500';
        if (emailStatus === 'available' && isValid) return 'border-green-500';
      }
      if (!isValid || errors.length > 0) return 'border-red-500';
      if (isValid && errors.length === 0) return 'border-green-500';
    }
    return 'border-gray-300';
  };

  const shouldShowErrors = hasBlurred && (errors.length > 0 || (checkEmailAvailability && emailStatus === 'taken'));

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <input
          type={getInputType()}
          id={name}
          name={name}
          value={value || ''}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            block w-full px-3 py-2 pr-10 border rounded-md shadow-sm 
            placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
            transition-colors duration-200
            ${getBorderColor()}
          `}
          {...props}
        />

        {/* Validation Icon */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 space-x-1">
          {getValidationIcon()}
          
          {/* Password Toggle */}
          {type === 'password' && (
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              {showPassword ? (
                <EyeSlashIcon className="h-4 w-4" />
              ) : (
                <EyeIcon className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Password Strength Indicator */}
      {showPasswordStrength && type === 'password' && passwordStrength && value && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-2"
        >
          <div className="flex items-center space-x-2">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${(passwordStrength.score / 5) * 100}%`,
                  backgroundColor: passwordStrength.color
                }}
              />
            </div>
            <span className="text-xs font-medium" style={{ color: passwordStrength.color }}>
              {passwordStrength.strength}
            </span>
          </div>
          
          {passwordStrength.feedback.length > 0 && (
            <div className="text-xs text-gray-600">
              <div className="flex items-start space-x-1">
                <ExclamationTriangleIcon className="h-3 w-3 text-yellow-500 mt-0.5 flex-shrink-0" />
                <div>
                  {passwordStrength.feedback.map((tip, index) => (
                    <div key={index}>• {tip}</div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Error Messages */}
      <AnimatePresence>
        {shouldShowErrors && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-1"
          >
            {errors.map((error, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex items-center space-x-1 text-sm text-red-600"
              >
                <XCircleIcon className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Email Status Messages */}
      {checkEmailAvailability && type === 'email' && emailStatus === 'available' && isValid && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="flex items-center space-x-1 text-sm text-green-600"
        >
          <CheckCircleIcon className="h-4 w-4 flex-shrink-0" />
          <span>
            Email is available
            {isMockValidation && (
              <span className="text-xs text-gray-500 ml-1">(demo mode)</span>
            )}
          </span>
        </motion.div>
      )}

      {/* Email Taken Message */}
      {checkEmailAvailability && type === 'email' && emailStatus === 'taken' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="flex items-center space-x-1 text-sm text-red-600"
        >
          <XCircleIcon className="h-4 w-4 flex-shrink-0" />
          <span>
            This email is already registered
            {isMockValidation && (
              <span className="text-xs text-gray-500 ml-1">(demo mode)</span>
            )}
          </span>
        </motion.div>
      )}
    </div>
  );
};

export default ValidatedInput;
