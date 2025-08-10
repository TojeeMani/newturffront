import toast from 'react-hot-toast';

// Custom toast configurations
const toastConfig = {
  duration: 4000,
  position: 'top-right',
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
};

// Success toast
export const showSuccessToast = (message, options = {}) => {
  return toast.success(message, {
    ...toastConfig,
    style: {
      ...toastConfig.style,
      border: '1px solid #10b981',
      background: '#f0fdf4',
    },
    iconTheme: {
      primary: '#10b981',
      secondary: '#f0fdf4',
    },
    ...options,
  });
};

// Error toast
export const showErrorToast = (message, options = {}) => {
  return toast.error(message, {
    ...toastConfig,
    style: {
      ...toastConfig.style,
      border: '1px solid #ef4444',
      background: '#fef2f2',
    },
    iconTheme: {
      primary: '#ef4444',
      secondary: '#fef2f2',
    },
    ...options,
  });
};

// Warning toast
export const showWarningToast = (message, options = {}) => {
  return toast(message, {
    ...toastConfig,
    icon: '⚠️',
    style: {
      ...toastConfig.style,
      border: '1px solid #f59e0b',
      background: '#fffbeb',
    },
    ...options,
  });
};

// Info toast
export const showInfoToast = (message, options = {}) => {
  return toast(message, {
    ...toastConfig,
    icon: 'ℹ️',
    style: {
      ...toastConfig.style,
      border: '1px solid #3b82f6',
      background: '#eff6ff',
    },
    ...options,
  });
};

// Loading toast
export const showLoadingToast = (message, options = {}) => {
  return toast.loading(message, {
    ...toastConfig,
    style: {
      ...toastConfig.style,
      border: '1px solid #6b7280',
      background: '#f9fafb',
    },
    ...options,
  });
};

// Promise toast - for async operations
export const showPromiseToast = (promise, messages, options = {}) => {
  return toast.promise(
    promise,
    {
      loading: messages.loading || 'Loading...',
      success: messages.success || 'Success!',
      error: messages.error || 'Something went wrong!',
    },
    {
      ...toastConfig,
      ...options,
    }
  );
};

// Dismiss all toasts
export const dismissAllToasts = () => {
  toast.dismiss();
};

// Dismiss specific toast
export const dismissToast = (toastId) => {
  toast.dismiss(toastId);
};

// Confirmation toast with custom buttons
export const showConfirmToast = (message, onConfirm, onCancel = null, options = {}) => {
  return toast.custom((t) => (
    <div className={`${
      t.visible ? 'animate-enter' : 'animate-leave'
    } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
      <div className="flex-1 w-0 p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0 pt-0.5">
            <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
              <span className="text-yellow-600 text-sm">⚠️</span>
            </div>
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-gray-900">
              Confirm Action
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {message}
            </p>
          </div>
        </div>
      </div>
      <div className="flex border-l border-gray-200">
        <button
          onClick={() => {
            toast.dismiss(t.id);
            if (onCancel) onCancel();
          }}
          className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-gray-600 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            toast.dismiss(t.id);
            onConfirm();
          }}
          className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-red-600 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          Confirm
        </button>
      </div>
    </div>
  ), {
    duration: Infinity,
    ...options,
  });
};

// Input toast for getting user input
export const showInputToast = (message, placeholder, onSubmit, onCancel = null, options = {}) => {
  let inputValue = '';

  return toast.custom((t) => (
    <div className={`${
      t.visible ? 'animate-enter' : 'animate-leave'
    } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5`}>
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0 pt-0.5">
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 text-sm">✏️</span>
            </div>
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-gray-900">
              Input Required
            </p>
            <p className="mt-1 text-sm text-gray-500 mb-3">
              {message}
            </p>
            <input
              type="text"
              placeholder={placeholder}
              onChange={(e) => inputValue = e.target.value}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
              onKeyPress={(e) => {
                if (e.key === 'Enter' && inputValue.trim()) {
                  toast.dismiss(t.id);
                  onSubmit(inputValue.trim());
                }
              }}
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end space-x-2">
          <button
            onClick={() => {
              toast.dismiss(t.id);
              if (onCancel) onCancel();
            }}
            className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-500 focus:outline-none"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (inputValue.trim()) {
                toast.dismiss(t.id);
                onSubmit(inputValue.trim());
              } else {
                showWarningToast('Please enter a value');
              }
            }}
            className="px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  ), {
    duration: Infinity,
    ...options,
  });
};

const toastUtils = {
  success: showSuccessToast,
  error: showErrorToast,
  warning: showWarningToast,
  info: showInfoToast,
  loading: showLoadingToast,
  promise: showPromiseToast,
  confirm: showConfirmToast,
  input: showInputToast,
  dismiss: dismissToast,
  dismissAll: dismissAllToasts,
};

export default toastUtils;
