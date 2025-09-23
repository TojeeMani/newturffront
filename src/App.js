import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './index.css';

import { AuthProvider, useAuth } from './context/AuthContext';
import { LoadingProvider } from './context/LoadingContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { SessionWarning } from './components/common';
import { Layout } from './components/layout';
import { ProtectedRoute } from './components/common';
import { FullPageLoader } from './components/ui/Loading';

// Lazy load components for better performance
const Home = React.lazy(() => import('./pages/Home'));
const Login = React.lazy(() => import('./features/auth/Login'));
const Register = React.lazy(() => import('./features/auth/Register'));
const ForgotPassword = React.lazy(() => import('./features/auth/ForgotPassword'));
const ResetPassword = React.lazy(() => import('./features/auth/ResetPassword'));
const OTPVerificationPage = React.lazy(() => import('./features/auth/OTPVerificationPage'));
const PlayerDashboard = React.lazy(() => import('./features/dashboard/PlayerDashboard'));
const OwnerDashboard = React.lazy(() => import('./features/dashboard/OwnerDashboard'));
const OwnerTurfsPage = React.lazy(() => import('./features/dashboard/OwnerTurfsPage'));
const OwnerBookingsPage = React.lazy(() => import('./features/dashboard/OwnerBookingsPage'));
const OwnerAnalyticsPage = React.lazy(() => import('./features/dashboard/OwnerAnalyticsPage'));
const OwnerCustomersPage = React.lazy(() => import('./features/dashboard/OwnerCustomersPage'));
const OwnerMatchesPage = React.lazy(() => import('./features/matches/MatchManagement'));
const AdminDashboard = React.lazy(() => import('./features/dashboard/AdminDashboard'));
const ProfileSettings = React.lazy(() => import('./features/profile/ProfileSettings'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));
const AddTurf = React.lazy(() => import('./features/turfs/AddTurf'));
const TurfDetails = React.lazy(() => import('./features/turfs/TurfDetails'));
const EditTurf = React.lazy(() => import('./features/turfs/EditTurf'));
const MyBookings = React.lazy(() => import('./features/bookings/MyBookings'));
const MyMatches = React.lazy(() => import('./pages/MyMatches'));
const PublicMatchViewer = React.lazy(() => import('./pages/PublicMatchViewer'));

// Custom Loading component for Suspense
const SuspenseLoader = () => (
  <FullPageLoader message="Loading page..." type="football" />
);

// Theme-aware Toaster component
const ThemedToaster = () => {
  const { isDarkMode } = useTheme();

  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      containerClassName=""
      containerStyle={{}}
      toastOptions={{
        duration: 4000,
        style: {
          borderRadius: '12px',
          background: isDarkMode ? '#1f2937' : '#fff',
          color: isDarkMode ? '#f9fafb' : '#374151',
          fontSize: '14px',
          fontWeight: '500',
          padding: '16px 20px',
          boxShadow: isDarkMode
            ? '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)'
            : '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          border: isDarkMode ? '1px solid #374151' : '1px solid #e5e7eb',
          maxWidth: '400px',
        },
        success: {
          style: {
            border: isDarkMode ? '1px solid #059669' : '1px solid #10b981',
            background: isDarkMode ? '#064e3b' : '#f0fdf4',
          },
          iconTheme: {
            primary: isDarkMode ? '#059669' : '#10b981',
            secondary: isDarkMode ? '#064e3b' : '#f0fdf4',
          },
        },
        error: {
          style: {
            border: isDarkMode ? '1px solid #dc2626' : '1px solid #ef4444',
            background: isDarkMode ? '#7f1d1d' : '#fef2f2',
          },
          iconTheme: {
            primary: isDarkMode ? '#dc2626' : '#ef4444',
            secondary: isDarkMode ? '#7f1d1d' : '#fef2f2',
          },
        },
      }}
    />
  );
};

