import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { OwnerDashboardNav } from '../../components/layout';
import { CardSkeleton } from '../../components/ui';
import turfService from '../../services/turfService';

const OwnerTurfsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [myTurfs, setMyTurfs] = useState([]);
  const [loadingTurfs, setLoadingTurfs] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const loadMyTurfs = useCallback(async () => {
    try {
      setLoadingTurfs(true);
      const response = await turfService.getMyTurfs();
      setMyTurfs(response.data || []);
    } catch (err) {
      console.error('Error loading turfs:', err);
      setError(`Failed to load your turfs: ${err.message}`);
    } finally {
      setLoadingTurfs(false);
    }
  }, []);

  // Load owner's turfs
  useEffect(() => {
    loadMyTurfs();
  }, [loadMyTurfs]);

  const handleEdit = (turf) => {
    navigate(`/owner/turfs/${turf._id}/edit`);
  };

  const handleDelete = async (turfId) => {
    const confirmed = window.confirm('Are you sure you want to delete this turf? This action cannot be undone.');
    if (!confirmed) return;

    try {
      setDeletingId(turfId);
      await turfService.deleteTurf(turfId);
      await loadMyTurfs();
    } catch (err) {
      console.error('Delete turf failed:', err);
      setError(err.message || 'Failed to delete turf');
    } finally {
      setDeletingId(null);
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
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              My Turfs
            </h1>
            <p className="text-gray-600">
              Manage and monitor all your turf listings in one place.
            </p>
          </div>

          {/* Turfs Grid */}
          <div className="bg-white rounded-xl shadow-lg p-6">
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
                  onClick={() => window.location.href = '/add-turf'}
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
                        {turf.location?.address || 'Location not specified'}
                      </p>
                      <p className="flex items-center">
                        <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                        ₹{turf.pricePerHour}/hour
                      </p>
                    </div>

                    <div className="flex space-x-2 mt-4">
                      <button onClick={() => handleEdit(turf)} className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(turf._id)} disabled={deletingId === turf._id} className={`flex-1 px-3 py-2 rounded text-sm transition-colors ${deletingId === turf._id ? 'bg-red-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'} text-white`}>
                        {deletingId === turf._id ? 'Deleting...' : 'Delete'}
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

export default OwnerTurfsPage;
