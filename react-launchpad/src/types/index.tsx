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
  Id: number;
  FirstName: string;
  LastName: string;
  Email: string;
  PhoneNo: string;
  Gender?: string;
  ProfilePicture?: string;
  Role: string;
  CreatedAt: string;
  Summary: string;
  HourlyRate: number;
  WorkingHours: string;
  Availability: string;
  AvgRating: number;
  Skills: string;
  Experience: string;
  Projects: string;
}

export interface Skill {
  Id: number;
  SkillName: string;
  Source: 'parsed' | 'manual';
}

export interface ProjectItem {
  Id: number;
  Title: string;
  Description: string;
  Source: 'parsed' | 'manual';
}

export interface Experience {
  Id: number;
  Title: string;
  Company: string;
  StartDate: string;
  EndDate: string;
  Description: string;
  Source: 'parsed' | 'manual';
}

export interface ProfileSetupData {
  Summary: string;
  Skills: {
    Id: number;
    SkillName: string;
    Source: string;
  }[];
  Projects: {
    Id: number;
    Title: string;
    Description: string;
    Source: string;
  }[];
  Experience: {
    Id: number;
    Title: string;
    Company: string;
    StartDate: string;
    EndDate: string;
    Description: string;
    Source: string;
  }[];
}

export interface ParsedResumeData {
  summary: string;
  skills: Skill[];
  experience: Experience[];
  projects: ProjectItem[];
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

export interface Project {
  id: string;
  title: string;
  description: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  budget: number;
  deadline: string;
  clientId: string;
  category: string;
  paymentType: string;
  numberOfFreelancers: number;  
  attachedDocumentPath: string;
  client: User;
  skills: string[];
  team: User[];
  progress: number;
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
  Description: string;
  EstimatedDeadline: string;
  Priority: number;
  Status: number;
  CreatedByUserId: number;
  AssignedToUserId: number;
  ProjectId: number;
  CreatedByUser: KanbanUser;
  AssignedToUser: KanbanUser;
  CreatedAt: string;
  Subtasks: KanbanSubtask[];
}

export interface Feedback {
  ProjectId: number;
  FreelancerId: number;
  Review: string;
  Rating: number;
  ProjectName: string;
  ClientName: string;
  CreatedAt: string;
}