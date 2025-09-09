import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';
import { LocationInput, AddressInput, ValidatedInput } from '../../components/forms';
import { DevOTPDisplay } from '../../components/ui';
import apiService from '../../services/api';
import { showSuccessToast } from '../../utils/toast';

import { getDashboardRoute } from '../../utils/dashboardRoutes';
import {
  CheckCircleIcon,
  ArrowRightIcon,
  UserGroupIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';

const Register = () => {
  const navigate = useNavigate();
  const { register, googleAuth, isAuthenticated, user, loading } = useAuth();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [userType, setUserType] = useState(''); // 'player' or 'owner'
  const [formData, setFormData] = useState({
    // Personal Info
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',

    // Player specific
    preferredSports: [],
    skillLevel: '',
    location: '',

    // Turf Owner specific
    businessName: '',
    businessAddress: '',
    businessPhone: '',
    turfCount: '',
    turfLocation: '', // Separate field for turf location
    sportTypes: [], // Multiple sport types for the turf
    sportType: '', // Keep for backward compatibility
    // Document uploads
    govIdFile: null, // Government-issued ID (required)
    ownershipProofFile: null, // Turf Ownership Proof (required)
    businessCertFile: null, // Business Registration Certificate (optional)
    gstNumber: '', // GST Number (optional, text)
    gstFile: null, // GST Document (optional)
    bankDetails: '', // Bank Details / UPI ID (optional, text)
    bankProofFile: null, // Bank Proof (optional)

    // Terms
    agreeToTerms: false,
    agreeToMarketing: false
  });
  
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [devOTP, setDevOTP] = useState(null);
  const [devMessage, setDevMessage] = useState('');

  // Memoized additional validation data to prevent unnecessary re-renders
  const confirmPasswordValidationData = useMemo(() => ({
    password: formData.password
  }), [formData.password]);

  // Validation rules for form fields
  const validationRules = {
    firstName: [
      { type: 'required', field: 'First Name' },
      { type: 'name', field: 'First Name' },
      { type: 'minLength', min: 2, field: 'First Name' },
      { type: 'maxLength', max: 50, field: 'First Name' }
    ],
    lastName: [
      { type: 'required', field: 'Last Name' },
      { type: 'name', field: 'Last Name' },
      { type: 'minLength', min: 2, field: 'Last Name' },
      { type: 'maxLength', max: 50, field: 'Last Name' }
    ],
    email: [
      { type: 'required', field: 'Email' },
      { type: 'email' }
    ],
    phone: [
      { type: 'required', field: 'Phone Number' },
      { type: 'phone' }
    ],
    password: [
      { type: 'required', field: 'Password' },
      { type: 'password' },
      { type: 'minLength', min: 8, field: 'Password' }
    ],
    confirmPassword: [
      { type: 'required', field: 'Confirm Password' },
      { type: 'passwordMatch' }
    ],
    businessName: [
      { type: 'required', field: 'Business Name' },
      { type: 'businessName' },
      { type: 'minLength', min: 2, field: 'Business Name' },
      { type: 'maxLength', max: 100, field: 'Business Name' }
    ],
    businessPhone: [
      { type: 'required', field: 'Business Phone' },
      { type: 'phone' }
    ],
    turfCount: [
      { type: 'required', field: 'Number of Turfs' },
      { type: 'numeric', field: 'Number of Turfs' },
      { type: 'positive', field: 'Number of Turfs' }
    ],
    sportType: [
      { type: 'required', field: 'Sport Type' }
    ]
  };
  // Removed OTP verification data state since we're using navigation

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user && !loading) {
      const redirectRoute = getDashboardRoute(user.userType);
      navigate(redirectRoute, { replace: true });
    }
  }, [isAuthenticated, user, loading, navigate]);

  const sports = ['Football', 'Cricket', 'Basketball', 'Tennis', 'Badminton', 'Volleyball'];
  const skillLevels = ['Beginner', 'Intermediate', 'Advanced', 'Professional'];

  
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSportToggle = (sport) => {
    setFormData(prev => ({
      ...prev,
      preferredSports: prev.preferredSports.includes(sport)
        ? prev.preferredSports.filter(s => s !== sport)
        : [...prev.preferredSports, sport]
    }));
  };

  const handleOwnerSportToggle = (sport) => {
    setFormData(prev => ({
      ...prev,
      sportTypes: prev.sportTypes.includes(sport)
        ? prev.sportTypes.filter(s => s !== sport)
        : [...prev.sportTypes, sport]
    }));
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    if (step === 1) {
      if (!formData.firstName) newErrors.firstName = 'First name is required';
      if (!formData.lastName) newErrors.lastName = 'Last name is required';
      if (!formData.email) {
        newErrors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email';
      }
      if (!formData.phone) newErrors.phone = 'Phone number is required';
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }
    
    if (step === 2) {
      if (userType === 'player') {
        if (formData.preferredSports.length === 0) {
          newErrors.preferredSports = 'Please select at least one sport';
        }
        if (!formData.skillLevel) newErrors.skillLevel = 'Please select your skill level';
        if (!formData.location) newErrors.location = 'Location is required';
      } else {
        if (!formData.businessName) newErrors.businessName = 'Business name is required';
        if (!formData.businessAddress) newErrors.businessAddress = 'Business address is required';
        if (!formData.businessPhone) newErrors.businessPhone = 'Business phone is required';
        if (!formData.turfCount) newErrors.turfCount = 'Number of turfs is required';
        if (!formData.turfLocation) newErrors.turfLocation = 'Turf location is required';
        if (formData.sportTypes.length === 0) newErrors.sportTypes = 'Please select at least one sport type';
        if (!formData.govIdFile) newErrors.govIdFile = 'Government-issued ID is required';
        if (!formData.ownershipProofFile) newErrors.ownershipProofFile = 'Turf Ownership Proof is required';
      }
    }
    
    if (step === 3) {
      if (!formData.agreeToTerms) {
        newErrors.agreeToTerms = 'You must agree to the terms and conditions';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep(3)) return;
    
    setIsLoading(true);
    console.log('🚀 Starting registration...');
    
    try {
      let documentUrls = {};
      if (userType === 'owner') {
        // Upload each document if present
        if (formData.govIdFile) {
          documentUrls.govIdFileUrl = await apiService.uploadDocumentToCloudinary(formData.govIdFile);
        }
        if (formData.ownershipProofFile) {
          documentUrls.ownershipProofFileUrl = await apiService.uploadDocumentToCloudinary(formData.ownershipProofFile);
        }
        if (formData.businessCertFile) {
          documentUrls.businessCertFileUrl = await apiService.uploadDocumentToCloudinary(formData.businessCertFile);
        }
        if (formData.gstFile) {
          documentUrls.gstFileUrl = await apiService.uploadDocumentToCloudinary(formData.gstFile);
        }
        if (formData.bankProofFile) {
          documentUrls.bankProofFileUrl = await apiService.uploadDocumentToCloudinary(formData.bankProofFile);
        }
      }
      const registrationData = {
        ...formData,
        ...documentUrls,
        govIdFile: undefined,
        ownershipProofFile: undefined,
        businessCertFile: undefined,
        gstFile: undefined,
        bankProofFile: undefined,
        userType
      };
      
      console.log('📝 Registration data:', registrationData);
      const result = await register(registrationData);
      console.log('📋 Registration result:', result);
      
      if (result.success) {
        console.log('🔧 Frontend: Registration successful, checking OTP requirement...');
        console.log('🔧 Frontend: requiresOtpVerification:', result.requiresOtpVerification);
        console.log('🔧 Frontend: Full result:', result);

        if (result.requiresOtpVerification) {
          console.log('🔧 Frontend: Setting OTP verification data...');

          // Show development OTP if available
          if (result.devOtp && process.env.NODE_ENV === 'development') {
            setDevOTP(result.devOtp);
            setDevMessage(result.devMessage || 'Development Mode - OTP shown below');
          }

          // Show OTP verification screen
          const otpData = {
            userId: result.userId,
            email: result.email,
            userType: result.userType
          };
          console.log('🔧 Frontend: OTP data to set:', otpData);
          console.log('🔧 Frontend: OTP verification data set successfully');

          // Navigate to OTP page with state
          console.log('🔧 Frontend: Navigating to OTP verification page...');
          navigate('/verify-otp', { state: otpData });
        } else {
          console.log('✅ Registration successful, redirecting to login...');
          // Show success message and redirect to login
          showSuccessToast(result.message);
          navigate('/login');
        }
      } else {
        console.log('❌ Registration failed:', result.error);
        setErrors({ general: result.error || 'Registration failed. Please try again.' });
      }
    } catch (error) {
      console.log('💥 Registration error:', error);
      setErrors({ general: error.message || 'Registration failed. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  // OTP verification completion handled in separate page

  // OTP verification now handled by separate page via navigation

  const handleSocialRegister = async (provider) => {
    if (provider === 'google') {
      try {
        setIsLoading(true);
        
        const result = await googleAuth();
        if (result.success) {
          // Google auth automatically logs in the user, so redirect appropriately
          const redirectRoute = user?.userType === 'admin' ? getDashboardRoute(user.userType) : '/';
          navigate(redirectRoute, { replace: true });
        } else {
          setErrors({ general: result.error || 'Google registration failed. Please try again.' });
        }
      } catch (error) {
        setErrors({ general: 'Google registration failed. Please try again.' });
      } finally {
        setIsLoading(false);
      }
    } else {
      console.log(`Register with ${provider} - not implemented yet`);
    }
  };

  const renderUserTypeSelection = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Choose your account type</h3>
        <p className="text-gray-600">Select how you want to use TurfEase</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => setUserType('player')}
          className={`p-6 rounded-xl border-2 transition-all ${
            userType === 'player'
              ? 'border-primary-500 bg-primary-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <UserGroupIcon className="w-12 h-12 mx-auto mb-4 text-primary-600" />
          <h4 className="text-lg font-semibold text-gray-900 mb-2">Player</h4>
          <p className="text-sm text-gray-600">
            Book turfs, join matches, and participate in tournaments
          </p>
          <p className="text-xs text-primary-600 mt-2 font-medium">
            ✓ Google Sign-In available
          </p>
        </button>
        
        <button
          type="button"
          onClick={() => setUserType('owner')}
          className={`p-6 rounded-xl border-2 transition-all ${
            userType === 'owner'
              ? 'border-primary-500 bg-primary-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <BuildingOfficeIcon className="w-12 h-12 mx-auto mb-4 text-primary-600" />
          <h4 className="text-lg font-semibold text-gray-900 mb-2">Turf Owner</h4>
          <p className="text-sm text-gray-600">
            List your turfs, manage bookings, and grow your business
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Email/password registration only
          </p>
        </button>
      </div>
    </motion.div>
  );

  const renderStep1 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Personal Information</h3>
        <p className="text-gray-600">Let's start with your basic details</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ValidatedInput
          type="text"
          name="firstName"
          label="First Name"
          value={formData.firstName}
          onChange={handleInputChange}
          validationRules={validationRules.firstName}
          placeholder="Enter first name"
          required={true}
        />

        <ValidatedInput
          type="text"
          name="lastName"
          label="Last Name"
          value={formData.lastName}
          onChange={handleInputChange}
          validationRules={validationRules.lastName}
          placeholder="Enter last name"
          required={true}
        />
      </div>

      <ValidatedInput
        type="email"
        name="email"
        label="Email Address"
        value={formData.email}
        onChange={handleInputChange}
        validationRules={validationRules.email}
        placeholder="Enter your email"
        required={true}
        checkEmailAvailability={true}
      />

      <ValidatedInput
        type="tel"
        name="phone"
        label="Phone Number"
        value={formData.phone}
        onChange={handleInputChange}
        validationRules={validationRules.phone}
        placeholder="Enter your phone number"
        required={true}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ValidatedInput
          type="password"
          name="password"
          label="Password"
          value={formData.password}
          onChange={handleInputChange}
          validationRules={validationRules.password}
          placeholder="Create password"
          required={true}
          showPasswordStrength={true}
        />

        <ValidatedInput
          type="password"
          name="confirmPassword"
          label="Confirm Password"
          value={formData.confirmPassword}
          onChange={handleInputChange}
          validationRules={validationRules.confirmPassword}
          placeholder="Confirm password"
          required={true}
          additionalValidationData={confirmPasswordValidationData}
        />
      </div>
    </motion.div>
  );

  const renderStep2 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {userType === 'player' ? 'Sports Preferences' : 'Business Information'}
        </h3>
        <p className="text-gray-600">
          {userType === 'player' 
            ? 'Tell us about your sports interests' 
            : 'Provide details about your business'
          }
        </p>
      </div>

      {userType === 'player' ? (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Preferred Sports
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {sports.map((sport) => (
                <button
                  key={sport}
                  type="button"
                  onClick={() => handleSportToggle(sport)}
                  className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                    formData.preferredSports.includes(sport)
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {sport}
                </button>
              ))}
            </div>
            {errors.preferredSports && <p className="mt-1 text-sm text-red-600">{errors.preferredSports}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Skill Level
            </label>
            <select
              name="skillLevel"
              value={formData.skillLevel}
              onChange={handleInputChange}
              className={`block w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                errors.skillLevel ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
            >
              <option value="">Select your skill level</option>
              {skillLevels.map((level) => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
            {errors.skillLevel && <p className="mt-1 text-sm text-red-600">{errors.skillLevel}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <LocationInput
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="Enter your city/area"
              error={errors.location}
              required
            />
          </div>
        </>
      ) : (
        <>
          <ValidatedInput
            type="text"
            name="businessName"
            label="Business Name"
            value={formData.businessName}
            onChange={handleInputChange}
            validationRules={validationRules.businessName}
            placeholder="Enter your business name"
            required={true}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Address
            </label>
            <AddressInput
              name="businessAddress"
              value={formData.businessAddress}
              onChange={handleInputChange}
              placeholder="Enter your business address"
              error={errors.businessAddress}
              required
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Turf Location
            </label>
            <LocationInput
              name="turfLocation"
              value={formData.turfLocation}
              onChange={handleInputChange}
              placeholder="Enter your turf's city/location"
              error={errors.turfLocation}
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              📍 This is where your turf is located (customers will see this)
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ValidatedInput
              type="tel"
              name="businessPhone"
              label="Business Phone"
              value={formData.businessPhone}
              onChange={handleInputChange}
              validationRules={validationRules.businessPhone}
              placeholder="Business phone number"
              required={true}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Turfs
              </label>
              <select
                name="turfCount"
                value={formData.turfCount}
                onChange={handleInputChange}
                className={`block w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                  errors.turfCount ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              >
                <option value="">Select number of turfs</option>
                <option value="1">1 Turf</option>
                <option value="2-5">2 Turfs</option>
                <option value="6-10">3 Turfs</option>
                <option value="10+">4 Turfs</option>
              </select>
              {errors.turfCount && <p className="mt-1 text-sm text-red-600">{errors.turfCount}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Sport Types (Select all that apply)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {sports.map((sport) => (
                  <button
                    key={sport}
                    type="button"
                    onClick={() => handleOwnerSportToggle(sport)}
                    className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                      formData.sportTypes.includes(sport)
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {sport}
                  </button>
                ))}
              </div>
              {errors.sportTypes && <p className="mt-1 text-sm text-red-600">{errors.sportTypes}</p>}
            </div>
          </div>
          {userType === 'owner' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Government-issued ID (Aadhar, PAN, Voter ID) <span className="text-red-500">*</span>
                </label>
                <input
                  name="govIdFile"
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={e => setFormData(prev => ({ ...prev, govIdFile: e.target.files[0] }))}
                  className="block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
                {errors.govIdFile && <p className="mt-1 text-sm text-red-600">{errors.govIdFile}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Turf Ownership Proof (electricity bill, land deed, rental agreement) <span className="text-red-500">*</span>
                </label>
                <input
                  name="ownershipProofFile"
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={e => setFormData(prev => ({ ...prev, ownershipProofFile: e.target.files[0] }))}
                  className="block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
                {errors.ownershipProofFile && <p className="mt-1 text-sm text-red-600">{errors.ownershipProofFile}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Registration Certificate (optional)
                </label>
                <input
                  name="businessCertFile"
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={e => setFormData(prev => ({ ...prev, businessCertFile: e.target.files[0] }))}
                  className="block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  GST Number (optional)
                </label>
                <input
                  name="gstNumber"
                  type="text"
                  value={formData.gstNumber}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter GST Number (if registered)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  GST Document (optional)
                </label>
                <input
                  name="gstFile"
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={e => setFormData(prev => ({ ...prev, gstFile: e.target.files[0] }))}
                  className="block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bank Details / UPI ID (optional)
                </label>
                <input
                  name="bankDetails"
                  type="text"
                  value={formData.bankDetails}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter Bank Account or UPI ID (if payouts needed)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bank Proof Document (optional)
                </label>
                <input
                  name="bankProofFile"
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={e => setFormData(prev => ({ ...prev, bankProofFile: e.target.files[0] }))}
                  className="block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </>
          )}
        </>
      )}
    </motion.div>
  );

  const renderStep3 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Terms & Conditions</h3>
        <p className="text-gray-600">Review and accept our terms to complete registration</p>
      </div>

      <div className="bg-gray-50 rounded-lg p-6 space-y-4">
        <div className="flex items-start">
          <input
            id="agreeToTerms"
            name="agreeToTerms"
            type="checkbox"
            checked={formData.agreeToTerms}
            onChange={handleInputChange}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-1"
          />
          <label htmlFor="agreeToTerms" className="ml-3 text-sm text-gray-700">
            I agree to the{' '}
            <Link to="/terms" className="text-primary-600 hover:text-primary-500 font-medium">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="text-primary-600 hover:text-primary-500 font-medium">
              Privacy Policy
            </Link>
          </label>
        </div>
        {errors.agreeToTerms && <p className="text-sm text-red-600">{errors.agreeToTerms}</p>}

        <div className="flex items-start">
          <input
            id="agreeToMarketing"
            name="agreeToMarketing"
            type="checkbox"
            checked={formData.agreeToMarketing}
            onChange={handleInputChange}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-1"
          />
          <label htmlFor="agreeToMarketing" className="ml-3 text-sm text-gray-700">
            I would like to receive marketing communications and updates about new features
          </label>
        </div>
      </div>

      <div className="bg-primary-50 rounded-lg p-6">
        <h4 className="font-semibold text-gray-900 mb-3">What happens next?</h4>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center">
            <CheckCircleIcon className="h-4 w-4 text-primary-500 mr-2" />
            <span>Email verification will be sent to your inbox</span>
          </div>
          <div className="flex items-center">
            <CheckCircleIcon className="h-4 w-4 text-primary-500 mr-2" />
            <span>Complete your profile setup</span>
          </div>
          <div className="flex items-center">
            <CheckCircleIcon className="h-4 w-4 text-primary-500 mr-2" />
            <span>Start booking turfs and joining matches</span>
          </div>
        </div>
      </div>
    </motion.div>
  );

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50">


      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Create your account</h2>
            <p className="text-gray-600">Join thousands of sports enthusiasts</p>
          </motion.div>



        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep >= step
                    ? 'bg-primary-600 border-primary-600 text-white'
                    : 'border-gray-300 text-gray-400'
                }`}
              >
                {currentStep > step ? (
                  <CheckCircleIcon className="w-6 h-6" />
                ) : (
                  <span className="text-sm font-semibold">{step}</span>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Account Type</span>
            <span>Details</span>
            <span>Finish</span>
          </div>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          <form onSubmit={handleSubmit}>
            {currentStep === 0 && renderUserTypeSelection()}
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              {currentStep > 0 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
              ) : (
                <div></div>
              )}

              {currentStep === 0 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  disabled={!userType}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                  <ArrowRightIcon className="ml-2 h-4 w-4" />
                </button>
              ) : currentStep < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="btn-primary"
                >
                  Next
                  <ArrowRightIcon className="ml-2 h-4 w-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary relative"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Creating account...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      Create Account
                      <CheckCircleIcon className="ml-2 h-4 w-4" />
                    </div>
                  )}
                </button>
              )}
            </div>
          </form>

          {/* Social Registration - Only show for players on first step */}
          {currentStep === 1 && userType === 'player' && (
            <>
              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or register with</span>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => handleSocialRegister('google')}
                  className="w-full inline-flex justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="ml-2">Continue with Google</span>
                </button>
                
                <p className="mt-2 text-xs text-gray-500 text-center">
                  Google Sign-In is available for players only
                </p>
              </div>
            </>
          )}

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </motion.div>
        </div>
      </div>

      {/* Development OTP Display */}
      <DevOTPDisplay
        otp={devOTP}
        message={devMessage}
        onClose={() => {
          setDevOTP(null);
          setDevMessage('');
        }}
      />
    </div>
  );
};

export default Register;