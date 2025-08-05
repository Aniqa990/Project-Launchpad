import axios from "axios";
import type {
  FreelancerProfile,
  LoginResponse,
  SignupRequest,
  User,
  KanbanTask,
  KanbanSubtask,
  KanbanTaskStatus,
  KanbanTaskPriorityLevel,
  Deliverable,
  Feedback,
  Milestone,
} from "@/types";
import { lowercaseFirstLetterKeys } from "@/utils/lowercaseFirst"; //for matching the keys from backend to frontend

const api = axios.create({
  baseURL: "http://localhost:7071/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    console.log("API Interceptor:", config.method, config.url, "Token:", token);
    if (token) {
      config.headers = config.headers || {};
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

//AUTH
export const loginUser = async (email: string, password: string) => {
  const response = await api.post("/auth/login", { email, password });
  return response.data;
};

export const signupUser = async (userData: Partial<SignupRequest>) => {
  const response = await api.post("/auth/register", userData);
  return response.data;
};

export async function validateToken(token?: string) {
  return api
    .get("/auth/validate", {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
    .then((res) => res.data);
}

//FREELANCER
export const getFreelancerById = async (
  id: number
): Promise<FreelancerProfile> => {
  try {
    const response = await api.get(`/freelancer/${id}`);
    return lowercaseFirstLetterKeys(response.data);
  } catch (error: any) {
    throw new Error(
      error.response?.data?.detail || "Failed to fetch freelancer profile"
    );
  }
};

export const updateFreelancerProfile = async (
  profile: Partial<FreelancerProfile>,
  id: number
) => {
  try {
    const response = await api.patch(`/freelancer/profile/${id}`, profile);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to save profile");
  }
};

export async function deleteFreelancerProfile(userId: number) {
  const { data } = await api.delete(`/freelancer/${userId}`);
  return data;
}

//CLIENTS
export const getClientById = async (clientId: number) => {
  try {
    const response = await api.get(`/clients/${clientId}`);
    return lowercaseFirstLetterKeys(response.data);
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Failed to fetch client details"
    );
  }
};

//Client Profile Setup API
export async function fetchClientProfile(id: number) {
  const { data } = await api.get(`/client/profile/${id}`);
  return lowercaseFirstLetterKeys(data);
}

export async function updateClientProfile(updates: Partial<User>) {
  const { data } = await api.patch("/client/profile", updates);
  return data;
}

export async function deleteClientProfile(userId: number) {
  const { data } = await api.delete(`/client/profile/${userId}`);
  return data;
}

//PROJECT REQUESTS
export const getProjectRequests = async (freelancerId: number) => {
  try {
    const response = await api.get(`/requests/${freelancerId}`);
    return lowercaseFirstLetterKeys(response.data);
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Failed to fetch requests"
    );
  }
};

export const sendProjectRequest = async (
  projectId: number,
  freelancerId: number
) => {
  try {
    console.log("Sending project request:", {
      ProjectId: projectId,
      FreelancerId: freelancerId,
    });
    const response = await api.post("/projects/requests", {
      ProjectId: projectId,
      FreelancerId: freelancerId,
    });
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Failed to assign freelancer"
    );
  }
};

export const updateProjectRequestStatus = async (
  ProjectId: number,
  Status: string,
  FreelancerId?: number
) => {
  try {
    const response = await api.patch(`/requests/${FreelancerId}/${ProjectId}`, {
      Status,
    });
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Failed to update request status"
    );
  }
};

export const getProjectRequestsByProjectId = async (projectId: number) => {
  try {
    const response = await api.get(`/projects/${projectId}/requests`);
    return lowercaseFirstLetterKeys(response.data);
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message ||
        "Failed to fetch project requests for project"
    );
  }
};

//PROJECTS
export const assignFreelancerToProject = async (
  projectId: number,
  freelancerId: number
) => {
  try {
    const response = await api.post("/projects/assign", {
      ProjectId: projectId,
      FreelancerId: freelancerId,
    });
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Failed to assign freelancer"
    );
  }
};

export const getFreelancerProjects = async (freelancerId: number) => {
  try {
    const response = await api.get(`/freelancers/${freelancerId}/projects`);
    return lowercaseFirstLetterKeys(response.data);
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Failed to fetch freelancer projects"
    );
  }
};

export const getProjects = async () => {
  const res = await api.get("/projects");
  return lowercaseFirstLetterKeys(res.data);
};

export const getProjectById = async (id: string | number) => {
  const res = await api.get(`/projects/${id}`);
  return lowercaseFirstLetterKeys(res.data);
};

// Fetch projects for a specific client
export const getClientProjects = async (clientId: number) => {
  const res = await api.get(`/clients/${clientId}/projects`);
  return lowercaseFirstLetterKeys(res.data);
};

export const getProjectFreelancers = async (
  projectId: number
): Promise<FreelancerProfile[]> => {
  try {
    const response = await api.get(`/projects/${projectId}/freelancers`);
    return lowercaseFirstLetterKeys(response.data);
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Failed to fetch project freelancers"
    );
  }
};

// Fetch projects by approval status for a specific client
export const getProjectsByApprovalStatus = async (
  clientId: number,
  approvalStatus: string
) => {
  const res = await api.get(
    `/clients/${clientId}/projects/approval/${approvalStatus}`
  );
  return lowercaseFirstLetterKeys(res.data);
};

export const createProject = async (payload: any) => {
  const res = await api.post("/projects", payload);
  return res.data;
};

export const updateProject = async (id: number, updatedData: any) => {
  const res = await api.patch(`/projects/${id}`, updatedData);
  return res.data;
};

export const getProjectsWithPendingApproval = async () => {
  const res = await api.get("platform/projects/pending");
  return lowercaseFirstLetterKeys(res.data);
};

export const updateProjectApprovalStatus = async (
  Id: number,
  ApprovalStatus: string,
  RejectionReason?: string
) => {
  const res = await api.patch(`platform/projects/${Id}`, {
    ApprovalStatus,
    RejectionReason,
  });
  return res.data;
};

// Kanban APIs
export const getTasks = async (): Promise<KanbanTask[]> => {
  const response = await api.get("/tasks");
  return response.data;
};

export const createTask = async (task: {
  title: string;
  description: string;
  estimatedDeadline: string;
  priority: KanbanTaskPriorityLevel;
  createdByUserId: number;
  assignedToUserId: number;
  ProjectId: number; // <-- Add this
}): Promise<KanbanTask> => {
  const response = await api.post("/tasks", task);
  return response.data;
};

export const updateTask = async (
  id: number,
  update: Partial<{
    status: KanbanTaskStatus;
    priority: KanbanTaskPriorityLevel;
    title: string;
    description: string;
    estimatedDeadline: string;
    createdByUserId: number;
    assignedToUserId: number;
  }>
): Promise<KanbanTask> => {
  const response = await api.put(`/tasks/${id}`, update);
  return response.data;
};

export const deleteTask = async (id: number): Promise<void> => {
  await api.delete(`/tasks/${id}`);
};

export const syncTasksFromAI = async (tasks: any[]) => {
  try {
    const response = await api.post("/tasks/ai/sync", { tasks });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to sync AI tasks");
  }
};

// Get tasks by project ID
export const getTasksByProjectId = async (
  projectId: number
): Promise<KanbanTask[]> => {
  try {
    const response = await api.get(`/tasks/project/${projectId}`);
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Failed to fetch tasks by project"
    );
  }
};

// Subtasks
export const getSubtasks = async (): Promise<KanbanSubtask[]> => {
  const response = await api.get("/subtasks");
  return response.data;
};

export const createSubtask = async (subtask: {
  title: string;
  description: string;
  dueDate: string;
  taskItemId: number;
}): Promise<KanbanSubtask> => {
  const response = await api.post("/subtasks", subtask);
  return response.data;
};

export const updateSubtask = async (
  id: number,
  update: Partial<{
    status: KanbanTaskStatus | string;
  }>
): Promise<KanbanSubtask> => {
  const response = await api.put(`/subtasks/${id}`, update);
  return response.data;
};

