import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  ChevronDownIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
  UserIcon,
  HomeIcon
} from '@heroicons/react/24/outline';
import { getDashboardRoute } from '../../utils/dashboardRoutes';
import { ProfileCompletionModal, OwnerProfileModal } from '../modals';

const UserProfile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsDropdownOpen(false);
  };

  const handleProfileComplete = (updatedUser) => {
    // The AuthContext will handle updating the user state
    setShowProfileModal(false);
  };

  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return user?.email?.[0]?.toUpperCase() || 'U';
  };

  const getDisplayName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user?.email || 'User';
  };

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
        >
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt="Profile"
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
              {getInitials()}
            </div>
          )}
          <span className="hidden md:block text-sm font-medium text-gray-700">
            {getDisplayName()}
          </span>
          <ChevronDownIcon className="w-4 h-4 text-gray-500" />
        </button>

        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
            {/* Enhanced User Info Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-100">
              <div className="flex items-center space-x-4">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt="Profile"
                    className="w-12 h-12 rounded-xl object-cover shadow-md border-2 border-white"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-semibold shadow-md">
                    {getInitials()}
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-base font-semibold text-gray-900">
                    {getDisplayName()}
                  </p>
                  <p className="text-sm text-gray-600">{user?.email}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      user?.userType === 'owner'
                        ? 'bg-purple-100 text-purple-800'
                        : user?.userType === 'admin'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {user?.userType === 'owner' ? '🏢 Owner' : user?.userType === 'admin' ? '⚙️ Admin' : '⚽ Football Player'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Menu */}
            <div className="px-6 py-4">
              <div className="space-y-1">
                <button
                  onClick={() => {
                    navigate('/');
                    setIsDropdownOpen(false);
                  }}
                  className="flex items-center w-full px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-all duration-200 group"
                >
                  <div className="w-8 h-8 bg-gray-100 group-hover:bg-blue-100 rounded-lg flex items-center justify-center mr-3 transition-colors duration-200">
                    <HomeIcon className="w-4 h-4 text-gray-600 group-hover:text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Home</p>
                    <p className="text-xs text-gray-500">Back to homepage</p>
                  </div>
                </button>

                {user?.userType !== 'admin' && (
                  <button
                    onClick={() => {
                      navigate('/profile/settings');
                      setIsDropdownOpen(false);
                    }}
                    className="flex items-center w-full px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-all duration-200 group"
                  >
                    <div className="w-8 h-8 bg-gray-100 group-hover:bg-purple-100 rounded-lg flex items-center justify-center mr-3 transition-colors duration-200">
                      <UserIcon className="w-4 h-4 text-gray-600 group-hover:text-purple-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Profile Settings</p>
                      <p className="text-xs text-gray-500">Update your information</p>
                    </div>
                  </button>
                )}

                {user?.userType !== 'admin' && (
                  <button
                    onClick={() => {
                      const dashboardRoute = getDashboardRoute(user?.userType);
                      navigate(dashboardRoute);
                      setIsDropdownOpen(false);
                    }}
                    className="flex items-center w-full px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-all duration-200 group"
                  >
                    <div className="w-8 h-8 bg-gray-100 group-hover:bg-green-100 rounded-lg flex items-center justify-center mr-3 transition-colors duration-200">
                      <Cog6ToothIcon className="w-4 h-4 text-gray-600 group-hover:text-green-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Dashboard</p>
                      <p className="text-xs text-gray-500">Your control panel</p>
                    </div>
                  </button>
                )}

                {user?.userType === 'admin' && (
                  <button
                    onClick={() => {
                      navigate('/admin');
                      setIsDropdownOpen(false);
                    }}
                    className="flex items-center w-full px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-all duration-200 group"
                  >
                    <div className="w-8 h-8 bg-gray-100 group-hover:bg-red-100 rounded-lg flex items-center justify-center mr-3 transition-colors duration-200">
                      <Cog6ToothIcon className="w-4 h-4 text-gray-600 group-hover:text-red-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Admin Dashboard</p>
                      <p className="text-xs text-gray-500">System administration</p>
                    </div>
                  </button>
                )}
              </div>
            </div>

            {/* Logout Section */}
            <div className="px-6 py-4 border-t border-gray-100">
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 group"
              >
                <div className="w-8 h-8 bg-red-50 group-hover:bg-red-100 rounded-lg flex items-center justify-center mr-3 transition-colors duration-200">
                  <ArrowRightOnRectangleIcon className="w-4 h-4 text-red-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Logout</p>
                  <p className="text-xs text-red-400">Sign out of your account</p>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Profile Modal - Different for Owners vs Players */}
      {user?.userType === 'owner' ? (
        <OwnerProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          onComplete={handleProfileComplete}
        />
      ) : (
        <ProfileCompletionModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          onComplete={handleProfileComplete}
        />
      )}

      {/* Click outside to close dropdown */}
      {isDropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </>
  );
};

export default UserProfile; 