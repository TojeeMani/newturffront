import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './index.css';

import { AuthProvider } from './context/AuthContext';
import { LoadingProvider } from './context/LoadingContext';
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
const AdminDashboard = React.lazy(() => import('./features/dashboard/AdminDashboard'));
const AllCitiesDemo = React.lazy(() => import('./pages/AllCitiesDemo'));
const ProfileSettings = React.lazy(() => import('./features/profile/ProfileSettings'));
const AddTurf = React.lazy(() => import('./features/turfs/AddTurf'));
const LoadingDemo = React.lazy(() => import('./pages/LoadingDemo'));

// Custom Loading component for Suspense
const SuspenseLoader = () => (
  <FullPageLoader message="Loading page..." type="football" />
);

function App() {
  return (
    <LoadingProvider>
      <AuthProvider>
        <Router>
          <div className="App">
          {/* Toast Notifications */}
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
                background: '#fff',
                color: '#374151',
                fontSize: '14px',
                fontWeight: '500',
                padding: '16px 20px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                border: '1px solid #e5e7eb',
                maxWidth: '400px',
              },
              success: {
                style: {
                  border: '1px solid #10b981',
                  background: '#f0fdf4',
                },
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#f0fdf4',
                },
              },
              error: {
                style: {
                  border: '1px solid #ef4444',
                  background: '#fef2f2',
                },
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fef2f2',
                },
              },
            }}
          />
          <Suspense fallback={<SuspenseLoader />}>
            <Routes>
              <Route path="/" element={<Layout><Home /></Layout>} />
              <Route path="/cities" element={<Layout><AllCitiesDemo /></Layout>} />
              <Route path="/loading-demo" element={<Layout><LoadingDemo /></Layout>} />
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
                path="/owner-dashboard"
                element={
                  <ProtectedRoute requireAuth={true} requiredRole="owner">
                    <OwnerDashboard />
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
                path="/add-turf"
                element={
                  <ProtectedRoute requireAuth={true} requiredRole="owner">
                    <AddTurf />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/turfs"
                element={<Layout><Home /></Layout>}
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
  );
}

export default App;