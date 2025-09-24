import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { OwnerDashboardNav } from '../../components/layout';
import { CardSkeleton, LoadingSpinner } from '../../components/ui';
import turfService from '../../services/turfService';
import {
  ChartBarIcon, 
  ClockIcon, 
  StarIcon, 
  ArrowTrendingUpIcon, 
  CalendarIcon, 
  CurrencyDollarIcon,
  LightBulbIcon,
  CurrencyRupeeIcon,
  ArrowTrendingDownIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';

const OwnerAnalyticsPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');

  const periods = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
    { value: '1y', label: 'Last year' }
  ];

  useEffect(() => {
    loadAnalytics();
  }, [selectedPeriod]);

  // Add new state for AI insights
  const [aiInsights, setAiInsights] = useState(null);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Current user data:', user);
      
      if (!user) {
        setError('Please login to view analytics');
        setLoading(false);
        return;
      }

      // Check if user has owner role
      if (user.userType !== 'owner') {
        setError('Only turf owners can view analytics. Please login as an owner account.');
        setLoading(false);
        return;
      }

      const data = await turfService.getOwnerAnalytics(selectedPeriod);
      console.log('Analytics data received:', data);
      console.log('Analytics data type:', typeof data);
      console.log('Analytics data keys:', Object.keys(data));
      console.log('Analytics summary:', data?.summary);
      
      if (!data || !data.summary) {
        console.warn('Analytics data is empty or missing summary');
        console.warn('Full data object:', JSON.stringify(data, null, 2));
        setError('No analytics data available. Please check if you have any bookings.');
        return;
      }
      
      setAnalytics(data);
      
      // Set AI insights if available
      if (data.aiInsights) {
        setAiInsights(data.aiInsights);
      }
      
    } catch (err) {
      console.error('Error loading analytics:', err);
      setError(err.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatTime = (time) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Temporary debug display
  if (analytics && analytics.summary) {
    console.log('RENDERING ANALYTICS - Summary:', analytics.summary);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
        <OwnerDashboardNav />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
        <OwnerDashboardNav />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Analytics</h3>
            <p className="text-red-600">{error}</p>
            <button
              onClick={loadAnalytics}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { summary, trends, popularSlots, turfPerformance } = analytics || {};

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
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Analytics Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Track your business performance and gain insights into your turf operations.
              </p>
            </div>
            
            {/* Period Selector */}
            <div className="mt-4 sm:mt-0">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {periods.map((period) => (
                  <option key={period.value} value={period.value}>
                    {period.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Bookings</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary?.totalBookings || 0}</p>
                </div>
                <CalendarIcon className="h-8 w-8 text-primary-500" />
              </div>
              <div className="mt-2 flex items-center text-sm">
                <span className="text-green-600 font-medium">
                  {summary?.confirmedBookings || 0} confirmed
                </span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(summary?.totalRevenue || 0)}
                  </p>
                </div>
                <CurrencyRupeeIcon className="h-8 w-8 text-green-500" />
              </div>
              <div className="mt-2 flex items-center text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  Avg: {formatCurrency(summary?.averageBookingValue || 0)}
                </span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Turfs</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary?.activeTurfs || 0}</p>
                </div>
                <BuildingOfficeIcon className="h-8 w-8 text-blue-500" />
              </div>
              <div className="mt-2 flex items-center text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  {summary?.totalTurfs || 0} total turfs
                </span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Average Rating</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {analytics?.ratingAnalytics?.averageRating || 0}
                    <span className="text-sm text-gray-500 ml-1">/5</span>
                  </p>
                </div>
                <StarIcon className="h-8 w-8 text-yellow-500" />
              </div>
              <div className="mt-2 flex items-center text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  {analytics?.ratingAnalytics?.totalReviews || 0} reviews
                </span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Cancellation Rate</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {summary?.totalBookings > 0 
                      ? Math.round((summary.cancelledBookings / summary.totalBookings) * 100)
                      : 0}%
                  </p>
                </div>
                <ArrowTrendingDownIcon className="h-8 w-8 text-red-500" />
              </div>
              <div className="mt-2 flex items-center text-sm">
                <span className="text-red-600">
                  {summary?.cancelledBookings || 0} cancelled
                </span>
              </div>
            </motion.div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Popular Time Slots */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <ClockIcon className="h-5 w-5 mr-2 text-primary-500" />
                Popular Time Slots
              </h3>
              <div className="space-y-3">
                {popularSlots && popularSlots.length > 0 ? (
                  popularSlots.slice(0, 5).map((slot, index) => (
                    <div key={slot._id} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center text-sm font-medium text-primary-600 dark:text-primary-400">
                          {index + 1}
                        </div>
                        <span className="ml-3 text-gray-900 dark:text-white font-medium">
                          {formatTime(slot._id)}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {slot.count} bookings
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {formatCurrency(slot.revenue)}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                    No booking data available for this period
                  </p>
                )}
              </div>
            </motion.div>

            {/* Turf Performance */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <BuildingOfficeIcon className="h-5 w-5 mr-2 text-primary-500" />
                Turf Performance
              </h3>
              <div className="space-y-3">
                {turfPerformance && turfPerformance.length > 0 ? (
                  turfPerformance.slice(0, 5).map((turf, index) => (
                    <div key={turf._id} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center text-sm font-medium text-green-600 dark:text-green-400">
                          {index + 1}
                        </div>
                        <span className="ml-3 text-gray-900 dark:text-white font-medium">
                          {turf.turfName}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {turf.bookings} bookings
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {formatCurrency(turf.revenue)}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                    No turf performance data available
                  </p>
                )}
              </div>
            </motion.div>
          </div>

          {/* Recent Trends */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <ChartBarIcon className="h-5 w-5 mr-2 text-primary-500" />
              Recent Booking Trends
            </h3>
            {trends && trends.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Bookings
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Revenue
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {trends.slice(-10).map((trend, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {formatDate(new Date(trend._id.year, trend._id.month - 1, trend._id.day))}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {trend.bookings}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {formatCurrency(trend.revenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                No trend data available for this period
              </p>
            )}
          </motion.div>

          {/* Rating Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Rating Distribution */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <StarIcon className="h-5 w-5 mr-2 text-yellow-500" />
                Rating Distribution
              </h3>
              {analytics?.ratingAnalytics?.ratingDistribution ? (
                <div className="space-y-3">
                  {[5, 4, 3, 2, 1].map((rating) => {
                    const count = analytics.ratingAnalytics.ratingDistribution[rating] || 0;
                    const total = analytics.ratingAnalytics.totalReviews || 1;
                    const percentage = (count / total) * 100;
                    
                    return (
                      <div key={rating} className="flex items-center">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400 w-8">
                          {rating}★
                        </span>
                        <div className="flex-1 mx-3">
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400 w-12 text-right">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  No rating data available
                </p>
              )}
            </motion.div>

            {/* Turf Ratings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <StarIcon className="h-5 w-5 mr-2 text-yellow-500" />
                Top Rated Turfs
              </h3>
              <div className="space-y-3">
                {analytics?.turfRatings && analytics.turfRatings.length > 0 ? (
                  analytics.turfRatings.slice(0, 5).map((turf, index) => (
                    <div key={turf._id} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center text-sm font-medium text-yellow-600 dark:text-yellow-400">
                          {index + 1}
                        </div>
                        <span className="ml-3 text-gray-900 dark:text-white font-medium">
                          {turf.name}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {turf.averageRating}/5
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {turf.totalReviews} reviews
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                    No turf rating data available
                  </p>
                )}
              </div>
            </motion.div>
          </div>

          {/* Recent Reviews */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <StarIcon className="h-5 w-5 mr-2 text-yellow-500" />
              Recent Reviews
            </h3>
            {analytics?.recentReviews && analytics.recentReviews.length > 0 ? (
              <div className="space-y-4">
                {analytics.recentReviews.map((review) => (
                  <div key={review._id} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-b-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                            {review.userId?.name || 'Anonymous'}
                          </h4>
                          <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                            {formatDate(review.createdAt)}
                          </span>
                        </div>
                        <div className="flex items-center mb-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <StarIcon
                              key={star}
                              className={`h-4 w-4 ${
                                star <= review.rating
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                            {review.rating}/5
                          </span>
                        </div>
                        {review.comment && (
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {review.comment}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {review.turfId?.name || 'Unknown Turf'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                No recent reviews available
              </p>
            )}
          </motion.div>

          {/* AI/ML Insights Section */}
          {aiInsights && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-8"
            >
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                <h2 className="text-2xl font-bold mb-6 flex items-center">
                  <ChartBarIcon className="h-6 w-6 mr-3" />
                  AI-Powered Insights
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Predicted Popular Slots */}
                  <div className="bg-white bg-opacity-20 rounded-lg p-4 backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-purple-100">Predicted Peak Hours</p>
                        <p className="text-2xl font-bold">
                          {aiInsights.predictedPopularSlots?.slice(0, 2).map(slot => 
                            `${slot.hour}:00`
                          ).join(', ') || 'N/A'}
                        </p>
                        <p className="text-xs text-purple-100 mt-1">
                          Confidence: {aiInsights.popularSlotsConfidence?.toFixed(1)}%
                        </p>
                      </div>
                      <ClockIcon className="h-8 w-8 text-purple-200" />
                    </div>
                  </div>

                  {/* Rating Trend */}
                  <div className="bg-white bg-opacity-20 rounded-lg p-4 backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-100">Rating Trend</p>
                        <p className="text-2xl font-bold">
                          {aiInsights.ratingTrend > 0 ? '+' : ''}{aiInsights.ratingTrend?.toFixed(1)}%
                        </p>
                        <p className="text-xs text-blue-100 mt-1">
                          {aiInsights.ratingTrend > 0 ? 'Improving' : 'Declining'}
                        </p>
                      </div>
                      <ArrowTrendingUpIcon className="h-8 w-8 text-blue-200" />
                    </div>
                  </div>

                  {/* Booking Prediction */}
                  <div className="bg-white bg-opacity-20 rounded-lg p-4 backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-100">Next 7 Days</p>
                        <p className="text-2xl font-bold">
                          {aiInsights.predictedBookings || 0}
                        </p>
                        <p className="text-xs text-green-100 mt-1">
                          Predicted bookings
                        </p>
                      </div>
                      <CalendarIcon className="h-8 w-8 text-green-200" />
                    </div>
                  </div>

                  {/* Revenue Optimization */}
                  <div className="bg-white bg-opacity-20 rounded-lg p-4 backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-yellow-100">Optimal Pricing</p>
                        <p className="text-2xl font-bold">
                          {formatCurrency(aiInsights.optimalPricing || 0)}
                        </p>
                        <p className="text-xs text-yellow-100 mt-1">
                          Suggested rate/hour
                        </p>
                      </div>
                      <CurrencyDollarIcon className="h-8 w-8 text-yellow-200" />
                    </div>
                  </div>
                </div>

                {/* AI Recommendations */}
                {aiInsights.recommendations && aiInsights.recommendations.length > 0 && (
                  <div className="mt-6 bg-white bg-opacity-20 rounded-lg p-4 backdrop-blur-sm">
                    <h3 className="text-lg font-semibold mb-3 flex items-center">
                      <LightBulbIcon className="h-5 w-5 mr-2" />
                      AI Recommendations
                    </h3>
                    <div className="space-y-2">
                      {aiInsights.recommendations.map((rec, index) => (
                        <div key={index} className="flex items-start">
                          <div className="w-2 h-2 bg-white rounded-full mt-2 mr-3 flex-shrink-0"></div>
                          <p className="text-sm text-white">{rec}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default OwnerAnalyticsPage;
