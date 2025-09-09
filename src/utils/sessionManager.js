import { jwtDecode } from 'jwt-decode';

class SessionManager {
  constructor() {
    this.checkInterval = null;
    this.warningShown = false;
    this.onSessionExpired = null;
    this.onSessionWarning = null;
  }

  // Initialize session monitoring
  init(onSessionExpired, onSessionWarning) {
    this.onSessionExpired = onSessionExpired;
    this.onSessionWarning = onSessionWarning;
    this.startMonitoring();
  }

  // Start monitoring session
  startMonitoring() {
    // Check every minute
    this.checkInterval = setInterval(() => {
      this.checkSession();
    }, 60000);

    // Check immediately
    this.checkSession();
  }

  // Stop monitoring
  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.warningShown = false;
  }

  // Check if session is valid
  checkSession() {
    const token = localStorage.getItem('token');
    
    if (!token) {
      this.handleSessionExpired();
      return false;
    }

    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      const timeUntilExpiry = decoded.exp - currentTime;

      // Token expired
      if (timeUntilExpiry <= 0) {
        this.handleSessionExpired();
        return false;
      }

      // Token expires in 5 minutes - show warning
      if (timeUntilExpiry <= 300 && !this.warningShown) {
        this.handleSessionWarning(Math.floor(timeUntilExpiry / 60));
        this.warningShown = true;
        return true;
      }

      // Reset warning if token has more than 5 minutes
      if (timeUntilExpiry > 300) {
        this.warningShown = false;
      }

      return true;
    } catch (error) {
      console.error('Error decoding token:', error);
      this.handleSessionExpired();
      return false;
    }
  }

  // Handle session expiration
  handleSessionExpired() {
    this.stopMonitoring();
    localStorage.removeItem('token');
    
    if (this.onSessionExpired) {
      this.onSessionExpired();
    }
  }

  // Handle session warning
  handleSessionWarning(minutesLeft) {
    if (this.onSessionWarning) {
      this.onSessionWarning(minutesLeft);
    }
  }

  // Get time until expiry
  getTimeUntilExpiry() {
    const token = localStorage.getItem('token');
    
    if (!token) return 0;

    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      return Math.max(0, decoded.exp - currentTime);
    } catch (error) {
      return 0;
    }
  }

  // Check if token is valid
  isTokenValid() {
    return this.getTimeUntilExpiry() > 0;
  }

  // Refresh session (extend token)
  async refreshSession() {
    try {
      // For now, just extend the current token by resetting the warning
      // In a real app, you would call your refresh token endpoint
      this.warningShown = false;
      return true;
    } catch (error) {
      console.error('Error refreshing session:', error);
      return false;
    }
  }

  // Manual logout
  logout() {
    this.stopMonitoring();
    localStorage.removeItem('token');
  }
}

// Create singleton instance
const sessionManager = new SessionManager();

export default sessionManager;
