import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useLoading } from '../../context/LoadingContext';
import { OwnerDashboardNav } from '../../components/layout';
import turfService from '../../services/turfService';
import {
  PlusIcon,
  ArrowLeftIcon,
  MapPinIcon,
  CurrencyRupeeIcon,
  ClockIcon,
  PhotoIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

const EnhancedAddTurf = () => {
  const { user } = useAuth();
  const { showGlobalLoading, hideGlobalLoading } = useLoading();
  const navigate = useNavigate();
  
  // Mode selection: 'new-turf' or 'add-sport'
  const [mode, setMode] = useState('select');
  const [existingTurfs, setExistingTurfs] = useState([]);
  const [loadingTurfs, setLoadingTurfs] = useState(true);
  const [selectedTurf, setSelectedTurf] = useState(null);
  
  // Form states
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Load existing turfs for "add sport" mode
  useEffect(() => {
    if (user && mode === 'add-sport') {
      fetchMyTurfs();
    }
  }, [user, mode]);

  const fetchMyTurfs = async () => {
    try {
      setLoadingTurfs(true);
      const response = await turfService.getMyTurfs();
      setExistingTurfs(response.data);
    } catch (error) {
      console.error('Error fetching turfs:', error);
      setError('Failed to load your existing turfs');
    } finally {
      setLoadingTurfs(false);
    }
  };

  // Initialize blank form for new turf
  const initializeNewTurfForm = () => {
    setFormData({
      name: '',
      location: {
        address: '',
        coordinates: null
      },
      pricePerHour: '',
      images: [],
      amenities: [],
      sport: '',
      description: '',
      availableSlots: {
        monday: { isOpen: true, slots: [] },
        tuesday: { isOpen: true, slots: [] },
        wednesday: { isOpen: true, slots: [] },
        thursday: { isOpen: true, slots: [] },
        friday: { isOpen: true, slots: [] },
        saturday: { isOpen: true, slots: [] },
        sunday: { isOpen: true, slots: [] }
      },
      slotDuration: 60,
      advanceBookingDays: 30
    });
    setCurrentStep(1);
    setError('');
    setSuccess('');
  };

  // Initialize form for adding sport to existing turf
  const initializeAddSportForm = (turf) => {
    setFormData({
      sport: '',
      pricePerHour: '',
      availableSlots: turf.availableSlots || {
        monday: { isOpen: true, slots: [] },
        tuesday: { isOpen: true, slots: [] },
        wednesday: { isOpen: true, slots: [] },
        thursday: { isOpen: true, slots: [] },
        friday: { isOpen: true, slots: [] },
        saturday: { isOpen: true, slots: [] },
        sunday: { isOpen: true, slots: [] }
      }
    });
    setSelectedTurf(turf);
    setCurrentStep(1);
    setError('');
    setSuccess('');
  };

  const handleModeSelect = (selectedMode) => {
    setMode(selectedMode);
    if (selectedMode === 'new-turf') {
      initializeNewTurfForm();
    }
  };

  const handleTurfSelect = (turf) => {
    setSelectedTurf(turf);
    initializeAddSportForm(turf);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLocationChange = (e) => {
    const location = e.target ? e.target.value : e;
    setFormData(prev => ({ ...prev, location: { ...prev.location, address: location } }));
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

  const validateNewTurfStep = (step) => {
    switch (step) {
      case 1:
        return formData.name.trim() !== '';
      case 2:
        return formData.location.address.trim() !== '';
      case 3:
        return formData.pricePerHour && formData.sport;
      case 4:
        return formData.images.length > 0;
      case 5:
        return Object.values(formData.availableSlots).some(day => 
          day.isOpen && day.slots.length > 0
        );
      default:
        return true;
    }
  };

  const validateAddSportStep = (step) => {
    switch (step) {
      case 1:
        return formData.sport && formData.pricePerHour;
      case 2:
        return true; // Slot configuration
      default:
        return true;
    }
  };

  const nextStep = () => {
    const isValid = mode === 'new-turf' ? validateNewTurfStep(currentStep) : validateAddSportStep(currentStep);
    
    if (isValid) {
      if (mode === 'new-turf' && currentStep === 5) {
        handleSubmit();
      } else if (mode === 'add-sport' && currentStep === 2) {
        handleAddSportSubmit();
      } else {
        setCurrentStep(prev => prev + 1);
        setError('');
      }
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

      // Upload images to Cloudinary
      let imageUrls = [];
      if (formData.images && formData.images.length > 0) {
        const filesToUpload = formData.images.filter(img => img instanceof File);
        const existingUrls = formData.images.filter(img => typeof img === 'string');

        if (filesToUpload.length > 0) {
          showGlobalLoading('Uploading images to Cloudinary...', 'football');
          const uploadResult = await turfService.uploadImages(filesToUpload);

          if (uploadResult.success) {
            const uploadedUrls = uploadResult.data.images.map(img => img.url);
            imageUrls = [...existingUrls, ...uploadedUrls];
          } else {
            throw new Error('Failed to upload images to Cloudinary');
          }
        } else {
          imageUrls = existingUrls;
        }
      }

      // Create turf data
      const turfData = {
        ...formData,
        images: imageUrls,
        pricePerHour: parseFloat(formData.pricePerHour)
      };

      const response = await turfService.createTurf(turfData);
      
      hideGlobalLoading();
      setSuccess('Turf submitted successfully! It will be reviewed by admin before going live.');
      
      // Redirect after success
      setTimeout(() => {
        navigate('/owner-dashboard');
      }, 3000);

    } catch (error) {
      console.error('Error creating turf:', error);
      setError(error.message || 'Failed to create turf. Please try again.');
      hideGlobalLoading();
    } finally {
      setLoading(false);
    }
  };

  const handleAddSportSubmit = async () => {
    try {
      setLoading(true);
      showGlobalLoading('Adding new sport to your turf...', 'football');
      setError('');

      const sportData = {
        sport: formData.sport,
        pricePerHour: parseFloat(formData.pricePerHour),
        availableSlots: formData.availableSlots
      };

      const response = await turfService.addSportToTurf(selectedTurf._id, sportData);
      
      hideGlobalLoading();
      setSuccess(`New sport ${formData.sport} added to ${selectedTurf.name} successfully!`);
      
      // Redirect after success
      setTimeout(() => {
        navigate('/owner-dashboard');
      }, 3000);

    } catch (error) {
      console.error('Error adding sport:', error);
      setError(error.message || 'Failed to add sport to turf. Please try again.');
      hideGlobalLoading();
    } finally {
      setLoading(false);
    }
  };

  const getProgressPercentage = () => {
    const totalSteps = mode === 'new-turf' ? 5 : 2;
    return (currentStep / totalSteps) * 100;
  };

  // Mode Selection Screen
  if (mode === 'select') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <OwnerDashboardNav />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20">
          <div className="mb-8">
            <button
              onClick={() => navigate('/owner-dashboard')}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeftIcon className="w-5 h-5 mr-2" />
              Back to Dashboard
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Add New Turf or Sport</h1>
            <p className="text-gray-600 mt-2">Choose what you'd like to add to your portfolio</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* New Turf Option */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 hover:shadow-xl transition-shadow cursor-pointer"
              onClick={() => handleModeSelect('new-turf')}
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <PlusIcon className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Add New Turf Location</h3>
                <p className="text-gray-600 mb-4">
                  Register a completely new turf location with all required details
                </p>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <ExclamationCircleIcon className="w-5 h-5 text-yellow-600 inline mr-2" />
                  <span className="text-sm text-yellow-800">
                    Requires admin approval before going live
                  </span>
                </div>
                <div className="text-left space-y-2 text-sm text-gray-600">
                  <p>✓ Full turf registration</p>
                  <p>✓ Location verification</p>
                  <p>✓ Complete setup required</p>
                  <p>✓ Admin approval needed</p>
                </div>
              </div>
            </motion.div>

            {/* Add Sport Option */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 hover:shadow-xl transition-shadow cursor-pointer"
              onClick={() => handleModeSelect('add-sport')}
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <PlusIcon className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Add Sport to Existing Turf</h3>
                <p className="text-gray-600 mb-4">
                  Add a new sport to one of your existing turf locations
                </p>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                  <CheckCircleIcon className="w-5 h-5 text-green-600 inline mr-2" />
                  <span className="text-sm text-green-800">
                    Auto-approved - goes live immediately
                  </span>
                </div>
                <div className="text-left space-y-2 text-sm text-gray-600">
                  <p>✓ Quick addition</p>
                  <p>✓ Uses existing location</p>
                  <p>✓ Same amenities</p>
                  <p>✓ Immediate activation</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  // Existing Turf Selection for Add Sport Mode
  if (mode === 'add-sport' && !selectedTurf) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <OwnerDashboardNav />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20">
          <div className="mb-8">
            <button
              onClick={() => setMode('select')}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeftIcon className="w-5 h-5 mr-2" />
              Back to Selection
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Select Turf for New Sport</h1>
            <p className="text-gray-600 mt-2">Choose which turf location to add a new sport to</p>
          </div>

          {loadingTurfs ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="bg-white rounded-lg p-6 animate-pulse">
                  <div className="h-4 bg-gray-300 rounded mb-4"></div>
                  <div className="h-3 bg-gray-300 rounded mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : existingTurfs.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <BuildingOfficeIcon className="h-20 w-20 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">No turfs found</h3>
              <p className="text-gray-600 mb-6">
                You need to have at least one turf before you can add sports to it.
              </p>
              <button
                onClick={() => handleModeSelect('new-turf')}
                className="btn-primary"
              >
                Create Your First Turf
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {existingTurfs.map((turf) => (
                <motion.div
                  key={turf._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleTurfSelect(turf)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-semibold text-gray-900">{turf.name}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      turf.isApproved 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {turf.isApproved ? 'Approved' : 'Pending'}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <p className="flex items-center">
                      <MapPinIcon className="h-4 w-4 mr-2" />
                      {turf.location?.address || 'Address not available'}
                    </p>
                    <p className="flex items-center">
                      <CurrencyRupeeIcon className="h-4 w-4 mr-2" />
                      ₹{turf.pricePerHour}/hour
                    </p>
                    <p className="flex items-center">
                      <span className="mr-2">🏃</span>
                      {turf.sport}
                    </p>
                  </div>

                  <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors">
                    Add Sport to This Turf
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Form rendering for both modes
  const totalSteps = mode === 'new-turf' ? 5 : 2;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <OwnerDashboardNav />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => setMode('select')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Back to Selection
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            {mode === 'new-turf' ? 'Register New Turf' : `Add Sport to ${selectedTurf?.name}`}
          </h1>
          <p className="text-gray-600 mt-2">
            {mode === 'new-turf' 
              ? 'Complete all required information for your new turf location'
              : 'Add a new sport to your existing turf location'
            }
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Step {currentStep} of {totalSteps}</span>
            <span>{Math.round(getProgressPercentage())}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getProgressPercentage()}%` }}
            ></div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircleIcon className="w-5 h-5 text-green-600 mr-2" />
              <p className="text-green-800">{success}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <ExclamationCircleIcon className="w-5 h-5 text-red-600 mr-2" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Form Steps */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          {/* Step content would go here - this is a simplified version */}
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              {mode === 'new-turf' ? `Step ${currentStep} - New Turf Registration` : `Step ${currentStep} - Add New Sport`}
            </h3>
            <p className="text-gray-600 mb-8">
              Form fields for step {currentStep} would be rendered here
            </p>
            
            {/* Navigation buttons */}
            <div className="flex justify-between">
              <button
                onClick={prevStep}
                disabled={currentStep === 1}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <button
                onClick={nextStep}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : currentStep === totalSteps ? 'Submit' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedAddTurf;