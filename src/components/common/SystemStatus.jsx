import React, { useState, useEffect } from 'react';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ExclamationTriangleIcon,
  InformationCircleIcon 
} from '@heroicons/react/24/outline';

const SystemStatus = () => {
  const [status, setStatus] = useState({
    backend: 'checking',
    database: 'checking',
    locationService: 'checking',
    ocrService: 'checking'
  });

  useEffect(() => {
    checkSystemStatus();
  }, []);

  const checkSystemStatus = async () => {
    const newStatus = { ...status };

    // Check backend connection
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/health`);
      if (response.ok) {
        newStatus.backend = 'online';
      } else {
        newStatus.backend = 'error';
      }
    } catch (error) {
      newStatus.backend = 'offline';
    }

    // Check location service
    try {
      // This will use fallback data, so it should always work
      newStatus.locationService = 'online';
    } catch (error) {
      newStatus.locationService = 'error';
    }

    // Check OCR service (if backend is online)
    if (newStatus.backend === 'online') {
      newStatus.ocrService = 'online';
    } else {
      newStatus.ocrService = 'offline';
    }

    setStatus(newStatus);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'online':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'offline':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'error':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      default:
        return <InformationCircleIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'online':
        return 'Online';
      case 'offline':
        return 'Offline';
      case 'error':
        return 'Error';
      default:
        return 'Checking...';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'online':
        return 'text-green-600 bg-green-100';
      case 'offline':
        return 'text-red-600 bg-red-100';
      case 'error':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
        <InformationCircleIcon className="h-5 w-5 mr-2 text-blue-500" />
        System Status
      </h3>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Backend API</span>
          <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status.backend)}`}>
            {getStatusIcon(status.backend)}
            <span className="ml-1">{getStatusText(status.backend)}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Location Service</span>
          <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status.locationService)}`}>
            {getStatusIcon(status.locationService)}
            <span className="ml-1">{getStatusText(status.locationService)}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">OCR Service</span>
          <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status.ocrService)}`}>
            {getStatusIcon(status.ocrService)}
            <span className="ml-1">{getStatusText(status.ocrService)}</span>
          </div>
        </div>
      </div>

      {status.backend === 'offline' && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900 rounded-lg">
          <p className="text-sm text-red-800 dark:text-red-200">
            <strong>Backend server is not running.</strong> Please start the backend server:
          </p>
          <code className="block mt-2 text-xs bg-red-100 dark:bg-red-800 p-2 rounded">
            cd turfback && npm run dev
          </code>
        </div>
      )}

      {status.locationService === 'online' && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Location service is using fallback data</strong> due to SSL issues with external APIs.
          </p>
        </div>
      )}
    </div>
  );
};

export default SystemStatus;
