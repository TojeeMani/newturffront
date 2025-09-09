import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XMarkIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const FileVerificationModal = ({ 
  isOpen, 
  onClose, 
  owner, 
  onApprove, 
  onReject,
  loading = false 
}) => {
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionForm, setShowRejectionForm] = useState(false);

  if (!isOpen || !owner) return null;

  const documents = [
    {
      id: 'businessLicense',
      name: 'Business License',
      url: owner.businessLicense,
      required: true,
      description: 'Valid business registration certificate'
    },
    {
      id: 'identityProof',
      name: 'Identity Proof',
      url: owner.identityProof,
      required: true,
      description: 'Government issued ID (Aadhar, Passport, etc.)'
    },
    {
      id: 'addressProof',
      name: 'Address Proof',
      url: owner.addressProof,
      required: true,
      description: 'Utility bill or rental agreement'
    },
    {
      id: 'turfOwnershipProof',
      name: 'Turf Ownership Proof',
      url: owner.turfOwnershipProof,
      required: false,
      description: 'Property ownership or lease agreement'
    }
  ];

  const handleApprove = () => {
    onApprove(owner._id);
    onClose();
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    onReject(owner._id, rejectionReason);
    onClose();
    setRejectionReason('');
    setShowRejectionForm(false);
  };

  const openDocument = (url) => {
    if (url) {
      window.open(url, '_blank');
    }
  };

  const downloadDocument = (url, filename) => {
    if (url) {
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          {/* Background overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="inline-block w-full max-w-4xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Document Verification
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Review and verify documents for {owner.firstName} {owner.lastName}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Owner Info */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Business Name
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {owner.businessName || 'Not provided'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Email
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {owner.email}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Phone
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {owner.phone || 'Not provided'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Registration Date
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {new Date(owner.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Documents Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <DocumentTextIcon className="w-5 h-5 text-blue-500" />
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {doc.name}
                      </h4>
                      {doc.required && (
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                          Required
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-1">
                      {doc.url ? (
                        <CheckCircleIcon className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircleIcon className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {doc.description}
                  </p>
                  
                  {doc.url ? (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openDocument(doc.url)}
                        className="flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm"
                      >
                        <EyeIcon className="w-4 h-4" />
                        <span>View</span>
                      </button>
                      <button
                        onClick={() => downloadDocument(doc.url, `${owner.firstName}_${doc.name}`)}
                        className="flex items-center space-x-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm"
                      >
                        <ArrowDownTrayIcon className="w-4 h-4" />
                        <span>Download</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 text-red-600">
                      <ExclamationTriangleIcon className="w-4 h-4" />
                      <span className="text-sm">Document not uploaded</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Rejection Form */}
            {showRejectionForm && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-red-900 dark:text-red-300 mb-3">
                  Rejection Reason
                </h4>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please provide a detailed reason for rejection..."
                  className="w-full p-3 border border-red-300 dark:border-red-600 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                  rows={3}
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end space-x-4">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
              
              {!showRejectionForm ? (
                <>
                  <button
                    onClick={() => setShowRejectionForm(true)}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                    disabled={loading}
                  >
                    Reject
                  </button>
                  <button
                    onClick={handleApprove}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? 'Approving...' : 'Approve'}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setShowRejectionForm(false);
                      setRejectionReason('');
                    }}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    Cancel Rejection
                  </button>
                  <button
                    onClick={handleReject}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                    disabled={loading || !rejectionReason.trim()}
                  >
                    {loading ? 'Rejecting...' : 'Confirm Rejection'}
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default FileVerificationModal;
