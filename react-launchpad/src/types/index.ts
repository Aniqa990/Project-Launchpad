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