// Milestones
export const getMilestones = async (): Promise<any[]> => {
  const response = await api.get("/milestones");
  return lowercaseFirstLetterKeys(response.data);
};

export const getMilestonesByHandoverStatus = async (status: string) => {
  const response = await api.get(`/platform/milestones/handover/${status}`);
  return lowercaseFirstLetterKeys(response.data);
};

export const getMilestonesWithPaymentInfo = async (status: string) => {
  const response = await api.get(`/platform/milestones/handover/${status}`);
  const milestones = lowercaseFirstLetterKeys(response.data);

  // For each milestone, fetch payment information
  const milestonesWithPayments = await Promise.all(
    milestones.map(async (milestone: any) => {
      try {
        const payments = await getPaymentByMilestone(milestone.id);

        // If there are multiple payments, find the one that's not released or take the first one
        let payment = null;
        if (payments.length > 0) {
          // Try to find a payment that's not released
          payment =
            payments.find((p: any) => p.paymentStatus !== "released") ||
            payments[0];
        }

        return {
          ...milestone,
          paymentStatus: payment?.paymentStatus || null,
          paymentDate: payment?.paymentDate || null,
          transactionReference: payment?.transactionReference || null,
          paymentId: payment?.id || null,
        };
      } catch (error) {
        console.error(
          `Error fetching payment for milestone ${milestone.id}:`,
          error
        );
        return {
          ...milestone,
          paymentStatus: null,
          paymentDate: null,
          transactionReference: null,
          paymentId: null,
        };
      }
    })
  );

  // Remove duplicates based on milestone ID
  const uniqueMilestones = milestonesWithPayments.filter(
    (milestone: any, index: number, self: any[]) =>
      index === self.findIndex((m: any) => m.id === milestone.id)
  );

  return uniqueMilestones;
};

export const updateHandoverStatus = async (
  milestoneId: number,
  handoverStatus: string
) => {
  const response = await api.patch(`/platform/handover/${milestoneId}`, {
    handoverStatus,
  });
  return lowercaseFirstLetterKeys(response.data);
};

export const createMilestone = async (milestone: {
  title: string;
  description: string;
  amount: number;
  projectId: number;
  dueDate: string;
}): Promise<any> => {
  const response = await api.post("/milestones", milestone);
  return response.data;
};

export const updateMilestone = async (
  id: number,
  update: {
    title: string;
    description: string;
    dueDate: string;
    amount: number;
    freelancerComments?: string;
    submissionDate?: string;
    status?: number;
  }
): Promise<any> => {
  const response = await api.put(`/updatemilestone/${id}`, update);
  return response.data;
};

// Deliverables
export const getDeliverables = async (): Promise<Deliverable[]> => {
  const response = await api.get("/deliverables");
  return lowercaseFirstLetterKeys(response.data);
};

export const createDeliverable = async (deliverable: {
  UploadFiles: string;
  MilestoneId: number;
  ProjectId: number;
  Comment: string;
  Status: string;
}): Promise<any> => {
  const response = await api.post("/deliverables", deliverable);
  return response.data;
};

export const updateDeliverable = async (
  id: number,
  update: {
    uploadFiles?: string;
    projectId?: number;
    comment?: string;
    status?: string;
  }
): Promise<any> => {
  const response = await api.put(`/deliverables/${id}`, update);
  return response.data;
};

export const deleteDeliverable = async (id: number): Promise<void> => {
  await api.delete(`/deliverables/${id}`);
};

export const getDeliverablesByMilestoneId = async (
  milestoneId: number
): Promise<any[]> => {
  try {
    const response = await api.get(`/deliverables/milestone/${milestoneId}`);
    return lowercaseFirstLetterKeys(response.data);
  } catch (error: any) {
    if (error.response && error.response.status === 404) {
      return [];
    }
    throw error;
  }
};

// Hourly Logs
export const getHourlyLogs = async (): Promise<any[]> => {
  const response = await api.get("/logs");
  return response.data;
};

