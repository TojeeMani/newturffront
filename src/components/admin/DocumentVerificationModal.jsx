import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import ocrService from '../../services/ocrService';
import {
  DocumentArrowUpIcon,
  DocumentCheckIcon,
  DocumentXMarkIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

const DocumentVerificationModal = ({ isOpen, onClose, ownerId, ownerName, documents = [], onVerificationComplete }) => {
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const documentTypes = [
    { value: 'business_license', label: 'Business License', icon: '🏢' },
    { value: 'pan_card', label: 'PAN CARD', icon: '🆔' },
    { value: 'aadhaar_card', label: 'Aadhaar Card', icon: '📄' },
    { value: 'gst_certificate', label: 'GST Certificate', icon: '📋' }
  ];

  const handleFileUpload = async (file, documentType) => {
    try {
      setLoading(true);
      setError('');
      setVerificationResult(null);

      // Validate file
      if (!ocrService.validateFileFormat(file)) {
        throw new Error('Unsupported file format. Please upload JPG, PNG, PDF, TIFF, or BMP files.');
      }

      if (!ocrService.validateFileSize(file)) {
        throw new Error('File size too large. Maximum size is 10MB.');
      }

      // Perform OCR verification
      const result = await ocrService.verifyDocument(file, documentType);
      
      if (result.success) {
        setVerificationResult({
          ...result.data.verification,
          fileName: file.name,
          fileSize: ocrService.formatFileSize(file.size),
          documentType: documentType
        });
      } else {
        throw new Error(result.data.error || 'Verification failed');
      }

    } catch (err) {
      console.error('Document verification error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const documentType = documentTypes[0].value; // Default to first type
      handleFileUpload(file, documentType);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const documentType = documentTypes[0].value; // Default to first type
      handleFileUpload(file, documentType);
    }
  };

  const resetVerification = () => {
    setVerificationResult(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleVerificationComplete = (status) => {
    if (onVerificationComplete) {
      onVerificationComplete(ownerId, status, verificationResult);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Document Verification
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Verify documents for {ownerName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {/* Document Upload Area */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Upload Document for Verification
              </h3>
              
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <DocumentArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  Drag and drop a document here, or click to select
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
                  Supported formats: JPG, PNG, PDF, TIFF, BMP (Max 10MB)
                </p>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf,.tiff,.bmp"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Choose File
                </button>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
                <div className="flex items-center">
                  <MagnifyingGlassIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2 animate-spin" />
                  <span className="text-blue-800 dark:text-blue-200">
                    Processing document... This may take a few moments.
                  </span>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900 rounded-lg">
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
                  <span className="text-red-800 dark:text-red-200">{error}</span>
                </div>
                <button
                  onClick={resetVerification}
                  className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline"
                >
                  Try again
                </button>
              </div>
            )}

            {/* Verification Result */}
            {verificationResult && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Result Summary */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      Verification Result
                    </h3>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      ocrService.getVerificationScoreColor(verificationResult.verificationScore)
                    }`}>
                      {ocrService.getVerificationStatus(verificationResult.verificationScore)}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">File:</span>
                      <span className="ml-2 text-gray-900 dark:text-white">{verificationResult.fileName}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Size:</span>
                      <span className="ml-2 text-gray-900 dark:text-white">{verificationResult.fileSize}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Confidence:</span>
                      <span className="ml-2 text-gray-900 dark:text-white">
                        {Math.round(verificationResult.confidence)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Score:</span>
                      <span className="ml-2 text-gray-900 dark:text-white">
                        {Math.round(verificationResult.verificationScore * 100)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Document Type Specific Results */}
                {verificationResult.documentType === 'business_license' && (
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-4">Business License Details</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Valid License:</span>
                        <span className={`ml-2 font-medium ${
                          verificationResult.isBusinessLicense ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {verificationResult.isBusinessLicense ? 'Yes' : 'No'}
                        </span>
                      </div>
                      {verificationResult.licenseNumber && (
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">License Number:</span>
                          <span className="ml-2 text-gray-900 dark:text-white font-mono">
                            {verificationResult.licenseNumber}
                          </span>
                        </div>
                      )}
                      {verificationResult.dates && verificationResult.dates.length > 0 && (
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Dates Found:</span>
                          <span className="ml-2 text-gray-900 dark:text-white">
                            {verificationResult.dates.join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {verificationResult.documentType === 'pan_card' && (
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-4">PAN Card Details</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Valid PAN:</span>
                        <span className={`ml-2 font-medium ${
                          verificationResult.isPANCard ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {verificationResult.isPANCard ? 'Yes' : 'No'}
                        </span>
                      </div>
                      {verificationResult.panNumber && (
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">PAN Number:</span>
                          <span className="ml-2 text-gray-900 dark:text-white font-mono">
                            {verificationResult.panNumber}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Extracted Text */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-4">Extracted Text</h4>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 max-h-40 overflow-y-auto">
                    <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                      {verificationResult.extractedText || 'No text extracted'}
                    </pre>
                  </div>
                </div>

                {/* Keywords Found */}
                {verificationResult.foundKeywords && verificationResult.foundKeywords.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-4">Keywords Found</h4>
                    <div className="flex flex-wrap gap-2">
                      {verificationResult.foundKeywords.map((keyword, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded text-sm"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={resetVerification}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Reset
              </button>
              
              {/* OCR-based Action Buttons */}
              {verificationResult && (
                <>
                  <button
                    onClick={() => handleVerificationComplete('approved')}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
                  >
                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                    Approve Owner
                  </button>
                  <button
                    onClick={() => handleVerificationComplete('rejected')}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
                  >
                    <XMarkIcon className="h-4 w-4 mr-2" />
                    Reject Owner
                  </button>
                </>
              )}
              
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default DocumentVerificationModal;
