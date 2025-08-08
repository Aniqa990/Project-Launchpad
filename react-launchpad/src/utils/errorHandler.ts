import toast from 'react-hot-toast';

/**
 * Handles API errors with appropriate user-friendly messages
 */
export function handleApiError(error: any, operation?: string): void {
  console.error('API Error:', error);
  
  // Network errors (no response)
  if (!error.response) {
    // Check if it's a custom error with a specific message
    if (error.message && error.message !== 'Network Error') {
      toast.error(error.message);
    } else {
      toast.error('Network connection error. Please check your internet connection and try again.');
    }
    return;
  }
  
  const status = error.response.status;
  
  // Handle different HTTP status codes
  switch (status) {
    case 400:
      // Try to get specific error message from backend
      const errorMessage = error.response.data?.message || error.response.data?.detail || 'Invalid request. Please check your input and try again.';
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
      // Validation errors - show backend message if available
      const validationMessage = error.response.data?.message || error.response.data?.detail || 'Invalid data provided. Please check your input and try again.';
      toast.error(validationMessage);
      break;
    case 500:
    case 502:
    case 503:
    case 504:
      // Check if it's an authentication error that was incorrectly returned as 500
      const authErrorMessage = error.response.data?.message || error.response.data?.detail;
      if (authErrorMessage && (authErrorMessage.includes('Invalid email or password') || authErrorMessage.includes('Email already in use'))) {
        toast.error(authErrorMessage);
      } else {
        // Use operation-specific message if available
        const operationMessage = operation && OPERATION_ERROR_MESSAGES[operation as keyof typeof OPERATION_ERROR_MESSAGES];
        toast.error(operationMessage || 'Server error. Please try again later.');
      }
      break;
    default:
      // Use operation-specific message if available
      const defaultOperationMessage = operation && OPERATION_ERROR_MESSAGES[operation as keyof typeof OPERATION_ERROR_MESSAGES];
      toast.error(defaultOperationMessage || 'An unexpected error occurred. Please try again.');
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
  refreshProjects: 'Failed to refresh projects. Please try again.',
  fetchProjectDetails: 'Failed to load project details. Please try again.',
  approveProject: 'Failed to approve project. Please try again.',
  rejectProject: 'Failed to reject project. Please try again.',
  
  // Milestones
  createMilestone: 'Failed to create milestone. Please try again.',
  updateMilestone: 'Failed to update milestone. Please try again.',
  deleteMilestone: 'Failed to delete milestone. Please try again.',
  fetchMilestones: 'Failed to load milestones. Please refresh the page.',
  assignMilestone: 'Failed to assign freelancer to milestone. Please try again.',
  unassignMilestone: 'Failed to remove freelancer from milestone. Please try again.',
  updateMilestoneStatus: 'Failed to update milestone status. Please try again.',
  milestoneStatus: 'Failed to update milestone status. Please try again.',
  
  // Payments
  processPayment: 'Payment processing failed. Please try again.',
  releasePayment: 'Failed to release payment. Please try again.',
  fetchPayments: 'Failed to load payment information. Please refresh the page.',
  checkFreelancerPayments: 'Failed to check freelancer payments. Please try again.',
  adminReleasePaymentAndApproveMilestone: 'Failed to release payment and approve milestone. Please try again.',
  
  // Messages
  sendMessage: 'Failed to send message. Please try again.',
  fetchMessages: 'Failed to load messages. Please refresh the page.',
  deleteMessage: 'Failed to delete message. Please try again.',
  
  // Profile
  updateProfile: 'Failed to update profile. Please try again.',
  fetchProfile: 'Failed to load profile. Please refresh the page.',
  uploadImage: 'Failed to upload image. Please try again.',
  changePassword: 'Failed to change password. Please try again.',
  updatePassword: 'Failed to update password. Please try again.',
  
  // Files
  uploadFile: 'Failed to upload file. Please try again.',
  downloadFile: 'Failed to download file. Please try again.',
  
  // Meetings
  createMeeting: 'Failed to create meeting. Please try again.',
  joinMeeting: 'Failed to join meeting. Please try again.',
  fetchMeetingDetails: 'Failed to load meeting details. Please try again.',
  fetchNotifications: 'Failed to load notifications. Please try again.',
  startMeeting: 'Failed to start meeting. Please try again.',
  endMeeting: 'Failed to end meeting. Please try again.',
  stopMeeting: 'Failed to stop meeting. Please try again.',
  fetchSummaries: 'Failed to load meeting summaries. Please try again.',
  
  // Timesheets
  fetchTimesheets: 'Failed to load timesheets. Please refresh the page.',
  createTimesheet: 'Failed to submit timesheet. Please try again.',
  approveTimesheet: 'Failed to approve timesheet. Please try again.',
  rejectTimesheet: 'Failed to reject timesheet. Please try again.',
  
  // Project Requests
  sendProjectRequest: 'Failed to send project request. Please try again.',
  respondToRequest: 'Failed to respond to request. Please try again.',
  updateProjectRequestStatus: 'Failed to update request status. Please try again.',
  
  // Freelancers
  fetchFreelancers: 'Failed to load freelancers. Please refresh the page.',
  fetchClientDetails: 'Failed to load client details. Please try again.',
  
  // Dashboard
  fetchDashboardData: 'Failed to load dashboard data. Please refresh the page.',
  
  // Feedback
  fetchFeedbacks: 'Failed to load feedback. Please refresh the page.',
  
  // Handover
  updateHandoverStatus: 'Failed to update handover status. Please try again.',
  
  // Timeline
  updateTimeline: 'Failed to update timeline. Please try again.',
  
  // Project Closure
  getProjectClosureSummary: 'Failed to get project closure summary. Please try again.',
  
  // Tasks
  fetchTasks: 'Failed to load tasks. Please refresh the page.',
  createTask: 'Failed to create task. Please try again.',
  updateTask: 'Failed to update task. Please try again.',
  deleteTask: 'Failed to delete task. Please try again.',
  updateSubtask: 'Failed to update subtask. Please try again.',
  
  // Validation
  validation: 'Please check your input and try again.',
  
  // General
  fetchData: 'Failed to load data. Please refresh the page.',
  saveData: 'Failed to save changes. Please try again.',
  deleteData: 'Failed to delete item. Please try again.',
  networkError: 'Network connection error. Please check your internet connection.',
  serverError: 'Server error. Please try again later.',
  unknownError: 'An unexpected error occurred. Please try again.'
};