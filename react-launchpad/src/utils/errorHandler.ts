import toast from 'react-hot-toast';

// Error types for different scenarios
export enum ErrorType {
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER_ERROR = 'SERVER_ERROR',
  UNKNOWN = 'UNKNOWN'
}

// User-friendly error messages
const ERROR_MESSAGES = {
  [ErrorType.NETWORK]: {
    title: 'Connection Error',
    message: 'Unable to connect to the server. Please check your internet connection and try again.',
    action: 'Retry'
  },
  [ErrorType.AUTHENTICATION]: {
    title: 'Authentication Error',
    message: 'Your session has expired. Please log in again to continue.',
    action: 'Login'
  },
  [ErrorType.AUTHORIZATION]: {
    title: 'Access Denied',
    message: 'You don\'t have permission to perform this action.',
    action: 'Contact Support'
  },
  [ErrorType.VALIDATION]: {
    title: 'Invalid Input',
    message: 'Please check your input and try again.',
    action: 'Review'
  },
  [ErrorType.NOT_FOUND]: {
    title: 'Not Found',
    message: 'The requested resource was not found.',
    action: 'Go Back'
  },
  [ErrorType.SERVER_ERROR]: {
    title: 'Server Error',
    message: 'Something went wrong on our end. Please try again later.',
    action: 'Retry'
  },
  [ErrorType.UNKNOWN]: {
    title: 'Unexpected Error',
    message: 'An unexpected error occurred. Please try again.',
    action: 'Retry'
  }
};

// Specific error messages for common operations
const OPERATION_ERROR_MESSAGES = {
  // Authentication
  login: 'Failed to log in. Please check your credentials and try again.',
  signup: 'Failed to create account. Please try again with different information.',
  logout: 'Failed to log out. Please try again.',
  
  // Projects
  createProject: 'Failed to create project. Please check your input and try again.',
  updateProject: 'Failed to update project. Please try again.',
  deleteProject: 'Failed to delete project. Please try again.',
  fetchProjects: 'Failed to load projects. Please refresh the page.',
  updateStartDate: 'Failed to update start date. Please try again.',
  fetchProjectDetails: 'Failed to load project details. Please try again.',
  validationError: 'Please fix the validation errors before proceeding.',
  
  // Milestones
  createMilestone: 'Failed to create milestone. Please try again.',
  updateMilestone: 'Failed to update milestone. Please try again.',
  deleteMilestone: 'Failed to delete milestone. Please try again.',
  fetchMilestones: 'Failed to load milestones. Please refresh the page.',
  assignMilestone: 'Failed to assign freelancer to milestone. Please try again.',
  unassignMilestone: 'Failed to remove freelancer from milestone. Please try again.',
  
  // Payments
  processPayment: 'Payment processing failed. Please try again.',
  releasePayment: 'Failed to release payment. Please try again.',
  fetchPayments: 'Failed to load payment information. Please refresh the page.',
  
  // Messages
  sendMessage: 'Failed to send message. Please try again.',
  fetchMessages: 'Failed to load messages. Please refresh the page.',
  deleteMessage: 'Failed to delete message. Please try again.',
  
  // Profile
  updateProfile: 'Failed to update profile. Please try again.',
  uploadImage: 'Failed to upload image. Please try again.',
  changePassword: 'Failed to change password. Please try again.',
  
  // Files
  uploadFile: 'Failed to upload file. Please try again.',
  downloadFile: 'Failed to download file. Please try again.',
  
  // Meetings
  createMeeting: 'Failed to create meeting. Please try again.',
  joinMeeting: 'Failed to join meeting. Please try again.',
  
  // General
  fetchData: 'Failed to load data. Please refresh the page.',
  saveData: 'Failed to save changes. Please try again.',
  deleteData: 'Failed to delete item. Please try again.',
  networkError: 'Network connection error. Please check your internet connection.',
  serverError: 'Server error. Please try again later.',
  unknownError: 'An unexpected error occurred. Please try again.'
};

