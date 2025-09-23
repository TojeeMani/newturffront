import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserProfile } from '../common';
import { CompactThemeToggle } from '../ui';
import { ProfileCompletionModal, OwnerProfileModal } from '../modals';
import {
  Bars3Icon,
  XMarkIcon,
  ArrowRightStartOnRectangleIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  HomeIcon,
  BuildingOfficeIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

const Navigation = () => {
  const { user, isAuthenticated, needsProfileCompletion, logout } = useAuth();
  const navigate = useNavigate();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const location = useLocation();

  // Debug user avatar
  console.log('🖼️ Navigation Debug - User avatar:', user?.avatar);
  console.log('🖼️ Navigation Debug - User data:', user);

  const handleProfileComplete = (updatedUser) => {
    setShowProfileModal(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      setIsUserMenuOpen(false);
      setIsMobileMenuOpen(false);
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const scrollToSection = (sectionId) => {
    setIsMobileMenuOpen(false);
    if (location.pathname === '/') {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/', { state: { scrollTo: sectionId } });
    }
  };

  const getDashboardRoute = () => {
    switch (user?.userType) {
      case 'admin':
        return '/admin-dashboard';
      case 'owner':
        return '/owner-dashboard';
      case 'player':
        return '/player-dashboard';
      default:
        return '/';
    }
  };

  // Redirect to profile page if user needs to complete profile (except owners who stay on dashboard)
  React.useEffect(() => {
    if (needsProfileCompletion && isAuthenticated && user?.userType !== 'owner' && location.pathname !== '/profile' && location.pathname !== '/profile/settings') {
      navigate('/profile');
    }
  }, [needsProfileCompletion, isAuthenticated, user?.userType, navigate, location.pathname]);

  return (
    <>
      <nav className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-sm border-b border-gray-200 dark:border-gray-700 fixed top-0 left-0 right-0 z-50 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="text-2xl font-bold gradient-text">
                TurfEase
              </Link>
            </div>

            {/* Navigation Links - Only show for players/guests */}
            {(!user || user.userType === 'player') && (
              <div className="hidden md:flex items-center space-x-8">
                <button
                  onClick={() => scrollToSection('turfs')}
                  className="text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  Turfs
                </button>
                <button
                  onClick={() => scrollToSection('matches')}
                  className="text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  Live Matches
                </button>
                <button
                  onClick={() => scrollToSection('tournaments')}
                  className="text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  Tournaments
                </button>
                <button
                  onClick={() => scrollToSection('how-it-works')}
                  className="text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  How It Works
                </button>
              </div>
            )}

            {/* Desktop Auth Section */}
            <div className="hidden md:flex items-center space-x-4">
              {/* Theme Toggle */}
              <CompactThemeToggle />

              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
                  >
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt={`${user.firstName} ${user.lastName}`}
                        className="w-8 h-8 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div
                      className={`w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold ${user?.avatar ? 'hidden' : ''}`}
                    >
                      {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                        {user?.userType}
                      </p>
                    </div>
                  </button>

                  {/* User Dropdown Menu */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {user?.firstName} {user?.lastName}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {user?.email}
                        </p>
                      </div>

                      <div className="py-2">
                        <button
                          onClick={() => {
                            navigate(getDashboardRoute());
                            setIsUserMenuOpen(false);
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                        >
                          <HomeIcon className="w-4 h-4 mr-3" />
                          Dashboard
                        </button>

                        {/* Removed My Matches from dropdown as requested */}

                        {user?.userType === 'owner' && (
                          <button
                            onClick={() => {
                              navigate('/add-turf');
                              setIsUserMenuOpen(false);
                            }}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                          >
                            <BuildingOfficeIcon className="w-4 h-4 mr-3" />
                            Add Turf
                          </button>
                        )}

                        <button
                          onClick={() => {
                            navigate('/profile');
                            setIsUserMenuOpen(false);
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                        >
                          <UserCircleIcon className="w-4 h-4 mr-3" />
                          Profile Settings
                        </button>
                      </div>

                      <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
                        >
                          <ArrowRightStartOnRectangleIcon className="w-4 h-4 mr-3" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link
                    to="/login"
                    className="text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="bg-green-600 dark:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 dark:hover:bg-green-600 transition-colors duration-200"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center space-x-2">
              <CompactThemeToggle />
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-md text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
              >
                {isMobileMenuOpen ? (
                  <XMarkIcon className="w-6 h-6" />
                ) : (
                  <Bars3Icon className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
            <div className="px-4 py-4 space-y-3">
              {/* Navigation Links - Only show for players/guests */}
              {(!user || user.userType === 'player') && (
                <>
                  <button
                    onClick={() => scrollToSection('turfs')}
                    className="block w-full text-left px-3 py-2 text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors duration-200"
                  >
                    Turfs
                  </button>
                  <button
                    onClick={() => scrollToSection('matches')}
                    className="block w-full text-left px-3 py-2 text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors duration-200"
                  >
                    Live Matches
                  </button>
                  <button
                    onClick={() => scrollToSection('tournaments')}
                    className="block w-full text-left px-3 py-2 text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors duration-200"
                  >
                    Tournaments
                  </button>
                  <button
                    onClick={() => scrollToSection('how-it-works')}
                    className="block w-full text-left px-3 py-2 text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors duration-200"
                  >
                    How It Works
                  </button>
                </>
              )}

              {/* Auth Section */}
              {isAuthenticated ? (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                  <div className="flex items-center space-x-3 px-3 py-2 mb-3">
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt={`${user.firstName} ${user.lastName}`}
                        className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div
                      className={`w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold ${user?.avatar ? 'hidden' : ''}`}
                    >
                      {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                        {user?.userType}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      navigate(getDashboardRoute());
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors duration-200"
                  >
                    <HomeIcon className="w-4 h-4 mr-3" />
                    Dashboard
                  </button>

                  {user?.userType === 'owner' && (
                    <button
                      onClick={() => {
                        navigate('/add-turf');
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex items-center w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors duration-200 mt-1"
                    >
                      <BuildingOfficeIcon className="w-4 h-4 mr-3" />
                      Add Turf
                    </button>
                  )}

                  <button
                    onClick={() => {
                      navigate('/profile');
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors duration-200 mt-1"
                  >
                    <UserCircleIcon className="w-4 h-4 mr-3" />
                    Profile Settings
                  </button>

                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors duration-200 mt-3"
                  >
                    <ArrowRightStartOnRectangleIcon className="w-4 h-4 mr-3" />
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4 space-y-3">
                  <Link
                    to="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block w-full text-center px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 border border-gray-300 dark:border-gray-600 rounded-md transition-colors duration-200"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block w-full text-center px-4 py-2 bg-green-600 dark:bg-green-700 text-white rounded-md hover:bg-green-700 dark:hover:bg-green-600 transition-colors duration-200"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Click outside handlers */}
      {isUserMenuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsUserMenuOpen(false)}
        />
      )}

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

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
    </>
  );
};

export default Navigation;
