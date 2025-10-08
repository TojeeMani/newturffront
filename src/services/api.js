const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    console.log('🔧 API Service initialized with baseURL:', this.baseURL);
    console.log('🔧 Environment REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
  }

  // Helper method to get auth headers
  getAuthHeaders() {
    const token = localStorage.getItem('token');
    console.log('🔍 API Service - Token available:', !!token);
    if (token) {
      console.log('🔍 API Service - Adding Authorization header');
    } else {
      console.warn('⚠️ API Service - No token found in localStorage');
    }
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };
  }

  // Helper method to handle API responses
  async handleResponse(response) {
    let data = null;
    try {
      // Only attempt JSON parse when content-type is JSON
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = text ? { message: text } : {};
      }
    } catch (_) {
      data = {};
    }

    if (!response.ok) {
      const message = data.message || data.error || response.statusText || 'Something went wrong';
      const error = new Error(message);
      error.type = data.type || 'GENERAL_ERROR';
      error.response = { data };
      throw error;
    }

    return data;
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getAuthHeaders(),
      ...options
    };

    console.log('🌐 API Request:', {
      url,
      method: config.method || 'GET',
      baseURL: this.baseURL,
      endpoint
    });

    try {
      const response = await fetch(url, config);
      console.log('🌐 API Response:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('🚨 API request failed:', {
        error: error.message,
        url,
        baseURL: this.baseURL,
        endpoint
      });
      throw error;
    }
  }

  // HTTP method helpers
  async get(endpoint, options = {}) {
    return this.request(endpoint, {
      method: 'GET',
      ...options
    });
  }

  async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options
    });
  }

  async put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...options
    });
  }

  async delete(endpoint, options = {}) {
    return this.request(endpoint, {
      method: 'DELETE',
      ...options
    });
  }

  // Authentication methods
  async login(credentials) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  }

  async register(userData) {
    console.log('🌐 API: Registering user with data:', userData);
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    console.log('🌐 API: Register response:', response);
    return response;
  }

  async firebaseAuth(firebaseToken) {
    return this.request('/auth/firebase', {
      method: 'POST',
      body: JSON.stringify({ firebaseToken })
    });
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  async getMe() {
    return this.request('/auth/me');
  }

  async updateProfile(profileData) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  }

  async logout() {
    return this.request('/auth/logout', {
      method: 'POST'
    });
  }

  async forgotPassword(email) {
    return this.request('/auth/forgotpassword', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  }

  async resetPassword(resetToken, password) {
    return this.request(`/auth/resetpassword/${resetToken}`, {
      method: 'PUT',
      body: JSON.stringify({ password })
    });
  }

  async resendVerification(emailData) {
    return this.request('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify(emailData)
    });
  }

  async verifyOTP(userId, otp) {
    return this.request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ userId, otp })
    });
  }

  async resendOTP(userId) {
    return this.request('/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
  }

  async sendLoginOTP(email) {
    return this.request('/auth/send-login-otp', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  }

  async loginWithOTP(email, otp) {
    return this.request('/auth/login-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp })
    });
  }

  async checkEmailExists(email) {
    return this.request('/auth/check-email', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  }

  // User methods
  async getUserProfile() {
    return this.request('/users/profile');
  }

  async updateUserProfile(profileData) {
    return this.request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  }

  // Turf methods
  async getTurfs(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/turfs?${queryString}` : '/turfs';
    return this.request(endpoint);
  }

  async getTurf(id) {
    return this.request(`/turfs/${id}`);
  }

  async createTurf(turfData) {
    return this.request('/turfs', {
      method: 'POST',
      body: JSON.stringify(turfData)
    });
  }

  async updateTurf(id, turfData) {
    return this.request(`/turfs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(turfData)
    });
  }

  async deleteTurf(id) {
    return this.request(`/turfs/${id}`, {
      method: 'DELETE'
    });
  }

  // Booking methods
  async getBookings() {
    return this.request('/bookings');
  }

  async getBooking(id) {
    return this.request(`/bookings/${id}`);
  }

  async createBooking(bookingData) {
    return this.request('/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData)
    });
  }

  async updateBooking(id, bookingData) {
    return this.request(`/bookings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(bookingData)
    });
  }

  async cancelBooking(id) {
    return this.request(`/bookings/${id}`, {
      method: 'DELETE'
    });
  }

  // Upload profile image via backend
  async uploadProfileImage(file) {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`${this.baseURL}/upload/profile`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Profile image upload failed');
    }

    return await response.json();
  }

  // Upload a single file to Cloudinary (direct upload)
  async uploadDocumentToCloudinary(file) {
    const formData = new FormData();
    const uploadPreset = process.env.REACT_APP_CLOUDINARY_PRESET || 'turfease';
    const cloudName = process.env.REACT_APP_CLOUDINARY_CLOUD || 'dlegjx9sw';

    console.log('🧪 Uploading to Cloudinary with:', { uploadPreset, cloudName });

    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    const url = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;

    const response = await fetch(url, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const error = await response.text(); // Show raw error
      console.error('🚨 Cloudinary upload error:', error);
      throw new Error('Cloudinary upload failed');
    }
  
    const data = await response.json();
    return data.secure_url;
  }
  
  // Payment methods
  async createPaymentOrder({ bookingId, amount }) {
    return this.post('/payment/create-order', { bookingId, amount });
  }

  async verifyPayment(payload) {
    return this.post('/payment/verify', payload);
  }
  
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;