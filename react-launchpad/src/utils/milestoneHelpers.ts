export interface MilestoneAssignment {
  milestoneId: number;
  userId: number;
  assignedAt: string;
}

export interface MilestoneValidation {
  isValid: boolean;
  error?: string;
}

/**
 * Validates if a freelancer can be assigned to a milestone
 */
export const validateMilestoneAssignment = (
  milestoneId: number,
  userId: number,
  existingAssignments: MilestoneAssignment[]
): MilestoneValidation => {
  // Check if freelancer is already assigned to this milestone
  const isAlreadyAssigned = existingAssignments.some(
    assignment => assignment.milestoneId === milestoneId && assignment.userId === userId
  );

  if (isAlreadyAssigned) {
    return {
      isValid: false,
      error: 'This freelancer is already assigned to this milestone'
    };
  }

  // Check if milestone ID is valid
  if (!milestoneId || milestoneId <= 0) {
    return {
      isValid: false,
      error: 'Invalid milestone ID'
    };
  }

  // Check if user ID is valid
  if (!userId || userId <= 0) {
    return {
      isValid: false,
      error: 'Invalid freelancer ID'
    };
  }

  return { isValid: true };
};

/**
 * Gets the status text for a milestone
 */
export const getMilestoneStatusText = (status: number): string => {
  switch (status) {
    case 0:
      return 'Not Started';
    case 1:
      return 'In Progress';
    case 2:
      return 'Completed';
    default:
      return 'Unknown';
  }
};

/**
 * Gets the status color for a milestone
 */
export const getMilestoneStatusColor = (status: number): string => {
  switch (status) {
    case 0:
      return 'default';
    case 1:
      return 'warning';
    case 2:
      return 'success';
    default:
      return 'default';
  }
};

/**
 * Formats the due date for display
 */
export const formatMilestoneDueDate = (dueDate: string): string => {
  try {
    return new Date(dueDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    return 'Invalid Date';
  }
};

/**
 * Checks if a milestone is overdue
 */
export const isMilestoneOverdue = (dueDate: string, status: number): boolean => {
  if (status === 2) return false; // Completed milestones are not overdue
  
  try {
    const due = new Date(dueDate);
    const now = new Date();
    return due < now;
  } catch (error) {
    return false;
  }
};

/**
 * Gets the number of assigned freelancers for a milestone
 */
export const getAssignedFreelancerCount = (assignments: MilestoneAssignment[]): number => {
  return assignments.length;
};

/**
 * Checks if a milestone can be assigned to a freelancer
 */
export const canAssignToMilestone = (status: number): boolean => {
  // Can only assign to milestones that are not completed
  return status !== 2;
}; 