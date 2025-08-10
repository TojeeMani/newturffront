import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDashboardRoute } from '../utils/dashboardRoutes';

const ProtectedRoute = ({ children, requireAuth = true, redirectTo = '/login', requiredRole = null }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  // If route requires authentication and user is not authenticated
  if (requireAuth && !isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // If route doesn't require authentication (login/register) but user is already authenticated
  if (!requireAuth && isAuthenticated && user) {
    console.log('🔍 ProtectedRoute: User already authenticated, redirecting...', {
      userType: user.userType,
      requireAuth
    });
    
    // Admin and Owner go to dashboard, regular users go to homepage
    const redirectRoute = (user.userType === 'admin' || user.userType === 'owner')
      ? getDashboardRoute(user.userType)
      : '/';
    
    console.log('🔍 ProtectedRoute: Redirecting to:', redirectRoute);
    return <Navigate to={redirectRoute} replace />;
  }

  // If route requires a specific role and user does not have it
  if (requiredRole && user && user.userType !== requiredRole) {
    // Redirect to the correct dashboard for their role
    const redirectRoute = getDashboardRoute(user.userType);
    return <Navigate to={redirectRoute} replace />;
  }

  return children;
};

export default ProtectedRoute;