import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { getUserTypeDisplayName, getUserTypeColor } from '../../utils/dashboardRoutes';
import { ProfileCompletionModal, OwnerProfileModal } from '../modals';
import {
  ChevronDownIcon,
  UserIcon,
  Cog6ToothIcon,
  ArrowRightStartOnRectangleIcon
} from '@heroicons/react/24/outline';

const DashboardHeader = ({ title }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const handleProfileComplete = (updatedUser) => {
    setShowProfileModal(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      <header className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto">
          {/* Main Header */}
          <div className="flex justify-between items-center h-16 px-4 sm:px-6 lg:px-8">
            {/* Left Section - Brand */}
            <div className="flex items-center space-x-6">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-green-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">TE</span>
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                  TurfEase
                </span>
              </Link>

              {/* Dashboard Title */}
              <div className="hidden lg:block">
                <div className="h-8 w-px bg-gray-300"></div>
              </div>
              <div className="hidden lg:block">
                <h1 className="text-lg font-semibold text-gray-800">{title}</h1>
                {user?.userType === 'owner' && user?.businessName && (
                  <p className="text-sm text-gray-500">{user.businessName}</p>
                )}
              </div>
            </div>

            {/* Center Section - Navigation */}
            {user?.userType === 'owner' && (
              <nav className="hidden lg:flex items-center space-x-1 bg-gray-50 rounded-lg p-1">
                <Link
                  to="/owner/turfs"
                  className="flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-white transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span>My Turfs</span>
                </Link>
                <Link
                  to="/owner/bookings"
                  className="flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-white transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Bookings</span>
                </Link>
                <Link
                  to="/owner/analytics"
                  className="flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-white transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span>Analytics</span>
                </Link>
                <Link
                  to="/owner/customers"
                  className="flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-white transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                  <span>Customers</span>
                </Link>
              </nav>
            )}

            {/* Admin Navigation */}
            {user?.userType === 'admin' && (
              <nav className="hidden lg:flex items-center space-x-1 bg-gray-50 rounded-lg p-1">
                <Link
                  to="/admin/owners"
                  className="flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-white transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span>Owner Management</span>
                </Link>
                <Link
                  to="/admin/analytics"
                  className="flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-white transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span>System Analytics</span>
                </Link>
                <Link
                  to="/admin/settings"
                  className="flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-white transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>System Settings</span>
                </Link>
              </nav>
            )}

            {/* Right Section - User Profile */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              {user?.userType === 'owner' && (
                <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-400"></span>
                </button>
              )}

              {/* User Profile */}
              {user && (
                <div className="relative">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center space-x-3 p-2 rounded-xl hover:bg-gray-50 transition-all duration-200 border border-transparent hover:border-gray-200"
                  >
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-center text-white text-sm font-semibold shadow-md">
                      {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                    </div>
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-semibold text-gray-900">{user.firstName} {user.lastName}</p>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getUserTypeColor(user.userType)}`}>
                          {getUserTypeDisplayName(user.userType)}
                        </span>
                        {user?.userType === 'owner' && (
                          <span className="text-xs text-gray-500">•</span>
                        )}
                        {user?.userType === 'owner' && (
                          <span className="text-xs text-green-600 font-medium">Active</span>
                        )}
                      </div>
                    </div>
                    <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                  </button>

                  {/* Professional Dropdown Menu */}
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                      {/* User Info Header */}
                      <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-center text-white font-semibold shadow-lg">
                            {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <p className="text-base font-semibold text-gray-900">{user.firstName} {user.lastName}</p>
                            <p className="text-sm text-gray-600">{user.email}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getUserTypeColor(user.userType)}`}>
                                {getUserTypeDisplayName(user.userType)}
                              </span>
                              {user?.userType === 'owner' && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  ● Active
                                </span>
                              )}
                            </div>
                            {user?.userType === 'owner' && user?.businessName && (
                              <p className="text-sm text-blue-700 font-medium mt-1 truncate">{user.businessName}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Owner Quick Stats */}
                      {user?.userType === 'owner' && (
                        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-blue-50">
                          <div className="grid grid-cols-3 gap-4">
                            <div className="text-center">
                              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-1">
                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                              </div>
                              <p className="text-lg font-bold text-gray-900">{user?.turfCount || '0'}</p>
                              <p className="text-xs text-gray-500 font-medium">Turfs</p>
                            </div>
                            <div className="text-center">
                              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-1">
                                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                </svg>
                              </div>
                              <p className="text-lg font-bold text-gray-900">₹0</p>
                              <p className="text-xs text-gray-500 font-medium">Today</p>
                            </div>
                            <div className="text-center">
                              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-1">
                                <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                              <p className="text-lg font-bold text-gray-900">0</p>
                              <p className="text-xs text-gray-500 font-medium">Bookings</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Admin System Stats */}
                      {user?.userType === 'admin' && (
                        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-red-50">
                          <div className="grid grid-cols-3 gap-4">
                            <div className="text-center">
                              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-1">
                                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                              </div>
                              <p className="text-lg font-bold text-gray-900">0</p>
                              <p className="text-xs text-gray-500 font-medium">Pending Approvals</p>
                            </div>
                            <div className="text-center">
                              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-1">
                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                </svg>
                              </div>
                              <p className="text-lg font-bold text-gray-900">0</p>
                              <p className="text-xs text-gray-500 font-medium">Total Users</p>
                            </div>
                            <div className="text-center">
                              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-1">
                                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <p className="text-lg font-bold text-gray-900">●</p>
                              <p className="text-xs text-gray-500 font-medium">System Status</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Quick Actions for Owners */}
                      {user?.userType === 'owner' && (
                        <div className="px-6 py-4 border-b border-gray-100">
                          <div className="mb-3">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Quick Actions</p>
                          </div>
                          <div className="space-y-1">
                            <button
                              onClick={() => {
                                navigate('/owner/turfs/add');
                                setIsDropdownOpen(false);
                              }}
                              className="flex items-center w-full px-3 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-all duration-200 group"
                            >
                              <div className="w-8 h-8 bg-blue-100 group-hover:bg-blue-200 rounded-lg flex items-center justify-center mr-3 transition-colors duration-200">
                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                              </div>
                              <div className="text-left">
                                <p className="font-medium">Add New Turf</p>
                                <p className="text-xs text-gray-500">Create a new turf listing</p>
                              </div>
                            </button>
                            <button
                              onClick={() => {
                                navigate('/owner/bookings');
                                setIsDropdownOpen(false);
                              }}
                              className="flex items-center w-full px-3 py-2.5 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 rounded-lg transition-all duration-200 group"
                            >
                              <div className="w-8 h-8 bg-green-100 group-hover:bg-green-200 rounded-lg flex items-center justify-center mr-3 transition-colors duration-200">
                                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                              <div className="text-left">
                                <p className="font-medium">View Bookings</p>
                                <p className="text-xs text-gray-500">Manage your reservations</p>
                              </div>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Quick Actions for Admins */}
                      {user?.userType === 'admin' && (
                        <div className="px-6 py-4 border-b border-gray-100">
                          <div className="mb-3">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Admin Actions</p>
                          </div>
                          <div className="space-y-1">
                            <button
                              onClick={() => {
                                navigate('/admin-dashboard');
                                setIsDropdownOpen(false);
                              }}
                              className="flex items-center w-full px-3 py-2.5 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 rounded-lg transition-all duration-200 group"
                            >
                              <div className="w-8 h-8 bg-red-100 group-hover:bg-red-200 rounded-lg flex items-center justify-center mr-3 transition-colors duration-200">
                                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <div className="text-left">
                                <p className="font-medium">Review Approvals</p>
                                <p className="text-xs text-gray-500">Manage pending owner requests</p>
                              </div>
                            </button>
                            <button
                              onClick={() => {
                                navigate('/admin/users');
                                setIsDropdownOpen(false);
                              }}
                              className="flex items-center w-full px-3 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-all duration-200 group"
                            >
                              <div className="w-8 h-8 bg-blue-100 group-hover:bg-blue-200 rounded-lg flex items-center justify-center mr-3 transition-colors duration-200">
                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                </svg>
                              </div>
                              <div className="text-left">
                                <p className="font-medium">Manage Users</p>
                                <p className="text-xs text-gray-500">View and manage all users</p>
                              </div>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Navigation Options */}
                      <div className="px-6 py-4 border-b border-gray-100">
                        <div className="space-y-1">
                          <button
                            onClick={() => {
                              navigate('/');
                              setIsDropdownOpen(false);
                            }}
                            className="flex items-center w-full px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-all duration-200 group"
                          >
                            <div className="w-8 h-8 bg-gray-100 group-hover:bg-gray-200 rounded-lg flex items-center justify-center mr-3 transition-colors duration-200">
                              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                              </svg>
                            </div>
                            <div className="text-left">
                              <p className="font-medium">Home</p>
                              <p className="text-xs text-gray-500">Go to homepage</p>
                            </div>
                          </button>
                        </div>
                      </div>

                      {/* Account Settings */}
                      <div className="px-6 py-4">
                        <div className="space-y-1">
                          {user?.userType !== 'admin' && (
                            <button
                              onClick={() => {
                                navigate('/profile/settings');
                                setIsDropdownOpen(false);
                              }}
                              className="flex items-center w-full px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-all duration-200 group"
                            >
                              <div className="w-8 h-8 bg-gray-100 group-hover:bg-gray-200 rounded-lg flex items-center justify-center mr-3 transition-colors duration-200">
                                <UserIcon className="w-4 h-4 text-gray-600" />
                              </div>
                              <div className="text-left">
                                <p className="font-medium">Business Profile</p>
                                <p className="text-xs text-gray-500">Update your business information</p>
                              </div>
                            </button>
                          )}

                          {user?.userType === 'admin' && (
                            <button
                              onClick={() => {
                                navigate('/admin-dashboard');
                                setIsDropdownOpen(false);
                              }}
                              className="flex items-center w-full px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-all duration-200 group"
                            >
                              <div className="w-8 h-8 bg-gray-100 group-hover:bg-gray-200 rounded-lg flex items-center justify-center mr-3 transition-colors duration-200">
                                <Cog6ToothIcon className="w-4 h-4 text-gray-600" />
                              </div>
                              <div className="text-left">
                                <p className="font-medium">Admin Dashboard</p>
                                <p className="text-xs text-gray-500">System administration</p>
                              </div>
                            </button>
                          )}

                          <button
                            onClick={handleLogout}
                            className="flex items-center w-full px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 group"
                          >
                            <div className="w-8 h-8 bg-red-100 group-hover:bg-red-200 rounded-lg flex items-center justify-center mr-3 transition-colors duration-200">
                              <ArrowRightStartOnRectangleIcon className="w-4 h-4 text-red-600" />
                            </div>
                            <div className="text-left">
                              <p className="font-medium">Sign Out</p>
                              <p className="text-xs text-red-500">Logout from your account</p>
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Profile Modal - Different for Owners vs Players */}
      {user?.userType === 'owner' ? (
        <OwnerProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          onComplete={handleProfileComplete}
        />
      ) : (
        <ProfileCompletionModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          onComplete={handleProfileComplete}
        />
      )}

      {/* Click outside to close dropdown */}
      {isDropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </>
  );
};

export default DashboardHeader; 