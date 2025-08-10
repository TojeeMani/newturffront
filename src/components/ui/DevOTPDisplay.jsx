import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardDocumentIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

const DevOTPDisplay = ({ otp, message, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [copied, setCopied] = useState(false);

  if (!otp || process.env.NODE_ENV !== 'development') {
    return null;
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(otp);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy OTP:', err);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) {
      setTimeout(onClose, 300);
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="fixed top-4 right-4 z-50 max-w-sm"
        >
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg border border-blue-200 p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <InformationCircleIcon className="h-5 w-5 text-white" />
                <h3 className="text-sm font-semibold text-white">
                  Development Mode
                </h3>
              </div>
              <button
                onClick={handleClose}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Message */}
            <p className="text-white text-xs mb-3 opacity-90">
              {message || 'Email service bypassed in development'}
            </p>

            {/* OTP Display */}
            <div className="bg-white bg-opacity-20 rounded-lg p-3 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-white text-xs font-medium">Your OTP:</span>
                  <code className="bg-white bg-opacity-30 text-white px-2 py-1 rounded text-sm font-mono font-bold tracking-wider">
                    {otp}
                  </code>
                </div>
                <button
                  onClick={handleCopy}
                  className="text-white hover:text-gray-200 transition-colors p-1"
                  title="Copy OTP"
                >
                  {copied ? (
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      className="text-green-300"
                    >
                      ✓
                    </motion.div>
                  ) : (
                    <ClipboardDocumentIcon className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Instructions */}
            <div className="mt-3 text-xs text-white opacity-80">
              <p>• Copy this OTP and paste it in the verification form</p>
              <p>• In production, this will be sent via email</p>
            </div>

            {/* Auto-close timer */}
            <div className="mt-3">
              <div className="w-full bg-white bg-opacity-20 rounded-full h-1">
                <motion.div
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: 10, ease: 'linear' }}
                  className="bg-white h-1 rounded-full"
                  onAnimationComplete={handleClose}
                />
              </div>
              <p className="text-xs text-white opacity-60 mt-1 text-center">
                Auto-closes in 10 seconds
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DevOTPDisplay;
