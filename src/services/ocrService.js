import api from './api';

class OCRService {
  constructor() {
    this.baseURL = '/ocr';
  }

  /**
   * Extract text from uploaded document
   * @param {File} file - Document file to process
   * @param {Object} options - OCR options
   * @returns {Promise<Object>} OCR result
   */
  async extractText(file, options = {}) {
    try {
      const formData = new FormData();
      formData.append('document', file);
      
      if (options.language) {
        formData.append('language', options.language);
      }
      if (options.preprocess !== undefined) {
        formData.append('preprocess', options.preprocess);
      }

      const response = await api.request(`${this.baseURL}/extract-text`, {
        method: 'POST',
        body: formData,
        headers: {
          // Don't set Content-Type, let browser set it with boundary
        }
      });

      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // New: Extract text by URL and expected name
  async extractTextByUrl({ fileUrl, expectedName, ownerId, documentType = 'other', options = {} }) {
    try {
      const payload = {
        fileUrl,
        expectedName,
        ownerId,
        documentType,
        ...(options.language ? { language: options.language } : {}),
        ...(options.preprocess !== undefined ? { preprocess: options.preprocess } : {})
      };

      const response = await api.request(`${this.baseURL}/extract-text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Verify business license document
   * @param {File} file - Document file to verify
   * @returns {Promise<Object>} Verification result
   */
  async verifyBusinessLicense(file) {
    try {
      const formData = new FormData();
      formData.append('document', file);

      const response = await api.request(`${this.baseURL}/verify-business-license`, {
        method: 'POST',
        body: formData
      });

      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Verify PAN card document
   * @param {File} file - Document file to verify
   * @returns {Promise<Object>} Verification result
   */
  async verifyPANCard(file) {
    try {
      const formData = new FormData();
      formData.append('document', file);

      const response = await api.request(`${this.baseURL}/verify-pan-card`, {
        method: 'POST',
        body: formData
      });

      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Verify Aadhaar card document
   * @param {File} file - Document file to verify
   * @returns {Promise<Object>} Verification result
   */
  async verifyAadhaarCard(file) {
    try {
      const formData = new FormData();
      formData.append('document', file);

      const response = await api.request(`${this.baseURL}/verify-aadhaar-card`, {
        method: 'POST',
        body: formData
      });

      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Verify GST certificate document
   * @param {File} file - Document file to verify
   * @returns {Promise<Object>} Verification result
   */
  async verifyGSTCertificate(file) {
    try {
      const formData = new FormData();
      formData.append('document', file);

      const response = await api.request(`${this.baseURL}/verify-gst-certificate`, {
        method: 'POST',
        body: formData
      });

      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Generic document verification
   * @param {File} file - Document file to verify
   * @param {string} documentType - Type of document
   * @returns {Promise<Object>} Verification result
   */
  async verifyDocument(file, documentType) {
    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('documentType', documentType);

      const response = await api.request(`${this.baseURL}/verify-document`, {
        method: 'POST',
        body: formData,
        headers: {
          Accept: 'application/json',
          // Don't set Content-Type, it will be set automatically for FormData
        }
      });

      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get supported file formats
   * @returns {Promise<Object>} Supported formats info
   */
  async getSupportedFormats() {
    try {
      const response = await api.request(`${this.baseURL}/supported-formats`);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Clean up temporary OCR files
   * @returns {Promise<Object>} Cleanup result
   */
  async cleanupTempFiles() {
    try {
      const response = await api.request(`${this.baseURL}/cleanup`, {
        method: 'POST'
      });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Validate file format
   * @param {File} file - File to validate
   * @returns {boolean} Whether file format is supported
   */
  validateFileFormat(file) {
    const supportedTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'application/pdf',
      'image/tiff',
      'image/bmp'
    ];
    
    return supportedTypes.includes(file.type);
  }

  /**
   * Validate file size
   * @param {File} file - File to validate
   * @param {number} maxSizeMB - Maximum size in MB
   * @returns {boolean} Whether file size is valid
   */
  validateFileSize(file, maxSizeMB = 10) {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return file.size <= maxSizeBytes;
  }

  /**
   * Format file size for display
   * @param {number} bytes - File size in bytes
   * @returns {string} Formatted file size
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get verification score color
   * @param {number} score - Verification score (0-1)
   * @returns {string} Color class
   */
  getVerificationScoreColor(score) {
    if (score >= 0.8) return 'text-green-600 bg-green-100 dark:bg-green-900';
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900';
    if (score >= 0.4) return 'text-orange-600 bg-orange-100 dark:bg-orange-900';
    return 'text-red-600 bg-red-100 dark:bg-red-900';
  }

  /**
   * Get verification status text
   * @param {number} score - Verification score (0-1)
   * @returns {string} Status text
   */
  getVerificationStatus(score) {
    if (score >= 0.8) return 'Verified';
    if (score >= 0.6) return 'Likely Valid';
    if (score >= 0.4) return 'Uncertain';
    return 'Invalid';
  }

  /**
   * Handle API errors
   * @param {Error} error - Error object
   * @returns {Error} Formatted error
   */
  handleError(error) {
    if (error.response) {
      const message = error.response.data?.message || error.response.data?.error || 'An error occurred';
      return new Error(message);
    } else if (error.request) {
      return new Error('Network error. Please check your connection.');
    } else {
      return new Error('An unexpected error occurred.');
    }
  }
}

const ocrService = new OCRService();
export default ocrService;
