import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { XMarkIcon, BuildingOfficeIcon, PhoneIcon, MapPinIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { LocationInput, AddressInput } from '../forms';
import { ProfileImageUpload } from '../ui';

const OwnerProfileModal = ({ isOpen, onClose, onComplete }) => {
  const { user, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone === '0000000000' ? '' : (user?.phone || ''),
    businessName: user?.businessName || '',
    businessAddress: user?.businessAddress || '',
    businessPhone: user?.businessPhone || '',
    turfCount: user?.turfCount || '',
    location: user?.location || '',
    turfLocation: user?.turfLocation || '',
    avatar: user?.avatar || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate required fields for owners
      if (!formData.phone) {
        throw new Error('Phone number is required');
      }
      if (!formData.businessName) {
        throw new Error('Business name is required');
      }
      if (!formData.businessAddress) {
        throw new Error('Business address is required');
      }
      if (!formData.businessPhone) {
        throw new Error('Business phone number is required');
      }
      if (!formData.turfCount) {
        throw new Error('Please select the number of turfs you own');
      }
      if (!formData.location) {
        throw new Error('Personal location is required');
      }
      if (!formData.turfLocation) {
        throw new Error('Turf location is required');
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[85vh] overflow-y-auto">
        <div className="p-4">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-3">
              <BuildingOfficeIcon className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Business Profile Settings</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Profile Image Upload */}
            <ProfileImageUpload
              currentImage={formData.avatar}
              onImageChange={handleImageChange}
              loading={loading}
            />

            {/* Personal Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <PhoneIcon className="w-4 h-4 inline mr-1" />
                    Personal Phone *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+91 9876543210"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPinIcon className="w-4 h-4 inline mr-1" />
                    Personal Location *
                  </label>
                  <LocationInput
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="Your personal city/location"
                    required
                    className="w-full"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    🏠 Where you are personally based
                  </p>
                </div>
              </div>
            </div>

            {/* Business Information */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Business Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <BuildingOfficeIcon className="w-4 h-4 inline mr-1" />
                    Business Name *
                  </label>
                  <input
                    type="text"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Elite Sports Arena"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Address *
                  </label>
                  <AddressInput
                    name="businessAddress"
                    value={formData.businessAddress}
                    onChange={handleInputChange}
                    placeholder="Complete business address with landmarks"
                    required
                    rows={3}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPinIcon className="w-4 h-4 inline mr-1" />
                    Turf Location *
                  </label>
                  <LocationInput
                    name="turfLocation"
                    value={formData.turfLocation}
                    onChange={handleInputChange}
                    placeholder="Enter your turf's city/location"
                    required
                    className="w-full"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    📍 This is where your turf is located (customers will see this)
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <PhoneIcon className="w-4 h-4 inline mr-1" />
                      Business Phone *
                    </label>
                    <input
                      type="tel"
                      name="businessPhone"
                      value={formData.businessPhone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="+91 9876543210"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <ChartBarIcon className="w-4 h-4 inline mr-1" />
                      Number of Turfs *
                    </label>
                    <select
                      name="turfCount"
                      value={formData.turfCount}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select turf count</option>
                      <option value="1">1 Turf</option>
                      <option value="2-5">2-5 Turfs</option>
                      <option value="6-10">6-10 Turfs</option>
                      <option value="10+">10+ Turfs</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Saving...' : 'Save Business Profile'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OwnerProfileModal;
