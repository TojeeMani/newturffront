import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import OTPVerification from '../components/OTPVerification';
import { showSuccessToast, showInfoToast } from '../utils/toast';

const OTPVerificationPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get OTP data from navigation state
  const otpData = location.state;
  
  console.log('🔧 OTPVerificationPage: Received data:', otpData);
  
  // If no OTP data, redirect to register
  if (!otpData || !otpData.userId) {
    console.log('🔧 OTPVerificationPage: No OTP data, redirecting to register');
    navigate('/register', { replace: true });
    return null;
  }
  
  const handleOtpVerificationComplete = (result) => {
    console.log('✅ OTP verification completed:', result);
    showSuccessToast(result.message);

    if (result.userType === 'player') {
      navigate('/login');
    } else {
      // For owners, show pending approval message
      showInfoToast('Your account is pending admin approval. You will be notified once approved.');
      navigate('/login');
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Verify Your Email
            </h1>
            <p className="text-gray-600">
              We've sent a verification code to
            </p>
            <p className="text-green-600 font-medium">
              {otpData.email}
            </p>
          </div>
          
          <OTPVerification
            userId={otpData.userId}
            email={otpData.email}
            userType={otpData.userType}
            onVerificationComplete={handleOtpVerificationComplete}
          />
          
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/register')}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              ← Back to Registration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OTPVerificationPage;