export const getFreelancerHourlyLogs = async (
  freelancerId: number
): Promise<any[]> => {
  try {
    const response = await api.get(`/logs/freelancer/${freelancerId}`);
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Failed to fetch freelancer hourly logs"
    );
  }
};

export const getLogsByProjectId = async (projectId: number): Promise<any[]> => {
  try {
    const response = await api.get(`/projects/${projectId}/logs`);
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Failed to fetch logs by project"
    );
  }
};

// Get payment status for a specific milestone
export const getPaymentByMilestone = async (milestoneId: number) => {
  try {
    const response = await api.get(`/payments/milestone/${milestoneId}`);
    // Backend returns a list of payments, return all of them
    const payments = response.data;
    return payments || [];
  } catch (error: any) {
    // Return empty array if no payment found for this milestone
    return [];
  }
};

// Assign freelancer to milestone
export const assignMilestoneToFreelancer = async (
  milestoneId: number,
  userId: number
) => {
  try {
    const response = await api.post(
      `/milestones/${milestoneId}/assign/${userId}`
    );
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message ||
        "Failed to assign freelancer to milestone"
    );
  }
};

// Unassign freelancer from milestone
export const unassignMilestoneFromFreelancer = async (
  milestoneId: number,
  userId: number
) => {
  try {
    const response = await api.delete(
      `/milestones/${milestoneId}/unassign/${userId}`
    );
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message ||
        "Failed to unassign freelancer from milestone"
    );
  }
};

// Get milestones by freelancer ID
export const getMilestonesByFreelancerId = async (userId: number) => {
  try {
    const response = await api.get(`/milestones/freelancer/${userId}`);
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Failed to fetch freelancer milestones"
    );
  }
};

export const getMilestoneFreelancers = async (milestoneId: number) => {
  try {
    const response = await api.get(`/milestones/${milestoneId}/freelancers`);
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Failed to fetch milestone freelancers"
    );
  }
};

export const getMilestonesByProjectId = async (projectId: number) => {
  const response = await api.get(`/milestones/project/${projectId}`);
  return lowercaseFirstLetterKeys(response.data);
};

// Update handover status for a milestone
export const updateMilestoneHandover = async (
  milestoneId: number,
  handoverStatus: string
) => {
  try {
    const response = await api.patch(`/platform/handover/${milestoneId}`, {
      handoverStatus: handoverStatus,
    });
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Failed to update handover status"
    );
  }
};

// TIMESHEETS
export const getTimesheets = async () => {
  const res = await api.get("/timesheets");
  return res.data;
};

export const createTimesheet = async (payload: any) => {
  const res = await api.post("/timesheets", payload);
  return res.data;
};

export const approveTimesheet = async (
  id: number,
  reviewerComments: string
) => {
  const res = await api.put(`/timesheets/${id}/approve`, { reviewerComments });
  return res.data;
};

export const rejectTimesheet = async (id: number, reviewerComments: string) => {
  const res = await api.put(`/timesheets/${id}/reject`, { reviewerComments });
  return res.data;
};

export const getTimesheetsByFreelancerId = async (
  freelancerId: number | string
) => {
  const res = await api.get(`/timesheets/freelancer/${freelancerId}`);
  return res.data;
};

export const getTimesheetsByFreelancer = async (freelancerName: string) => {
  const res = await api.get(
    `/timesheets/freelancer/${encodeURIComponent(freelancerName)}`
  );
  return res.data;
};

// MESSAGES
export const getUserMessages = async (userId: number) => {
  const res = await api.get(`/messages/user/${userId}`);
  return res.data;
};

export const getConversationMessages = async (
  userId: number,
  otherUserId: number
) => {
  const res = await api.get(`/messages/conversation/${userId}/${otherUserId}`);
  return res.data;
};

export const sendMessage = async (messageData: any) => {
  const res = await api.post("/messages", messageData);
  return res.data;
};

export const markMessageRead = async (messageId: number) => {
  const res = await api.put(`/messages/${messageId}/read`);
  return res.data;
};

