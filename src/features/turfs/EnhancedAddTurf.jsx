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
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      if (name === 'amenities') {
        const amenity = value;
        setFormData(prev => ({
          ...prev,
          amenities: checked 
            ? [...prev.amenities, amenity]
            : prev.amenities.filter(a => a !== amenity)
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: checked
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleLocationChange = (location) => {
    setFormData(prev => ({
      ...prev,
      location
    }));
  };

  const handleImageChange = (images) => {
    setFormData(prev => ({
      ...prev,
      images
    }));
  };

  const handleSlotDurationChange = (duration) => {
    setFormData(prev => ({
      ...prev,
      slotDuration: parseInt(duration)
    }));
  };

  const handleAdvanceBookingDaysChange = (days) => {
    setFormData(prev => ({
      ...prev,
      advanceBookingDays: parseInt(days)
    }));
  };

  const handleAvailableSlotsChange = (day, slots) => {
    setFormData(prev => ({
      ...prev,
      availableSlots: {
        ...prev.availableSlots,
        [day]: slots
      }
    }));
  };

  // Validation functions
  const validateStep = () => {
    switch (currentStep) {
      case 1: // Basic Info
        if (!formData.name.trim()) {
          setError('Turf name is required');
          return false;
        }
        if (!formData.description.trim()) {
          setError('Description is required');
          return false;
        }
        if (formData.description.trim().length < 20) {
          setError('Description must be at least 20 characters');
          return false;
        }
        return true;
      
      case 2: // Location
        if (!formData.location.address.trim()) {
          setError('Location is required');
          return false;
        }
        return true;
      
      case 3: // Details
        if (!formData.pricePerHour || formData.pricePerHour <= 0) {
          setError('Valid price per hour is required');
          return false;
        }
        if (!formData.sport) {
          setError('Sport type is required');
          return false;
        }
        return true;
      
      case 4: // Images
        if (!formData.images || formData.images.length === 0) {
          setError('At least one image is required');
          return false;
        }
        return true;
      
      case 5: // Slots
        const hasAnySlots = Object.values(formData.availableSlots).some(
          day => day.isOpen && day.slots.length > 0
        );
        if (!hasAnySlots) {
          setError('At least one day must have available slots');
          return false;
        }
        return true;
      
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep()) {
      setError('');
      if (currentStep < 5) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const prevStep = () => {
    setError('');
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Helper functions for slot management
  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const suffix = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
    return `${displayHour}:${minutes} ${suffix}`;
  };

  const generateStartTimes = (durationMinutes = 60) => {
    const times = [];
    const startHour = 8; // 8 AM
    const endHour = 23; // 11 PM
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        times.push(timeStr);
        
        // Skip to next valid slot based on duration
        if (durationMinutes > 60) {
          break; // Only generate hourly slots for longer durations
        }
      }
      
      if (durationMinutes > 60) {
        // For longer durations, only generate hourly slots
        continue;
      }
    }
    
    return times;
  };

  const addMinutes = (timeStr, minutes) => {
    if (!timeStr) return '';
    const [hours, mins] = timeStr.split(':').map(Number);
    const totalMinutes = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newMins = totalMinutes % 60;
    return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
  };

  const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const isWithinOperatingHours = (startTime, endTime) => {
    const start = timeToMinutes(startTime);
    const end = timeToMinutes(endTime);
    const openTime = timeToMinutes('08:00');
    const closeTime = timeToMinutes('23:00');
    
    return start >= openTime && end <= closeTime && start < end;
  };

  const overlapsExisting = (day, startTime, endTime) => {
    const existingSlots = formData.availableSlots[day]?.slots || [];
    const newStart = timeToMinutes(startTime);
    const newEnd = timeToMinutes(endTime);
    
    return existingSlots.some(slot => {
      const existingStart = timeToMinutes(slot.startTime);
      const existingEnd = timeToMinutes(slot.endTime);
      
      return Math.max(newStart, existingStart) < Math.min(newEnd, existingEnd);
    });
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

  // Import form components dynamically
  const TurfLocationInput = React.lazy(() => import('../../components/common/TurfLocationInput'));
  const ImageUpload = React.lazy(() => import('../../components/common/ImageUpload'));
  const SlotConfiguration = React.lazy(() => import('../../components/common/SlotConfiguration'));

  const renderStepContent = () => {
    if (mode === 'new-turf') {
      switch (currentStep) {
        case 1:
          return (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Turf Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your turf name"
                />
                <p className="text-sm text-gray-500 mt-1">
                  This must match your registered business name
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sport Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="sport"
                  value={formData.sport || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a sport</option>
                  <option value="Football">Football</option>
                  <option value="Cricket">Cricket</option>
                  <option value="Basketball">Basketball</option>
                  <option value="Tennis">Tennis</option>
                  <option value="Badminton">Badminton</option>
                  <option value="Volleyball">Volleyball</option>
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  This must be one of your registered sport types
                </p>
              </div>
            </div>
          );
          
        case 2:
          return (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location Address <span className="text-red-500">*</span>
                </label>
                <React.Suspense fallback={<div>Loading location input...</div>}>
                  <TurfLocationInput
                    value={formData.location?.address || ''}
                    onChange={handleLocationChange}
                    placeholder="Enter your turf address"
                  />
                </React.Suspense>
                <p className="text-sm text-gray-500 mt-1">
                  This must match your registered location
                </p>
              </div>
            </div>
          );
          
        case 3:
          return (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Per Hour (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="pricePerHour"
                  value={formData.pricePerHour || ''}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter price per hour"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description || ''}
                  onChange={handleInputChange}
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe your turf (optional)"
                />
              </div>
            </div>
          );
          
        case 4:
          return (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Turf Images <span className="text-red-500">*</span>
                </label>
                <React.Suspense fallback={<div>Loading image upload...</div>}>
                  <ImageUpload
                    onImageChange={handleImageChange}
                    existingImages={formData.images || []}
                    maxImages={5}
                    accept="image/*"
                  />
                </React.Suspense>
                <p className="text-sm text-gray-500 mt-2">
                  Upload at least one image of your turf
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Amenities
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {['Floodlights', 'Parking', 'Changing Room', 'Washroom', 'Drinking Water', 'First Aid', 'Equipment Rental', 'Cafeteria', 'AC', 'Sound System', 'Professional Pitch', 'Scoreboard'].map(amenity => (
                    <label key={amenity} className="flex items-center">
                      <input
                        type="checkbox"
                        value={amenity}
                        checked={formData.amenities?.includes(amenity) || false}
                        onChange={handleAmenitiesChange}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">{amenity}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          );
          
        case 5:
          return (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Available Slots <span className="text-red-500">*</span>
                </label>
                <React.Suspense fallback={<div>Loading slot configuration...</div>}>
                  <SlotConfiguration
                    availableSlots={formData.availableSlots || {}}
                    onSlotsChange={(slots) => setFormData(prev => ({ ...prev, availableSlots: slots }))}
                    slotDuration={formData.slotDuration || 60}
                    onSlotDurationChange={(duration) => setFormData(prev => ({ ...prev, slotDuration: duration }))}
                  />
                </React.Suspense>
                <p className="text-sm text-gray-500 mt-2">
                  Configure at least one time slot for booking
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Slot Duration (minutes)
                  </label>
                  <select
                    value={formData.slotDuration || 60}
                    onChange={(e) => setFormData(prev => ({ ...prev, slotDuration: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={30}>30 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={90}>1.5 hours</option>
                    <option value={120}>2 hours</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Advance Booking Days
                  </label>
                  <input
                    type="number"
                    value={formData.advanceBookingDays || 30}
                    onChange={(e) => setFormData(prev => ({ ...prev, advanceBookingDays: parseInt(e.target.value) }))}
                    min="1"
                    max="90"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          );
          
        default:
          return null;
      }
    } else {
      // Add Sport Mode
      switch (currentStep) {
        case 1:
          return (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Sport Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="sport"
                  value={formData.sport || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a sport</option>
                  <option value="Football">Football</option>
                  <option value="Cricket">Cricket</option>
                  <option value="Basketball">Basketball</option>
                  <option value="Tennis">Tennis</option>
                  <option value="Badminton">Badminton</option>
                  <option value="Volleyball">Volleyball</option>
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  Choose a different sport than {selectedTurf?.sport}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Per Hour (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="pricePerHour"
                  value={formData.pricePerHour || ''}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter price per hour for this sport"
                />
                <p className="text-sm text-gray-500 mt-1">
                  This can be different from your existing turf pricing
                </p>
              </div>
            </div>
          );
          
        case 2:
          return (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Available Slots for {formData.sport} <span className="text-red-500">*</span>
                </label>
                <React.Suspense fallback={<div>Loading slot configuration...</div>}>
                  <SlotConfiguration
                    availableSlots={formData.availableSlots || selectedTurf?.availableSlots || {}}
                    onSlotsChange={(slots) => setFormData(prev => ({ ...prev, availableSlots: slots }))}
                    slotDuration={formData.slotDuration || selectedTurf?.slotDuration || 60}
                    onSlotDurationChange={(duration) => setFormData(prev => ({ ...prev, slotDuration: duration }))}
                  />
                </React.Suspense>
                <p className="text-sm text-gray-500 mt-2">
                  Configure time slots specific to {formData.sport} bookings
                </p>
              </div>
            </div>
          );
          
        default:
          return null;
      }
    }
  };

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
          {renderStepContent()}
          
          {/* Navigation buttons */}
          <div className="flex justify-between mt-8">
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
  );
};

export default EnhancedAddTurf;