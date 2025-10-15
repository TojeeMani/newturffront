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

  // Reviews
  async getTurfReviews(turfId) {
    try {
      return await api.request(`/turfs/${turfId}/reviews`);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async canReviewTurf(turfId) {
    try {
      const res = await api.request(`/turfs/${turfId}/reviews/can`);
      const data = res?.data || res;
      return data?.data?.eligible ?? false;
    } catch (error) {
      // If unauthorized or no booking, treat as not eligible
      return false;
    }
  }

  async createReview(turfId, { rating, comment }) {
    try {
      const res = await api.request(`/turfs/${turfId}/reviews`, {
        method: 'POST',
        body: JSON.stringify({ rating, comment })
      });
      return res;
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
      const response = await api.request('/turfs/owner/my');
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Alias for getMyTurfs
  async getOwnerTurfs() {
    return this.getMyTurfs();
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

  // Add sport to existing turf (private/owner)
  async addSportToTurf(turfId, sportData) {
    try {
      const response = await api.request(`/turfs/${turfId}/sports`, {
        method: 'POST',
        body: JSON.stringify(sportData)
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
      files.forEach((file) => { formData.append('images', file); });

      const token = localStorage.getItem('token');
      if (!token) throw new Error('You must be logged in to upload images');
      const headers = { Authorization: `Bearer ${token}` };

      const uploadUrl = `${api.baseURL}/upload/images`;
      const response = await fetch(uploadUrl, { method: 'POST', headers, body: formData });
      if (!response.ok) {
        let errorData = {};
        try {
          const contentType = response.headers.get('content-type') || '';
          errorData = contentType.includes('application/json') ? await response.json() : { message: await response.text() };
        } catch {}
        const message = errorData.message || errorData.error || response.statusText || 'Upload failed';
        throw new Error(message);
      }
      const result = await response.json();
      return result;
    } catch (error) {
      if (error && error.message) throw new Error(error.message);
      throw this.handleError(error);
    }
  }

  // Validate turf data
  validateTurfData(data) {
    const errors = [];
    if (!data.name || data.name.trim().length === 0) errors.push('Turf name is required');
    if (!data.location || !data.location.address) errors.push('Location address is required');
    if (!data.pricePerHour || data.pricePerHour <= 0) errors.push('Valid price per hour is required');
    if (!data.images || data.images.length === 0) errors.push('At least one image is required');
    return { isValid: errors.length === 0, errors };
  }

  // Format turf data for API
  formatTurfData(data) {
    return {
      name: data.name,
      location: { address: data.location?.address || '', coordinates: data.location?.coordinates || null },
      pricePerHour: parseFloat(data.pricePerHour) || 0,
      images: data.images || [],
      sport: data.sport || '',
      description: data.description || '',
      amenities: data.amenities || [],
      availableSlots: data.availableSlots || {},
      slotDuration: parseInt(data.slotDuration) || 60,
      advanceBookingDays: parseInt(data.advanceBookingDays) || 30
    };
  }

  // Check slot availability for a specific turf and date
  async checkSlotAvailability(turfId, date, startTime, endTime) {
    try {
      const qs = new URLSearchParams({ date, startTime, endTime }).toString();
      const response = await api.request(`/turfs/${turfId}/slots/check?${qs}`);
      // Normalize return to boolean
      const available = response?.data?.available ?? response?.available ?? false;
      return { available };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get available slots for a turf on a specific date
  async getAvailableSlots(turfId, date, courtType = 'full') {
    try {
      const response = await api.request(`/turfs/${turfId}/slots/available?date=${date}&courtType=${courtType}`);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Book a slot (offline booking by owner)
  async bookSlot(turfId, bookingData) {
    try {
      const response = await api.request(`/turfs/${turfId}/slots/book`, {
        method: 'POST',
        body: JSON.stringify(bookingData)
      });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Allocate slots for a specific day (private/owner)
  async allocateSlotsForDay(turfId, allocation) {
    try {
      const response = await api.request(`/turfs/${turfId}/slots/allocate`, {
        method: 'POST',
        body: JSON.stringify(allocation)
      });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Cancel a slot booking
  async cancelSlotBooking(turfId, date, startTime, endTime) {
    try {
      const response = await api.request(`/turfs/${turfId}/slots/cancel`, {
        method: 'DELETE',
        body: JSON.stringify({ date, startTime, endTime })
      });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get turf bookings for a specific date
  async getTurfBookings(turfId, date) {
    try {
      const response = await api.request(`/turfs/${turfId}/bookings?date=${date}`);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get all bookings for owner's turfs
  async getOwnerBookings(filters = {}) {
    try {
      const queryString = new URLSearchParams(filters).toString();
      const endpoint = queryString ? `/turfs/owner/bookings?${queryString}` : '/turfs/owner/bookings';
      const response = await api.request(endpoint);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get owner analytics data
  async getOwnerAnalytics(period = '30d') {
    try {
      console.log('📊 TurfService: Fetching analytics for period:', period);
      // Add cache-busting parameter to avoid 304 responses
      const cacheBuster = Date.now();
      const response = await api.request(`/turfs/owner/analytics?period=${period}&_t=${cacheBuster}`);
      console.log('📊 TurfService: Analytics response received:', response);
      console.log('📊 TurfService: Response type:', typeof response);
      console.log('📊 TurfService: Response keys:', Object.keys(response));
      
      // Check if response has the expected structure
      if (response && response.data) {
        console.log('📊 TurfService: Response has data property:', response.data);
        return response.data;
      } else if (response && !response.data) {
        console.log('📊 TurfService: Response is direct data, no data wrapper');
        return response;
      } else {
        console.log('📊 TurfService: Response structure unclear, returning as-is');
        return response;
      }
    } catch (error) {
      console.error('📊 TurfService: Error fetching analytics:', error);
      throw this.handleError(error);
    }
  }

  // Get owner customers data
  async getOwnerCustomers(filters = {}) {
    try {
      const queryString = new URLSearchParams(filters).toString();
      const endpoint = queryString ? `/turfs/owner/customers?${queryString}` : '/turfs/owner/customers';
      const response = await api.request(endpoint);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Handle API errors
  handleError(error) {
    if (error.response) {
      const message = error.response.data?.message || error.response.data?.error || 'An error occurred';
      return new Error(message);
    } else if (error.request) {
      return new Error('Network error. Please check your connection.');
    } else {
      return new Error('An unexpected error occurred.');
    }
  }
}

const turfService = new TurfService();
export default turfService;
