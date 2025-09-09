import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { Navigation } from '../../components/layout';
import { TableRowSkeleton, CardSkeleton, LoadingSpinner } from '../../components/ui';
import apiService from '../../services/api';
import { showSuccessToast, showConfirmToast, showInputToast } from '../../utils/toast';
import {
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  BuildingOfficeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  InformationCircleIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { DocumentViewer } from '../../components/ui';

const AdminDashboard = () => {
  const { user } = useAuth(); // Move useAuth to the top
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // All Owners state
  const [allOwners, setAllOwners] = useState([]);
  const [ownersLoading, setOwnersLoading] = useState(false);
  const [ownersStatusCounts, setOwnersStatusCounts] = useState({});
  const [ownersPage, setOwnersPage] = useState(1);
  const [ownersTotalPages, setOwnersTotalPages] = useState(1);
  const [ownersStatusFilter, setOwnersStatusFilter] = useState('all');

  // Turfs state
  const [allTurfs, setAllTurfs] = useState([]);
  const [turfsByOwner, setTurfsByOwner] = useState([]);
  const [turfsLoading, setTurfsLoading] = useState(false);
  const [turfsPage, setTurfsPage] = useState(1);
  const [turfsTotalPages, setTurfsTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState('owners');
  const [pendingTurfChanges, setPendingTurfChanges] = useState([]);
  const [turfChangesLoading, setTurfChangesLoading] = useState(false);

  // Document viewer state
  const [documentViewer, setDocumentViewer] = useState({
    isOpen: false,
    documentUrl: '',
    documentName: '',
    documentType: '',
    ownerName: ''
  });

  // Removed All Users functionality - only showing turf owners

  useEffect(() => {
    fetchAllOwners();
  }, [ownersPage, ownersStatusFilter]);

  useEffect(() => {
    if (activeTab === 'turfs') {
      fetchAllTurfs();
    } else if (activeTab === 'changes') {
      fetchPendingTurfChanges();
    }
  }, [turfsPage, activeTab]);

  const fetchAllOwners = async () => {
    try {
      setOwnersLoading(true);
      const queryParams = new URLSearchParams({
        page: ownersPage,
        limit: 10,
        status: ownersStatusFilter
      });

      const data = await apiService.request(`/admin/all-owners?${queryParams}`);
      setAllOwners(data.data);
      setOwnersStatusCounts(data.statusCounts);
      setOwnersTotalPages(data.pages);
    } catch (error) {
      setError(error.message);
    } finally {
      setOwnersLoading(false);
      setLoading(false);
    }
  };

  const fetchAllTurfs = async () => {
    try {
      setTurfsLoading(true);
      const queryParams = new URLSearchParams({
        page: turfsPage,
        limit: 10
      });

      const response = await apiService.request(`/turfs/admin/all?${queryParams}`);

      if (response.success) {
        setAllTurfs(response.data.turfs);
        setTurfsByOwner(response.data.turfsByOwner);
        setTurfsTotalPages(Math.ceil(response.total / 10));
      }
    } catch (error) {
      setError(error.message);
      setAllTurfs([]);
      setTurfsByOwner([]);
    } finally {
      setTurfsLoading(false);
    }
  };

  // Removed fetchAllUsers function - only focusing on turf owners

  const handleApproval = async (ownerId, status, notes = '') => {
    try {
      await apiService.request(`/admin/owners/${ownerId}/approval`, {
        method: 'PUT',
        body: JSON.stringify({ status, notes })
      });

      // Refresh the list
      fetchAllOwners();
      showSuccessToast(`Owner ${status} successfully! Email notification has been sent.`);
    } catch (error) {
      setError(error.message);
    }
  };

  const fetchPendingTurfChanges = async () => {
    try {
      setTurfChangesLoading(true);
      const response = await apiService.request('/admin/turfs/pending-changes');

      if (response.success) {
        setPendingTurfChanges(response.data);
      }
    } catch (error) {
      console.error('Error fetching pending turf changes:', error);
      showErrorToast('Failed to fetch pending turf changes');
    } finally {
      setTurfChangesLoading(false);
    }
  };

  const approveTurfChanges = async (turfId, status, notes = '') => {
    try {
      const response = await apiService.request(`/admin/turfs/${turfId}/approve-changes`, {
        method: 'PUT',
        body: JSON.stringify({ status, notes })
      });

      if (response.success) {
        showSuccessToast(`Turf changes ${status} successfully!`);
        fetchPendingTurfChanges(); // Refresh the list
      }
    } catch (error) {
      console.error('Error approving turf changes:', error);
      showErrorToast('Failed to process turf changes');
    }
  };

  // Document viewer functions
  const openDocumentViewer = (documentUrl, documentName, documentType, ownerName) => {
    setDocumentViewer({
      isOpen: true,
      documentUrl,
      documentName,
      documentType,
      ownerName
    });
  };

  const closeDocumentViewer = () => {
    setDocumentViewer({
      isOpen: false,
      documentUrl: '',
      documentName: '',
      documentType: '',
      ownerName: ''
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20">
        {/* Welcome Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome, {user?.firstName}! 🛡️
          </h1>
          <p className="text-gray-600">
            Monitor and manage the TurfEase platform. Review owner applications and system health.
          </p>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="bg-white rounded-xl shadow-lg p-1">
            <div className="flex space-x-1">
              <button
                onClick={() => setActiveTab('owners')}
                className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all ${
                  activeTab === 'owners'
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>Turf Owners</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('turfs')}
                className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all ${
                  activeTab === 'turfs'
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span>All Turfs</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('changes')}
                className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all ${
                  activeTab === 'changes'
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <ClockIcon className="w-5 h-5" />
                  <span>Pending Changes</span>
                  {pendingTurfChanges.length > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 ml-1">
                      {pendingTurfChanges.length}
                    </span>
                  )}
                </div>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Content based on active tab */}
        {activeTab === 'owners' && (
          <>
            {/* Owner Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
            >
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-blue-100">
                    <BuildingOfficeIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Owners</p>
                    <p className="text-2xl font-bold text-gray-900">{ownersStatusCounts.total || 0}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-yellow-100">
                    <ClockIcon className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-gray-900">{ownersStatusCounts.pending || 0}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-green-100">
                    <CheckCircleIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Approved</p>
                    <p className="text-2xl font-bold text-gray-900">{ownersStatusCounts.approved || 0}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-red-100">
                    <XCircleIcon className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Rejected</p>
                    <p className="text-2xl font-bold text-gray-900">{ownersStatusCounts.rejected || 0}</p>
                  </div>
                </div>
              </div>
        </motion.div>

        {/* Owners Management */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-xl p-6"
        >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Owner Management</h2>
              <div className="flex space-x-4">
                <select
                  value={ownersStatusFilter}
                  onChange={(e) => setOwnersStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
                <button
                  onClick={fetchAllOwners}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Refresh
                </button>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600">{error}</p>
              </div>
            )}

            {ownersLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : allOwners.length === 0 ? (
              <div className="text-center py-8">
                <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No owners found</h3>
                <p className="mt-1 text-sm text-gray-500">No owners match the current filter.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {allOwners.map((owner) => (
                <div
                  key={owner._id}
                  className={`bg-white border rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 ${
                    owner.adminApprovalStatus === 'rejected'
                      ? 'border-red-200 opacity-75 scale-95'
                      : 'border-gray-200'
                  }`}
                >
                  {/* Header Section */}
                  <div className={`px-6 border-b border-gray-100 rounded-t-xl ${
                    owner.adminApprovalStatus === 'rejected'
                      ? 'py-3 bg-red-50'
                      : 'py-4 bg-gray-50'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center shadow-lg ${
                          owner.adminApprovalStatus === 'rejected' ? 'h-12 w-12' : 'h-16 w-16'
                        }`}>
                          <span className={`font-bold text-white ${
                            owner.adminApprovalStatus === 'rejected' ? 'text-lg' : 'text-xl'
                          }`}>
                            {owner.firstName.charAt(0)}{owner.lastName.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h3 className={`font-semibold text-gray-900 ${
                            owner.adminApprovalStatus === 'rejected' ? 'text-lg' : 'text-xl'
                          }`}>
                            {owner.firstName} {owner.lastName}
                          </h3>
                          <p className={`text-gray-600 ${
                            owner.adminApprovalStatus === 'rejected' ? 'text-xs' : 'text-sm'
                          }`}>{owner.email}</p>
                          {owner.adminApprovalStatus !== 'rejected' && (
                            <p className="text-xs text-gray-500">
                              Registered: {new Date(owner.createdAt).toLocaleDateString('en-IN', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                          owner.adminApprovalStatus === 'approved' ? 'bg-green-100 text-green-800' :
                          owner.adminApprovalStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {owner.adminApprovalStatus === 'approved' ? '✅ Approved' :
                           owner.adminApprovalStatus === 'rejected' ? '❌ Rejected' :
                           '⏳ Pending Review'}
                        </span>
                        {owner.isEmailVerified ? (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                            📧 Email Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                            ⚠️ Email Not Verified
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Details Section */}
                  <div className={`px-6 ${
                    owner.adminApprovalStatus === 'rejected' ? 'py-3' : 'py-6'
                  }`}>
                    {owner.adminApprovalStatus === 'rejected' ? (
                      /* Compact view for rejected applications */
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div>
                              <p className="text-sm font-medium text-gray-700">
                                {owner.businessName || 'Business name not provided'}
                              </p>
                              <p className="text-xs text-gray-500">
                                {owner.turfLocation || 'Location not specified'} • {owner.turfCount || 'Turf count not specified'} • {owner.sportType || 'Sport not specified'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">
                              Rejected: {owner.adminApprovalDate ? new Date(owner.adminApprovalDate).toLocaleDateString('en-IN') : 'Date not available'}
                            </p>
                            {owner.adminApprovalNotes && (
                              <p className="text-xs text-red-600 mt-1 max-w-xs truncate" title={owner.adminApprovalNotes}>
                                Reason: {owner.adminApprovalNotes}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Full view for pending and approved applications */
                      <div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Personal Information */}
                          <div className="space-y-4">
                            <h4 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                              👤 Personal Information
                            </h4>
                            <div className="space-y-3">
                              <div className="flex items-center space-x-3">
                                <span className="text-gray-400">📞</span>
                                <div>
                                  <p className="text-sm font-medium text-gray-700">Personal Phone</p>
                                  <p className="text-sm text-gray-600">{owner.phone || 'Not provided'}</p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-3">
                                <span className="text-gray-400">🏠</span>
                                <div>
                                  <p className="text-sm font-medium text-gray-700">Personal Location</p>
                                  <p className="text-sm text-gray-600">{owner.location || 'Not provided'}</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Business Information */}
                          <div className="space-y-4">
                            <h4 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                              🏢 Business Information
                            </h4>
                            <div className="space-y-3">
                              <div className="flex items-center space-x-3">
                                <span className="text-gray-400">🏪</span>
                                <div>
                                  <p className="text-sm font-medium text-gray-700">Business Name</p>
                                  <p className="text-sm text-gray-600 font-medium">{owner.businessName || 'Not provided'}</p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-3">
                                <span className="text-gray-400">📞</span>
                                <div>
                                  <p className="text-sm font-medium text-gray-700">Business Phone</p>
                                  <p className="text-sm text-gray-600">{owner.businessPhone || 'Not provided'}</p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-3">
                                <span className="text-gray-400">📊</span>
                                <div>
                                  <p className="text-sm font-medium text-gray-700">Number of Turfs</p>
                                  <p className="text-sm text-gray-600">{owner.turfCount || 'Not specified'}</p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-3">
                                <span className="text-gray-400">⚽</span>
                                <div>
                                  <p className="text-sm font-medium text-gray-700">Sport Type</p>
                                  <p className="text-sm text-gray-600">{owner.sportType || 'Not specified'}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Location Information */}
                        <div className="mt-6 space-y-4">
                          <h4 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                            📍 Location Details
                          </h4>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                              <div className="flex items-start space-x-3">
                                <span className="text-orange-500 text-lg">🎯</span>
                                <div className="flex-1">
                                  <p className="text-sm font-semibold text-orange-800">Turf Location (Customer-facing)</p>
                                  <p className="text-sm text-orange-700 mt-1">
                                    {owner.turfLocation || 'Not specified'}
                                  </p>
                                  <p className="text-xs text-orange-600 mt-1">
                                    This is where customers will find the turf
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                              <div className="flex items-start space-x-3">
                                <span className="text-blue-500 text-lg">🏢</span>
                                <div className="flex-1">
                                  <p className="text-sm font-semibold text-blue-800">Business Address</p>
                                  <p className="text-sm text-blue-700 mt-1">
                                    {owner.businessAddress || 'Not provided'}
                                  </p>
                                  <p className="text-xs text-blue-600 mt-1">
                                    Complete address with landmarks
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Additional Information */}
                        <div className="mt-6 bg-gray-50 rounded-lg p-4">
                          <h4 className="text-sm font-semibold text-gray-700 mb-3">📋 Additional Information</h4>
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                            <div>
                              <p className="text-gray-500">User ID</p>
                              <p className="text-gray-700 font-mono">{owner._id.slice(-8)}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Account Type</p>
                              <p className="text-gray-700 capitalize">{owner.userType}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Email Status</p>
                              <p className={`font-medium ${owner.isEmailVerified ? 'text-green-600' : 'text-red-600'}`}>
                                {owner.isEmailVerified ? 'Verified' : 'Unverified'}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500">Admin Status</p>
                              <p className={`font-medium ${
                                owner.isApprovedByAdmin ? 'text-green-600' : 'text-yellow-600'
                              }`}>
                                {owner.isApprovedByAdmin ? 'Approved' : 'Pending'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Owner Documents */}
                        <div className="mt-6 bg-gray-50 rounded-lg p-4">
                          <h4 className="text-sm font-semibold text-gray-700 mb-3">📑 Owner Documents</h4>
                          <ul className="space-y-2 text-sm">
                            <li className="flex items-center justify-between">
                              <div>
                                <span className="font-medium">Government-issued ID (required): </span>
                                {owner.govIdFileUrl ? (
                                  <span className="text-green-600">✓ Submitted</span>
                                ) : (
                                  <span className="text-red-600">Not submitted</span>
                                )}
                              </div>
                              {owner.govIdFileUrl && (
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => openDocumentViewer(
                                      owner.govIdFileUrl,
                                      'Government-issued ID',
                                      'Government ID',
                                      `${owner.firstName} ${owner.lastName}`
                                    )}
                                    className="flex items-center space-x-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                                    title="View document in modal"
                                  >
                                    <EyeIcon className="h-3 w-3" />
                                    <span>View</span>
                                  </button>
                                  <a
                                    href={owner.govIdFileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center space-x-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                                    title="Open in new tab"
                                  >
                                    <InformationCircleIcon className="h-3 w-3" />
                                    <span>External</span>
                                  </a>
                                </div>
                              )}
                            </li>
                            <li className="flex items-center justify-between">
                              <div>
                                <span className="font-medium">Turf Ownership Proof (required): </span>
                                {owner.ownershipProofFileUrl ? (
                                  <span className="text-green-600">✓ Submitted</span>
                                ) : (
                                  <span className="text-red-600">Not submitted</span>
                                )}
                              </div>
                              {owner.ownershipProofFileUrl && (
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => openDocumentViewer(
                                      owner.ownershipProofFileUrl,
                                      'Turf Ownership Proof',
                                      'Ownership Proof',
                                      `${owner.firstName} ${owner.lastName}`
                                    )}
                                    className="flex items-center space-x-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                                    title="View document in modal"
                                  >
                                    <EyeIcon className="h-3 w-3" />
                                    <span>View</span>
                                  </button>
                                  <a
                                    href={owner.ownershipProofFileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center space-x-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                                    title="Open in new tab"
                                  >
                                    <InformationCircleIcon className="h-3 w-3" />
                                    <span>External</span>
                                  </a>
                                </div>
                              )}
                            </li>
                            <li className="flex items-center justify-between">
                              <div>
                                <span className="font-medium">Business Registration Certificate (optional): </span>
                                {owner.businessCertFileUrl ? (
                                  <span className="text-green-600">✓ Submitted</span>
                                ) : (
                                  <span className="text-gray-400">Not submitted</span>
                                )}
                              </div>
                              {owner.businessCertFileUrl && (
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => openDocumentViewer(
                                      owner.businessCertFileUrl,
                                      'Business Registration Certificate',
                                      'Business Certificate',
                                      `${owner.firstName} ${owner.lastName}`
                                    )}
                                    className="flex items-center space-x-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                                    title="View document in modal"
                                  >
                                    <EyeIcon className="h-3 w-3" />
                                    <span>View</span>
                                  </button>
                                  <a
                                    href={owner.businessCertFileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center space-x-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                                    title="Open in new tab"
                                  >
                                    <InformationCircleIcon className="h-3 w-3" />
                                    <span>External</span>
                                  </a>
                                </div>
                              )}
                            </li>
                            <li className="flex items-center justify-between">
                              <div>
                                <span className="font-medium">GST Number (optional): </span>
                                {owner.gstNumber ? (
                                  <span className="text-gray-700">{owner.gstNumber}</span>
                                ) : (
                                  <span className="text-gray-400">Not provided</span>
                                )}
                                {owner.gstFileUrl && (
                                  <span className="ml-2 text-green-600">✓ Document submitted</span>
                                )}
                              </div>
                              {owner.gstFileUrl && (
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => openDocumentViewer(
                                      owner.gstFileUrl,
                                      'GST Document',
                                      'GST',
                                      `${owner.firstName} ${owner.lastName}`
                                    )}
                                    className="flex items-center space-x-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                                    title="View document in modal"
                                  >
                                    <EyeIcon className="h-3 w-3" />
                                    <span>View</span>
                                  </button>
                                  <a
                                    href={owner.gstFileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center space-x-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                                    title="Open in new tab"
                                  >
                                    <InformationCircleIcon className="h-3 w-3" />
                                    <span>External</span>
                                  </a>
                                </div>
                              )}
                            </li>
                            <li className="flex items-center justify-between">
                              <div>
                                <span className="font-medium">Bank Details / UPI ID (optional): </span>
                                {owner.bankDetails ? (
                                  <span className="text-gray-700">{owner.bankDetails}</span>
                                ) : (
                                  <span className="text-gray-400">Not provided</span>
                                )}
                                {owner.bankProofFileUrl && (
                                  <span className="ml-2 text-green-600">✓ Document submitted</span>
                                )}
                              </div>
                              {owner.bankProofFileUrl && (
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => openDocumentViewer(
                                      owner.bankProofFileUrl,
                                      'Bank Proof Document',
                                      'Bank Proof',
                                      `${owner.firstName} ${owner.lastName}`
                                    )}
                                    className="flex items-center space-x-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                                    title="View document in modal"
                                  >
                                    <EyeIcon className="h-3 w-3" />
                                    <span>View</span>
                                  </button>
                                  <a
                                    href={owner.bankProofFileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center space-x-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                                    title="Open in new tab"
                                  >
                                    <InformationCircleIcon className="h-3 w-3" />
                                    <span>External</span>
                                  </a>
                                </div>
                              )}
                            </li>
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className={`px-6 border-t border-gray-100 rounded-b-xl ${
                    owner.adminApprovalStatus === 'rejected'
                      ? 'py-2 bg-red-50'
                      : 'py-4 bg-gray-50'
                  }`}>
                    {owner.adminApprovalStatus === 'rejected' ? (
                      /* Compact actions for rejected applications */
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-2 bg-red-100 px-2 py-1 rounded">
                            <XCircleIcon className="h-4 w-4 text-red-600" />
                            <span className="text-xs font-medium text-red-800">Rejected</span>
                          </div>
                          {owner.adminApprovalDate && (
                            <span className="text-xs text-gray-500">
                              {new Date(owner.adminApprovalDate).toLocaleDateString('en-IN')}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <a
                            href={`mailto:${owner.email}?subject=TurfEase - Regarding Your Rejected Application`}
                            className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                          >
                            📧 Contact
                          </a>
                          <button
                            onClick={() => {
                              showConfirmToast(
                                'Are you sure you want to re-approve this rejected application?',
                                () => handleApproval(owner._id, 'approved')
                              );
                            }}
                            className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 transition-colors"
                          >
                            ✅ Re-approve
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Full actions for pending and approved applications */
                      <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {/* Status Display */}
                        {owner.adminApprovalStatus === 'approved' && (
                          <div className="flex items-center space-x-2">
                            <div className="flex items-center space-x-2 bg-green-100 px-3 py-2 rounded-lg">
                              <CheckCircleIcon className="h-5 w-5 text-green-600" />
                              <span className="text-sm font-medium text-green-800">Approved</span>
                            </div>
                            {owner.adminApprovalDate && (
                              <span className="text-xs text-gray-500">
                                on {new Date(owner.adminApprovalDate).toLocaleDateString('en-IN')}
                              </span>
                            )}
                          </div>
                        )}
                        {owner.adminApprovalStatus === 'rejected' && (
                          <div className="flex items-center space-x-2">
                            <div className="flex items-center space-x-2 bg-red-100 px-3 py-2 rounded-lg">
                              <XCircleIcon className="h-5 w-5 text-red-600" />
                              <span className="text-sm font-medium text-red-800">Rejected</span>
                            </div>
                            {owner.adminApprovalDate && (
                              <span className="text-xs text-gray-500">
                                on {new Date(owner.adminApprovalDate).toLocaleDateString('en-IN')}
                              </span>
                            )}
                          </div>
                        )}
                        {owner.adminApprovalStatus === 'pending' && (
                          <div className="flex items-center space-x-2 bg-yellow-100 px-3 py-2 rounded-lg">
                            <svg className="h-5 w-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm font-medium text-yellow-800">Pending Review</span>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center space-x-3">
                        {/* Contact Owner */}
                        <a
                          href={`mailto:${owner.email}?subject=TurfEase - Regarding Your Business Registration`}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                        >
                          <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          Contact
                        </a>

                        {/* Approval Actions */}
                        {owner.adminApprovalStatus === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApproval(owner._id, 'approved')}
                              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors shadow-sm"
                            >
                              <CheckCircleIcon className="h-4 w-4 mr-2" />
                              Approve Business
                            </button>
                            <button
                              onClick={() => {
                                showInputToast(
                                  'Enter rejection reason (this will be sent to the owner):',
                                  'Reason for rejection...',
                                  (notes) => handleApproval(owner._id, 'rejected', notes)
                                );
                              }}
                              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors shadow-sm"
                            >
                              <XCircleIcon className="h-4 w-4 mr-2" />
                              Reject Application
                            </button>
                          </>
                        )}

                        {/* Re-review Actions for Approved/Rejected */}
                        {(owner.adminApprovalStatus === 'approved' || owner.adminApprovalStatus === 'rejected') && (
                          <button
                            onClick={() => {
                              const action = owner.adminApprovalStatus === 'approved' ? 'reject' : 'approve';
                              const confirmMessage = `Are you sure you want to ${action} this ${owner.adminApprovalStatus} application?`;
                              const newStatus = owner.adminApprovalStatus === 'approved' ? 'rejected' : 'approved';

                              showConfirmToast(
                                confirmMessage,
                                () => {
                                  if (newStatus === 'rejected') {
                                    showInputToast(
                                      'Enter reason for status change:',
                                      'Reason for change...',
                                      (notes) => handleApproval(owner._id, newStatus, notes)
                                    );
                                  } else {
                                    handleApproval(owner._id, newStatus);
                                  }
                                }
                              );
                            }}
                            className={`inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-white transition-colors shadow-sm ${
                              owner.adminApprovalStatus === 'approved'
                                ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                                : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                            } focus:outline-none focus:ring-2 focus:ring-offset-2`}
                          >
                            {owner.adminApprovalStatus === 'approved' ? (
                              <>
                                <XCircleIcon className="h-4 w-4 mr-2" />
                                Revoke Approval
                              </>
                            ) : (
                              <>
                                <CheckCircleIcon className="h-4 w-4 mr-2" />
                                Re-approve
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                    )}

                    {/* Verification Checklist - Only show for non-rejected applications */}
                    {owner.adminApprovalStatus !== 'rejected' && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h5 className="text-sm font-semibold text-gray-700 mb-3">📋 Verification Checklist</h5>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className={`flex items-center space-x-2 text-xs ${
                          owner.firstName && owner.lastName ? 'text-green-600' : 'text-red-600'
                        }`}>
                          <span>{owner.firstName && owner.lastName ? '✅' : '❌'}</span>
                          <span>Complete Name</span>
                        </div>
                        <div className={`flex items-center space-x-2 text-xs ${
                          owner.isEmailVerified ? 'text-green-600' : 'text-red-600'
                        }`}>
                          <span>{owner.isEmailVerified ? '✅' : '❌'}</span>
                          <span>Email Verified</span>
                        </div>
                        <div className={`flex items-center space-x-2 text-xs ${
                          owner.phone && owner.phone !== '0000000000' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          <span>{owner.phone && owner.phone !== '0000000000' ? '✅' : '❌'}</span>
                          <span>Valid Phone</span>
                        </div>
                        <div className={`flex items-center space-x-2 text-xs ${
                          owner.businessName ? 'text-green-600' : 'text-red-600'
                        }`}>
                          <span>{owner.businessName ? '✅' : '❌'}</span>
                          <span>Business Name</span>
                        </div>
                        <div className={`flex items-center space-x-2 text-xs ${
                          owner.businessAddress ? 'text-green-600' : 'text-red-600'
                        }`}>
                          <span>{owner.businessAddress ? '✅' : '❌'}</span>
                          <span>Business Address</span>
                        </div>
                        <div className={`flex items-center space-x-2 text-xs ${
                          owner.businessPhone ? 'text-green-600' : 'text-red-600'
                        }`}>
                          <span>{owner.businessPhone ? '✅' : '❌'}</span>
                          <span>Business Phone</span>
                        </div>
                        <div className={`flex items-center space-x-2 text-xs ${
                          owner.turfLocation ? 'text-green-600' : 'text-red-600'
                        }`}>
                          <span>{owner.turfLocation ? '✅' : '❌'}</span>
                          <span>Turf Location</span>
                        </div>
                        <div className={`flex items-center space-x-2 text-xs ${
                          owner.turfCount ? 'text-green-600' : 'text-red-600'
                        }`}>
                          <span>{owner.turfCount ? '✅' : '❌'}</span>
                          <span>Turf Count</span>
                        </div>
                        <div className={`flex items-center space-x-2 text-xs ${
                          owner.sportType ? 'text-green-600' : 'text-red-600'
                        }`}>
                          <span>{owner.sportType ? '✅' : '❌'}</span>
                          <span>Sport Type</span>
                        </div>
                      </div>
                    </div>
                    )}
                  </div>
                </div>
                ))}
              </div>
            )}

            {/* Pagination for Owners */}
            {ownersTotalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-700">
                  Page {ownersPage} of {ownersTotalPages}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setOwnersPage(prev => Math.max(prev - 1, 1))}
                    disabled={ownersPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    <ChevronLeftIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setOwnersPage(prev => Math.min(prev + 1, ownersTotalPages))}
                    disabled={ownersPage === ownersTotalPages}
                    className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    <ChevronRightIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
        </motion.div>
          </>
        )}

        {/* Turfs Tab Content */}
        {activeTab === 'turfs' && (
          <>
            {/* Turfs Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
            >
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-green-100">
                    <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Turfs</p>
                    <p className="text-2xl font-bold text-gray-900">{allTurfs.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-blue-100">
                    <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Owners</p>
                    <p className="text-2xl font-bold text-gray-900">{turfsByOwner.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-yellow-100">
                    <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Avg Rating</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {allTurfs.length > 0
                        ? (allTurfs.reduce((sum, turf) => sum + (turf.rating || 0), 0) / allTurfs.length).toFixed(1)
                        : '0.0'
                      }
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-purple-100">
                    <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ₹{allTurfs.reduce((sum, turf) => sum + (turf.pricePerHour || 0), 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Turfs by Owner */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl shadow-lg overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Turfs by Owner</h2>
                <p className="text-sm text-gray-600 mt-1">
                  View and manage all turfs organized by their owners
                </p>
              </div>

              {turfsLoading ? (
                <div className="p-6">
                  <div className="grid grid-cols-1 gap-6">
                    {[...Array(3)].map((_, index) => (
                      <div key={index} className="animate-pulse">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                          <div>
                            <div className="h-4 bg-gray-300 rounded w-32 mb-2"></div>
                            <div className="h-3 bg-gray-300 rounded w-24"></div>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {[...Array(2)].map((_, i) => (
                            <div key={i} className="border border-gray-200 rounded-lg p-4">
                              <div className="h-4 bg-gray-300 rounded mb-2"></div>
                              <div className="h-3 bg-gray-300 rounded mb-2 w-3/4"></div>
                              <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : turfsByOwner.length === 0 ? (
                <div className="p-8 text-center">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Turfs Found</h3>
                  <p className="text-gray-600">No turfs have been added to the platform yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {turfsByOwner.map((ownerData, index) => (
                    <div key={ownerData.owner._id} className="p-6">
                      {/* Owner Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-primary-600 font-semibold text-lg">
                              {ownerData.owner.firstName?.[0]}{ownerData.owner.lastName?.[0]}
                            </span>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {ownerData.owner.firstName} {ownerData.owner.lastName}
                            </h3>
                            <p className="text-sm text-gray-600">{ownerData.owner.email}</p>
                            {ownerData.owner.businessName && (
                              <p className="text-sm text-primary-600 font-medium">
                                {ownerData.owner.businessName}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-gray-900">{ownerData.totalTurfs}</p>
                          <p className="text-sm text-gray-600">Turfs</p>
                        </div>
                      </div>

                      {/* Owner's Turfs */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {ownerData.turfs.map((turf) => (
                          <div key={turf._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-semibold text-gray-900 truncate">{turf.name}</h4>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                turf.isApproved
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {turf.isApproved ? 'Live' : 'Pending'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2 truncate">
                              {turf.location?.address || 'No address'}
                            </p>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-primary-600 font-medium">
                                ₹{turf.pricePerHour}/hr
                              </span>
                              <span className="text-gray-500">
                                {turf.sport}
                              </span>
                            </div>
                            {turf.rating > 0 && (
                              <div className="flex items-center mt-2">
                                <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                <span className="ml-1 text-sm text-gray-600">
                                  {turf.rating} ({turf.totalReviews})
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination for Turfs */}
              {turfsTotalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setTurfsPage(prev => Math.max(prev - 1, 1))}
                      disabled={turfsPage === 1}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-gray-700">
                      Page {turfsPage} of {turfsTotalPages}
                    </span>
                    <button
                      onClick={() => setTurfsPage(prev => Math.min(prev + 1, turfsTotalPages))}
                      disabled={turfsPage === turfsTotalPages}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}

        {/* Pending Changes Tab Content */}
        {activeTab === 'changes' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Pending Turf Changes</h2>
              <button
                onClick={fetchPendingTurfChanges}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Refresh
              </button>
            </div>

            {turfChangesLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : pendingTurfChanges.length === 0 ? (
              <div className="text-center py-8">
                <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No pending turf changes</p>
              </div>
            ) : (
              <div className="space-y-6">
                {pendingTurfChanges.map((turf) => (
                  <div key={turf._id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {turf.name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          Owner: {turf.ownerId?.firstName} {turf.ownerId?.lastName} ({turf.ownerId?.email})
                        </p>
                        <p className="text-sm text-gray-600 mb-4">
                          Business: {turf.ownerId?.businessName}
                        </p>

                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                          <h4 className="font-medium text-yellow-800 mb-2">Pending Changes:</h4>
                          <div className="space-y-2">
                            {Array.from(turf.pendingChanges.entries()).map(([key, value]) => (
                              <div key={key} className="text-sm">
                                <span className="font-medium text-yellow-700">{key}:</span>
                                <span className="text-yellow-600 ml-2">
                                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => approveTurfChanges(turf._id, 'approved')}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => approveTurfChanges(turf._id, 'rejected', 'Changes rejected by admin')}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Document Viewer Modal */}
      <DocumentViewer
        isOpen={documentViewer.isOpen}
        onClose={closeDocumentViewer}
        documentUrl={documentViewer.documentUrl}
        documentName={documentViewer.documentName}
        documentType={documentViewer.documentType}
        ownerName={documentViewer.ownerName}
      />
    </div>
  );
};

export default AdminDashboard;