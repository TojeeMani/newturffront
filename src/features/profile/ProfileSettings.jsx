import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  UserIcon,
  BuildingOfficeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CameraIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  ArrowLeftIcon,
  Cog6ToothIcon,
  HeartIcon
} from '@heroicons/react/24/outline';
import { LocationInput } from '../../components/forms';
import { ProfileImageUpload } from '../../components/ui';
import { FestivalSettings } from '../../components/common';
import toast from 'react-hot-toast';

const ProfileSettings = () => {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
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
    skillLevel: user?.skillLevel || ''
  });

  const sports = ['Football', 'Cricket', 'Basketball', 'Tennis', 'Badminton', 'Volleyball'];
  const skillLevels = ['Beginner', 'Intermediate', 'Advanced', 'Professional'];

  const tabs = user?.userType === 'owner'
    ? [
        { id: 'personal', name: 'Personal Info', icon: UserIcon, description: 'Basic personal information' },
        { id: 'preferences', name: 'Preferences', icon: Cog6ToothIcon, description: 'Account preferences' },
        { id: 'festivals', name: 'Festival Themes', icon: HeartIcon, description: 'Festival theme settings' }
      ]
    : [
        { id: 'personal', name: 'Personal Info', icon: UserIcon, description: 'Basic personal information' },
        { id: 'sports', name: 'Sports & Skills', icon: HeartIcon, description: 'Sports preferences and skill level' },
        { id: 'preferences', name: 'Preferences', icon: Cog6ToothIcon, description: 'Account preferences' },
        { id: 'festivals', name: 'Festival Themes', icon: HeartIcon, description: 'Festival theme settings' }
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
        skillLevel: user.skillLevel || ''
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

  const handleLocationChange = (e) => {
    const location = e.target ? e.target.value : e;
    setFormData(prev => ({
      ...prev,
      location: location
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
    if (user?.userType === 'player' && formData.preferredSports.length === 0) {
      setError('Please select at least one sport');
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
      console.log('🖼️ ProfileSettings - Submitting form data:', formData);
      const result = await updateProfile(formData);
      console.log('🖼️ ProfileSettings - Update result:', result);
      setSuccess('Profile updated successfully!');
      toast.success('Profile updated successfully!');
      
      // Navigate back after successful update
      setTimeout(() => {
        navigate(-1);
      }, 1000);
    } catch (error) {
      console.error('Profile update error:', error);
      setError(error.message || 'Failed to update profile');
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  const tabContentVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-gray-50"
    >
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5 mr-2" />
                <span className="text-sm font-medium">Back</span>
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Profile Settings</h1>
                <p className="text-sm text-gray-500">Manage your account information</p>
              </div>
            </div>
            
            {/* User Info */}
            <div className="flex items-center space-x-3">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt="Profile"
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {user?.firstName?.charAt(0) || 'U'}
                </div>
              )}
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.userType || 'Player'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <nav className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-start space-x-3 px-4 py-3 rounded-lg transition-all text-left ${
                    activeTab === tab.id
                      ? 'bg-blue-50 border border-blue-200 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  <tab.icon className={`w-5 h-5 mt-0.5 ${
                    activeTab === tab.id ? 'text-blue-600' : 'text-gray-400'
                  }`} />
                  <div>
                    <p className="font-medium">{tab.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{tab.description}</p>
                  </div>
                </button>
              ))}
            </nav>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              {/* Status Messages */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mx-6 mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center space-x-2"
                >
                  <ExclamationTriangleIcon className="w-5 h-5" />
                  <span>{error}</span>
                </motion.div>
              )}

              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mx-6 mt-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center space-x-2"
                >
                  <CheckCircleIcon className="w-5 h-5" />
                  <span>{success}</span>
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="p-6">
                <motion.div
                  key={activeTab}
                  variants={tabContentVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  transition={{ duration: 0.2 }}
                >
                  {activeTab === 'personal' && (
                    <div className="space-y-8">
                      {/* Profile Image Section */}
                      <div>
                        <div className="flex items-center space-x-3 mb-6">
                          <CameraIcon className="w-6 h-6 text-blue-600" />
                          <div>
                            <h2 className="text-xl font-semibold text-gray-900">Profile Picture</h2>
                            <p className="text-sm text-gray-500">Upload a professional profile photo</p>
                          </div>
                        </div>
                        <div className="bg-gray-50 p-6 rounded-lg">
                          <ProfileImageUpload
                            currentImage={formData.avatar}
                            onImageChange={handleImageChange}
                            loading={loading}
                          />
                        </div>
                      </div>

                      {/* Personal Information */}
                      <div>
                        <div className="flex items-center space-x-3 mb-6">
                          <UserIcon className="w-6 h-6 text-blue-600" />
                          <div>
                            <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
                            <p className="text-sm text-gray-500">Your basic contact information</p>
                          </div>
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
                              value={user?.email || ''}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                              disabled
                            />
                            <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                          </div>

                          <div className="md:col-span-2">
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
                      </div>
                    </div>
                  )}

                  {activeTab === 'sports' && user?.userType === 'player' && (
                    <div className="space-y-8">
                      {/* Sports Preferences */}
                      <div>
                        <div className="flex items-center space-x-3 mb-6">
                          <HeartIcon className="w-6 h-6 text-blue-600" />
                          <div>
                            <h2 className="text-xl font-semibold text-gray-900">Sports Preferences</h2>
                            <p className="text-sm text-gray-500">Select your favorite sports and skill level</p>
                          </div>
                        </div>

                        <div className="space-y-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-4">
                              Preferred Sports *
                            </label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                              {sports.map((sport) => (
                                <button
                                  key={sport}
                                  type="button"
                                  onClick={() => handleSportToggle(sport)}
                                  className={`p-4 rounded-lg border-2 transition-all text-sm font-medium ${
                                    formData.preferredSports.includes(sport)
                                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                                      : 'border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50'
                                  }`}
                                >
                                  {sport}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Skill Level *
                            </label>
                            <select
                              name="skillLevel"
                              value={formData.skillLevel}
                              onChange={handleInputChange}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                      </div>
                    </div>
                  )}



                  {activeTab === 'preferences' && (
                    <div className="space-y-8">
                      {/* Account Preferences */}
                      <div>
                        <div className="flex items-center space-x-3 mb-6">
                          <Cog6ToothIcon className="w-6 h-6 text-blue-600" />
                          <div>
                            <h2 className="text-xl font-semibold text-gray-900">Account Preferences</h2>
                            <p className="text-sm text-gray-500">Customize your account settings</p>
                          </div>
                        </div>

                        {user?.userType === 'owner' && (
                          <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg mb-6">
                            <div className="flex items-start space-x-3">
                              <BuildingOfficeIcon className="w-6 h-6 text-blue-600 mt-1" />
                              <div>
                                <h3 className="text-lg font-medium text-blue-900 mb-2">Manage Your Turfs</h3>
                                <p className="text-blue-700 mb-4">
                                  To edit your turf details, business information, and manage your turf listings,
                                  please visit the "My Turfs" section in your dashboard.
                                </p>
                                <button
                                  onClick={() => navigate('/owner-dashboard')}
                                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                                >
                                  <BuildingOfficeIcon className="w-4 h-4 mr-2" />
                                  Go to My Turfs
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="bg-gray-50 p-6 rounded-lg">
                          <div className="text-center text-gray-500">
                            <Cog6ToothIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Coming Soon</h3>
                            <p>Additional preferences and settings will be available here.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'festivals' && (
                    <div className="space-y-8">
                      <div>
                        <div className="flex items-center space-x-3 mb-6">
                          <HeartIcon className="w-6 h-6 text-blue-600" />
                          <div>
                            <h2 className="text-xl font-semibold text-gray-900">Festival Themes</h2>
                            <p className="text-sm text-gray-500">View and manage festival theme settings</p>
                          </div>
                        </div>
                        <FestivalSettings />
                      </div>
                    </div>
                  )}
                </motion.div>

                {/* Save Button */}
                <div className="flex justify-end pt-6 border-t border-gray-200 mt-8">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="w-4 h-4" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProfileSettings;
