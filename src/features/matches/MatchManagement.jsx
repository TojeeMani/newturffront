import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  PlayIcon,
  PauseIcon,
  CheckCircleIcon,
  ShareIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import MatchCard from '../../components/matches/MatchCard';
import LiveMatchControl from '../../components/matches/LiveMatchControl';
import MatchViewer from '../../components/matches/MatchViewer';
import matchService from '../../services/matchService';
import { useAuth } from '../../context/AuthContext';
import { showSuccessToast, showErrorToast } from '../../utils/toast';

const MatchManagement = () => {
  const { user } = useAuth();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    matchType: '',
    search: ''
  });
  const [viewMode, setViewMode] = useState('all'); // 'all', 'upcoming', 'live', 'completed'
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [showMatchViewer, setShowMatchViewer] = useState(false);
  const [shareCode, setShareCode] = useState('');

  useEffect(() => {
    loadMatches();
  }, [filters, user]);

  const loadMatches = async () => {
    try {
      setLoading(true);
      const params = { ...filters };
      if (user?.userType === 'owner') {
        const ownerId = user?._id || user?.id;
        if (ownerId) {
          params.ownerId = ownerId;
        }
      }
      console.log('Loading matches with params:', params, 'user:', user);
      const response = await matchService.getMatches(params);
      console.log('Matches API response:', response);
      
      // Handle different response structures
      const matchesData = response?.data || response || [];
      setMatches(Array.isArray(matchesData) ? matchesData : []);
      setError(null);
    } catch (err) {
      console.error('Error loading matches:', err);
      setMatches([]); // Set empty array on error
      setError('Failed to load matches');
      showErrorToast('Failed to load matches. Please check if the backend server is running.');
    } finally {
      setLoading(false);
    }
  };


  const handleStartMatch = async (matchId) => {
    try {
      await matchService.updateMatchStatus(matchId, 'live');
      setMatches(prev => prev.map(match => 
        match._id === matchId ? { ...match, status: 'live' } : match
      ));
      showSuccessToast('Match started!');
    } catch (error) {
      showErrorToast('Failed to start match');
    }
  };

  const handlePauseMatch = async (matchId) => {
    try {
      await matchService.updateMatchStatus(matchId, 'scheduled');
      setMatches(prev => prev.map(match => 
        match._id === matchId ? { ...match, status: 'scheduled' } : match
      ));
      showSuccessToast('Match paused');
    } catch (error) {
      showErrorToast('Failed to pause match');
    }
  };

  const handleCompleteMatch = async (matchId) => {
    try {
      await matchService.updateMatchStatus(matchId, 'completed');
      setMatches(prev => prev.map(match => 
        match._id === matchId ? { ...match, status: 'completed' } : match
      ));
      showSuccessToast('Match completed!');
    } catch (error) {
      showErrorToast('Failed to complete match');
    }
  };

  const handleShare = (shareCode) => {
    const shareUrl = `${window.location.origin}/match/${shareCode}`;
    if (navigator.share) {
      navigator.share({
        title: 'Live Match',
        text: 'Watch this live match!',
        url: shareUrl
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      showSuccessToast('Match link copied to clipboard!');
    }
  };

  const handleViewMatch = (shareCode) => {
    setShareCode(shareCode);
    setShowMatchViewer(true);
  };

  const handleMatchUpdate = () => {
    loadMatches();
  };

  const filteredMatches = (matches || []).filter(match => {
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      return match.matchName.toLowerCase().includes(searchTerm) ||
             match.turfId?.name.toLowerCase().includes(searchTerm);
    }
    return true;
  });

  // Get today's date for filtering
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

  // Filter matches by date and status
  const todayMatches = filteredMatches.filter(match => {
    const matchDate = new Date(match.startTime);
    return matchDate >= todayStart && matchDate < todayEnd;
  });

  const now = new Date();
  const liveMatches = todayMatches.filter(match => match.status === 'live');
  // Upcoming across ALL future dates, not restricted to today
  const allUpcomingMatches = filteredMatches.filter(match => 
    match.status === 'scheduled' && new Date(match.startTime) > now
  );
  // Keep the original today-only upcoming for the summary widgets, if needed
  const upcomingMatchesToday = todayMatches.filter(match => 
    match.status === 'scheduled' && new Date(match.startTime) > now
  );
  const completedMatches = todayMatches.filter(match => match.status === 'completed');
  const otherMatches = filteredMatches.filter(match => {
    const matchDate = new Date(match.startTime);
    return !(matchDate >= todayStart && matchDate < todayEnd);
  });

  // Get matches based on view mode
  const getDisplayMatches = () => {
    switch (viewMode) {
      case 'upcoming':
        return allUpcomingMatches;
      case 'live':
        return liveMatches;
      case 'completed':
        return completedMatches;
      default:
        return todayMatches;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Match Management</h1>
              <p className="text-sm text-gray-600">Manage and monitor live matches</p>
            </div>
            <div className="text-sm text-gray-600">
              Matches are automatically created from user bookings
            </div>
          </div>
        </div>
      </div>

      {/* Filters and View Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* View Mode Tabs */}
          <div className="mb-4">
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
              {[
                { key: 'all', label: 'All Today', count: todayMatches?.length || 0 },
                { key: 'upcoming', label: 'Upcoming', count: allUpcomingMatches?.length || 0 },
                { key: 'live', label: 'Live', count: liveMatches?.length || 0 },
                { key: 'completed', label: 'Completed', count: completedMatches?.length || 0 }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setViewMode(tab.key)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                    viewMode === tab.key
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                      viewMode === tab.key
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search matches..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="live">Live</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <select
              value={filters.matchType}
              onChange={(e) => setFilters(prev => ({ ...prev, matchType: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="football">Football</option>
              <option value="cricket">Cricket</option>
              <option value="basketball">Basketball</option>
              <option value="tennis">Tennis</option>
              <option value="badminton">Badminton</option>
              <option value="other">Other</option>
            </select>

            <button
              onClick={loadMatches}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ArrowPathIcon className="w-4 h-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <ArrowPathIcon className="w-8 h-8 animate-spin text-blue-600 mr-3" />
            <span className="text-gray-600">Loading matches...</span>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={loadMatches}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Today's Matches Summary */}
            {viewMode === 'all' && (
              <div className="bg-blue-50 rounded-lg p-6 mb-6">
                <h2 className="text-lg font-semibold text-blue-900 mb-4">Today's Matches Summary</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-gray-900">{todayMatches?.length || 0}</div>
                    <div className="text-sm text-gray-600">Total Today</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-600">{upcomingMatchesToday?.length || 0}</div>
                    <div className="text-sm text-gray-600">Upcoming</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-red-600">{liveMatches?.length || 0}</div>
                    <div className="text-sm text-gray-600">Live Now</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{completedMatches?.length || 0}</div>
                    <div className="text-sm text-gray-600">Completed</div>
                  </div>
                </div>
              </div>
            )}

            {/* Live Matches */}
            {viewMode === 'all' && (liveMatches?.length || 0) > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <PlayIcon className="w-5 h-5 mr-2 text-red-600" />
                  Live Matches ({liveMatches?.length || 0})
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {(liveMatches || []).map((match) => (
                    <LiveMatchControl
                      key={match._id}
                      match={match}
                      onUpdate={handleMatchUpdate}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming Matches */}
            {viewMode === 'all' && (upcomingMatchesToday?.length || 0) > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <ClockIcon className="w-5 h-5 mr-2 text-yellow-600" />
                  Upcoming Matches ({upcomingMatchesToday?.length || 0})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(upcomingMatchesToday || []).map((match) => (
                    <MatchCard
                      key={match._id}
                      match={match}
                      onStartMatch={handleStartMatch}
                      onPauseMatch={handlePauseMatch}
                      onCompleteMatch={handleCompleteMatch}
                      onShare={handleShare}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Completed Matches */}
            {viewMode === 'all' && (completedMatches?.length || 0) > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <CheckCircleIcon className="w-5 h-5 mr-2 text-green-600" />
                  Completed Matches ({completedMatches?.length || 0})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(completedMatches || []).map((match) => (
                    <MatchCard
                      key={match._id}
                      match={match}
                      onStartMatch={handleStartMatch}
                      onPauseMatch={handlePauseMatch}
                      onCompleteMatch={handleCompleteMatch}
                      onShare={handleShare}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Filtered View (when not showing all) */}
            {viewMode !== 'all' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  {viewMode === 'upcoming' && `Upcoming Matches (${allUpcomingMatches?.length || 0})`}
                  {viewMode === 'live' && `Live Matches (${liveMatches?.length || 0})`}
                  {viewMode === 'completed' && `Completed Matches (${completedMatches?.length || 0})`}
                </h2>
                <div className={`grid gap-6 ${
                  viewMode === 'live' 
                    ? 'grid-cols-1 lg:grid-cols-2' 
                    : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                }`}>
                  {(getDisplayMatches() || []).map((match) => (
                    viewMode === 'live' ? (
                      <LiveMatchControl
                        key={match._id}
                        match={match}
                        onUpdate={handleMatchUpdate}
                      />
                    ) : (
                      <MatchCard
                        key={match._id}
                        match={match}
                        onStartMatch={handleStartMatch}
                        onPauseMatch={handlePauseMatch}
                        onCompleteMatch={handleCompleteMatch}
                        onShare={handleShare}
                      />
                    )
                  ))}
                </div>
              </div>
            )}

            {/* Other Matches (non-today) */}
            {viewMode === 'all' && (otherMatches?.length || 0) > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Other Matches ({otherMatches?.length || 0})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(otherMatches || []).map((match) => (
                    <MatchCard
                      key={match._id}
                      match={match}
                      onStartMatch={handleStartMatch}
                      onPauseMatch={handlePauseMatch}
                      onCompleteMatch={handleCompleteMatch}
                      onShare={handleShare}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {(getDisplayMatches() || []).length === 0 && (
              <div className="text-center py-12">
                <FunnelIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {viewMode === 'upcoming' && 'No upcoming matches today'}
                  {viewMode === 'live' && 'No live matches right now'}
                  {viewMode === 'completed' && 'No completed matches today'}
                  {viewMode === 'all' && 'No matches found'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {filters.search || filters.status || filters.matchType
                    ? 'Try adjusting your filters'
                    : viewMode === 'all' 
                      ? 'Create your first match to get started'
                      : 'No matches match your current view'
                  }
                </p>
                {!filters.search && !filters.status && !filters.matchType && viewMode === 'all' && (
                  <div className="text-center">
                    <p className="text-gray-600 mb-4">
                      Matches are automatically created when users book your turfs
                    </p>
                    <button
                      onClick={() => navigate('/owner/bookings')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      View Bookings
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}

      <AnimatePresence>
        {showMatchViewer && (
          <MatchViewer
            shareCode={shareCode}
            onClose={() => setShowMatchViewer(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default MatchManagement;
