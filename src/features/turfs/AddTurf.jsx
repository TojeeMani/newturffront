import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { TurfLocationInput } from '../../components/forms';
import { ImageUpload, ButtonLoader } from '../../components/ui';
import { useLoading } from '../../context/LoadingContext';
import turfService from '../../services/turfService';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  MapPinIcon,
  CurrencyRupeeIcon,
  PhotoIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

const AddTurf = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showGlobalLoading, hideGlobalLoading } = useLoading();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    location: {
      address: '',
      coordinates: { lat: null, lng: null }
    },
    pricePerHour: '',
    images: [],
    amenities: [],
    sport: '',
    description: ''
  });

  const steps = [
    { id: 1, name: 'Basic Info', icon: InformationCircleIcon },
    { id: 2, name: 'Location', icon: MapPinIcon },
    { id: 3, name: 'Pricing & Sport', icon: CurrencyRupeeIcon },
    { id: 4, name: 'Images & Details', icon: PhotoIcon }
  ];

  const availableAmenities = [
    'Floodlights', 'Parking', 'Changing Room', 'Washroom', 'Drinking Water',
    'First Aid', 'Equipment Rental', 'Cafeteria', 'AC', 'Sound System',
    'Professional Pitch', 'Scoreboard', 'Pavilion', 'Pro Shop', 'Coaching'
  ];

  const sportsOptions = ['Football', 'Cricket', 'Basketball', 'Tennis', 'Badminton', 'Volleyball'];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLocationChange = (e) => {
    const location = e.target ? e.target.value : e;
    setFormData(prev => ({ ...prev, location: location }));
  };

  const handleImageChange = (files) => {
    setFormData(prev => ({ ...prev, images: files }));
  };

  const handleAmenitiesChange = (e) => {
    const { value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      amenities: checked 
        ? [...prev.amenities, value]
        : prev.amenities.filter(amenity => amenity !== value)
    }));
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        return formData.name.trim() !== '';
      case 2:
        return formData.location.address && formData.location.coordinates.lat && formData.location.coordinates.lng;
      case 3:
        return formData.pricePerHour && formData.sport;
      case 4:
        return formData.images.length > 0;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
      setError('');
    } else {
      setError('Please fill in all required fields for this step');
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setError('');
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      showGlobalLoading('Creating your turf...', 'football');
      setError('');

      const validation = turfService.validateTurfData(formData);
      if (!validation.isValid) {
        setError(validation.errors.join(', '));
        return;
      }

      // Step 1: Upload images to Cloudinary first (frontend handles this)
      // Step 2: Send only Cloudinary URLs to backend (no File objects)
      let imageUrls = [];
      if (formData.images && formData.images.length > 0) {
        try {
          // Check if images are File objects (need to upload) or URLs (already uploaded)
          console.log('🔍 Form data images:', formData.images);
          const filesToUpload = formData.images.filter(img => img instanceof File);
          const existingUrls = formData.images.filter(img => typeof img === 'string');
          console.log('🔍 Files to upload:', filesToUpload);
          console.log('🔍 Existing URLs:', existingUrls);

          if (filesToUpload.length > 0) {
            showGlobalLoading('Uploading images to Cloudinary...', 'football');
            console.log('📤 Uploading images to Cloudinary...', filesToUpload);
            const uploadResult = await turfService.uploadImages(filesToUpload);
            console.log('📤 Upload result:', uploadResult);

            if (uploadResult.success) {
              const uploadedUrls = uploadResult.data.images.map(img => img.url);
              imageUrls = [...existingUrls, ...uploadedUrls];
              console.log(`✅ Uploaded ${uploadResult.data.totalUploaded} images`);
              console.log('✅ Uploaded URLs:', uploadedUrls);
            } else {
              console.error('❌ Upload failed:', uploadResult);
              throw new Error('Failed to upload images to Cloudinary');
            }
          } else {
            imageUrls = existingUrls;
          }
        } catch (uploadError) {
          console.error('❌ Image upload error:', uploadError);
          setError('Failed to upload images to Cloudinary. Please try again.');
          return;
        }
      }

      // Create turf data with Cloudinary URLs (no File objects)
      const turfDataWithUrls = {
        ...formData,
        images: imageUrls // Only Cloudinary URLs, no File objects
      };

      console.log('🔍 Final turf data (URLs only):', turfDataWithUrls);
      console.log('🔍 Image URLs being sent:', imageUrls);

      // Validate that all images are valid URLs
      const invalidImages = imageUrls.filter(url => {
        if (typeof url !== 'string') return true;
        // Accept HTTP/HTTPS URLs (including placeholder URLs for dev mode)
        return !url.startsWith('http');
      });
      if (invalidImages.length > 0) {
        console.error('❌ Invalid image URLs:', invalidImages);
        throw new Error('Some images are not valid URLs. Please try uploading again.');
      }

      showGlobalLoading('Saving turf details...', 'grass');
      await turfService.createTurf(turfDataWithUrls);

      hideGlobalLoading();
      setSuccess('Turf created successfully! Images uploaded to Cloudinary and turf is now live.');

      setTimeout(() => {
        navigate('/owner-dashboard');
      }, 2000);
    } catch (error) {
      hideGlobalLoading();
      setError(error.message || 'Failed to create turf');
    } finally {
      setLoading(false);
    }
  };

  const getStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Turf Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter your turf name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Describe your turf facilities and features..."
              />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Turf Location *
              </label>
              <TurfLocationInput
                value={formData.location}
                onChange={handleLocationChange}
                placeholder="Enter turf location"
              />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Per Hour (₹) *
                </label>
                <input
                  type="number"
                  name="pricePerHour"
                  value={formData.pricePerHour}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter hourly rate"
                  min="0"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sport Type *
                </label>
                <select
                  name="sport"
                  value={formData.sport}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Sport</option>
                  {sportsOptions.map(sport => (
                    <option key={sport} value={sport}>{sport}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Amenities
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {availableAmenities.map(amenity => (
                  <label key={amenity} className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      value={amenity}
                      checked={formData.amenities.includes(amenity)}
                      onChange={handleAmenitiesChange}
                      className="text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">{amenity}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Turf Images *
              </label>
              <ImageUpload
                images={formData.images}
                onChange={handleImageChange}
                maxFiles={5}
                maxSize={5 * 1024 * 1024} // 5MB
              />
              <p className="text-sm text-gray-500 mt-2">
                Upload up to 5 high-quality images of your turf (max 5MB each)
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const getProgressPercentage = () => {
    return (currentStep / 4) * 100;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/owner-dashboard')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Add New Turf</h1>
          <p className="text-gray-600 mt-2">
            Create a new turf listing that will be immediately available to users
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep >= step.id 
                    ? 'bg-primary-600 border-primary-600 text-white' 
                    : 'border-gray-300 text-gray-400'
                }`}>
                  {currentStep > step.id ? (
                    <CheckCircleIcon className="w-6 h-6" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-1 mx-2 ${
                    currentStep > step.id ? 'bg-primary-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Step {currentStep} of {steps.length}: {steps[currentStep - 1].name}
          </p>
        </div>

        {/* Form Content */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-xl shadow-lg p-8 mb-8"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {steps[currentStep - 1].name}
          </h2>
          
          {getStepContent()}
        </motion.div>

        {/* Error/Success Messages */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6"
          >
            <div className="flex items-center">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6"
          >
            <div className="flex items-center">
              <CheckCircleIcon className="w-5 h-5 text-green-600 mr-2" />
              <span className="text-green-700">{success}</span>
            </div>
          </motion.div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <div className="flex space-x-4">
            {currentStep < 4 ? (
              <button
                onClick={nextStep}
                className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Next Step
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading && <ButtonLoader size="sm" color="white" />}
                {loading ? 'Creating Turf...' : 'Create Turf'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddTurf;