export const deleteMessage = async (messageId: number) => {
  const res = await api.delete(`/messages/${messageId}`);
  return res.data;
};

//Feedbacks
export const getFreelancerFeedbacks = async (
  freelancerId: number
): Promise<Feedback[]> => {
  const response = await api.get(`/feedbacks/freelancer/${freelancerId}`);
  return lowercaseFirstLetterKeys(response.data);
};

// NOTIFICATIONS
export const getNotifications = async (userId: number) => {
  const response = await api.get(`/notifications/${userId}`);
  return response.data;
};

export const markNotificationRead = async (notificationId: number) => {
  const response = await api.put(`/notifications/${notificationId}/read`);
  return response.data;
};

// Payment APIs
export const getFreelancerPayments = async (freelancerId: number) => {
  try {
    const response = await api.get(`/payments/freelancer/${freelancerId}`);
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Failed to fetch freelancer payments"
    );
  }
};

export const getClientPayments = async (clientId: number) => {
  try {
    const response = await api.get(`/payments/client/${clientId}`);
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Failed to fetch client payments"
    );
  }
};

export const getPaymentsByProject = async (projectId: number) => {
  try {
    const response = await api.get(`/payments/project/${projectId}`);
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Failed to fetch project payments"
    );
  }
};

export const releasePayment = async (paymentId: number) => {
  try {
    const response = await api.post(`/payments/release/${paymentId}`);
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Failed to release payment"
    );
  }
};

export const adminReleasePaymentAndApproveMilestone = async (
  paymentId: number
) => {
  try {
    const response = await api.post(`/payments/admin-release/${paymentId}`);
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message ||
        "Failed to release payment and approve milestone"
    );
  }
};

// Stripe Payment API
export const createStripePaymentIntent = async (params: {
  clientId: number;
  freelancerId: number;
  projectId: number;
  paymentType: string;
  milestoneId: number | null;
  timesheetId: number | null;
  amount: number;
}): Promise<{ clientSecret: string }> => {
  const response = await api.post("/payments/create-intent", params, {
    headers: { "Content-Type": "application/json" },
  });
  return response.data;
};

// New: Stripe Checkout Session API
export const createStripeCheckoutSession = async (params: {
  clientId: number;
  freelancerId: number;
  projectId: number;
  paymentType: string;
  milestoneId: number | null;
  timesheetId: number | null;
  amount: number;
}): Promise<{ url: string }> => {
  const response = await api.post("/payments/create-checkout-session", params, {
    headers: { "Content-Type": "application/json" },
  });
  return response.data;
};

export const createMultiFreelancerCheckoutSession = async (params: {
  clientId: number;
  projectId: number;
  paymentType: string;
  milestoneId: number | null;
  timesheetId: number | null;
  totalAmount: number;
  freelancerPayments: Array<{
    freelancerId: number;
    freelancerName: string;
    amount: number;
  }>;
}): Promise<{ url: string }> => {
  const response = await api.post(
    "/payments/create-multi-freelancer-checkout-session",
    params,
    { headers: { "Content-Type": "application/json" } }
  );
  return response.data;
};

//ADMIN API
export async function fetchPlatformProfile(id: number) {
  const { data } = await api.get(`/platform/profile/${id}`);
  return lowercaseFirstLetterKeys(data);
}

export async function updatePlatformProfile(
  id: number,
  updates: Partial<User>
) {
  const { data } = await api.patch(`/platform/profile/${id}`, updates);
  return data;
}

//admin dashboard stats
export async function getAllocatedResources() {
  const { data } = await api.get("/platform/allocated-resources");
  return data;
}

export async function getUnallocatedResources() {
  const { data } = await api.get("/platform/unallocated-resources");
  return data;
}

//MEETINGS
export const getMeetingsByProjectId = async (projectId: number) => {
  try {
    const response = await api.get(`/projects/${projectId}/meetings`);
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Failed to fetch project meetings"
    );
  }
};

export const getMeetingDetails = async (meetingId: number) => {
  try {
    const response = await api.get(`/meetings/${meetingId}/details`);
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Failed to fetch meeting details"
    );
  }
};

