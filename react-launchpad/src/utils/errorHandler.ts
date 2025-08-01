import toast from 'react-hot-toast';

/**
 * Handles API errors with appropriate user-friendly messages
 */
export function handleApiError(error: any, operation?: string): void {
  console.error('API Error:', error);
  
  // Network errors (no response)
  if (!error.response) {
    toast.error('Network connection error. Please check your internet connection and try again.');
    return;
  }
  
  const status = error.response.status;
  
  // Handle different HTTP status codes
  switch (status) {
    case 400:
      // Try to get specific error message from backend
      const errorMessage = error.response.data?.message || 'Invalid request. Please check your input and try again.';
      toast.error(errorMessage);
      break;
    case 401:
      toast.error('Your session has expired. Please log in again to continue.');
      break;
    case 403:
      toast.error('You don\'t have permission to perform this action.');
      break;
    case 404:
      toast.error('The requested resource was not found.');
      break;
    case 409:
      toast.error('This resource already exists. Please try a different approach.');
      break;
    case 422:
      toast.error('Invalid data provided. Please check your input and try again.');
      break;
    case 500:
    case 502:
    case 503:
    case 504:
      toast.error('Server error. Please try again later.');
      break;
    default:
      toast.error('An unexpected error occurred. Please try again.');
  }
}

/**
 * Shows a success toast notification
 */
export function showSuccessToast(message: string, duration: number = 3000): void {
  toast.success(message, {
    duration,
    position: 'top-right',
    style: {
      background: '#F0FDF4',
      color: '#16A34A',
      border: '1px solid #BBF7D0',
    },
  });
}

/**
 * Shows an error toast notification for custom messages
 */
export function showErrorToast(message: string, duration: number = 4000): void {
  toast.error(message, {
    duration,
    position: 'top-right',
    style: {
      background: '#FEF2F2',
      color: '#DC2626',
      border: '1px solid #FECACA',
    },
  });
}

/**
 * Shows an info toast notification
 */
export function showInfoToast(message: string, duration: number = 3000): void {
  toast(message, {
    duration,
    position: 'top-right',
    style: {
      background: '#EFF6FF',
      color: '#2563EB',
      border: '1px solid #BFDBFE',
    },
  });
} 