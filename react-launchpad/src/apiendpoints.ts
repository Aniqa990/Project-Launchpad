import axios from "axios";
import type {FreelancerProfile, LoginResponse, SignupRequest, User, KanbanTask, KanbanSubtask, KanbanTaskStatus, KanbanTaskPriorityLevel, Deliverable, Feedback, ProfileSetupData} from "@/types";
import { lowercaseFirstLetterKeys } from "@/utils/lowercaseFirst";

const api = axios.create({
  baseURL: "http://localhost:7071/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log('API Interceptor:', config.method, config.url, 'Token:', token);
    if (token) {
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

//AUTH
export const loginUser = async (email: string, password: string)=>{
  const response = await api.post('/auth/login', { email, password});
  return response.data;
};

export const signupUser = async (userData: Partial<SignupRequest>)=> {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

export async function validateToken(token?: string) {
  return api.get('/auth/validate', {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  }).then(res => res.data);
}

export const addFreelancerProfile = async(profile: Partial<FreelancerProfile>) => {
  try{
  const response = await api.post("/freelancer", profile);
  return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to save profile');
  }
};

export const updateFreelancerProfile = async(profile: Partial<FreelancerProfile>) => {
  try{
  const response = await api.put("/freelancer", profile);
  return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to save profile');
  }
};

//PROJECT REQUESTS
export const getProjectRequests = async(freelancerId: number) => {
  try{
  const response = await api.get(`/requests/${freelancerId}`);
  return lowercaseFirstLetterKeys(response.data);
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch requests');
  }
};

export const respondToProjectRequest = async (projectId: number, status: string, freelancerId?: number) => {
  try {
    const response = await api.patch(`/requests/${freelancerId}/${projectId}`, { status });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to update request status');
  }
};

export const getFreelancerProjects = async (freelancerId: number) => {
  try {
    const response = await api.get(`/freelancers/${freelancerId}/projects`);
    return lowercaseFirstLetterKeys(response.data);
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch freelancer projects');
  }
};

// Kanban APIs
export const getTasks = async (): Promise<KanbanTask[]> => {
  const response = await api.get('/tasks');
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
  const response = await api.post('/tasks', task);
  return response.data;
};

export const updateTask = async (id: number, update: Partial<{
  status: KanbanTaskStatus;
  priority: KanbanTaskPriorityLevel;
  title: string;
  description: string;
  estimatedDeadline: string;
  createdByUserId: number;
  assignedToUserId: number;
}>): Promise<KanbanTask> => {
  const response = await api.put(`/tasks/${id}`, update);
  return response.data;
};

export const deleteTask = async (id: number): Promise<void> => {
  await api.delete(`/tasks/${id}`);
};

// Subtasks
export const getSubtasks = async (): Promise<KanbanSubtask[]> => {
  const response = await api.get('/subtasks');
  return response.data;
};

export const createSubtask = async (subtask: {
  title: string;
  description: string;
  dueDate: string;
  taskItemId: number;
}): Promise<KanbanSubtask> => {
  const response = await api.post('/subtasks', subtask);
  return response.data;
};

export const updateSubtask = async (id: number, update: Partial<{
  status: KanbanTaskStatus | string;
}>): Promise<KanbanSubtask> => {
  const response = await api.put(`/subtasks/${id}`, update);
  return response.data;
};

// Milestones
export const getMilestones = async (): Promise<any[]> => {
  const response = await api.get('/milestones');
  return response.data;
};

export const getMilestonesByHandoverStatus = async(status: string) =>{
  const response = await api.get(`/platform/milestones/handover/${status}`);
  return response.data;
}

export const updateHandoverStatus = async(milestoneId: number, handoverStatus: string) => {
  const response = await api.patch(`/platform/handover/${milestoneId}`, {handoverStatus});
  return response.data;
}

export const createMilestone = async (milestone: {
  title: string;
  description: string;
  amount: number;
  projectId: number;
  dueDate: string;
}): Promise<any> => {
  const response = await api.post('/milestones', milestone);
  return response.data;
};

export const updateMilestone = async (id: number, update: {
  title: string;
  description: string;
  dueDate: string;
  amount: number;
  freelancerComments?: string;
  submittedFileUrls?: string;
  submissionDate?: string;
  status?: number;
}): Promise<any> => {
  const response = await api.put(`/updatemilestone/${id}`, update);
  return response.data;
};

// Deliverables
export const getDeliverables = async (): Promise<Deliverable[]> => {
  const response = await api.get('/deliverables');
  return response.data;
};

export const createDeliverable = async (deliverable: {
  uploadFiles: string;
  milestoneId: number;
  comment: string;
  status: string;
}): Promise<any> => {
  const response = await api.post('/deliverables', deliverable);
  return response.data;
};

export const updateDeliverable = async (id: number, update: {
  uploadFiles?: string;
  projectId?: number;
  comment?: string;
  status?: string;
}): Promise<any> => {
  const response = await api.put(`/deliverables/${id}`, update);
  return response.data;
};

export const deleteDeliverable = async (id: number): Promise<void> => {
  await api.delete(`/deliverables/${id}`);
};

// Hourly Logs
export const getHourlyLogs = async (): Promise<any[]> => {
  const response = await api.get('/logs');
  return response.data;
};

export const getFreelancerHourlyLogs = async (freelancerId: number): Promise<any[]> => {
  try {
    const response = await api.get(`/logs/freelancer/${freelancerId}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch freelancer hourly logs');
  }
};

export const getLogsByProjectId = async (projectId: number): Promise<any[]> => {
  try {
    const response = await api.get(`/projects/${projectId}/logs`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch logs by project');
  }
};

// PROJECTS
export const getProjects = async () => {
  const res = await api.get('/projects');
  return lowercaseFirstLetterKeys(res.data);
};

export const createProject = async (payload: any) => {
  const res = await api.post('/projects', payload);
  return res.data;
};

export const updateProject = async (id: number, updatedData: any) => {
  const res = await api.put(`/projects/${id}`, updatedData);
  return res.data;
};

export const getProjectsWithPendingApproval = async () => {
  const res = await api.get('platform/projects/pending');
  return lowercaseFirstLetterKeys(res.data);
};

export const updateProjectApprovalStatus = async (Id: number, ApprovalStatus : string, RejectionReason? : string) => {
  const res = await api.patch(`platform/projects/${Id}`, { ApprovalStatus, RejectionReason });
  return res.data;
};

// TIMESHEETS
export const getTimesheets = async () => {
  const res = await api.get('/timesheets');
  return res.data;
};

export const createTimesheet = async (payload: any) => {
  const res = await api.post('/timesheets', payload);
  return res.data;
};

export const approveTimesheet = async (id: number, reviewerComments: string) => {
  const res = await api.put(`/timesheets/${id}/approve`, { reviewerComments });
  return res.data;
};

export const rejectTimesheet = async (id: number, reviewerComments: string) => {
  const res = await api.put(`/timesheets/${id}/reject`, { reviewerComments });
  return res.data;
};

// MESSAGES
export const getUserMessages = async (userId: number) => {
  const res = await api.get(`/messages/user/${userId}`);
  return res.data;
};

export const getConversationMessages = async (userId: number, otherUserId: number) => {
  const res = await api.get(`/messages/conversation/${userId}/${otherUserId}`);
  return res.data;
};

export const sendMessage = async (messageData: any) => {
  const res = await api.post('/messages', messageData);
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
export const getFreelancerFeedbacks = async (freelancerId: number): Promise<Feedback[]> => {
  const response = await api.get(`/feedbacks/freelancer/${freelancerId}`);
  return response.data;
};

// Freelancer Profile Setup API functions
export const getProfileSetupData = async (): Promise<ProfileSetupData> => {
  const response = await api.get('/freelancer/profile-setup');
  return response.data;
};

export const saveProfileSetupData = async (data: {
  firstName: string;
  lastName: string;
  phone: string;
  hourlyRate: number;
  availability: string;
  workingHours: string;
  profileData: ProfileSetupData;
}): Promise<void> => {
  await api.post('/freelancer/profile-setup', data);
};

export const updateProfileSetupData = async (data: {
  firstName: string;
  lastName: string;
  phone: string;
  hourlyRate: number;
  availability: string;
  workingHours: string;
  profilePicture: string;
  profileData: ProfileSetupData;
  password?: string;
  newPassword?: string;
}): Promise<void> => {
  await api.put('/freelancer/profile-setup', data);
};

export const getCurrentUserFreelancerProfile = async (userId: number): Promise<FreelancerProfile> => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }
    const response = await api.get(`/freelancer/${userId}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch freelancer profile');
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
  // Note: This uses the backend port 7053
  const response = await axios.post(
    'http://localhost:7053/api/payments/create-intent',
    params,
    { headers: { 'Content-Type': 'application/json' } }
  );
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
  const response = await axios.post(
    'http://localhost:7053/api/payments/create-checkout-session',
    params,
    { headers: { 'Content-Type': 'application/json' } }
  );
  return response.data;
};

export const getMilestonesByProjectId = async (projectId: number): Promise<any[]> => {
  const response = await api.get(`/milestones/project/${projectId}`);
  return lowercaseFirstLetterKeys(response.data);
};

export const getDeliverablesByMilestoneId = async (milestoneId: number): Promise<any[]> => {
  const response = await api.get(`/deliverables/milestone/${milestoneId}`);
  return response.data;
};

export async function deleteFreelancerProfile(userId: number) {
  const { data } = await api.delete(`/freelancer/${userId}`);
  return data;
}

//Client Profile Setup API
export async function fetchClientProfile(id:number) {
  const { data } = await api.get(`/client/profile/${id}`);
  return lowercaseFirstLetterKeys(data);
}

export async function updateClientProfile(updates: Partial<User>) {
  const { data } = await api.patch('/client/profile', updates);
  return data;
}

export async function deleteClientProfile(userId: number) {
  const { data } = await api.delete(`/client/profile/${userId}`);
  return data;
}

//ADMIN API
export async function fetchPlatformProfile(id:number) {
  const { data } = await api.get(`/platform/profile/${id}`);
  return lowercaseFirstLetterKeys(data);
}

export async function updatePlatformProfile(id:number, updates: Partial<User>) {
  const { data } = await api.patch(`/platform/profile/${id}`, updates);
  return data;
}

//admin dashboard stats
export async function getAllocatedResources() {
  const { data } = await api.get('/platform/allocated-resources');
  return data;
}

export async function getUnallocatedResources() {
  const { data } = await api.get('/platform/unallocated-resources');
  return data;
}
