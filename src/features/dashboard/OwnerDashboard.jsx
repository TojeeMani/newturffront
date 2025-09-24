import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { OwnerDashboardNav } from '../../components/layout';
import { CardSkeleton, LoadingSpinner } from '../../components/ui';
import turfService from '../../services/turfService';
import {
  BuildingOfficeIcon,
  CalendarIcon,
  CurrencyRupeeIcon,
  ChartBarIcon,
  EyeIcon,
  StarIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  ClockIcon,
  MapPinIcon,
  PhotoIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';



const OwnerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [myTurfs, setMyTurfs] = useState([]);
  const [loadingTurfs, setLoadingTurfs] = useState(true);
  const [dashboardStats, setDashboardStats] = useState({
    totalTurfs: 0,
    activeTurfs: 0,
    pendingApproval: 0,
    totalBookings: 0,
    monthlyRevenue: 0,
    averageRating: 0,
    totalViews: 0,
    recentBookings: []
  });



  // Load owner's turfs
  useEffect(() => {
    const loadMyTurfs = async () => {
      try {
        setLoadingTurfs(true);

        // Debug: Check authentication
        const token = localStorage.getItem('token');
        console.log('🔍 Debug - Token exists:', !!token);
        console.log('🔍 Debug - User from context:', user);

        if (!token) {
          throw new Error('No authentication token found. Please login again.');
        }

        console.log('🔍 Debug - Making API call to getMyTurfs...');
        const response = await turfService.getMyTurfs();
        console.log('🔍 Debug - API response:', response);
        const turfs = response.data || [];
        setMyTurfs(turfs);

        // Calculate dashboard statistics
        const stats = {
          totalTurfs: turfs.length,
          activeTurfs: turfs.filter(turf => turf.isApproved).length,
          pendingApproval: turfs.filter(turf => !turf.isApproved).length,
          totalBookings: Math.floor(Math.random() * 150) + 50, // Mock data
          monthlyRevenue: Math.floor(Math.random() * 50000) + 10000, // Mock data
          averageRating: (Math.random() * 2 + 3).toFixed(1), // Mock data between 3-5
          totalViews: Math.floor(Math.random() * 1000) + 200, // Mock data
          recentBookings: [] // Mock data
        };
        setDashboardStats(stats);
      } catch (err) {
        console.error('❌ Error loading turfs:', err);
        setError(`Failed to load your turfs: ${err.message}`);
      } finally {
        setLoadingTurfs(false);
      }
    };

    loadMyTurfs();
  }, []);

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);
    
    try {
      // Validate turf data
      const validation = turfService.validateTurfData(turf);
      if (!validation.isValid) {
        setError(validation.errors.join(', '));
        return;
      }

      // Upload images first if they are File objects
      let imageUrls = [];
      if (turf.images && turf.images.length > 0) {
        try {
          // Check if images are File objects (need to upload) or URLs (already uploaded)
          const filesToUpload = turf.images.filter(img => img instanceof File);
          const existingUrls = turf.images.filter(img => typeof img === 'string');
          
          if (filesToUpload.length > 0) {
            console.log('📤 Uploading images to Cloudinary...');
            const uploadResult = await turfService.uploadImages(filesToUpload);
            
            if (uploadResult.success) {
              imageUrls = [...existingUrls, ...uploadResult.data.images.map(img => img.url)];
              console.log(`✅ Uploaded ${uploadResult.data.totalUploaded} images`);
            } else {
              throw new Error('Failed to upload images');
            }
          } else {
            imageUrls = existingUrls;
          }
        } catch (uploadError) {
          console.error('❌ Image upload error:', uploadError);
          setError('Failed to upload images. Please try again.');
          return;
        }
      }

      // Format turf data for API with image URLs
      const formattedData = turfService.formatTurfData({
        ...turf,
        images: imageUrls
      });
      
      // Create turf via API
      await turfService.createTurf(formattedData);

      setSuccess('Turf added successfully! It is now live and visible to users.');
      setTurf(initialTurfState);
      setShowAddTurf(false);
      
      // Reload turfs list
      const turfsResponse = await turfService.getMyTurfs();
      setMyTurfs(turfsResponse.data || []);
    } catch (err) {
      setError(err.message || 'Failed to add turf. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      <OwnerDashboardNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Welcome Message */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome back, {user?.firstName}! 👋
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your turf business and track your performance from your dashboard.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Turfs */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Turfs</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{dashboardStats.totalTurfs}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">All your properties</p>
                </div>
                <div className="p-3 bg-primary-100 dark:bg-primary-900/20 rounded-lg">
                  <BuildingOfficeIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                </div>
              </div>
            </motion.div>

            {/* Active Turfs */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Turfs</p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">{dashboardStats.activeTurfs}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Currently live</p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </motion.div>

            {/* Pending Approval */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Approval</p>
                  <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{dashboardStats.pendingApproval}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Awaiting review</p>
                </div>
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                  <ClockIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </motion.div>

            {/* Monthly Revenue */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Monthly Revenue</p>
                  <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">₹{dashboardStats.monthlyRevenue?.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">This month</p>
                </div>
                <div className="p-3 bg-primary-100 dark:bg-primary-900/20 rounded-lg">
                  <CurrencyRupeeIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Quick Actions */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-8"
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button 
                onClick={() => navigate('/enhanced-add-turf')}
                className="flex items-center p-4 bg-primary-50 dark:bg-primary-900/10 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/20 transition-all duration-300 group border border-primary-200 dark:border-primary-800"
              >
                <PlusIcon className="h-5 w-5 text-primary-600 dark:text-primary-400 mr-3 group-hover:scale-110 transition-transform" />
                <div className="text-left">
                  <span className="text-primary-700 dark:text-primary-300 font-medium block">Add New Turf</span>
                  <span className="text-primary-600 dark:text-primary-400 text-sm">Create a new listing</span>
                </div>
              </button>
              <button className="flex items-center p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-all duration-300 group border border-blue-200 dark:border-blue-800">
                <ChartBarIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-3 group-hover:scale-110 transition-transform" />
                <div className="text-left">
                  <span className="text-blue-700 dark:text-blue-300 font-medium block">View Analytics</span>
                  <span className="text-blue-600 dark:text-blue-400 text-sm">Business insights</span>
                </div>
              </button>
              <button className="flex items-center p-4 bg-green-50 dark:bg-green-900/10 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/20 transition-all duration-300 group border border-green-200 dark:border-green-800">
                <CalendarIcon className="h-5 w-5 text-green-600 dark:text-green-400 mr-3 group-hover:scale-110 transition-transform" />
                <div className="text-left">
                  <span className="text-green-700 dark:text-green-300 font-medium block">Manage Bookings</span>
                  <span className="text-green-600 dark:text-green-400 text-sm">View reservations</span>
                </div>
              </button>
            </div>
          </motion.div>

          {/* My Turfs Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Turfs</h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Manage and monitor your turf listings</p>
              </div>
              <button
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
                onClick={() => navigate('/enhanced-add-turf')}
              >
                <PlusIcon className="h-4 w-4" />
                <span>Add New Turf</span>
              </button>
            </div>

            {loadingTurfs ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, index) => (
                  <CardSkeleton key={index} />
                ))}
              </div>
            ) : myTurfs.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center py-12"
              >
                <div className="text-gray-400 dark:text-gray-500 mb-6">
                  <BuildingOfficeIcon className="h-20 w-20 mx-auto" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">No turfs yet</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  Start by adding your first turf to begin accepting bookings and growing your business.
                </p>
                <button
                  className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2 mx-auto"
                  onClick={() => navigate('/enhanced-add-turf')}
                >
                  <PlusIcon className="h-5 w-5" />
                  <span>Add Your First Turf</span>
                </button>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myTurfs.map((turf, index) => (
                  <motion.div 
                    key={turf._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 * index }}
                    className="bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden hover:shadow-lg transition-all duration-300 group"
                  >
                    {/* Turf Image */}
                    <div className="relative h-48 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800">
                      {turf.images && turf.images.length > 0 ? (
                        <img 
                          src={turf.images[0]} 
                          alt={turf.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <PhotoIcon className="h-12 w-12 text-primary-400" />
                        </div>
                      )}
                      <div className="absolute top-3 right-3">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full backdrop-blur-sm ${
                          turf.isApproved 
                            ? 'bg-green-100/90 text-green-800 border border-green-200' 
                            : 'bg-yellow-100/90 text-yellow-800 border border-yellow-200'
                        }`}>
                          {turf.isApproved ? '✓ Approved' : '⏳ Pending'}
                        </span>
                      </div>
                    </div>

                    {/* Turf Content */}
                    <div className="p-5">
                      <div className="mb-4">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                          {turf.name}
                        </h3>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center text-gray-600 dark:text-gray-400">
                            <MapPinIcon className="h-4 w-4 mr-2 text-gray-400" />
                            <span className="truncate">{turf.location?.address || 'Address not available'}</span>
                          </div>
                          <div className="flex items-center text-gray-600 dark:text-gray-400">
                            <CurrencyRupeeIcon className="h-4 w-4 mr-2 text-gray-400" />
                            <span className="font-semibold text-primary-600 dark:text-primary-400">₹{turf.pricePerHour}/hour</span>
                          </div>
                          <div className="flex items-center text-gray-600 dark:text-gray-400">
                            <PhotoIcon className="h-4 w-4 mr-2 text-gray-400" />
                            <span>{turf.images?.length || 0} image{(turf.images?.length || 0) !== 1 ? 's' : ''}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex space-x-2">
                        <button className="flex-1 bg-primary-600 hover:bg-primary-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center space-x-1">
                          <PencilIcon className="h-4 w-4" />
                          <span>Edit</span>
                        </button>
                        <button className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center space-x-1">
                          <TrashIcon className="h-4 w-4" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default OwnerDashboard;