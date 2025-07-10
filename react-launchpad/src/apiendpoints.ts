import axios from "axios";
import type {FreelancerProfile, LoginResponse, SignupRequest, User, KanbanTask, KanbanSubtask, KanbanTaskStatus, KanbanTaskPriorityLevel, Deliverable} from "@/types";

const api = axios.create({
  baseURL: "http://localhost:7071/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export const loginUser = async (email: string, password: string, role: string)=>{
  const response = await api.post('/auth/login', { email, password, role });
  return response.data;
};

export const signupUser = async (userData: Partial<SignupRequest>)=> {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

export const addFreelancerProfile = async(profile: Partial<FreelancerProfile>) => {
  try{
  const response = await api.post("/freelancer", profile);
  return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to save profile');
  }
};

export const getProjectRequests = async(freelancerId: number) => {
  try{
  const response = await api.get(`/requests/${freelancerId}`);
  return response.data;
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
    return response.data;
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
  projectId: number;
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

