import React, { createContext, useContext, useState, useCallback } from 'react';
import { FullPageLoader } from '../components/ui/Loading';

const LoadingContext = createContext();

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};

export const LoadingProvider = ({ children }) => {
  const [loadingStates, setLoadingStates] = useState({});
  const [globalLoading, setGlobalLoading] = useState(false);
  const [globalMessage, setGlobalMessage] = useState('Loading...');
  const [globalType, setGlobalType] = useState('football');

  // Set loading state for a specific key
  const setLoading = useCallback((key, isLoading, message = '') => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: { isLoading, message }
    }));
  }, []);

  // Get loading state for a specific key
  const isLoading = useCallback((key) => {
    return loadingStates[key]?.isLoading || false;
  }, [loadingStates]);

  // Get loading message for a specific key
  const getLoadingMessage = useCallback((key) => {
    return loadingStates[key]?.message || '';
  }, [loadingStates]);

  // Show global loading overlay
  const showGlobalLoading = useCallback((message = 'Loading...', type = 'football') => {
    setGlobalMessage(message);
    setGlobalType(type);
    setGlobalLoading(true);
  }, []);

  // Hide global loading overlay
  const hideGlobalLoading = useCallback(() => {
    setGlobalLoading(false);
  }, []);

  // Clear all loading states
  const clearAllLoading = useCallback(() => {
    setLoadingStates({});
    setGlobalLoading(false);
  }, []);

  // Check if any loading is active
  const hasAnyLoading = useCallback(() => {
    return Object.values(loadingStates).some(state => state.isLoading) || globalLoading;
  }, [loadingStates, globalLoading]);

  const value = {
    // Individual loading states
    setLoading,
    isLoading,
    getLoadingMessage,
    
    // Global loading
    showGlobalLoading,
    hideGlobalLoading,
    globalLoading,
    globalMessage,
    globalType,
    
    // Utilities
    clearAllLoading,
    hasAnyLoading,
    loadingStates
  };

  return (
    <LoadingContext.Provider value={value}>
      {children}
      {globalLoading && (
        <FullPageLoader 
          message={globalMessage} 
          type={globalType}
        />
      )}
    </LoadingContext.Provider>
  );
};

// HOC for automatic loading management
export const withLoading = (WrappedComponent, loadingKey) => {
  return function WithLoadingComponent(props) {
    const { setLoading, isLoading: checkLoading } = useLoading();
    const isLoading = checkLoading(loadingKey);

    const startLoading = (message) => setLoading(loadingKey, true, message);
    const stopLoading = () => setLoading(loadingKey, false);

    return (
      <WrappedComponent
        {...props}
        isLoading={isLoading}
        startLoading={startLoading}
        stopLoading={stopLoading}
      />
    );
  };
};

export default LoadingContext;
