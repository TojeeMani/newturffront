import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

import {
  EnvelopeIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const ForgotPassword = () => {
  const { forgotPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError('Email is required');
      return;
    }
    
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const result = await forgotPassword(email);

      if (result.success) {
        setIsSubmitted(true);
      } else {
        setError(result.error || 'Failed to send reset email. Please try again.');
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsLoading(true);
    setError('');

    try {
      const result = await forgotPassword(email);
      if (!result.success) {
        setError(result.error || 'Failed to resend reset email. Please try again.');
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50">

        <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-2xl shadow-xl p-8 text-center"
          >
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircleIcon className="w-8 h-8 text-primary-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Check your email
            </h2>
            
            <p className="text-gray-600 mb-6">
              We've sent a password reset link to{' '}
              <span className="font-medium text-gray-900">{email}</span>
            </p>
            
            <div className="space-y-4">
              <button
                onClick={handleResend}
                disabled={isLoading}
                className="w-full btn-secondary"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mr-2"></div>
                    Resending...
                  </div>
                ) : (
                  'Resend email'
                )}
              </button>
              
              <Link
                to="/login"
                className="w-full btn-primary inline-flex items-center justify-center"
              >
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                Back to login
              </Link>
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Didn't receive the email?</strong> Check your spam folder or try resending the email.
              </p>
            </div>
          </motion.div>
          </div>
        </div>
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Forgot your password?</h2>
            <p className="text-gray-600">
              No worries! Enter your email and we'll send you a reset link.
            </p>
          </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                    error ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Enter your email address"
                />
              </div>
              {error && (
                <div className="mt-2 flex items-center text-red-600">
                  <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                  <span className="text-sm">{error}</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Sending reset link...
                </div>
              ) : (
                'Send reset link'
              )}
            </button>
          </form>

          <div className="mt-6">
            <Link
              to="/login"
              className="w-full btn-secondary inline-flex items-center justify-center"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Back to login
            </Link>
          </div>

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

        {/* Help Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white rounded-xl p-6 shadow-lg"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
            Need help?
          </h3>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start">
              <CheckCircleIcon className="h-4 w-4 text-primary-500 mr-2 mt-0.5 flex-shrink-0" />
              <span>Reset links are valid for 24 hours</span>
            </div>
            <div className="flex items-start">
              <CheckCircleIcon className="h-4 w-4 text-primary-500 mr-2 mt-0.5 flex-shrink-0" />
              <span>Check your spam folder if you don't see the email</span>
            </div>
            <div className="flex items-start">
              <CheckCircleIcon className="h-4 w-4 text-primary-500 mr-2 mt-0.5 flex-shrink-0" />
              <span>Contact support if you continue having issues</span>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200 text-center">
            <Link
              to="/contact"
              className="text-sm text-primary-600 hover:text-primary-500 font-medium"
            >
              Contact Support
            </Link>
          </div>
        </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;