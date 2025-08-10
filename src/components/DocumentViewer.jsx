import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XMarkIcon,
  DocumentIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const DocumentViewer = ({ 
  isOpen, 
  onClose, 
  documentUrl, 
  documentName, 
  documentType = 'document',
  ownerName = 'Owner'
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleLoad = () => {
    setLoading(false);
    setError(false);
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
  };

  const downloadDocument = () => {
    if (documentUrl) {
      const link = document.createElement('a');
      link.href = documentUrl;
      link.download = `${documentName}_${ownerName}.pdf`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const getDocumentTypeIcon = () => {
    switch (documentType.toLowerCase()) {
      case 'government id':
      case 'govid':
        return '🆔';
      case 'ownership proof':
      case 'ownership':
        return '🏠';
      case 'business certificate':
      case 'business':
        return '🏢';
      case 'gst':
        return '📋';
      case 'bank proof':
      case 'bank':
        return '🏦';
      default:
        return '📄';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{getDocumentTypeIcon()}</span>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {documentName}
                </h3>
                <p className="text-sm text-gray-600">
                  Owner: {ownerName}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Download Button */}
              <button
                onClick={downloadDocument}
                className="flex items-center space-x-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                title="Download Document"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                <span>Download</span>
              </button>
              
              {/* Close Button */}
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Close"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Document Content */}
          <div className="flex-1 relative bg-gray-100">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Loading document...</p>
                </div>
              </div>
            )}

            {error && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center p-8">
                  <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    Unable to load document
                  </h4>
                  <p className="text-sm text-gray-600 mb-4">
                    The document could not be displayed in the browser.
                  </p>
                  <button
                    onClick={downloadDocument}
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4" />
                    <span>Download to view</span>
                  </button>
                </div>
              </div>
            )}

            {documentUrl && (
              <iframe
                src={`${documentUrl}#toolbar=1&navpanes=1&scrollbar=1`}
                className="w-full h-full min-h-[500px]"
                title={`${documentName} - ${ownerName}`}
                onLoad={handleLoad}
                onError={handleError}
                style={{ display: loading || error ? 'none' : 'block' }}
              />
            )}

            {!documentUrl && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center p-8">
                  <DocumentIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    No document available
                  </h4>
                  <p className="text-sm text-gray-600">
                    This document has not been uploaded yet.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <CheckCircleIcon className="h-4 w-4 text-green-500" />
                <span>Document verification in progress</span>
              </div>
              <div className="flex items-center space-x-4">
                <span>Type: {documentType}</span>
                <span>•</span>
                <span>Format: PDF</span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default DocumentViewer;
