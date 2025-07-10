export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'client' | 'freelancer';
  skills?: string[];
  hourlyRate?: number;
  rating?: number;
  reviews?: number;
  bio?: string;
  location?: string;
  joinedDate?: string;
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