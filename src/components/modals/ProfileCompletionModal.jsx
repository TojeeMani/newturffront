import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import {
  XMarkIcon,
  UserIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CameraIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { LocationInput } from '../forms';
import { ProfileImageUpload } from '../ui';
import toast from 'react-hot-toast';

const ProfileCompletionModal = ({ isOpen, onClose, onComplete }) => {
  const { user, logout, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone === '0000000000' ? '' : (user?.phone || ''),
    preferredSports: user?.preferredSports || [],
    skillLevel: user?.skillLevel || '',
    location: user?.location || '',
    avatar: user?.avatar || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const sportsOptions = ['Football', 'Cricket', 'Basketball', 'Tennis', 'Badminton', 'Volleyball'];
  const skillLevels = ['Beginner', 'Intermediate', 'Advanced', 'Professional'];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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

  const handleImageChange = (imageUrl) => {
    setFormData(prev => ({
      ...prev,
      avatar: imageUrl || ''
    }));
  };

  const handleLocationChange = (e) => {
    const location = e.target ? e.target.value : e;
    setFormData(prev => ({
      ...prev,
      location: location
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate required fields
      if (!formData.phone) {
        throw new Error('Phone number is required');
      }
      if (formData.preferredSports.length === 0) {
        throw new Error('Please select at least one preferred sport');
      }
      if (!formData.skillLevel) {
        throw new Error('Please select your skill level');
      }
      if (!formData.location) {
        throw new Error('Location is required');
      }

      const response = await updateProfile(formData);
      
      if (response.success) {
        onComplete(response.user);
        onClose();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: 20 }
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
          className="bg-white rounded-xl max-w-lg w-full max-h-[85vh] overflow-hidden shadow-xl"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-blue-600 px-4 py-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <SparklesIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Complete Your Profile</h2>
                  <p className="text-green-100 text-xs">Let's get you set up!</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-green-200 transition-colors p-1 hover:bg-white hover:bg-opacity-10 rounded-full"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 overflow-y-auto max-h-[calc(85vh-100px)]">

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
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Profile Image Section */}
              <div className="bg-gradient-to-br from-gray-50 to-green-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center space-x-2 mb-3">
                  <CameraIcon className="w-4 h-4 text-green-600" />
                  <h3 className="text-base font-semibold text-gray-900">Profile Picture</h3>
                </div>
                <ProfileImageUpload
                  currentImage={formData.avatar}
                  onImageChange={handleImageChange}
                  loading={loading}
                />
              </div>

              {/* Personal Information */}
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-center space-x-2 mb-4">
                  <UserIcon className="w-4 h-4 text-green-600" />
                  <h3 className="text-base font-semibold text-gray-900">Personal Information</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
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
                      value={user?.email || ''}
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

              {/* Sports Preferences */}
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="text-base font-semibold text-gray-900 mb-4">Sports Preferences</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Sports *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {sportsOptions.map((sport) => (
                      <button
                        key={sport}
                        type="button"
                        onClick={() => handleSportToggle(sport)}
                        className={`p-2 rounded-md border-2 transition-all text-xs font-medium ${
                          formData.preferredSports.includes(sport)
                            ? 'border-green-500 bg-green-50 text-green-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                        }`}
                      >
                        {sport}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Skill Level *
                  </label>
                  <select
                    name="skillLevel"
                    value={formData.skillLevel}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    required
                  >
                    <option value="">Select your skill level</option>
                    {skillLevels.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={logout}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm"
                  disabled={loading}
                >
                  Logout
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-md hover:from-green-700 hover:to-blue-700 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="w-4 h-4" />
                      <span>Complete Profile</span>
                    </>
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

export default ProfileCompletionModal; 