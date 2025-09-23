import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import turfService from '../../services/turfService';
import { showSuccessToast, showErrorToast } from '../../utils/toast';

const CreateMatchModal = ({ isOpen, onClose, onMatchCreated }) => {
  const [formData, setFormData] = useState({
    turfId: '',
    matchName: '',
    matchType: 'football',
    startTime: '',
    endTime: '',
    teams: [
      { name: '', players: [], captain: '' },
      { name: '', players: [], captain: '' }
    ]
  });
  const [turfOptions, setTurfOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      loadTurfs();
      // Set default times
      const now = new Date();
      const startTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
      const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000); // 2 hours later
      
      setFormData(prev => ({
        ...prev,
        startTime: startTime.toISOString().slice(0, 16),
        endTime: endTime.toISOString().slice(0, 16)
      }));
    }
  }, [isOpen]);

  const loadTurfs = async () => {
    try {
      const response = await turfService.getTurfs();
      setTurfOptions(response.data);
    } catch (error) {
      showErrorToast('Failed to load turfs');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleTeamChange = (teamIndex, field, value) => {
    setFormData(prev => ({
      ...prev,
      teams: prev.teams.map((team, index) => 
        index === teamIndex ? { ...team, [field]: value } : team
      )
    }));
  };

  const handlePlayerAdd = (teamIndex) => {
    setFormData(prev => ({
      ...prev,
      teams: prev.teams.map((team, index) => 
        index === teamIndex 
          ? { ...team, players: [...team.players, ''] }
          : team
      )
    }));
  };

  const handlePlayerChange = (teamIndex, playerIndex, value) => {
    setFormData(prev => ({
      ...prev,
      teams: prev.teams.map((team, index) => 
        index === teamIndex 
          ? { 
              ...team, 
              players: team.players.map((player, pIndex) => 
                pIndex === playerIndex ? value : player
              )
            }
          : team
      )
    }));
  };

  const handlePlayerRemove = (teamIndex, playerIndex) => {
    setFormData(prev => ({
      ...prev,
      teams: prev.teams.map((team, index) => 
        index === teamIndex 
          ? { 
              ...team, 
              players: team.players.filter((_, pIndex) => pIndex !== playerIndex)
            }
          : team
      )
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.turfId) newErrors.turfId = 'Please select a turf';
    if (!formData.matchName.trim()) newErrors.matchName = 'Match name is required';
    if (!formData.startTime) newErrors.startTime = 'Start time is required';
    if (!formData.endTime) newErrors.endTime = 'End time is required';
    
    if (new Date(formData.startTime) >= new Date(formData.endTime)) {
      newErrors.endTime = 'End time must be after start time';
    }

    formData.teams.forEach((team, index) => {
      if (!team.name.trim()) {
        newErrors[`team${index}Name`] = `Team ${index + 1} name is required`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showErrorToast('Please fix the errors below');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/matches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to create match');
      }

      const result = await response.json();
      showSuccessToast('Match created successfully!');
      onMatchCreated(result.data);
      onClose();
    } catch (error) {
      showErrorToast('Failed to create match');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      turfId: '',
      matchName: '',
      matchType: 'football',
      startTime: '',
      endTime: '',
      teams: [
        { name: '', players: [], captain: '' },
        { name: '', players: [], captain: '' }
      ]
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Create New Match</h2>
            <button
              onClick={handleClose}
              className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Turf *
                </label>
                <select
                  name="turfId"
                  value={formData.turfId}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.turfId ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select a turf</option>
                  {turfOptions.map((turf) => (
                    <option key={turf._id} value={turf._id}>
                      {turf.name} - {turf.location}
                    </option>
                  ))}
                </select>
                {errors.turfId && <p className="text-red-500 text-sm mt-1">{errors.turfId}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Match Name *
                </label>
                <input
                  type="text"
                  name="matchName"
                  value={formData.matchName}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.matchName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Championship Final"
                />
                {errors.matchName && <p className="text-red-500 text-sm mt-1">{errors.matchName}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Match Type
                </label>
                <select
                  name="matchType"
                  value={formData.matchType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="football">Football</option>
                  <option value="cricket">Cricket</option>
                  <option value="basketball">Basketball</option>
                  <option value="tennis">Tennis</option>
                  <option value="badminton">Badminton</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time *
                </label>
                <input
                  type="datetime-local"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.startTime ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.startTime && <p className="text-red-500 text-sm mt-1">{errors.startTime}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Time *
                </label>
                <input
                  type="datetime-local"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.endTime ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.endTime && <p className="text-red-500 text-sm mt-1">{errors.endTime}</p>}
              </div>
            </div>

            {/* Teams */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Teams</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {formData.teams.map((team, teamIndex) => (
                  <div key={teamIndex} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center mb-4">
                      <div className={`w-4 h-4 rounded-full mr-2 ${teamIndex === 0 ? 'bg-blue-500' : 'bg-red-500'}`}></div>
                      <h4 className="text-lg font-medium text-gray-900">Team {teamIndex + 1}</h4>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Team Name *
                        </label>
                        <input
                          type="text"
                          value={team.name}
                          onChange={(e) => handleTeamChange(teamIndex, 'name', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            errors[`team${teamIndex}Name`] ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder={`Team ${teamIndex + 1} name`}
                        />
                        {errors[`team${teamIndex}Name`] && (
                          <p className="text-red-500 text-sm mt-1">{errors[`team${teamIndex}Name`]}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Captain
                        </label>
                        <input
                          type="text"
                          value={team.captain}
                          onChange={(e) => handleTeamChange(teamIndex, 'captain', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Captain name"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Players
                          </label>
                          <button
                            type="button"
                            onClick={() => handlePlayerAdd(teamIndex)}
                            className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-700"
                          >
                            <PlusIcon className="w-4 h-4 mr-1" />
                            Add Player
                          </button>
                        </div>
                        <div className="space-y-2">
                          {team.players.map((player, playerIndex) => (
                            <div key={playerIndex} className="flex items-center space-x-2">
                              <input
                                type="text"
                                value={player}
                                onChange={(e) => handlePlayerChange(teamIndex, playerIndex, e.target.value)}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder={`Player ${playerIndex + 1}`}
                              />
                              <button
                                type="button"
                                onClick={() => handlePlayerRemove(teamIndex, playerIndex)}
                                className="p-2 text-red-600 hover:text-red-700"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Match'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CreateMatchModal;