export const getAudioByMeetingId = async (meetingId: number) => {
  try {
    const response = await api.get(`/audio/meeting/${meetingId}`);
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message ||
        "Failed to fetch meeting audio/transcript"
    );
  }
};

export const startMeeting = async (meetingData: {
  projectId: number;
  title: string;
  description: string;
  agenda: string;
  createdBy: number;
  participants: any[];
}): Promise<any> => {
  try {
    const response = await api.post("/meetings/start", meetingData);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to start meeting");
  }
};

// Upload meeting audio
export const uploadMeetingAudio = async (
  meetingId: number,
  formData: FormData
): Promise<any> => {
  try {
    const response = await api.post(
      `/meetings/${meetingId}/upload-audio`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Failed to upload meeting audio"
    );
  }
};

// Meeting Summaries API (STAND-UP BOT)
export const getMeetingSummaries = async (
  userId: number,
  userRole: string,
  projectIds?: string,
  dateFrom?: string,
  dateTo?: string
) => {
  try {
    const params = new URLSearchParams({
      user_id: userId.toString(),
      user_role: userRole,
    });

    if (projectIds) params.append("project_ids", projectIds);
    if (dateFrom) params.append("date_from", dateFrom);
    if (dateTo) params.append("date_to", dateTo);

    // Use Python server URL for meeting summaries
    const response = await axios.get(
      `http://localhost:8001/meeting-summaries?${params.toString()}`
    );
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Failed to fetch meeting summaries"
    );
  }
};

export const startProjectMeeting = async (
  projectId: number,
  freelancerId: number
) => {
  try {
    // Use Python server URL for meeting functionality
    const response = await axios.post("http://localhost:8001/start", {
      project_id: projectId,
      freelancer_id: freelancerId,
    });
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Failed to start project meeting"
    );
  }
};

export const stopMeeting = async () => {
  try {
    // Use Python server URL for meeting functionality
    const response = await axios.post("http://localhost:8001/stop");
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to stop meeting");
  }
};

export const runElevenLabsBot = async () => {
  try {
    const response = await axios.post(
      "http://localhost:8001/run-elevenlabs-bot"
    );
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Failed to run elevenlabs bot"
    );
  }
};

export const storeMeetingSummary = async (summaryData: {
  freelancer_id: number;
  project_id: number;
  freelancer_name: string;
  project_name: string;
  summary: string;
  blocker?: string;
}) => {
  try {
    // Use Python server URL for meeting functionality
    const response = await axios.post(
      "http://localhost:8001/store-meeting-summary",
      summaryData
    );
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Failed to store meeting summary"
    );
  }
};

export const getProjectDetails = async (projectId: number) => {
  try {
    // Use Python server URL for meeting functionality
    const response = await axios.get(
      `http://localhost:8000/project/${projectId}`
    );
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Failed to fetch project details"
    );
  }
};

export const getFreelancerDetails = async (freelancerId: number) => {
  try {
    // Use Python server URL for meeting functionality
    const response = await axios.get(
      `http://localhost:8000/freelancer/${freelancerId}`
    );
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Failed to fetch freelancer details"
    );
  }
};

// GitHub Gist API functions
export const addProjectToGist = async (projectData: {
  id: string;
  projectTitle: string;
  description: string;
}) => {
  try {
    const response = await axios.post(
      "http://localhost:8001/add-project",
      projectData
    );
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.detail || "Failed to add project to gist"
    );
  }
};

export const assignFreelancerToGist = async (assignmentData: {
  id: string;
  freelancerId: string;
  freelancerName: string;
}) => {
  try {
    const response = await axios.post(
      "http://localhost:8001/assign-freelancer",
      assignmentData
    );
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.detail || "Failed to assign freelancer to gist"
    );
  }
};

// Project Closure Summary
export const getProjectClosureSummary = async (projectId: number) => {
  try {
    const response = await api.get(`/projects/${projectId}/closure-summary`);
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Failed to fetch project closure summary"
    );
  }
};
