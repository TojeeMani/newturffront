import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Navigation } from '../components/layout';
import {
  UserIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  ArrowLeftIcon,
  HeartIcon
} from '@heroicons/react/24/outline';
import { LocationInput } from '../components/forms';
import { ProfileImageUpload } from '../components/ui';
import toast from 'react-hot-toast';

const ProfilePage = () => {
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

  // Define tabs based on user type - only personal information
  const getTabsForUserType = () => {
    const baseTabs = [
      { id: 'personal', name: 'Personal Info', icon: UserIcon, description: 'Basic personal information' }
    ];

    if (user?.userType === 'player') {
      return [
        ...baseTabs,
        { id: 'sports', name: 'Sports Preferences', icon: HeartIcon, description: 'Your favorite sports and skill level' }
      ];
    }

    // For owners and admins, only show personal info
    return baseTabs;
  };

  const tabs = getTabsForUserType();

  useEffect(() => {
    if (user) {
      // Handle location properly - it might be an object or string
      let locationValue = '';
      if (user.location) {
        if (typeof user.location === 'string') {
          locationValue = user.location;
        } else if (typeof user.location === 'object') {
          locationValue = user.location.address || user.location.formatted || user.location.display || '';
        }
      }

      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone === '0000000000' ? '' : (user.phone || ''),
        email: user.email || '',
        avatar: user.avatar || '',
        location: locationValue,
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
    setError('');
    setSuccess('');
  };

  const handleSportsChange = (sport) => {
    setFormData(prev => ({
      ...prev,
      preferredSports: prev.preferredSports.includes(sport)
        ? prev.preferredSports.filter(s => s !== sport)
        : [...prev.preferredSports, sport]
    }));
  };

  const handleLocationChange = (locationOrEvent) => {
    // Handle both direct location string and event object
    let locationValue = '';
    if (typeof locationOrEvent === 'string') {
      locationValue = locationOrEvent;
    } else if (locationOrEvent && locationOrEvent.target) {
      locationValue = locationOrEvent.target.value;
    }

    setFormData(prev => ({
      ...prev,
      location: locationValue
    }));
  };

  const handleImageChange = (imageUrl) => {
    setFormData(prev => ({
      ...prev,
      avatar: imageUrl
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      console.log('🖼️ ProfilePage - Submitting form data:', formData);
      const result = await updateProfile(formData);
      console.log('🖼️ ProfilePage - Update result:', result);
      setSuccess('Profile updated successfully!');
      toast.success('Profile updated successfully!');
      setError('');
    } catch (error) {
      console.error('Profile update error:', error);
      setError(error.message || 'Failed to update profile');
      toast.error(error.message || 'Failed to update profile');
      setSuccess('');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <ArrowLeftIcon className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Profile Settings
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Manage your personal information
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1"
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt={`${user.firstName} ${user.lastName}`}
                        className="w-12 h-12 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {user?.firstName} {user?.lastName}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                      {user?.userType}
                    </p>
                  </div>
                </div>
              </div>
              
              <nav className="p-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                        : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                  >
                    <tab.icon className="h-5 w-5" />
                    <div>
                      <div className="font-medium">{tab.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {tab.description}
                      </div>
                    </div>
                  </button>
                ))}
              </nav>
            </div>
          </motion.div>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-3"
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
              <form onSubmit={handleSubmit}>
                <div className="p-6">
                  {/* Personal Info Tab */}
                  {activeTab === 'personal' && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                          Personal Information
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                          Update your basic personal information and profile picture.
                        </p>
                      </div>

                      {/* Profile Picture */}
                      <div className="flex items-center space-x-6">
                        <div className="relative">
                          {formData.avatar ? (
                            <img
                              src={formData.avatar}
                              alt="Profile"
                              className="w-24 h-24 rounded-full object-cover border-4 border-gray-200 dark:border-gray-600"
                            />
                          ) : (
                            <div className="w-24 h-24 bg-gradient-to-r from-primary-500 to-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-semibold">
                              {formData.firstName?.charAt(0)}{formData.lastName?.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <ProfileImageUpload
                            currentImage={formData.avatar}
                            onImageChange={handleImageChange}
                            className="mb-2"
                          />
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Upload a profile picture. Recommended size: 400x400px
                          </p>
                        </div>
                      </div>

                      {/* Name Fields */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            First Name *
                          </label>
                          <input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="Enter your first name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Last Name *
                          </label>
                          <input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="Enter your last name"
                          />
                        </div>
                      </div>

                      {/* Contact Information */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            <EnvelopeIcon className="h-4 w-4 inline mr-1" />
                            Email Address
                          </label>
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            disabled
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Email cannot be changed
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            <PhoneIcon className="h-4 w-4 inline mr-1" />
                            Phone Number
                          </label>
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="Enter your phone number"
                          />
                        </div>
                      </div>

                      {/* Location */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          <MapPinIcon className="h-4 w-4 inline mr-1" />
                          Location
                        </label>
                        <LocationInput
                          value={formData.location}
                          onChange={handleLocationChange}
                          placeholder="Enter your location"
                          className="w-full"
                        />
                      </div>
                    </div>
                  )}

                  {/* Sports Preferences Tab (Player only) */}
                  {activeTab === 'sports' && user?.userType === 'player' && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                          Sports Preferences
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                          Tell us about your favorite sports and skill level.
                        </p>
                      </div>

                      {/* Preferred Sports */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                          Preferred Sports
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {sports.map((sport) => (
                            <label
                              key={sport}
                              className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                                formData.preferredSports.includes(sport)
                                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                  : 'border-gray-300 dark:border-gray-600 hover:border-primary-300'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={formData.preferredSports.includes(sport)}
                                onChange={() => handleSportsChange(sport)}
                                className="sr-only"
                              />
                              <span className={`text-sm font-medium ${
                                formData.preferredSports.includes(sport)
                                  ? 'text-primary-700 dark:text-primary-400'
                                  : 'text-gray-700 dark:text-gray-300'
                              }`}>
                                {sport}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Skill Level */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Skill Level
                        </label>
                        <select
                          name="skillLevel"
                          value={formData.skillLevel}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                  )}





                  {/* Error and Success Messages */}
                  {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                      <div className="flex items-center">
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
                        <p className="text-red-700 dark:text-red-400">{error}</p>
                      </div>
                    </div>
                  )}

                  {success && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                      <div className="flex items-center">
                        <CheckCircleIcon className="h-5 w-5 text-green-400 mr-2" />
                        <p className="text-green-700 dark:text-green-400">{success}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 rounded-b-xl">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Make sure all information is accurate before saving.
                    </p>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