// Session Warning Wrapper that can access auth context
const SessionWarningWrapper = () => {
  const { sessionWarning, logout, extendSession, hideSessionWarning } = useAuth();

  const handleExtendSession = async () => {
    const success = await extendSession();
    if (!success) {
      logout();
    }
  };

  const handleSessionLogout = () => {
    logout();
  };

  const handleDismissWarning = () => {
    hideSessionWarning();
  };

  if (!sessionWarning) return null;

  return (
    <SessionWarning
      isVisible={sessionWarning.show}
      minutesLeft={sessionWarning.minutesLeft}
      onExtend={handleExtendSession}
      onLogout={handleSessionLogout}
      onDismiss={handleDismissWarning}
    />
  );
};



function App() {
  return (
    <ThemeProvider>
      <LoadingProvider>
        <AuthProvider>
        <Router>
          <div className="App min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
          {/* Session Warning */}
          <SessionWarningWrapper />
          {/* Theme-aware Toast Notifications */}
          <ThemedToaster />
          <Suspense fallback={<SuspenseLoader />}>
            <Routes>
              <Route path="/" element={<Layout><Home /></Layout>} />
              <Route
                path="/match/:shareCode"
                element={<PublicMatchViewer />}
              />
              <Route
                path="/login"
                element={
                  <ProtectedRoute requireAuth={false}>
                    <Layout><Login /></Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <ProtectedRoute requireAuth={false}>
                    <Layout><Register /></Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/forgot-password"
                element={
                  <ProtectedRoute requireAuth={false}>
                    <Layout><ForgotPassword /></Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reset-password/:resetToken"
                element={
                  <ProtectedRoute requireAuth={false}>
                    <Layout><ResetPassword /></Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/verify-otp"
                element={
                  <ProtectedRoute requireAuth={false}>
                    <OTPVerificationPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/player-dashboard"
                element={
                  <ProtectedRoute requireAuth={true}>
                    <Layout><PlayerDashboard /></Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/bookings/my"
                element={
                  <ProtectedRoute requireAuth={true}>
                    <Layout><MyBookings /></Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/matches/my"
                element={
                  <ProtectedRoute requireAuth={true}>
                    <Layout><MyMatches /></Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/owner-dashboard"
                element={
                  <ProtectedRoute requireAuth={true} requiredRole="owner">
                    <OwnerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/owner/bookings"
                element={
                  <ProtectedRoute requireAuth={true} requiredRole="owner">
                    <OwnerBookingsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/owner-dashboard/analytics"
                element={
                  <ProtectedRoute requireAuth={true} requiredRole="owner">
                    <OwnerAnalyticsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/owner-dashboard/matches"
                element={
                  <ProtectedRoute requireAuth={true} requiredRole="owner">
                    <OwnerMatchesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/owner-dashboard/customers"
                element={
                  <ProtectedRoute requireAuth={true} requiredRole="owner">
                    <OwnerCustomersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/owner-dashboard/turfs"
                element={
                  <ProtectedRoute requireAuth={true} requiredRole="owner">
                    <OwnerTurfsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requireAuth={true} requiredRole="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin-dashboard"
                element={
                  <ProtectedRoute requireAuth={true} requiredRole="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile/settings"
                element={
                  <ProtectedRoute requireAuth={true}>
                    <ProfileSettings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute requireAuth={true}>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/add-turf"
                element={
                  <ProtectedRoute requireAuth={true} requiredRole="owner">
                    <AddTurf />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/owner/turfs/:id/edit"
                element={
                  <ProtectedRoute requireAuth={true} requiredRole="owner">
                    <EditTurf />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/turfs"
                element={<Layout><Home /></Layout>}
              />
              <Route
                path="/turfs/:id"
                element={<Layout><TurfDetails /></Layout>}
              />
              <Route
                path="/tournaments"
                element={<Layout><Home /></Layout>}
              />

              {/* Add more protected routes here as needed */}
            </Routes>
          </Suspense>
        </div>
      </Router>
        </AuthProvider>
      </LoadingProvider>
    </ThemeProvider>
  );
}

export default App;