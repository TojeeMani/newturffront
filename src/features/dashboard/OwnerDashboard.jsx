import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { DashboardHeader } from '../../components/layout';
import { CardSkeleton, LoadingSpinner } from '../../components/ui';
import turfService from '../../services/turfService';



const OwnerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [myTurfs, setMyTurfs] = useState([]);
  const [loadingTurfs, setLoadingTurfs] = useState(true);



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
        setMyTurfs(response.data || []);
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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50">
      <DashboardHeader title="Turf Owner Dashboard" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Welcome Message */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {user?.firstName}! 👋
            </h1>
            <p className="text-gray-600">
              Manage your turf business and track your performance from your dashboard.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Manage Turfs</h3>
              <p className="text-gray-600 mb-4">Add, edit, and manage your turf listings.</p>
              <button className="btn-primary w-full" onClick={() => navigate('/add-turf')}>Add Turf</button>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Bookings</h3>
              <p className="text-gray-600 mb-4">View and manage incoming bookings.</p>
              <button className="btn-primary w-full">View Bookings</button>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Analytics</h3>
              <p className="text-gray-600 mb-4">Track your business performance and earnings.</p>
              <button className="btn-primary w-full">View Analytics</button>
            </div>
          </div>

          {/* My Turfs Section */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">My Turfs</h2>
              <button
                className="btn-primary"
                onClick={() => navigate('/add-turf')}
              >
                Add New Turf
              </button>
            </div>

            {loadingTurfs ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, index) => (
                  <CardSkeleton key={index} />
                ))}
              </div>
            ) : myTurfs.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-4">
                  <svg className="h-16 w-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No turfs yet</h3>
                <p className="text-gray-600 mb-4">Start by adding your first turf to begin accepting bookings.</p>
                <button
                  className="btn-primary"
                  onClick={() => navigate('/add-turf')}
                >
                  Add Your First Turf
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myTurfs.map((turf) => (
                  <div key={turf._id} className="bg-gray-50 rounded-lg p-4 border">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold text-gray-900">{turf.name}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        turf.isApproved 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {turf.isApproved ? 'Approved' : 'Pending'}
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      <p className="flex items-center">
                        <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {turf.location.address}
                      </p>
                      <p className="flex items-center">
                        <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                        ₹{turf.pricePerHour}/hour
                      </p>
                      <p className="flex items-center">
                        <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {turf.images.length} image{turf.images.length !== 1 ? 's' : ''}
                      </p>
                    </div>

                    <div className="flex space-x-2 mt-4">
                      <button className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors">
                        Edit
                      </button>
                      <button className="flex-1 bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700 transition-colors">
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default OwnerDashboard;