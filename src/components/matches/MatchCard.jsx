import React from 'react';
import { motion } from 'framer-motion';
import { 
  ClockIcon, 
  MapPinIcon, 
  UsersIcon, 
  ShareIcon,
  PlayIcon,
  PauseIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const MatchCard = ({ match, onStartMatch, onPauseMatch, onCompleteMatch, onShare }) => {
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'live': return <PlayIcon className="w-4 h-4" />;
      case 'completed': return <CheckCircleIcon className="w-4 h-4" />;
      case 'cancelled': return <PauseIcon className="w-4 h-4" />;
      default: return <ClockIcon className="w-4 h-4" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{match.matchName}</h3>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(match.status)}`}>
            {getStatusIcon(match.status)}
            <span className="ml-1 capitalize">{match.status}</span>
          </span>
        </div>
        <div className="mt-2 flex items-center text-sm text-gray-600">
          <MapPinIcon className="w-4 h-4 mr-1" />
          <span>{match.turfId?.name}</span>
        </div>
        {match.customerName && (
          <div className="mt-1 text-sm text-gray-600">
            <span className="font-medium">Booked by:</span> {match.customerName}
          </div>
        )}
      </div>

      {/* Match Details */}
      <div className="p-4">
        {/* Teams and Score */}
        <div className="mb-4">
          {match.teams.map((team, index) => (
            <div key={index} className="flex items-center justify-between py-2">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-3 ${index === 0 ? 'bg-blue-500' : 'bg-red-500'}`}></div>
                <span className="font-medium text-gray-900">{team.name}</span>
                {team.captain && (
                  <span className="ml-2 text-sm text-gray-500">(C: {team.captain})</span>
                )}
              </div>
              <div className="text-2xl font-bold text-gray-900">{team.score}</div>
            </div>
          ))}
        </div>

        {/* Match Info */}
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center">
            <ClockIcon className="w-4 h-4 mr-2" />
            <span>{formatDate(match.startTime)} at {formatTime(match.startTime)}</span>
          </div>
          <div className="flex items-center">
            <UsersIcon className="w-4 h-4 mr-2" />
            <span className="capitalize">{match.matchType}</span>
          </div>
        </div>

        {/* Live Updates Preview */}
        {match.liveUpdates && match.liveUpdates.length > 0 && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Recent Updates</h4>
            <div className="space-y-1">
              {match.liveUpdates.slice(-3).map((update, index) => (
                <div key={index} className="text-sm text-gray-600">
                  <span className="font-medium">{update.time}'</span> - {update.description}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
        <div className="flex space-x-2">
          {match.status === 'scheduled' && (
            <button
              onClick={() => onStartMatch(match._id)}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <PlayIcon className="w-4 h-4 mr-1" />
              Start Match
            </button>
          )}
          {match.status === 'live' && (
            <>
              <button
                onClick={() => onPauseMatch(match._id)}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
              >
                <PauseIcon className="w-4 h-4 mr-1" />
                Pause
              </button>
              <button
                onClick={() => onCompleteMatch(match._id)}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <CheckCircleIcon className="w-4 h-4 mr-1" />
                Complete
              </button>
            </>
          )}
        </div>
        
        <button
          onClick={() => onShare(match.shareCode)}
          className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <ShareIcon className="w-4 h-4 mr-1" />
          Share
        </button>
      </div>
    </motion.div>
  );
};

export default MatchCard;
