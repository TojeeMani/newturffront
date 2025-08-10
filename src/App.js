import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import OTPVerificationPage from './pages/OTPVerificationPage';
import PlayerDashboard from './pages/PlayerDashboard';
import OwnerDashboard from './pages/OwnerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AllCitiesDemo from './pages/AllCitiesDemo';
// import Dashboard from './pages/Dashboard'; // Removed because file is deleted

import './index.css';

function App() {
  return (
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
          <Routes>
            <Route path="/" element={<Layout><Home /></Layout>} />
            <Route path="/cities" element={<Layout><AllCitiesDemo /></Layout>} />
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
              path="/turfs" 
              element={<Layout><Home /></Layout>} 
            />
            <Route 
              path="/tournaments" 
              element={<Layout><Home /></Layout>} 
            />
            {/* <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute requireAuth={true}>
                  <Dashboard />
                </ProtectedRoute>
              } 
            /> */}

            {/* Add more protected routes here as needed */}
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;