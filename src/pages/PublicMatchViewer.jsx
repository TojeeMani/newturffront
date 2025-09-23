import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ClockIcon, 
  MapPinIcon, 
  UsersIcon, 
  ShareIcon,
  ArrowPathIcon,
  TrophyIcon,
  FireIcon,
  HomeIcon
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import matchService from '../services/matchService';
import { showSuccessToast, showErrorToast } from '../utils/toast';

const PublicMatchViewer = () => {
  const { shareCode } = useParams();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    loadMatch();
    
    // Set up live updates polling for live matches
    let interval;
    if (isLive) {
      interval = setInterval(loadMatch, 5000); // Poll every 5 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [shareCode, isLive]);

  const loadMatch = async () => {
    try {
      const response = await matchService.getMatchByShareCode(shareCode);
      setMatch(response.data);
      setIsLive(response.data.status === 'live');
      setError(null);
    } catch (err) {
      setError('Match not found or no longer available');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/match/${shareCode}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${match?.matchName} - Live Match`,
          text: `Watch ${match?.matchName} live!`,
          url: shareUrl
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        showSuccessToast('Match link copied to clipboard!');
      }
    } catch (err) {
      showErrorToast('Failed to share match');
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-yellow-100 text-yellow-800';
      case 'live': return 'bg-red-100 text-red-800 animate-pulse';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ArrowPathIcon className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading match...</p>
        </div>
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <TrophyIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Match Not Found</h2>
          <p className="text-gray-600 mb-4">{error || 'This match is no longer available'}</p>
          <Link
            to="/"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <HomeIcon className="w-4 h-4 mr-2" />
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link
                to="/"
                className="mr-4 p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <HomeIcon className="w-6 h-6" />
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{match.matchName}</h1>
                <div className="flex items-center text-sm text-gray-600">
                  <MapPinIcon className="w-4 h-4 mr-1" />
                  <span>{match.turfId?.name}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(match.status)}`}>
                {match.status === 'live' && <FireIcon className="w-4 h-4 mr-1" />}
                <span className="capitalize">{match.status}</span>
              </span>
              <button
                onClick={handleShare}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <ShareIcon className="w-4 h-4 mr-2" />
                Share
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Match Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Match Display */}
          <div className="lg:col-span-2">
            {/* Score Display */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Live Score</h2>
                <div className="flex items-center justify-center text-sm text-gray-600">
                  <ClockIcon className="w-4 h-4 mr-1" />
                  <span>{formatDate(match.startTime)} at {formatTime(match.startTime)}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                {match.teams.map((team, index) => (
                  <div key={index} className="text-center">
                    <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${index === 0 ? 'bg-blue-500' : 'bg-red-500'}`}></div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{team.name}</h3>
                    <div className="text-4xl font-bold text-gray-900 mb-2">{team.score}</div>
                    {team.captain && (
                      <p className="text-sm text-gray-600">Captain: {team.captain}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Statistics */}
            {match.statistics && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Match Statistics</h3>
                
                {/* Possession */}
                {match.statistics.possession && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm font-medium text-gray-700 mb-2">
                      <span>{match.teams[0]?.name}</span>
                      <span>{match.teams[1]?.name}</span>
                    </div>
                    <div className="flex bg-gray-200 rounded-full h-4">
                      <div 
                        className="bg-blue-500 h-4 rounded-l-full"
                        style={{ width: `${match.statistics.possession.team1}%` }}
                      ></div>
                      <div 
                        className="bg-red-500 h-4 rounded-r-full"
                        style={{ width: `${match.statistics.possession.team2}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-600 mt-1">
                      <span>{match.statistics.possession.team1}%</span>
                      <span>{match.statistics.possession.team2}%</span>
                    </div>
                  </div>
                )}

                {/* Other Stats */}
                <div className="grid grid-cols-2 gap-4">
                  {match.statistics.shots && (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {match.statistics.shots.team1} - {match.statistics.shots.team2}
                      </div>
                      <div className="text-sm text-gray-600">Shots</div>
                    </div>
                  )}
                  {match.statistics.fouls && (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {match.statistics.fouls.team1} - {match.statistics.fouls.team2}
                      </div>
                      <div className="text-sm text-gray-600">Fouls</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Live Updates */}
            {match.liveUpdates && match.liveUpdates.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Live Updates</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  <AnimatePresence>
                    {match.liveUpdates.slice().reverse().map((update, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="border-l-4 border-blue-500 pl-4 py-2"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900">
                            {match.teams[update.team]?.name}
                          </span>
                          <span className="text-xs text-gray-500">{update.time}</span>
                        </div>
                        <p className="text-sm text-gray-700">{update.description}</p>
                        {update.player && (
                          <p className="text-xs text-gray-500 mt-1">Player: {update.player}</p>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Match Info */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Match Information</h3>
              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <UsersIcon className="w-4 h-4 mr-2 text-gray-400" />
                  <span className="capitalize">{match.matchType}</span>
                </div>
                <div className="flex items-center text-sm">
                  <ClockIcon className="w-4 h-4 mr-2 text-gray-400" />
                  <span>Started: {formatTime(match.startTime)}</span>
                </div>
                <div className="flex items-center text-sm">
                  <ClockIcon className="w-4 h-4 mr-2 text-gray-400" />
                  <span>Ends: {formatTime(match.endTime)}</span>
                </div>
              </div>
            </div>

            {/* Teams */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Teams</h3>
              <div className="space-y-4">
                {match.teams.map((team, index) => (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="flex items-center mb-2">
                      <div className={`w-3 h-3 rounded-full mr-2 ${index === 0 ? 'bg-blue-500' : 'bg-red-500'}`}></div>
                      <span className="font-medium text-gray-900">{team.name}</span>
                    </div>
                    {team.players && team.players.length > 0 && (
                      <div className="text-sm text-gray-600">
                        <div className="font-medium mb-1">Players:</div>
                        <div className="grid grid-cols-2 gap-1">
                          {team.players.map((player, playerIndex) => (
                            <div key={playerIndex} className="text-xs">
                              {player}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicMatchViewer;
