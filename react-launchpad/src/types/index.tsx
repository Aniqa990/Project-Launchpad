import { StringToBoolean } from "class-variance-authority/types";

export interface User {
  id?: number;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  avatar?: string;
  role: 'client' | 'freelancer';
  gender: string;
  location?: string;
  joinedDate?: string;
}

export interface LoginResponse {
  token: string;
  user: any;
}

export interface SignupRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string
  phone: string;
  gender: string;
  role: 'client' | 'freelancer';
  location?: string;
}

export interface FreelancerProfile {
  userId?: number;
  hourlyRate: number;
  workingHours: string;
  availability: string;
  rating?: number;
  reviews?: number; //fetched from separate reviews table
  location?: string;
  summary: string;
  skills: string;
  experience: string;
  projects: string;
}

export interface Freelancer extends User, FreelancerProfile {}

// export interface ParsedResumeData {
//   summary: string;
//   skills: string[];
//   experience: {
//     id: string;
//     company: string;
//     title: string;
//     startDate: string;
//     endDate: string;
//     duration: string;
//     description: string;
//   }[];

// }

export interface ParsedResumeData {
  summary: string;
  skills: string[];
  experience: {
    id: number;
    company: string;
    title: string;
    startDate: string;
    endDate: string;
    description: string;
  }[];
  projects: {
    id: number;
    title: string;
    description: string;
    tools: string[];
  }[];

}

export interface Project {
  id: string;
  title: string;
  description: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  budget: number;
  deadline: string;
  clientId: string;
  client: User;
  skills: string[];
  team: User[];
  progress: number;
  milestones: { name: string }[];
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'approved' | 'paid';
  deliverables: string[];
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'inprogress' | 'done';
  assigneeId: string;
  assignee: User;
  projectId: string;
  priority: 'low' | 'medium' | 'high';
  estimatedHours: number;
  actualHours: number;
  createdAt: string;
  dueDate: string;
}

export interface ProjectRequest {
  projectId: number;
  freelancerId: number;
  //project: Project;
  projectTitle: string;
  projectDescription: string;
  projectCategory:string;
  deadline: Date;
  skills: string[];
  budget?:number;
  clientId: number;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientProfile?: string;
  status: 'pending' | 'accepted' | 'rejected';
  sentAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'inprogress' | 'done';
  assigneeId: string;
  assignee: User;
  projectId: string;
  priority: 'low' | 'medium' | 'high';
  estimatedHours: number;
  actualHours: number;
  createdAt: string;
  dueDate: string;
}

export interface TimeEntry {
  id: string;
  userId: string;
  projectId: string;
  taskId: string;
  date: string;
  startTime: string;
  endTime: string;
  hours: number;
  description: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
}

export interface Message {
  id: string;
  senderId: string;
  sender: User;
  content: string;
  timestamp: string;
  projectId?: string;
  attachments?: string[];
}

export interface Payment {
  id: string;
  projectId: string;
  milestoneId: string;
  amount: number;
  platformFee: number;
  freelancerAmount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
}

export interface Deliverable {
  Id: number;
  uploadFiles: string;
  projectId: number;
  comment: string;
  Status: string;
  status?: string;
}

// Kanban Task Status Enum (backend: 0=ToDo, 1=InProgress, 2=Done)
export enum KanbanTaskStatus {
  ToDo = 0,
  InProgress = 1,
  Done = 2,
}

// Kanban Task Priority Level (backend: 0=Low, 1=Medium, 2=High, 3=Urgent)
export enum KanbanTaskPriorityLevel {
  Low = 0,
  Medium = 1,
  High = 2,
  Urgent = 3,
}

// User structure as per API response (for CreatedByUser, AssignedToUser)
export interface KanbanUser {
  Id: number;
  FirstName: string;
  LastName: string | null;
  Email: string | null;
  PhoneNo: string | null;
  Password: string | null;
  ConfirmPassword: string | null;
  Role: string | null;
  Gender: string | null;
  AvatarUrl: string | null;
}

// Subtask structure as per API response
export interface KanbanSubtask {
  Id: number;
  Title: string;
  Description: string | null;
  DueDate: string | null;
  Status: KanbanTaskStatus;
  TaskItemId: number;
}

// Task structure as per API response
export interface KanbanTask {
  Id: number;
  Title: string;
  Description: string | null;
  EstimatedDeadline: string | null;
  Priority: KanbanTaskPriorityLevel;
  Status: KanbanTaskStatus;
  CreatedByUserId: number;
  CreatedByUser: KanbanUser;
  AssignedToUserId: number;
  AssignedToUser: KanbanUser;
  CreatedAt: string;
  Subtasks: KanbanSubtask[];
}