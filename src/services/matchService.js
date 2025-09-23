import api from './api';

const matchService = {
  // Create a new match
  createMatch: async (matchData) => {
    const response = await api.post('/matches', matchData);
    return response.data;
  },

  // Get all matches
  getMatches: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) params.append(key, filters[key]);
    });
    
    const response = await api.get(`/matches?${params.toString()}`);
    return response.data;
  },

  // Get match by ID
  getMatch: async (matchId) => {
    const response = await api.get(`/matches/${matchId}`);
    return response.data;
  },

  // Get match by share code
  getMatchByShareCode: async (shareCode) => {
    const response = await api.get(`/matches/share/${shareCode}`);
    return response.data;
  },

  // Update match status
  updateMatchStatus: async (matchId, status) => {
    const response = await api.put(`/matches/${matchId}/status`, { status });
    return response.data;
  },

  // Update match score
  updateMatchScore: async (matchId, teamIndex, score) => {
    const response = await api.put(`/matches/${matchId}/score`, { teamIndex, score });
    return response.data;
  },

  // Add live update
  addLiveUpdate: async (matchId, updateData) => {
    const response = await api.post(`/matches/${matchId}/live-update`, updateData);
    return response.data;
  },

  // Update match statistics
  updateMatchStatistics: async (matchId, statistics) => {
    const response = await api.put(`/matches/${matchId}/statistics`, { statistics });
    return response.data;
  },

  // Delete match
  deleteMatch: async (matchId) => {
    const response = await api.delete(`/matches/${matchId}`);
    return response.data;
  }
};

export default matchService;
