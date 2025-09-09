import React, { useState, useRef } from 'react';
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import apiService from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const ProfileImageUpload = ({ currentImage, onImageChange, loading = false }) => {
  const { updateProfile } = useAuth();
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState(currentImage || null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Standard dimensions for profile pictures
  const PROFILE_DIMENSIONS = {
    width: 400,
    height: 400,
    quality: 85
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const validateFile = (file) => {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Please upload a valid image file (JPEG, PNG, or WebP)');
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error('Image size must be less than 5MB');
    }

    return true;
  };

  const resizeImage = (file) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Set canvas dimensions to standard profile size
        canvas.width = PROFILE_DIMENSIONS.width;
        canvas.height = PROFILE_DIMENSIONS.height;

        // Calculate scaling to maintain aspect ratio
        const scale = Math.min(
          PROFILE_DIMENSIONS.width / img.width,
          PROFILE_DIMENSIONS.height / img.height
        );

        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;

        // Center the image
        const x = (PROFILE_DIMENSIONS.width - scaledWidth) / 2;
        const y = (PROFILE_DIMENSIONS.height - scaledHeight) / 2;

        // Fill background with white
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, PROFILE_DIMENSIONS.width, PROFILE_DIMENSIONS.height);

        // Draw the resized image
        ctx.drawImage(img, x, y, scaledWidth, scaledHeight);

        // Convert to blob
        canvas.toBlob(resolve, 'image/jpeg', PROFILE_DIMENSIONS.quality / 100);
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const uploadToBackend = async (file) => {
    try {
      const response = await apiService.uploadProfileImage(file);

      if (response.success) {
        return {
          secure_url: response.data.url,
          public_id: response.data.publicId,
          width: response.data.width,
          height: response.data.height
        };
      } else {
        throw new Error(response.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Backend upload error:', error);
      throw new Error(error.message || 'Failed to upload image');
    }
  };

  const handleFile = async (file) => {
    try {
      setUploading(true);
      
      // Validate file
      validateFile(file);

      // Create preview
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);

      // Resize image to standard dimensions
      const resizedFile = await resizeImage(file);

      // Upload to backend
      const uploadResult = await uploadToBackend(resizedFile);

      // Call parent callback with the uploaded image URL
      console.log('🖼️ ProfileImageUpload - Upload successful:', uploadResult.secure_url);
      onImageChange(uploadResult.secure_url);

      // Immediately save the profile picture to the database
      try {
        console.log('🔄 ProfileImageUpload - Saving profile picture to database:', uploadResult.secure_url);
        const updateResult = await updateProfile({ avatar: uploadResult.secure_url });
        console.log('✅ ProfileImageUpload - Profile picture saved to database:', updateResult);
        
        // Verify the user state was updated
        if (updateResult.success && updateResult.user) {
          console.log('✅ ProfileImageUpload - User state updated with new avatar:', updateResult.user.avatar);
        } else {
          console.warn('⚠️ ProfileImageUpload - Update result missing user data:', updateResult);
        }
      } catch (error) {
        console.error('❌ ProfileImageUpload - Failed to save profile picture to database:', error);
        // Don't show error toast to user since image upload was successful
        // The profile picture will still be saved when the form is submitted
      }

      toast.success('Profile picture updated successfully!');
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error(error.message || 'Failed to upload image');
      setPreview(currentImage); // Reset to current image on error
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async () => {
    setPreview(null);
    onImageChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // Immediately save the profile picture removal to the database
    try {
      console.log('🔄 ProfileImageUpload - Saving profile picture removal to database');
      const updateResult = await updateProfile({ avatar: '' });
      console.log('✅ ProfileImageUpload - Profile picture removal saved to database:', updateResult);
      
      // Verify the user state was updated
      if (updateResult.success && updateResult.user) {
        console.log('✅ ProfileImageUpload - User state updated with removed avatar:', updateResult.user.avatar);
      } else {
        console.warn('⚠️ ProfileImageUpload - Update result missing user data:', updateResult);
      }
    } catch (error) {
      console.error('❌ ProfileImageUpload - Failed to save profile picture removal to database:', error);
      // Don't show error toast to user since this is just a removal
      // The removal will still be saved when the form is submitted
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        Profile Picture
      </label>

      {/* Current Image Preview */}
      {preview && (
        <div className="relative inline-block">
          <img
            src={preview}
            alt="Profile preview"
            className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
          />
          <button
            type="button"
            onClick={removeImage}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
            disabled={uploading || loading}
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        } ${(uploading || loading) ? 'opacity-50 pointer-events-none' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <PhotoIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <div className="text-sm text-gray-600 mb-4">
          <button
            type="button"
            onClick={openFileDialog}
            className="text-blue-600 hover:text-blue-500 font-medium"
            disabled={uploading || loading}
          >
            {uploading ? 'Uploading...' : 'Click to upload'}
          </button>
          {' '}or drag and drop
        </div>
        <p className="text-xs text-gray-500">
          PNG, JPG, WebP up to 5MB
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Recommended: {PROFILE_DIMENSIONS.width}x{PROFILE_DIMENSIONS.height}px
        </p>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading || loading}
      />

      {uploading && (
        <div className="text-center">
          <div className="inline-flex items-center text-sm text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            Uploading and processing image...
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileImageUpload;
