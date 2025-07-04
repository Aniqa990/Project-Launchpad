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
    id: string;
    company: string;
    title: string;
    startDate: string;
    endDate: string;
    description: string;
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
  createdAt: string;
  milestones: Milestone[];
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
  id: string;
  projectId: string;
  project: Project;
  freelancerId: string;
  status: 'pending' | 'accepted' | 'rejected';
  role: string;
  message: string;
  sentAt: string;
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
  id: string;
  projectId: string;
  milestoneId: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: string;
  uploadedBy: string;
  url: string;
  isLocked: boolean;
}