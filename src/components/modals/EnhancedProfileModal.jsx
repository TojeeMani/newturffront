import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { 
  XMarkIcon, 
  UserIcon, 
  BuildingOfficeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CameraIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import { LocationInput, TurfLocationInput } from '../forms';
import { ProfileImageUpload } from '../ui';
import toast from 'react-hot-toast';

const EnhancedProfileModal = ({ isOpen, onClose, userType = 'player' }) => {
  const { user, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('personal');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone === '0000000000' ? '' : (user?.phone || ''),
    email: user?.email || '',
    avatar: user?.avatar || '',
    location: user?.location || '',
    // Player specific
    preferredSports: user?.preferredSports || [],
    skillLevel: user?.skillLevel || '',
    // Owner specific
    businessName: user?.businessName || '',
    businessAddress: user?.businessAddress || '',
    businessPhone: user?.businessPhone || '',
    turfCount: user?.turfCount || '',
    turfLocation: user?.turfLocation || ''
  });

  const sports = ['Football', 'Cricket', 'Basketball', 'Tennis', 'Badminton', 'Volleyball'];
  const skillLevels = ['Beginner', 'Intermediate', 'Advanced', 'Professional'];

  const tabs = userType === 'owner' 
    ? [
        { id: 'personal', name: 'Personal', icon: UserIcon },
        { id: 'business', name: 'Business', icon: BuildingOfficeIcon }
      ]
    : [
        { id: 'personal', name: 'Profile', icon: UserIcon }
      ];

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone === '0000000000' ? '' : (user.phone || ''),
        email: user.email || '',
        avatar: user.avatar || '',
        location: user.location || '',
        preferredSports: user.preferredSports || [],
        skillLevel: user.skillLevel || '',
        businessName: user.businessName || '',
        businessAddress: user.businessAddress || '',
        businessPhone: user.businessPhone || '',
        turfCount: user.turfCount || '',
        turfLocation: user.turfLocation || ''
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (imageUrl) => {
    setFormData(prev => ({
      ...prev,
      avatar: imageUrl || ''
    }));
  };

  const handleSportToggle = (sport) => {
    setFormData(prev => ({
      ...prev,
      preferredSports: prev.preferredSports.includes(sport)
        ? prev.preferredSports.filter(s => s !== sport)
        : [...prev.preferredSports, sport]
    }));
  };

  const handleLocationChange = (location) => {
    setFormData(prev => ({
      ...prev,
      location: location
    }));
  };

  const handleTurfLocationChange = (location) => {
    setFormData(prev => ({
      ...prev,
      turfLocation: location
    }));
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      setError('First name is required');
      return false;
    }
    if (!formData.phone.trim()) {
      setError('Phone number is required');
      return false;
    }
    if (userType === 'player' && formData.preferredSports.length === 0) {
      setError('Please select at least one sport');
      return false;
    }
    if (userType === 'owner' && !formData.businessName.trim()) {
      setError('Business name is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await updateProfile(formData);
      setSuccess('Profile updated successfully!');
      toast.success('Profile updated successfully!');
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Profile update error:', error);
      setError(error.message || 'Failed to update profile');
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: 20 }
  };

  const tabContentVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <UserIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Profile Settings</h2>
                  <p className="text-blue-100 text-sm">Manage your account information</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-blue-200 transition-colors p-2 hover:bg-white hover:bg-opacity-10 rounded-full"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Tabs */}
            {tabs.length > 1 && (
              <div className="flex space-x-1 mt-4">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                      activeTab === tab.id
                        ? 'bg-white text-blue-600 shadow-md'
                        : 'text-blue-100 hover:text-white hover:bg-white hover:bg-opacity-10'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{tab.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            {/* Status Messages */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center space-x-2"
                >
                  <ExclamationTriangleIcon className="w-5 h-5" />
                  <span>{error}</span>
                </motion.div>
              )}

              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center space-x-2"
                >
                  <CheckCircleIcon className="w-5 h-5" />
                  <span>{success}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  variants={tabContentVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  transition={{ duration: 0.2 }}
                >
                  {activeTab === 'personal' && (
                    <div className="space-y-6">
                      {/* Profile Image Section */}
                      <div className="bg-gradient-to-br from-gray-50 to-blue-50 p-6 rounded-xl border border-gray-200">
                        <div className="flex items-center space-x-3 mb-4">
                          <CameraIcon className="w-5 h-5 text-blue-600" />
                          <h3 className="text-lg font-semibold text-gray-900">Profile Picture</h3>
                        </div>
                        <ProfileImageUpload
                          currentImage={formData.avatar}
                          onImageChange={handleImageChange}
                          loading={loading}
                        />
                      </div>

                      {/* Personal Information */}
                      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex items-center space-x-3 mb-6">
                          <UserIcon className="w-5 h-5 text-blue-600" />
                          <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              First Name *
                            </label>
                            <input
                              type="text"
                              name="firstName"
                              value={formData.firstName}
                              onChange={handleInputChange}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                              placeholder="Enter your first name"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Last Name
                            </label>
                            <input
                              type="text"
                              name="lastName"
                              value={formData.lastName}
                              onChange={handleInputChange}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                              placeholder="Enter your last name"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              <PhoneIcon className="w-4 h-4 inline mr-1" />
                              Phone Number *
                            </label>
                            <input
                              type="tel"
                              name="phone"
                              value={formData.phone}
                              onChange={handleInputChange}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                              placeholder="Enter your phone number"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              <EnvelopeIcon className="w-4 h-4 inline mr-1" />
                              Email Address
                            </label>
                            <input
                              type="email"
                              name="email"
                              value={formData.email}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                              disabled
                            />
                            <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                          </div>
                        </div>

                        <div className="mt-6">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            <MapPinIcon className="w-4 h-4 inline mr-1" />
                            Location
                          </label>
                          <LocationInput
                            value={formData.location}
                            onChange={handleLocationChange}
                            placeholder="Enter your location"
                          />
                        </div>
                      </div>

                      {/* Player-specific fields */}
                      {userType === 'player' && (
                        <>
                          {/* Preferred Sports */}
                          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sports Preferences</h3>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-3">
                                Preferred Sports *
                              </label>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {sports.map((sport) => (
                                  <button
                                    key={sport}
                                    type="button"
                                    onClick={() => handleSportToggle(sport)}
                                    className={`p-3 rounded-lg border-2 transition-all text-sm font-medium ${
                                      formData.preferredSports.includes(sport)
                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                                    }`}
                                  >
                                    {sport}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="mt-6">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Skill Level
                              </label>
                              <select
                                name="skillLevel"
                                value={formData.skillLevel}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                              >
                                <option value="">Select your skill level</option>
                                {skillLevels.map((level) => (
                                  <option key={level} value={level}>{level}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {activeTab === 'business' && userType === 'owner' && (
                    <div className="space-y-6">
                      {/* Business Information */}
                      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex items-center space-x-3 mb-6">
                          <BuildingOfficeIcon className="w-5 h-5 text-blue-600" />
                          <h3 className="text-lg font-semibold text-gray-900">Business Information</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Business Name *
                            </label>
                            <input
                              type="text"
                              name="businessName"
                              value={formData.businessName}
                              onChange={handleInputChange}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                              placeholder="Enter your business name"
                              required
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Business Address
                            </label>
                            <textarea
                              name="businessAddress"
                              value={formData.businessAddress}
                              onChange={handleInputChange}
                              rows={3}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                              placeholder="Enter your business address"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Business Phone
                            </label>
                            <input
                              type="tel"
                              name="businessPhone"
                              value={formData.businessPhone}
                              onChange={handleInputChange}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                              placeholder="Enter business phone"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Number of Turfs
                            </label>
                            <input
                              type="number"
                              name="turfCount"
                              value={formData.turfCount}
                              onChange={handleInputChange}
                              min="0"
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                              placeholder="Enter number of turfs"
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Turf Location
                            </label>
                            <TurfLocationInput
                              value={formData.turfLocation}
                              onChange={handleTurfLocationChange}
                              placeholder="Enter turf location"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Footer */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default EnhancedProfileModal;
