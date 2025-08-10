import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';

import { useAuth } from '../../context/AuthContext';
import { useLoading } from '../../context/LoadingContext';
import { ButtonLoader } from '../../components/ui';
import { getDashboardRoute } from '../../utils/dashboardRoutes';
import apiService from '../../services/api';
import {
  EyeIcon,
  EyeSlashIcon,
  UserIcon,
  LockClosedIcon,
  ArrowRightIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showGlobalLoading, hideGlobalLoading } = useLoading();
  const { login, googleAuth, loginWithOTP, isAuthenticated, user, error, clearError, loading } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    otp: '',
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [loginMethod, setLoginMethod] = useState('password'); // 'password' or 'otp'
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  const defaultRoute = location.state?.from?.pathname;

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user && !loading) {
      console.log('🔍 Login: User authenticated, redirecting...', {
        userType: user.userType,
        defaultRoute,
        isAuthenticated,
        loading
      });
      
      // Admin and Owner go to dashboard, regular users go to homepage
      let redirectRoute = defaultRoute;
      if (!redirectRoute) {
        if (user.userType === 'admin' || user.userType === 'owner') {
          redirectRoute = getDashboardRoute(user.userType);
          console.log('🔍 Login: Redirecting to dashboard:', redirectRoute);
        } else {
          redirectRoute = '/';
          console.log('🔍 Login: Redirecting to homepage');
        }
      }
      navigate(redirectRoute, { replace: true });
    }
  }, [isAuthenticated, user, loading, navigate, defaultRoute]);

  // Don't automatically clear errors on mount - let them persist until user action
  // This prevents the error from being cleared before it can be displayed



  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (loginMethod === 'password') {
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }
    } else if (loginMethod === 'otp') {
      if (!formData.otp) {
        newErrors.otp = 'OTP is required';
      } else if (formData.otp.length !== 4) {
        newErrors.otp = 'OTP must be 4 digits';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const sendOTP = async () => {
    if (!formData.email) {
      setErrors({ email: 'Please enter your email first' });
      return;
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setErrors({ email: 'Please enter a valid email' });
      return;
    }

    setOtpLoading(true);
    setErrors({});

    try {
      console.log('🔍 Sending OTP to:', formData.email);

      const result = await apiService.sendLoginOTP(formData.email);

      if (result.success) {
        setOtpSent(true);
        setErrors({ success: result.message });
        console.log('🔍 OTP sent successfully:', result);
      } else {
        setErrors({ general: result.message || 'Failed to send OTP. Please try again.' });
      }
    } catch (error) {
      console.error('🚨 Send OTP error:', error);
      let errorMessage = 'Failed to send OTP. Please try again.';

      if (error.message) {
        if (error.message.includes('No account found')) {
          errorMessage = 'No account found with this email address.';
        } else {
          errorMessage = error.message;
        }
      }

      setErrors({ general: errorMessage });
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({}); // Clear any existing errors
    clearError(); // Clear auth context errors

    try {
      const loginData = {
        email: formData.email,
        rememberMe: formData.rememberMe
      };

      if (loginMethod === 'password') {
        loginData.password = formData.password;
      } else {
        loginData.otp = formData.otp;
      }

      console.log('🔍 Login: Attempting login with:', {
        method: loginMethod,
        email: loginData.email,
        rememberMe: loginData.rememberMe
      });

      let result;
      if (loginMethod === 'password') {
        result = await login(loginData);
      } else {
        // Use OTP login from auth context
        console.log('🔍 Login: Attempting OTP login with:', { email: formData.email, otp: formData.otp });
        result = await loginWithOTP(formData.email, formData.otp);
        console.log('🔍 Login: OTP login result:', result);
      }

      if (result && result.success) {
        console.log('🔍 Login: Login successful, result:', result);
        console.log('🔍 Login: User type:', result.user?.userType);
        console.log('🔍 Login: Auth context state after login:', { isAuthenticated, user });

        // Different redirect logic for password vs OTP login
        let redirectRoute = defaultRoute;
        if (!redirectRoute) {
          if (loginMethod === 'otp') {
            // OTP login always goes to homepage
            redirectRoute = '/';
            console.log('🔍 Login: OTP login - Redirecting to homepage');
          } else {
            // Password login: Admin and Owner go to dashboard, regular users go to homepage
            if (result.user?.userType === 'admin' || result.user?.userType === 'owner') {
              redirectRoute = getDashboardRoute(result.user.userType);
              console.log('🔍 Login: Password login - Redirecting to dashboard:', redirectRoute);
            } else {
              redirectRoute = '/';
              console.log('🔍 Login: Password login - Redirecting to homepage');
            }
          }
        }

        console.log('🔍 Login: About to navigate to:', redirectRoute);

        // Small delay to ensure auth context is updated
        setTimeout(() => {
          console.log('🔍 Login: Auth context state after delay:', { isAuthenticated, user });
          navigate(redirectRoute, { replace: true });
        }, 100);
      } else {
        // Handle specific error types
        let errorMessage = (result && result.error) || 'Login failed. Please try again.';

        if (result && result.type === 'ACCOUNT_REJECTED') {
          errorMessage = result.error;
        } else if (result && result.type === 'PENDING_APPROVAL') {
          errorMessage = result.error;
        } else if (result && result.type === 'INVALID_CREDENTIALS') {
          errorMessage = result.error;
        }

        console.error('🚨 Login failed:', errorMessage);
        setErrors({ general: errorMessage });
      }
    } catch (error) {
      console.error('🚨 Login error:', error);

      // Handle the error properly - use the actual error message
      let errorMessage = error.message || 'An unexpected error occurred. Please try again.';

      // Check if it's an authentication error
      if (error.message && error.message.includes('Invalid email or password')) {
        errorMessage = error.message;
      } else if (error.message && error.message.includes('Network')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      }

      setErrors({ general: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider) => {
    if (provider === 'google') {
      setIsLoading(true);
      setErrors({}); // Clear any existing errors

      try {
        console.log('🔍 Starting Google authentication...');
        const result = await googleAuth();
        console.log('🔍 Google auth result:', result);

        if (result && result.success) {
          console.log('🔍 Google Login: Login successful, result:', result);
          console.log('🔍 Google Login: User type:', result.user?.userType);

          // Show success message for new users
          if (result.message && result.message.includes('new user created')) {
            toast.success('Welcome! Your account has been created successfully. Please complete your profile.');
          } else {
            toast.success('Welcome back! You have been logged in successfully.');
          }

          // Admin and Owner go to dashboard, regular users go to homepage
          let redirectRoute = defaultRoute;
          if (!redirectRoute) {
            if (result.user?.userType === 'admin' || result.user?.userType === 'owner') {
              redirectRoute = getDashboardRoute(result.user.userType);
              console.log('🔍 Google Login: Redirecting to dashboard:', redirectRoute);
            } else {
              redirectRoute = '/';
              console.log('🔍 Google Login: Redirecting to homepage');
            }
          }

          // Small delay to show the success message before redirecting
          setTimeout(() => {
            navigate(redirectRoute, { replace: true });
          }, 1000);
        } else {
          const errorMessage = (result && result.error) || 'Google login failed. Please try again.';
          console.error('🚨 Google login failed:', errorMessage);
          setErrors({ general: errorMessage });
        }
      } catch (error) {
        console.error('🚨 Google login error:', error);
        let errorMessage = 'Google login failed. Please try again.';

        // Handle specific error types from backend
        if (error.response && error.response.data) {
          const { message, type } = error.response.data;

          switch (type) {
            case 'DUPLICATE_EMAIL':
              errorMessage = 'An account with this email already exists. Please try logging in with email/password instead.';
              break;
            case 'VALIDATION_ERROR':
              errorMessage = 'Account creation failed due to invalid data. Please try again.';
              break;
            case 'PENDING_APPROVAL':
              errorMessage = 'Your account is pending admin approval. You will be notified once approved.';
              break;
            case 'ACCOUNT_REJECTED':
              errorMessage = 'Your account has been rejected. Please contact support for more information.';
              break;
            default:
              errorMessage = message || errorMessage;
          }
        } else if (error.message) {
          if (error.message.includes('popup-closed-by-user')) {
            errorMessage = 'Google login was cancelled. Please try again.';
          } else if (error.message.includes('popup-blocked')) {
            errorMessage = 'Popup was blocked. Please allow popups and try again.';
          } else if (error.message.includes('network')) {
            errorMessage = 'Network error. Please check your connection and try again.';
          } else {
            errorMessage = error.message;
          }
        }

        setErrors({ general: errorMessage });
      } finally {
        setIsLoading(false);
      }
    } else {
      console.log(`Login with ${provider} - not implemented yet`);
    }
  };

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50">

      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome back!</h2>
            <p className="text-gray-600">Sign in to your account to continue</p>
          </motion.div>

        {/* Login Form */}
                  <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-white rounded-2xl shadow-xl p-8"
          >


            <form onSubmit={handleSubmit} className="space-y-6">
            {/* Success Message */}
            {errors.success && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl p-4 mb-6 shadow-sm"
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircleIcon className="h-4 w-4 text-green-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-green-800 mb-1">✅ Success</h3>
                    <p className="text-sm text-green-700 leading-relaxed">{errors.success}</p>
                  </div>
                  <button
                    onClick={() => setErrors({})}
                    className="flex-shrink-0 p-1 rounded-full hover:bg-green-200 transition-colors duration-200"
                    aria-label="Dismiss success"
                  >
                    <svg className="h-4 w-4 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </motion.div>
            )}

            {/* Error Message */}
            {(errors.general || error) && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl p-4 mb-6 shadow-sm"
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <svg className="h-4 w-4 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-red-800 mb-1">
                      {(errors.general || error || '').includes('rejected') ? '🚫 Account Rejected' :
                       (errors.general || error || '').includes('pending') ? '⏳ Account Pending Approval' :
                       (errors.general || error || '').includes('Invalid') ? '🔐 Authentication Failed' : '⚠️ Error'}
                    </h3>
                    <p className="text-sm text-red-700 leading-relaxed">{errors.general || error}</p>
                  </div>
                  <button
                    onClick={() => {
                      setErrors({});
                      clearError();
                    }}
                    className="flex-shrink-0 p-1 rounded-full hover:bg-red-200 transition-colors duration-200"
                    aria-label="Dismiss error"
                  >
                    <svg className="h-4 w-4 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </motion.div>
            )}

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Login ID <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`block w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors bg-gray-50 ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter Your Email Address"
                  // style={{ textTransform: 'uppercase' }}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Login Method Toggle */}
            <div className="space-y-4">
              <div className="flex items-center space-x-6">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="loginMethod"
                    value="password"
                    checked={loginMethod === 'password'}
                    onChange={(e) => {
                      setLoginMethod(e.target.value);
                      setErrors({});
                      setOtpSent(false);
                      clearError();
                    }}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">Password</span>
                </label>

                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="loginMethod"
                    value="otp"
                    checked={loginMethod === 'otp'}
                    onChange={(e) => {
                      setLoginMethod(e.target.value);
                      setErrors({});
                      setOtpSent(false);
                      clearError();
                    }}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">OTP</span>
                </label>
              </div>
            </div>

            {/* Password Field - Only show when password method is selected */}
            {loginMethod === 'password' && (
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`block w-full px-3 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                      errors.password ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
              </div>
            )}

            {/* OTP Field - Only show when OTP method is selected */}
            {loginMethod === 'otp' && (
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                  OTP <span className="text-red-500">*</span>
                </label>
                <div className="space-y-3">
                  {!otpSent ? (
                    <button
                      type="button"
                      onClick={sendOTP}
                      disabled={otpLoading || !formData.email}
                      className="w-full py-3 px-4 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {otpLoading ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600 mr-2"></div>
                          Sending OTP...
                        </div>
                      ) : (
                        'Send OTP'
                      )}
                    </button>
                  ) : (
                    <div>
                      <input
                        id="otp"
                        name="otp"
                        type="text"
                        maxLength="4"
                        value={formData.otp}
                        onChange={handleInputChange}
                        className={`block w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors text-center text-lg tracking-widest ${
                          errors.otp ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder="0000"
                      />
                      <div className="flex justify-between items-center mt-2">
                        <p className="text-sm text-green-600">OTP sent to your email</p>
                        <button
                          type="button"
                          onClick={sendOTP}
                          disabled={otpLoading}
                          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                        >
                          Resend OTP
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                {errors.otp && (
                  <p className="mt-1 text-sm text-red-600">{errors.otp}</p>
                )}
              </div>
            )}



            {/* Remember Me & Forgot Password - Only for password login */}
            {loginMethod === 'password' && (
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="rememberMe"
                    name="rememberMe"
                    type="checkbox"
                    checked={formData.rememberMe}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700">
                    Remember me
                  </label>
                </div>
                <Link
                  to="/forgot-password"
                  className="text-sm text-primary-600 hover:text-primary-500 font-medium"
                >
                  Forgot password?
                </Link>
              </div>
            )}

            {/* Having Trouble Logging in - For OTP */}
            {loginMethod === 'otp' && (
              <div className="text-center">
                <Link
                  to="/forgot-password"
                  className="text-sm text-primary-600 hover:text-primary-500 font-medium"
                >
                  Having Trouble Logging in?
                </Link>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || (loginMethod === 'otp' && !otpSent)}
              className="w-full btn-primary relative"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <ButtonLoader size="sm" color="white" />
                  {loginMethod === 'password' ? 'Signing in...' : 'Verifying OTP...'}
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  {loginMethod === 'password' ? 'Sign in' : 'Verify OTP'}
                  <ArrowRightIcon className="ml-2 h-4 w-4" />
                </div>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>
          </div>

          {/* Google Sign-In Button */}
          <div className="mt-6">
            <button
              onClick={() => handleSocialLogin('google')}
              disabled={isLoading}
              className={`w-full inline-flex justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200 ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400 mr-2"></div>
                  Signing in with Google...
                </div>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="ml-2">Continue with Google</span>
                </>
              )}
            </button>


          </div>

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Sign up for free
              </Link>
            </p>
          </div>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white rounded-xl p-6 shadow-lg"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
            Why choose TurfEase?
          </h3>
          <div className="space-y-3">
            <div className="flex items-center">
              <CheckCircleIcon className="h-5 w-5 text-primary-500 mr-3" />
              <span className="text-sm text-gray-600">Book turfs instantly</span>
            </div>
            <div className="flex items-center">
              <CheckCircleIcon className="h-5 w-5 text-primary-500 mr-3" />
              <span className="text-sm text-gray-600">AI-powered team matching</span>
            </div>
            <div className="flex items-center">
              <CheckCircleIcon className="h-5 w-5 text-primary-500 mr-3" />
              <span className="text-sm text-gray-600">Join tournaments & earn rewards</span>
            </div>
          </div>
        </motion.div>

        
        </div>
      </div>
    </div>
  );
};

export default Login;