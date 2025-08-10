import api from './api';

class TurfService {
  // Get all turfs (public)
  async getAllTurfs(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const endpoint = queryString ? `/turfs?${queryString}` : '/turfs';
      const response = await api.request(endpoint);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get single turf (public)
  async getTurf(id) {
    try {
      const response = await api.request(`/turfs/${id}`);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get nearby turfs (public)
  async getNearbyTurfs(lat, lng, distance = 10000) {
    try {
      const params = { lat, lng, distance };
      const queryString = new URLSearchParams(params).toString();
      const response = await api.request(`/turfs/nearby?${queryString}`);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get owner's turfs (private)
  async getMyTurfs() {
    try {
      console.log('🔍 TurfService - Making API call to /turfs/owner/my');
      const token = localStorage.getItem('token');
      console.log('🔍 TurfService - Token available:', !!token);

      const response = await api.request('/turfs/owner/my');
      console.log('🔍 TurfService - API response received:', response);
      return response;
    } catch (error) {
      console.error('❌ TurfService - API call failed:', error);
      throw this.handleError(error);
    }
  }

  // Create new turf (private/owner)
  async createTurf(turfData) {
    try {
      const response = await api.request('/turfs', {
        method: 'POST',
        body: JSON.stringify(turfData)
      });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Update turf (private/owner)
  async updateTurf(id, turfData) {
    try {
      const response = await api.request(`/turfs/${id}`, {
        method: 'PUT',
        body: JSON.stringify(turfData)
      });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Delete turf (private/owner)
  async deleteTurf(id) {
    try {
      const response = await api.request(`/turfs/${id}`, {
        method: 'DELETE'
      });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Approve turf (private/admin)
  async approveTurf(id) {
    try {
      const response = await api.request(`/turfs/${id}/approve`, {
        method: 'PUT'
      });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Upload turf images
  async uploadImages(files) {
    try {
      const formData = new FormData();
      files.forEach((file, index) => {
        formData.append('images', file);
      });

      // For file uploads, we need to handle the headers differently
      const token = localStorage.getItem('token');
      const headers = {
        ...(token && { Authorization: `Bearer ${token}` })
      };

      const response = await fetch(`http://localhost:5001/api/upload/images`, {
        method: 'POST',
        headers,
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }

      return await response.json();
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Validate turf data
  validateTurfData(data) {
    const errors = [];

    if (!data.name || data.name.trim().length === 0) {
      errors.push('Turf name is required');
    }

    if (!data.location || !data.location.address) {
      errors.push('Location address is required');
    }

    if (!data.location || !data.location.coordinates) {
      errors.push('Location coordinates are required');
    }

    if (!data.pricePerHour || data.pricePerHour <= 0) {
      errors.push('Valid price per hour is required');
    }

    if (!data.images || data.images.length === 0) {
      errors.push('At least one image is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Format turf data for API
  formatTurfData(data) {
    return {
      name: data.name,
      location: {
        address: data.location.address,
        coordinates: {
          lat: data.location.coordinates.lat,
          lng: data.location.coordinates.lng
        }
      },
      pricePerHour: parseFloat(data.pricePerHour),
      images: data.images
    };
  }

  // Handle API errors
  handleError(error) {
    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.message || 'An error occurred';
      return new Error(message);
    } else if (error.request) {
      // Request was made but no response received
      return new Error('Network error. Please check your connection.');
    } else {
      // Something else happened
      return new Error('An unexpected error occurred.');
    }
  }
}

const turfService = new TurfService();
export default turfService;
