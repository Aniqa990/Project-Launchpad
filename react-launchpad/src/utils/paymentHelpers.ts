// Payment validation and helper functions

export interface PaymentData {
  clientId: number;
  freelancerId: number;
  projectId: number;
  paymentType: string;
  milestoneId?: number | null;
  timesheetId?: number | null;
  amount: number;
}

/**
 * Validates payment data to ensure only one of MilestoneId or TimesheetId is set
 * @param paymentData - The payment data to validate
 * @returns Object with isValid boolean and error message if invalid
 */
export const validatePaymentData = (paymentData: PaymentData): { isValid: boolean; error?: string } => {
  const { milestoneId, timesheetId, paymentType, amount } = paymentData;

  // Check if both milestoneId and timesheetId are set
  if (milestoneId && timesheetId) {
    return {
      isValid: false,
      error: 'Cannot set both MilestoneId and TimesheetId. Please choose one payment type.'
    };
  }

  // Validate payment type
  if (paymentType === 'Fixed' && milestoneId && milestoneId !== 0) {
    return {
      isValid: false,
      error: 'Fixed payment type should not have a MilestoneId. Use ProjectId only.'
    };
  }

  if (paymentType === 'Milestone' && (!milestoneId || milestoneId === 0)) {
    return {
      isValid: false,
      error: 'Milestone payment type requires a MilestoneId.'
    };
  }

  // Validate amount
  if (amount <= 0) {
    return {
      isValid: false,
      error: 'Payment amount must be greater than 0.'
    };
  }

  return { isValid: true };
};

/**
 * Formats payment amount with currency
 * @param amount - The amount to format
 * @param currency - The currency code (default: USD)
 * @returns Formatted amount string
 */
export const formatPaymentAmount = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

/**
 * Calculates platform fee
 * @param amount - The payment amount
 * @param feePercentage - The fee percentage (default: 5%)
 * @returns The calculated fee amount
 */
export const calculatePlatformFee = (amount: number, feePercentage: number = 0.05): number => {
  return amount * feePercentage;
};

/**
 * Calculates freelancer amount after platform fee
 * @param amount - The payment amount
 * @param feePercentage - The fee percentage (default: 5%)
 * @returns The amount freelancer receives
 */
export const calculateFreelancerAmount = (amount: number, feePercentage: number = 0.05): number => {
  return amount - calculatePlatformFee(amount, feePercentage);
};

/**
 * Gets payment status color for UI
 * @param status - The payment status
 * @returns The color variant for the badge
 */
export const getPaymentStatusColor = (status: string): 'default' | 'warning' | 'success' | 'destructive' => {
  switch (status?.toLowerCase()) {
    case 'released':
      return 'success';
    case 'paid':
      return 'warning';
    case 'pending':
      return 'default';
    case 'failed':
      return 'destructive';
    default:
      return 'default';
  }
};

/**
 * Formats payment date
 * @param dateString - The date string to format
 * @returns Formatted date string
 */
export const formatPaymentDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Validates if a project is eligible for fixed payment
 * @param project - The project object
 * @returns Boolean indicating if project is eligible
 */
export const isProjectEligibleForFixedPayment = (project: any): boolean => {
  // Check if project is completed and has no pending milestones
  return project.status === 'completed' && 
         (!project.milestones || project.milestones.every((m: any) => m.status === 2));
};

/**
 * Validates if a milestone is eligible for payment
 * @param milestone - The milestone object
 * @returns Boolean indicating if milestone is eligible
 */
export const isMilestoneEligibleForPayment = (milestone: any): boolean => {
  return milestone.status === 2 || milestone.Status === 2; // Completed status
};

/**
 * Gets milestone payment status for UI display
 * @param milestone - The milestone object
 * @param payment - The payment object (optional)
 * @returns The payment status string
 */
export const getMilestonePaymentStatus = (milestone: any, payment: any): 'not-started' | 'in-progress' | 'completed' | 'paid' | 'released' => {
  if (!milestone) return 'not-started';
  
  const milestoneStatus = milestone.Status || milestone.status;
  
  if (milestoneStatus === 0) return 'not-started';
  if (milestoneStatus === 1) return 'in-progress';
  if (milestoneStatus === 2) {
    if (payment) {
      if (payment.PaymentStatus === 'Released') return 'released';
      if (payment.PaymentStatus === 'Paid') return 'paid';
    }
    return 'completed';
  }
  
  return 'not-started';
}; 