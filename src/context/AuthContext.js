import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from '../firebase/config';
import apiService from '../services/api';

// Initial state
const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  loading: true,
  error: null,
  needsProfileCompletion: false
};

// Action types
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_LOADING: 'SET_LOADING',
  UPDATE_PROFILE: 'UPDATE_PROFILE'
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
      return {
        ...state,
        loading: true,
        error: null
      };
    
    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
        error: null,
        needsProfileCompletion: action.payload.user?.needsProfileCompletion || false
      };
    
    case AUTH_ACTIONS.LOGIN_FAILURE:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: action.payload
      };
    
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: null,
        needsProfileCompletion: false
      };
    
    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };
    
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };
    
    case AUTH_ACTIONS.UPDATE_PROFILE:
      return {
        ...state,
        user: action.payload.user,
        needsProfileCompletion: action.payload.user?.needsProfileCompletion || false
      };
    
    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check if user is authenticated on app load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('token');

        if (token) {
          // If we have a token, try to get user info
          try {
            const response = await apiService.getMe();
            if (response.success) {
              dispatch({
                type: AUTH_ACTIONS.LOGIN_SUCCESS,
                payload: {
                  user: response.user,
                  token: token
                }
              });
              return;
            }
          } catch (error) {
            console.log('Token validation failed, clearing token');
            localStorage.removeItem('token');
          }
        }

        // No valid token, set loading to false
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      } catch (error) {
        console.error('Auth initialization failed:', error);
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      }
    };

    // Initialize auth immediately
    initializeAuth();

    // Set up Firebase auth state listener (but don't block initial load)
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // Only handle Firebase auth changes if we don't already have a valid session
      if (firebaseUser && !state.isAuthenticated) {
        try {
          const firebaseToken = await firebaseUser.getIdToken();
          const response = await apiService.firebaseAuth(firebaseToken);

          if (response.success) {
            localStorage.setItem('token', response.token);
            dispatch({
              type: AUTH_ACTIONS.LOGIN_SUCCESS,
              payload: {
                user: response.user,
                token: response.token
              }
            });
          }
        } catch (error) {
          console.error('Firebase auth check failed:', error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Login function
  const login = useCallback(async (credentials) => {
    try {
      dispatch({ type: AUTH_ACTIONS.LOGIN_START });

      // Authenticate with backend API
      const response = await apiService.login(credentials);

      // Store the JWT token from backend
      localStorage.setItem('token', response.token);

      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: {
          user: response.user,
          token: response.token
        }
      });

      return { success: true, user: response.user };
    } catch (error) {
      // Parse error response to get type and message
      let errorMessage = error.message || 'Login failed. Please try again.';
      let errorType = error.type || 'GENERAL_ERROR';

      // If error has response data, use that
      if (error.response && error.response.data) {
        errorMessage = error.response.data.message || error.message;
        errorType = error.response.data.type || errorType;
      }

      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: errorMessage
      });

      return {
        success: false,
        error: errorMessage,
        type: errorType
      };
    }
  }, []);

  // Register function
  const register = useCallback(async (userData) => {
    try {
      console.log('🔧 AuthContext: Starting registration...');
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      
      // Send registration data to backend API only
      console.log('🔧 AuthContext: Sending registration data to backend...');
      const backendResponse = await apiService.register(userData);
      
      if (!backendResponse.success) {
        throw new Error(backendResponse.message || 'Backend registration failed');
      }
      
      console.log('🔧 AuthContext: Backend registration successful');
      
      // Don't create Firebase user for normal registration
      // Firebase is only used for Google authentication
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      
      return {
        success: true,
        message: backendResponse.message || 'Registration successful! You can now login to your account.',
        userType: backendResponse.userType || userData.userType,
        userId: backendResponse.userId,
        email: backendResponse.email,
        requiresOtpVerification: backendResponse.requiresOtpVerification
      };
    } catch (error) {
      console.log('🔧 AuthContext: Registration error:', error);
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: error.message
      });
      return { success: false, error: error.message };
    }
  }, []);

  // Google OAuth function
  const googleAuth = useCallback(async () => {
    try {
      dispatch({ type: AUTH_ACTIONS.LOGIN_START });
      
      const provider = new GoogleAuthProvider();
      const { user: firebaseUser } = await signInWithPopup(auth, provider);
      
      // Get Firebase ID token
      const firebaseToken = await firebaseUser.getIdToken();
      
      // Send token to backend for verification and user creation/update
      const response = await apiService.firebaseAuth(firebaseToken);
      
      if (response.success) {
        // Store the JWT token from backend
        localStorage.setItem('token', response.token);
        
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: {
            user: response.user,
            token: response.token
          }
        });

        return { success: true, user: response.user };
      } else {
        throw new Error(response.message || 'Authentication failed');
      }
    } catch (error) {
      console.error('Google auth error:', error);

      // Parse error response to get type and message
      let errorMessage = error.message;
      let errorType = error.type || 'GENERAL_ERROR';

      // If error has response data, use that
      if (error.response && error.response.data) {
        errorMessage = error.response.data.message || error.message;
        errorType = error.response.data.type || errorType;
      }

      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: errorMessage
      });

      return {
        success: false,
        error: errorMessage,
        type: errorType
      };
    }
  }, []);

  // OTP Login function
  const loginWithOTP = useCallback(async (email, otp) => {
    try {
      dispatch({ type: AUTH_ACTIONS.LOGIN_START });

      // Authenticate with backend API using OTP
      const response = await apiService.loginWithOTP(email, otp);

      if (response.success) {
        // Store the JWT token from backend
        localStorage.setItem('token', response.token);

        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: {
            user: response.user,
            token: response.token
          }
        });

        return {
          success: true,
          user: response.user,
          token: response.token
        };
      } else {
        dispatch({
          type: AUTH_ACTIONS.LOGIN_FAILURE,
          payload: response.message || 'OTP login failed'
        });

        return {
          success: false,
          error: response.message || 'OTP login failed'
        };
      }
    } catch (error) {
      console.error('OTP login failed:', error);

      const errorMessage = error.message || 'OTP login failed. Please try again.';

      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: errorMessage
      });

      return {
        success: false,
        error: errorMessage
      };
    }
  }, []);

  // Update profile function
  const updateProfile = useCallback(async (profileData) => {
    try {
      const response = await apiService.updateProfile(profileData);
      
      if (response.success) {
        dispatch({
          type: AUTH_ACTIONS.UPDATE_PROFILE,
          payload: {
            user: response.user
          }
        });
      }
      
      return response;
    } catch (error) {
      console.error('Profile update failed:', error);
      throw error;
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Firebase logout failed:', error);
    } finally {
      // Clear all stored authentication data
      localStorage.removeItem('token');
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  }, []);

  // Clear error function
  const clearError = useCallback(() => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  }, []);

  // Context value
  const value = {
    ...state,
    login,
    register,
    googleAuth,
    loginWithOTP,
    updateProfile,
    logout,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};