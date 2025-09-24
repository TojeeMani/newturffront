import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { TurfLocationInput } from '../../components/forms';
import { ImageUpload, ButtonLoader } from '../../components/ui';
import { OwnerDashboardNav } from '../../components/layout';
import { useLoading } from '../../context/LoadingContext';
import turfService from '../../services/turfService';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  MapPinIcon,
  CurrencyRupeeIcon,
  PhotoIcon,
  InformationCircleIcon,
  PlusIcon,
  BuildingOfficeIcon,
  PencilIcon,
  ClockIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

const AddTurf = ({ editTurfId, forceEdit = false }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { showGlobalLoading, hideGlobalLoading } = useLoading();
  const [activeTab, setActiveTab] = useState('add'); // 'add' or 'manage'
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [myTurfs, setMyTurfs] = useState([]);
  const [turfsLoading, setTurfsLoading] = useState(false);
  const [editingTurf, setEditingTurf] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const OPEN_TIME = '08:00';
  const CLOSE_TIME = '23:00';
  const [editingSlot, setEditingSlot] = useState({ day: null, index: null });

  const formatTime = (time24) => {
    if (!time24) return '';
    const [h, m] = time24.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    const mm = String(m).padStart(2, '0');
    return `${hour12}:${mm} ${ampm}`;
  };

  const timeToMinutes = (t) => {
    if (!t) return 0;
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };

  const isWithinOperatingHours = (start, end) => {
    const s = timeToMinutes(start);
    const e = timeToMinutes(end);
    return s >= timeToMinutes(OPEN_TIME) && e <= timeToMinutes(CLOSE_TIME) && e > s;
  };

  const addMinutes = (t, minutes) => {
    const total = timeToMinutes(t) + minutes;
    const h = Math.floor(total / 60);
    const m = total % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const generateStartTimes = (duration) => {
    const starts = [];
    let cur = OPEN_TIME;
    while (timeToMinutes(cur) + duration <= timeToMinutes(CLOSE_TIME)) {
      starts.push(cur);
      cur = addMinutes(cur, duration);
    }
    return starts;
  };

  const overlapsExisting = (day, start, end) => {
    const existing = formData.availableSlots[day]?.slots || [];
    const s = timeToMinutes(start);
    const e = timeToMinutes(end);
    return existing.some(slot => {
      const ss = timeToMinutes(slot.startTime);
      const ee = timeToMinutes(slot.endTime);
      return Math.max(s, ss) < Math.min(e, ee);
    });
  };

  // Initialize form data with user registration data if available
  const getInitialFormData = () => ({
    name: user?.businessName || '',
    location: user?.turfLocation ? {
      address: user.turfLocation,
      coordinates: null
    } : {
      address: '',
      coordinates: null
    },
    pricePerHour: '',
    images: [],
    amenities: [],
    sport: user?.sportType || '',
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

  const [formData, setFormData] = useState({
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
    slotDuration: 60, // minutes
    advanceBookingDays: 30
  });

  // Preload turf for edit: via props, navigation state, or query param ?edit=<turfId>
  useEffect(() => {
    const stateTurf = location.state?.editingTurf;
    const urlParams = new URLSearchParams(location.search);
    const editIdFromQuery = urlParams.get('edit');
    const finalEditId = editTurfId || editIdFromQuery || null;

    const applyTurf = (turf) => {
      setEditingTurf(turf);
      setIsEditMode(true);
      setActiveTab('add');
      setCurrentStep(1);
      setFormData({
        name: turf.name || '',
        location: turf.location || { address: '', coordinates: null },
        pricePerHour: turf.pricePerHour ? turf.pricePerHour.toString() : '',
        images: Array.isArray(turf.images) ? turf.images : [],
        amenities: turf.amenities || [],
        sport: turf.sport || '',
        description: turf.description || '',
        availableSlots: turf.availableSlots || {
          monday: { isOpen: true, slots: [] },
          tuesday: { isOpen: true, slots: [] },
          wednesday: { isOpen: true, slots: [] },
          thursday: { isOpen: true, slots: [] },
          friday: { isOpen: true, slots: [] },
          saturday: { isOpen: true, slots: [] },
          sunday: { isOpen: true, slots: [] }
        },
        slotDuration: turf.slotDuration || 60,
        advanceBookingDays: turf.advanceBookingDays || 30
      });
    };

    if (forceEdit && finalEditId === null && !stateTurf) {
      // No id to edit; do nothing special
    }

    if (stateTurf) {
      applyTurf(stateTurf);
      return;
    }

    if (finalEditId) {
      (async () => {
        try {
          setTurfsLoading(true);
          const res = await turfService.getTurf(finalEditId);
          const turf = res?.data || res;
          if (turf && turf._id) {
            applyTurf(turf);
          }
        } catch (e) {
          console.error('Failed to preload turf for edit:', e);
          setError('Failed to load turf for editing');
        } finally {
          setTurfsLoading(false);
        }
      })();
    }
  }, [location.state, location.search, editTurfId, forceEdit]);

  // Update form data when user becomes available
  useEffect(() => {
    console.log('🔧 AddTurf: User data available:', user);
    console.log('🔧 AddTurf: Business name from user:', user?.businessName);
    console.log('🔧 AddTurf: Turf location from user:', user?.turfLocation);
    console.log('🔧 AddTurf: Sport type from user:', user?.sportType);
    console.log('🔧 AddTurf: Full user object:', user);
    
    if (user && !isEditMode) {
      console.log('🔧 AddTurf: Setting form data with user info');
      setFormData(prev => {
        const newFormData = {
          ...prev,
          name: user.businessName || '',
          location: user.turfLocation ? {
            address: user.turfLocation,
            coordinates: null
          } : {
            address: '',
            coordinates: null
          },
          sport: user.sportType || ''
        };
        console.log('🔧 AddTurf: New form data:', newFormData);
        return newFormData;
      });
    }
  }, [user, isEditMode]);

  // Additional effect to handle user data loading after component mount
  useEffect(() => {
    if (user && user.businessName && !isEditMode && !formData.name) {
      console.log('🔧 AddTurf: User data loaded after mount, updating form');
      setFormData(prev => ({
        ...prev,
        name: user.businessName,
        location: user.turfLocation ? {
          address: user.turfLocation,
          coordinates: null
        } : {
          address: '',
          coordinates: null
        },
        sport: user.sportType || ''
      }));
    }
  }, [user, formData.name, isEditMode]);

  // Form data debug removed for production

  const steps = [
    { id: 1, name: 'Basic Info', icon: InformationCircleIcon },
    { id: 2, name: 'Location', icon: MapPinIcon },
    { id: 3, name: 'Pricing & Sport', icon: CurrencyRupeeIcon },
    { id: 4, name: 'Images & Details', icon: PhotoIcon },
    { id: 5, name: 'Available Slots', icon: ClockIcon }
  ];

  // Fetch owner's turfs
  const fetchMyTurfs = async () => {
    try {
      setTurfsLoading(true);
      const response = await turfService.getOwnerTurfs();
      if (response.success) {
        setMyTurfs(response.data);
      }
    } catch (error) {
      console.error('Error fetching turfs:', error);
      setError('Failed to fetch your turfs');
    } finally {
      setTurfsLoading(false);
    }
  };

  // Load turfs when component mounts or tab changes to manage
  useEffect(() => {
    if (activeTab === 'manage') {
      fetchMyTurfs();
    }
  }, [activeTab]);

  // Handle edit turf
  const handleEditTurf = (turf) => {
    setEditingTurf(turf);
    setIsEditMode(true);
    setFormData({
      name: turf.name || '',
      location: turf.location || { address: '', coordinates: null },
      pricePerHour: turf.pricePerHour ? turf.pricePerHour.toString() : '',
      images: turf.images || [],
      amenities: turf.amenities || [],
      sport: turf.sport || '', // Fixed: was turf.sports?.[0]
      description: turf.description || '',
      availableSlots: turf.availableSlots || {
        monday: { isOpen: true, slots: [] },
        tuesday: { isOpen: true, slots: [] },
        wednesday: { isOpen: true, slots: [] },
        thursday: { isOpen: true, slots: [] },
        friday: { isOpen: true, slots: [] },
        saturday: { isOpen: true, slots: [] },
        sunday: { isOpen: true, slots: [] }
      },
      slotDuration: turf.slotDuration || 60,
      advanceBookingDays: turf.advanceBookingDays || 30
    });
    setActiveTab('add');
    setCurrentStep(1);
    setError('');
    setSuccess('');
  };

  // Reset form for new turf - completely blank form
  const handleAddNewTurf = () => {
    setEditingTurf(null);
    setIsEditMode(false);
    setFormData({
      name: '', // Start completely blank - no pre-population
      location: {
        address: '',
        coordinates: null
      },
      pricePerHour: '',
      images: [],
      amenities: [],
      sport: '', // Start blank - user must select
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
    setActiveTab('add');
    setCurrentStep(1);
    setError('');
    setSuccess('');
  };

  // Handle tab switching
  const handleTabSwitch = (tab) => {
    if (tab === 'add' && !isEditMode) {
      // Reset form with registration data when switching to add tab
      handleAddNewTurf();
    } else {
      setActiveTab(tab);
    }
  };

  // Initialize form with registration data when component mounts and user is available
  useEffect(() => {
    if (user && activeTab === 'add' && !isEditMode) {
      handleAddNewTurf();
    }
  }, [user]); // Only depend on user, not activeTab or isEditMode to avoid loops

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
        return formData.location.address.trim() !== '';
      case 3:
        return formData.pricePerHour && formData.sport;
      case 4:
        return formData.images.length > 0;
      case 5:
        // Check if at least one day has slots configured
        return Object.values(formData.availableSlots).some(day => 
          day.isOpen && day.slots.length > 0
        );
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
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
      const loadingMessage = isEditMode ? 'Updating your turf...' : 'Creating your turf...';
      showGlobalLoading(loadingMessage, 'football');
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
      // Ensure we never submit empty images on edit; fallback to existing images
      const finalImages = (isEditMode && (!imageUrls || imageUrls.length === 0))
        ? (Array.isArray(editingTurf?.images) ? editingTurf.images : [])
        : imageUrls;

      // Ensure required fields exist; coerce types
      // Build base payload without location first to avoid triggering backend location validation on updates
      const basePayload = {
        name: formData.name || editingTurf?.name || '',
        pricePerHour: parseFloat(formData.pricePerHour || editingTurf?.pricePerHour || 0),
        sport: formData.sport || editingTurf?.sport || '',
        images: finalImages,
        amenities: formData.amenities,
        description: formData.description,
        availableSlots: formData.availableSlots,
        slotDuration: formData.slotDuration,
        advanceBookingDays: formData.advanceBookingDays
      };

      let turfDataWithUrls = { ...basePayload };

      if (isEditMode) {
        // For updates: only send location when coordinates are provided; send coordinates only
        const coords = formData.location?.coordinates;
        if (coords && typeof coords.lat === 'number' && typeof coords.lng === 'number') {
          turfDataWithUrls.location = { coordinates: coords };
        }
      } else {
        // For creates: include address (and optional coordinates)
        turfDataWithUrls.location = {
          address: formData.location?.address || '',
          coordinates: formData.location?.coordinates || null
        };
      }

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

      if (isEditMode && editingTurf?._id) {
        // Update existing turf
        await turfService.updateTurf(editingTurf._id, turfDataWithUrls);
        hideGlobalLoading();
        setSuccess('Turf updated successfully! Changes have been submitted for admin approval.');
      } else {
        // Create new turf
        await turfService.createTurf(turfDataWithUrls);
        hideGlobalLoading();
        setSuccess('Turf created successfully! Images uploaded to Cloudinary and turf is now live.');
      }

      setTimeout(() => {
        navigate('/owner-dashboard');
      }, 2000);
    } catch (error) {
      hideGlobalLoading();
      const errorMessage = isEditMode ? 'Failed to update turf' : 'Failed to create turf';
      setError(error.message || errorMessage);
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
                Turf Name * (Fixed from registration)
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                readOnly
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                placeholder="Turf name from registration"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                This is set to your business name from registration and cannot be changed
              </p>
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
                Turf Location * (Fixed from registration)
              </label>
              <input
                type="text"
                value={formData.location.address}
                readOnly
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                placeholder="Location from registration"
              />
              <p className="mt-1 text-xs text-gray-500">
                This is set to your turf location from registration and cannot be changed
              </p>
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
                  Sport Type * (Fixed from registration)
                </label>
                <select
                  name="sport"
                  value={formData.sport}
                  disabled
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                  required
                >
                  <option value="">Select Sport</option>
                  {sportsOptions.map(sport => (
                    <option key={sport} value={sport}>{sport}</option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  This is set to your sport type from registration and cannot be changed
                </p>
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
      case 5:
        return (
          <div className="space-y-6">
            {/* Slot Duration Setting */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Slot Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Slot Duration (minutes) *
                  </label>
                  <select
                    value={formData.slotDuration}
                    onChange={(e) => setFormData(prev => ({ ...prev, slotDuration: parseInt(e.target.value) }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value={30}>30 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={90}>1.5 hours</option>
                    <option value={120}>2 hours</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Advance Booking Days *
                  </label>
                  <select
                    value={formData.advanceBookingDays}
                    onChange={(e) => setFormData(prev => ({ ...prev, advanceBookingDays: parseInt(e.target.value) }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value={7}>7 days</option>
                    <option value={15}>15 days</option>
                    <option value={30}>30 days</option>
                    <option value={60}>60 days</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Weekly Schedule */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekday Schedule *</h3>
              <p className="text-sm text-gray-600 mb-4">Configure availability for Monday to Friday.</p>
              
              {Object.entries(formData.availableSlots)
                .filter(([day]) => ['monday','tuesday','wednesday','thursday','friday'].includes(day))
                .map(([day, dayData]) => (
                <div key={day} className="border border-gray-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-md font-semibold text-gray-900 capitalize flex items-center gap-2">
                      {day}
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">8:00 AM - 11:00 PM</span>
                    </h4>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={dayData.isOpen}
                        onChange={(e) => {
                          const newSlots = { ...formData.availableSlots };
                          newSlots[day].isOpen = e.target.checked;
                          if (!e.target.checked) {
                            newSlots[day].slots = [];
                          }
                          setFormData(prev => ({ ...prev, availableSlots: newSlots }));
                        }}
                        className="text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">Open</span>
                    </label>
                  </div>
                  
                  {dayData.isOpen && (
                    <div className="space-y-3">
                      {/* Display existing slots */}
                      {dayData.slots.map((slot, index) => (
                        <div key={index} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                          {editingSlot.day === day && editingSlot.index === index ? (
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                              <div className="col-span-1 md:col-span-2">
                                <label className="block text-xs font-medium text-gray-700 mb-1">Start</label>
                                <select id={`${day}-edit-start-${index}`} defaultValue={slot.startTime} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                                  {generateStartTimes(parseInt(formData.slotDuration)).map((t) => (
                                    <option key={t} value={t}>{formatTime(t)}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="col-span-1 md:col-span-2">
                                <label className="block text-xs font-medium text-gray-700 mb-1">End (auto)</label>
                                <input id={`${day}-edit-end-${index}`} readOnly value={formatTime(addMinutes(document.getElementById(`${day}-edit-start-${index}`)?.value || slot.startTime, parseInt(formData.slotDuration)))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50" />
                              </div>
                              <div className="col-span-1">
                                <label className="block text-xs font-medium text-gray-700 mb-1">Price (₹)</label>
                                <input type="number" id={`${day}-edit-price-${index}`} defaultValue={slot.price || formData.pricePerHour} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                              </div>
                              <div className="col-span-1 flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const start = document.getElementById(`${day}-edit-start-${index}`).value;
                                    const end = addMinutes(start, parseInt(formData.slotDuration));
                                    const price = parseInt(document.getElementById(`${day}-edit-price-${index}`).value || formData.pricePerHour);
                                    if (!isWithinOperatingHours(start, end)) {
                                      setError('Slots must be within 8:00 AM to 11:00 PM');
                                      return;
                                    }
                                    if (overlapsExisting(day, start, end)) {
                                      // Ignore overlap with the same slot index by removing it first
                                      const temp = { ...formData.availableSlots };
                                      const others = temp[day].slots.filter((_, i) => i !== index);
                                      if (others.some(s => Math.max(timeToMinutes(start), timeToMinutes(s.startTime)) < Math.min(timeToMinutes(end), timeToMinutes(s.endTime)))) {
                                        setError('This slot overlaps an existing one');
                                        return;
                                      }
                                    }
                                    const next = { ...formData.availableSlots };
                                    next[day].slots[index] = { startTime: start, endTime: end, price };
                                    setFormData(prev => ({ ...prev, availableSlots: next }));
                                    setEditingSlot({ day: null, index: null });
                                    setError('');
                                  }}
                                  className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingSlot({ day: null, index: null })}
                                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                                  {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                          </span>
                                <span className="text-sm text-gray-700">
                                  ₹{slot.price || formData.pricePerHour} <span className="text-xs text-gray-500">per slot</span>
                          </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setEditingSlot({ day, index })}
                                  className="px-2 py-1 text-sm text-blue-600 hover:text-white hover:bg-blue-600 rounded border border-blue-200"
                                >
                                  Edit
                                </button>
                          <button
                            type="button"
                            onClick={() => {
                              const newSlots = { ...formData.availableSlots };
                              newSlots[day].slots = newSlots[day].slots.filter((_, i) => i !== index);
                              setFormData(prev => ({ ...prev, availableSlots: newSlots }));
                            }}
                                  className="px-2 py-1 text-sm text-red-600 hover:text-white hover:bg-red-600 rounded border border-red-200"
                          >
                            Remove
                          </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                      
                      {/* Add new slot form - redesigned workflow */}
                      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                          <div className="col-span-1 md:col-span-2">
                            <label className="block text-xs font-semibold text-gray-800 mb-1">Start Time</label>
                            <select id={`${day}-start`} className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white">
                              {generateStartTimes(parseInt(formData.slotDuration)).map((t) => (
                                <option key={t} value={t}>{formatTime(t)}</option>
                              ))}
                            </select>
                            <p className="mt-1 text-[11px] text-gray-500">Within 8:00 AM – 11:00 PM</p>
                          </div>
                          <div className="col-span-1 md:col-span-2">
                            <label className="block text-xs font-semibold text-gray-800 mb-1">End Time (auto)</label>
                            <div className="relative">
                              <input id={`${day}-end`} readOnly className="w-full pl-3 pr-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-700" value={''} placeholder={formatTime(addMinutes(OPEN_TIME, parseInt(formData.slotDuration)))} />
                          </div>
                            <p className="mt-1 text-[11px] text-gray-500">Calculated from duration</p>
                          </div>
                          <div className="col-span-1">
                            <label className="block text-xs font-semibold text-gray-800 mb-1">Price (₹)</label>
                            <input
                              type="number"
                              id={`${day}-price`}
                              placeholder={formData.pricePerHour}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                            />
                            <p className="mt-1 text-[11px] text-gray-500">Default: ₹{formData.pricePerHour || 0}/hr</p>
                          </div>
                          <div className="col-span-1 flex items-end">
                            <button
                              type="button"
                              onClick={() => {
                                const startTime = document.getElementById(`${day}-start`).value;
                                const endTime = addMinutes(startTime, parseInt(formData.slotDuration));
                                const price = document.getElementById(`${day}-price`).value || formData.pricePerHour;
                                
                                // Validations: within operating hours and matches slotDuration
                                if (!startTime || !endTime) {
                                  setError('Please select start and end times');
                                  return;
                                }

                                if (!isWithinOperatingHours(startTime, endTime)) {
                                  setError('Slots must be within 8:00 AM to 11:00 PM');
                                  return;
                                }

                                const diff = timeToMinutes(endTime) - timeToMinutes(startTime);
                                if (diff !== parseInt(formData.slotDuration)) {
                                  setError(`Slot must be exactly ${formData.slotDuration} minutes`);
                                  return;
                                }

                                if (overlapsExisting(day, startTime, endTime)) {
                                  setError('This slot overlaps an existing one');
                                  return;
                                }
                                
                                if (startTime && endTime && startTime < endTime) {
                                  const newSlots = { ...formData.availableSlots };
                                  newSlots[day].slots.push({
                                    startTime,
                                    endTime,
                                    price: parseInt(price)
                                  });
                                  setFormData(prev => ({ ...prev, availableSlots: newSlots }));
                                  
                                  // Clear form
                                  document.getElementById(`${day}-start`).selectedIndex = 0;
                                  document.getElementById(`${day}-price`).value = '';
                                  setError('');
                                } else {
                                  setError('Please enter valid start and end times');
                                }
                              }}
                              className="w-full px-4 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors shadow-sm"
                            >
                              Add Slot
                            </button>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <p className="text-xs text-gray-500">Operating hours: 8:00 AM – 11:00 PM · Duration: {formData.slotDuration} mins</p>
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200">15 min increments</span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const duration = parseInt(formData.slotDuration);
                              const starts = generateStartTimes(duration);
                              const newSlots = { ...formData.availableSlots };
                              const created = [];
                              starts.forEach(s => {
                                const e = addMinutes(s, duration);
                                if (!overlapsExisting(day, s, e)) {
                                  newSlots[day].slots.push({ startTime: s, endTime: e, price: parseInt(formData.pricePerHour) });
                                  created.push(s);
                                }
                              });
                              setFormData(prev => ({ ...prev, availableSlots: newSlots }));
                              if (created.length === 0) setError('No slots were added (overlaps with existing)');
                              else setError('');
                            }}
                            className="px-3 py-1.5 text-xs rounded-lg border border-gray-300 hover:bg-gray-50"
                          >
                            Auto-fill full day
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const newSlots = { ...formData.availableSlots };
                              newSlots[day].slots = [];
                              setFormData(prev => ({ ...prev, availableSlots: newSlots }));
                              setError('');
                            }}
                            className="px-3 py-1.5 text-xs rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                          >
                            Clear day
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const getProgressPercentage = () => {
    return (currentStep / 5) * 100;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <OwnerDashboardNav />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/owner-dashboard')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditMode ? 'Edit Turf' : 'Turf Management'}
          </h1>
          <p className="text-gray-600 mt-2">
            {isEditMode
              ? 'Update your turf details - changes require admin approval'
              : 'Manage your turfs and create new listings'
            }
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => handleTabSwitch('add')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'add'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <PlusIcon className="w-5 h-5 inline mr-2" />
                {isEditMode ? 'Edit Turf' : 'Add New Turf'}
              </button>
              <button
                onClick={() => handleTabSwitch('manage')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'manage'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <BuildingOfficeIcon className="w-5 h-5 inline mr-2" />
                My Turfs ({myTurfs.length})
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'add' && (
          <>
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
            {currentStep < 5 ? (
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
                {loading
                  ? (isEditMode ? 'Updating Turf...' : 'Creating Turf...')
                  : (isEditMode ? 'Update Turf' : 'Create Turf')
                }
              </button>
            )}
          </div>
        </div>
        </>
        )}

        {/* My Turfs Tab Content */}
        {activeTab === 'manage' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-gray-900">My Turfs</h2>
              <button
                onClick={handleAddNewTurf}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                Add New Turf
              </button>
            </div>

            {turfsLoading ? (
              <div className="flex justify-center py-8">
                <ButtonLoader size="lg" />
              </div>
            ) : myTurfs.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl shadow-lg">
                <BuildingOfficeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No turfs yet</h3>
                <p className="text-gray-500 mb-4">Create your first turf to get started</p>
                <button
                  onClick={handleAddNewTurf}
                  className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Add Your First Turf
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myTurfs.map((turf) => (
                  <div key={turf._id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="relative h-48">
                      {turf.images && turf.images.length > 0 ? (
                        <img
                          src={turf.images[0]}
                          alt={turf.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <PhotoIcon className="h-12 w-12 text-gray-400" />
                        </div>
                      )}

                      {/* Status Badge */}
                      <div className="absolute top-3 right-3">
                        {turf.changesApprovalStatus === 'pending' && (
                          <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full flex items-center">
                            <ClockIcon className="w-3 h-3 mr-1" />
                            Pending Approval
                          </span>
                        )}
                        {turf.changesApprovalStatus === 'approved' && (
                          <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                            ✓ Approved
                          </span>
                        )}
                        {turf.changesApprovalStatus === 'rejected' && (
                          <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                            ✗ Rejected
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{turf.name}</h3>
                      <p className="text-gray-600 text-sm mb-2 flex items-center">
                        <MapPinIcon className="w-4 h-4 mr-1" />
                        {turf.location?.address || 'Location not specified'}
                      </p>
                      <p className="text-gray-600 text-sm mb-4 flex items-center">
                        <CurrencyRupeeIcon className="w-4 h-4 mr-1" />
                        ₹{turf.pricePerHour}/hour
                      </p>

                      {/* Pending Changes Info */}
                      {turf.pendingChanges && turf.pendingChanges.size > 0 && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                          <p className="text-yellow-800 text-xs font-medium mb-1">
                            Pending Changes ({turf.pendingChanges.size} fields)
                          </p>
                          <p className="text-yellow-600 text-xs">
                            {turf.changeApprovalNotes || 'Changes submitted for admin review'}
                          </p>
                        </div>
                      )}

                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditTurf(turf)}
                          className="flex-1 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm flex items-center justify-center"
                        >
                          <PencilIcon className="w-4 h-4 mr-1" />
                          Edit
                        </button>
                        <button
                          onClick={() => {/* Add view functionality */}}
                          className="flex-1 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm flex items-center justify-center"
                        >
                          <EyeIcon className="w-4 h-4 mr-1" />
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AddTurf;
