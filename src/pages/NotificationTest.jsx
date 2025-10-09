import React from 'react';
import { showSuccessToast, showErrorToast, showInfoToast, showWarningToast } from '../utils/toast';

const NotificationTest = () => {
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Notification Test</h1>
      <div className="grid grid-cols-2 gap-3">
        <button className="btn-primary" onClick={() => showSuccessToast('Success toast works!')}>Success Toast</button>
        <button className="btn-secondary" onClick={() => showErrorToast('Error toast works!')}>Error Toast</button>
        <button className="btn-secondary" onClick={() => showInfoToast('Info toast works!')}>Info Toast</button>
        <button className="btn-secondary" onClick={() => showWarningToast('Warning toast works!')}>Warning Toast</button>
      </div>
    </div>
  );
};

export default NotificationTest;