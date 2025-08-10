import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserProfile } from '../common';
import { ProfileCompletionModal, OwnerProfileModal } from '../modals';

const Navigation = () => {
  const { user, isAuthenticated, needsProfileCompletion } = useAuth();
  const navigate = useNavigate();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const location = useLocation();

  const handleProfileComplete = (updatedUser) => {
    setShowProfileModal(false);
  };

  const scrollToSection = (sectionId) => {
    if (location.pathname === '/') {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/', { state: { scrollTo: sectionId } });
    }
  };

  // Redirect to profile settings page if user needs to complete profile
  React.useEffect(() => {
    if (needsProfileCompletion && isAuthenticated && location.pathname !== '/profile/settings') {
      navigate('/profile/settings');
    }
  }, [needsProfileCompletion, isAuthenticated, navigate, location.pathname]);

  return (
    <>
      <nav className="bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="text-2xl font-bold gradient-text">
                TurfEase
              </Link>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <button
                onClick={() => scrollToSection('turfs')}
                className="text-gray-700 hover:text-green-600 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
              >
                Turfs
              </button>
              <button
                onClick={() => scrollToSection('matches')}
                className="text-gray-700 hover:text-green-600 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
              >
                Live Matches
              </button>
              <button
                onClick={() => scrollToSection('tournaments')}
                className="text-gray-700 hover:text-green-600 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
              >
                Tournaments
              </button>
              <button
                onClick={() => scrollToSection('how-it-works')}
                className="text-gray-700 hover:text-green-600 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
              >
                How It Works
              </button>
            </div>

            {/* Auth Section */}
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <UserProfile />
              ) : (
                <div className="flex items-center space-x-3">
                  <Link
                    to="/login"
                    className="text-gray-700 hover:text-green-600 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors duration-200"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

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
