import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PlayIcon, 
  PauseIcon, 
  StopIcon,
  PlusIcon,
  MinusIcon,
  ClockIcon,
  UsersIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';
import matchService from '../../services/matchService';
import { showSuccessToast, showErrorToast } from '../../utils/toast';

const LiveMatchControl = ({ match, onUpdate }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [liveUpdate, setLiveUpdate] = useState({
    type: 'general',
    team: 0,
    player: '',
    description: '',
    time: ''
  });

  const matchTypes = {
    football: {
      updateTypes: [
        { value: 'goal', label: 'Goal' },
        { value: 'card', label: 'Card' },
        { value: 'substitution', label: 'Substitution' },
        { value: 'general', label: 'General Update' }
      ],
      stats: ['possession', 'shots', 'fouls']
    },
    cricket: {
      updateTypes: [
        { value: 'wicket', label: 'Wicket' },
        { value: 'run', label: 'Run' },
        { value: 'general', label: 'General Update' }
      ],
      stats: ['overs']
    },
    basketball: {
      updateTypes: [
        { value: 'quarter', label: 'Quarter Update' },
        { value: 'general', label: 'General Update' }
      ],
      stats: ['quarters']
    }
  };

  const currentMatchType = matchTypes[match.matchType] || matchTypes.football;

  const handleScoreUpdate = async (teamIndex, change) => {
    if (isUpdating) return;
    
    setIsUpdating(true);
    try {
      const newScore = Math.max(0, match.teams[teamIndex].score + change);
      await matchService.updateMatchScore(match._id, teamIndex, newScore);
      onUpdate();
      showSuccessToast('Score updated successfully');
    } catch (error) {
      showErrorToast('Failed to update score');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStatusUpdate = async (status) => {
    if (isUpdating) return;
    
    setIsUpdating(true);
    try {
      await matchService.updateMatchStatus(match._id, status);
      onUpdate();
      showSuccessToast(`Match ${status} successfully`);
    } catch (error) {
      showErrorToast(`Failed to ${status} match`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLiveUpdate = async (e) => {
    e.preventDefault();
    if (isUpdating || !liveUpdate.description.trim()) return;
    
    setIsUpdating(true);
    try {
      await matchService.addLiveUpdate(match._id, liveUpdate);
      setLiveUpdate({
        type: 'general',
        team: 0,
        player: '',
        description: '',
        time: ''
      });
      onUpdate();
      showSuccessToast('Live update added successfully');
    } catch (error) {
      showErrorToast('Failed to add live update');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStatisticsUpdate = async (statType, teamIndex, change) => {
    if (isUpdating) return;
    
    setIsUpdating(true);
    try {
      const currentStats = match.statistics || {};
      const teamKey = teamIndex === 0 ? 'team1' : 'team2';
      
      if (statType === 'possession') {
        const newTeam1 = teamIndex === 0 
          ? Math.min(100, Math.max(0, (currentStats.possession?.team1 || 50) + change))
          : (currentStats.possession?.team1 || 50);
        const newTeam2 = 100 - newTeam1;
        
        await matchService.updateMatchStatistics(match._id, {
          possession: { team1: newTeam1, team2: newTeam2 }
        });
      } else {
        const currentValue = currentStats[statType]?.[teamKey] || 0;
        const newValue = Math.max(0, currentValue + change);
        
        await matchService.updateMatchStatistics(match._id, {
          [statType]: {
            ...currentStats[statType],
            [teamKey]: newValue
          }
        });
      }
      
      onUpdate();
      showSuccessToast('Statistics updated successfully');
    } catch (error) {
      showErrorToast('Failed to update statistics');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
      {/* Match Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{match.matchName}</h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 animate-pulse">
              <PlayIcon className="w-4 h-4 mr-1" />
              LIVE
            </span>
            <span className="text-sm text-gray-600">
              {new Date(match.startTime).toLocaleDateString()} at {new Date(match.startTime).toLocaleTimeString()}
            </span>
          </div>
          <button
            onClick={() => handleStatusUpdate('completed')}
            disabled={isUpdating}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
          >
            <StopIcon className="w-4 h-4 mr-2" />
            End Match
          </button>
        </div>
      </div>

      {/* Score Display */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Score</h3>
        <div className="grid grid-cols-2 gap-4">
          {match.teams.map((team, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">{team.name}</h4>
                <div className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-blue-500' : 'bg-red-500'}`}></div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold text-gray-900">{team.score}</span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleScoreUpdate(index, -1)}
                    disabled={isUpdating || team.score <= 0}
                    className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <MinusIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleScoreUpdate(index, 1)}
                    disabled={isUpdating}
                    className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <PlusIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Statistics */}
      {currentMatchType.stats.includes('possession') && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Possession</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">{match.teams[0]?.name}</span>
              <span className="text-sm font-medium text-gray-700">{match.teams[1]?.name}</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleStatisticsUpdate('possession', 0, -5)}
                disabled={isUpdating}
                className="p-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
              >
                <MinusIcon className="w-3 h-3" />
              </button>
              <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
                <div 
                  className="bg-blue-500 h-4 rounded-l-full"
                  style={{ width: `${match.statistics?.possession?.team1 || 50}%` }}
                ></div>
                <div 
                  className="bg-red-500 h-4 rounded-r-full absolute top-0 right-0"
                  style={{ width: `${match.statistics?.possession?.team2 || 50}%` }}
                ></div>
              </div>
              <button
                onClick={() => handleStatisticsUpdate('possession', 0, 5)}
                disabled={isUpdating}
                className="p-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
              >
                <PlusIcon className="w-3 h-3" />
              </button>
            </div>
            <div className="flex justify-between text-xs text-gray-600 mt-2">
              <span>{match.statistics?.possession?.team1 || 50}%</span>
              <span>{match.statistics?.possession?.team2 || 50}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Live Updates */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Live Updates</h3>
        <form onSubmit={handleLiveUpdate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Update Type</label>
              <select
                value={liveUpdate.type}
                onChange={(e) => setLiveUpdate({ ...liveUpdate, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {currentMatchType.updateTypes.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Team</label>
              <select
                value={liveUpdate.team}
                onChange={(e) => setLiveUpdate({ ...liveUpdate, team: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {match.teams.map((team, index) => (
                  <option key={index} value={index}>{team.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Player</label>
              <input
                type="text"
                value={liveUpdate.player}
                onChange={(e) => setLiveUpdate({ ...liveUpdate, player: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Player name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
              <input
                type="text"
                value={liveUpdate.time}
                onChange={(e) => setLiveUpdate({ ...liveUpdate, time: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 45', 2nd half"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={liveUpdate.description}
              onChange={(e) => setLiveUpdate({ ...liveUpdate, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="Describe what happened..."
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={isUpdating || !liveUpdate.description.trim()}
            className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUpdating ? 'Adding...' : 'Add Live Update'}
          </button>
        </form>
      </div>

      {/* Recent Updates */}
      {match.liveUpdates && match.liveUpdates.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Updates</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            <AnimatePresence>
              {match.liveUpdates.slice().reverse().map((update, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-gray-50 rounded-lg p-3"
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
  );
};

export default LiveMatchControl;