/**
 * Determines the error type based on the error response
 */
export function getErrorType(error: any): ErrorType {
  if (!error) return ErrorType.UNKNOWN;
  
  // Network errors
  if (!error.response) {
    return ErrorType.NETWORK;
  }
  
  const status = error.response?.status;
  
  switch (status) {
    case 400:
      return ErrorType.VALIDATION;
    case 401:
      return ErrorType.AUTHENTICATION;
    case 403:
      return ErrorType.AUTHORIZATION;
    case 404:
      return ErrorType.NOT_FOUND;
    case 500:
    case 502:
    case 503:
    case 504:
      return ErrorType.SERVER_ERROR;
    default:
      return ErrorType.UNKNOWN;
  }
}

/**
 * Gets user-friendly error message for a specific operation
 */
export function getOperationErrorMessage(operation: string, error?: any): string {
  const defaultMessage = OPERATION_ERROR_MESSAGES[operation as keyof typeof OPERATION_ERROR_MESSAGES] || 
                        OPERATION_ERROR_MESSAGES.unknownError;
  
  if (!error) return defaultMessage;
  
  const errorType = getErrorType(error);
  
  // If it's a validation error, try to get specific message from backend
  if (errorType === ErrorType.VALIDATION && error.response?.data?.message) {
    return error.response.data.message;
  }
  
  // If it's a server error with specific message
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  
  return defaultMessage;
}

/**
 * Shows a toast notification for an error
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

/**
 * Handles API errors with appropriate user feedback
 */
export function handleApiError(error: any, operation?: string): void {
  console.error('API Error:', error);
  
  const errorType = getErrorType(error);
  const errorInfo = ERROR_MESSAGES[errorType];
  
  // Get specific operation message if available
  const message = operation 
    ? getOperationErrorMessage(operation, error)
    : errorInfo.message;
  
  showErrorToast(message);
}

/**
 * Handles form validation errors
 */
export function handleValidationError(errors: Record<string, string[]>): void {
  const firstError = Object.values(errors)[0]?.[0];
  if (firstError) {
    showErrorToast(firstError);
  } else {
    showErrorToast('Please check your input and try again.');
  }
}

/**
 * Handles network errors
 */
export function handleNetworkError(): void {
  showErrorToast('Network connection error. Please check your internet connection and try again.');
}

/**
 * Handles authentication errors
 */
export function handleAuthError(): void {
  showErrorToast('Your session has expired. Please log in again to continue.');
  // You might want to redirect to login page here
}

/**
 * Handles server errors
 */
export function handleServerError(): void {
  showErrorToast('Server error. Please try again later.');
}

/**
 * Generic error handler that determines the type and shows appropriate message
 */
export function handleError(error: any, operation?: string): void {
  if (!error) {
    showErrorToast('An unexpected error occurred. Please try again.');
    return;
  }
  
  const errorType = getErrorType(error);
  
  switch (errorType) {
    case ErrorType.NETWORK:
      handleNetworkError();
      break;
    case ErrorType.AUTHENTICATION:
      handleAuthError();
      break;
    case ErrorType.SERVER_ERROR:
      handleServerError();
      break;
    default:
      handleApiError(error, operation);
  }
}

/**
 * Wraps async functions with error handling
 */
export function withErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  operation?: string
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      handleError(error, operation);
      throw error; // Re-throw so calling code can handle if needed
    }
  };
}

/**
 * Creates a safe async function that returns a result object
 */
export async function safeAsync<T>(
  promise: Promise<T>,
  operation?: string
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const data = await promise;
    return { success: true, data };
  } catch (error) {
    const message = operation 
      ? getOperationErrorMessage(operation, error)
      : 'An unexpected error occurred. Please try again.';
    
    showErrorToast(message);
    return { success: false, error: message };
  }
} 