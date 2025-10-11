import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../../services/api';
import { showSuccessToast, showInfoToast } from '../../utils/toast';

const OTPVerification = ({ userId, email, userType, onVerificationComplete }) => {
  console.log('🔧 OTPVerification: Component mounted with props:', { userId, email, userType });

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return; // Only allow single digit
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.querySelector(`input[data-index="${index + 1}"]`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.querySelector(`input[data-index="${index - 1}"]`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpString = otp.join('');
    
    if (otpString.length !== 6) {
      setError('Please enter the complete 6-digit OTP');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await apiService.verifyOTP(userId, otpString);
      
      if (result.success) {
        // Call the callback to handle successful verification
        if (onVerificationComplete) {
          onVerificationComplete(result);
        } else {
          // Default behavior: show success message and redirect
          showSuccessToast(result.message);
          if (userType === 'player') {
            navigate('/login');
          } else {
            // For owners, show pending approval message
            showInfoToast('Your account is pending admin approval. You will be notified once approved.');
            navigate('/login');
          }
        }
      } else {
        setError(result.message || 'OTP verification failed');
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      setError('Failed to verify OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setResendLoading(true);
    setError('');

    try {
      const result = await apiService.resendOTP(userId);
      
      if (result.success) {
        showSuccessToast('New OTP sent to your email successfully!');
        if (result.emailProvider === 'sendgrid') {
          showInfoToast('Email sent via SendGrid');
        }
        setCountdown(60); // Start 60-second countdown
      } else {
        setError(result.message || 'Failed to resend OTP');
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      setError('Failed to resend OTP. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Verify Your Email
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            We've sent a 6-digit verification code to
          </p>
          <p className="text-center text-sm font-medium text-gray-900">
            {email}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="otp" className="sr-only">
              Enter OTP
            </label>
            <div className="flex justify-center space-x-2">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  data-index={index}
                  type="text"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-12 text-center text-lg font-semibold border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-colors"
                  placeholder="0"
                />
              ))}
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading || otp.join('').length !== 6}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Verifying...' : 'Verify OTP'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Didn't receive the code?
            </p>
            <button
              type="button"
              onClick={handleResendOTP}
              disabled={resendLoading || countdown > 0}
              className="text-primary-600 hover:text-primary-500 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resendLoading 
                ? 'Sending...' 
                : countdown > 0 
                  ? `Resend in ${countdown}s` 
                  : 'Resend OTP'
              }
            </button>
          </div>
        </form>

        <div className="text-center">
          <button
            type="button"
            onClick={() => navigate('/register')}
            className="text-gray-600 hover:text-gray-500 text-sm"
          >
            ← Back to Registration
          </button>
        </div>
      </div>
    </div>
  );
};

export default OTPVerification;