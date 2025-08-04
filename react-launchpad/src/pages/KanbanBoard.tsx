import React, { useState, useEffect, useMemo } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  Plus, 
  Clock, 
  Calendar, 
  MessageCircle,
  Paperclip,
  Edit3,
  Trash2,
  CheckCircle,
  PlayCircle,
  AlertCircle
} from 'lucide-react';
import { KanbanTask, KanbanTaskStatus, KanbanTaskPriorityLevel, KanbanSubtask, Project, User } from '../types';
import { getTasks, updateTask, createTask, deleteTask, getSubtasks, updateSubtask, getFreelancerProjects, getClientProjects, getProjectById, getTasksByProjectId } from '../apiendpoints';
import { useDroppable } from '@dnd-kit/core';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Avatar } from '../components/ui/avatar';
import { Modal } from '../components/ui/Modal';
import { EditTaskModal } from '../components/ui/EditTaskModal';
import { AddTaskModal } from '../components/ui/AddTaskModal';
import { EditSubtaskModal } from '../components/ui/EditSubtaskModal';

// Custom CSS animations
const customStyles = `
  @keyframes fade-in-up {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .animate-fade-in-up {
    animation: fade-in-up 0.6s ease-out forwards;
  }
  
  .kanban-card {
    transition: all 0.2s ease-in-out;
  }
  
  .kanban-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  }
  
  .kanban-column {
    transition: all 0.3s ease-in-out;
  }
  
  .kanban-column:hover {
    transform: translateY(-1px);
  }
  
  .priority-indicator {
    transition: all 0.2s ease-in-out;
  }
  
  .task-card-dragging {
    transform: rotate(2deg) scale(1.02);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  }
`;

// Remove import { mockSubtasks } from '../../utils/mockData';

interface KanbanColumnProps {
  title: string;
  status: 'todo' | 'inprogress' | 'done';
  tasks: KanbanTask[];
  onTaskClick: (task: KanbanTask) => void;
  setShowAddTaskModal: React.Dispatch<React.SetStateAction<boolean>>;
  subtasks: KanbanSubtask[];
  setEditSubtask: React.Dispatch<React.SetStateAction<KanbanSubtask | null>>;
}

interface SortableTaskProps {
  task: KanbanTask;
  onClick: () => void;
}

// Utility to prevent drag/click conflict
function useClickGuard() {
  const dragging = React.useRef(false);
  return {
    onPointerDown: () => { dragging.current = false; },
    onPointerMove: () => { dragging.current = true; },
    onClick: (cb: () => void) => (e: React.MouseEvent) => {
      if (!dragging.current) cb();
      dragging.current = false;
    },
  };
}

function usePointerClickGuard(onClick: () => void) {
  const downPos = React.useRef<{x: number, y: number} | null>(null);
  return {
    onPointerDown: (e: React.PointerEvent) => {
      downPos.current = { x: e.clientX, y: e.clientY };
    },
    onPointerUp: (e: React.PointerEvent) => {
      if (downPos.current) {
        const dx = Math.abs(e.clientX - downPos.current.x);
        const dy = Math.abs(e.clientY - downPos.current.y);
        if (dx < 5 && dy < 5) {
          onClick();
        }
        downPos.current = null;
      }
    }
  };
}

function SortableTask({ task, onClick }: SortableTaskProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.Id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Map priority enum to label and badge
  const priorityLabel = task.Priority === KanbanTaskPriorityLevel.Urgent
    ? 'Critical'
    : task.Priority === KanbanTaskPriorityLevel.High
    ? 'High'
    : task.Priority === KanbanTaskPriorityLevel.Medium
    ? 'Medium'
    : 'Low';
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'bg-red-100 text-red-800';
      case 'High': return 'bg-orange-100 text-orange-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const createdBy = task.CreatedByUser?.FirstName + (task.CreatedByUser?.LastName ? ' ' + task.CreatedByUser.LastName : '');
  const assignedTo = task.AssignedToUser?.FirstName + (task.AssignedToUser?.LastName ? ' ' + task.AssignedToUser.LastName : '');
  const assignedAvatar = task.AssignedToUser?.AvatarUrl;

  const clickGuard = usePointerClickGuard(onClick);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="mb-3 cursor-pointer"
    >
      <KanbanTaskCard
        task={task}
        onClick={onClick}
      />
    </div>
  );
}

// Status mapping helpers
const statusToColumn = {
  [KanbanTaskStatus.ToDo]: 'todo',
  [KanbanTaskStatus.InProgress]: 'inprogress',
  [KanbanTaskStatus.Done]: 'done',
};
const columnToStatus = {
  'todo': KanbanTaskStatus.ToDo,
  'inprogress': KanbanTaskStatus.InProgress,
  'done': KanbanTaskStatus.Done,
};

// Priority label and badge mapping for modal
const getPriorityLabel = (priority: KanbanTaskPriorityLevel) => {
  switch (priority) {
    case KanbanTaskPriorityLevel.Urgent:
      return 'urgent';
    case KanbanTaskPriorityLevel.High:
      return 'high';
    case KanbanTaskPriorityLevel.Medium:
      return 'medium';
    default:
      return 'low';
  }
};
const getBadgeVariant = (priority: KanbanTaskPriorityLevel) => {
  switch (priority) {
    case KanbanTaskPriorityLevel.Urgent:
    case KanbanTaskPriorityLevel.High:
      return 'danger';
    case KanbanTaskPriorityLevel.Medium:
      return 'warning';
    default:
      return 'default';
  }
};

// KanbanTaskCard component
function KanbanTaskCard({ task, onClick }: { task: KanbanTask; onClick: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.Id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  };
  
  const priorityLabel = task.Priority === KanbanTaskPriorityLevel.Urgent
    ? 'Critical'
    : task.Priority === KanbanTaskPriorityLevel.High
    ? 'High'
    : task.Priority === KanbanTaskPriorityLevel.Medium
    ? 'Medium'
    : 'Low';
    
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'High': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityIndicator = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'bg-red-500';
      case 'High': return 'bg-orange-500';
      case 'Medium': return 'bg-yellow-500';
      case 'Low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const createdBy = task.CreatedByUser?.FirstName + (task.CreatedByUser?.LastName ? ' ' + task.CreatedByUser.LastName : '');
  const assignedTo = task.AssignedToUser?.FirstName + (task.AssignedToUser?.LastName ? ' ' + task.AssignedToUser.LastName : '');
  const assignedAvatar = task.AssignedToUser?.AvatarUrl;
  
  const isOverdue = task.EstimatedDeadline && new Date(task.EstimatedDeadline) < new Date();
  
  const clickGuard = usePointerClickGuard(onClick);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="mb-4 cursor-pointer group"
    >
      <div 
        className={`
          relative bg-white rounded-xl border border-gray-200 p-4 shadow-sm kanban-card
          ${isDragging ? 'task-card-dragging' : ''}
        `}
        onPointerDown={clickGuard.onPointerDown}
        onPointerUp={clickGuard.onPointerUp}
        role="button"
        tabIndex={0}
      >
        {/* Priority indicator line */}
        <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-xl priority-indicator ${getPriorityIndicator(priorityLabel)}`} />
        
        {/* Header with title and priority badge */}
        <div className="flex items-start justify-between mb-3">
          <h4 className="font-semibold text-gray-900 text-sm leading-tight pr-2">
            {task.Title}
          </h4>
          <span className={`rounded-full px-2 py-1 text-xs font-medium border ${getPriorityColor(priorityLabel)} flex-shrink-0`}>
            {priorityLabel === 'Critical' && '🔴'}
            {priorityLabel === 'High' && '🟠'}
            {priorityLabel === 'Medium' && '🟡'}
            {priorityLabel === 'Low' && '🟢'}
            {priorityLabel}
          </span>
        </div>
        
        {/* Description */}
        {task.Description && (
          <p className="text-xs text-gray-600 line-clamp-2 mb-3 leading-relaxed">
            {task.Description}
          </p>
        )}
        
        {/* Assigned and Created by info */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center text-xs">
            <span className="text-gray-500 mr-2">Assigned:</span>
            <div className="flex items-center">
              {assignedAvatar ? (
                <img src={assignedAvatar} alt={assignedTo} className="w-4 h-4 rounded-full mr-1" />
              ) : (
                <div className="w-4 h-4 rounded-full bg-blue-500 mr-1 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">
                    {assignedTo?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                </div>
              )}
              <span className="font-medium text-blue-600">{assignedTo || 'Unassigned'}</span>
            </div>
          </div>
          
          <div className="flex items-center text-xs">
            <span className="text-gray-500 mr-2">Created by:</span>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-gray-500 mr-1 flex items-center justify-center">
                <span className="text-white text-xs font-bold">
                  {createdBy?.charAt(0)?.toUpperCase() || '?'}
                </span>
              </div>
              <span className="font-medium text-gray-900">{createdBy || 'Unknown'}</span>
            </div>
          </div>
        </div>
        
        {/* Due date */}
        <div className="flex items-center text-xs text-gray-500 mb-3">
          <Calendar className="w-3 h-3 mr-1" />
          <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
            Due: {task.EstimatedDeadline ? new Date(task.EstimatedDeadline).toLocaleDateString() : 'No deadline'}
            {isOverdue && ' (Overdue)'}
          </span>
        </div>
        
        {/* Footer with creation date and task ID */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="text-xs text-gray-400">
            Created: {task.CreatedAt ? new Date(task.CreatedAt).toLocaleDateString() : 'Unknown'}
          </div>
          <div className="text-xs text-gray-400 font-mono">
            #{task.Id}
          </div>
        </div>
      </div>
    </div>
  );
}

// KanbanColumn component
function KanbanColumn({ title, status, tasks, onTaskClick, setShowAddTaskModal, subtasks, setEditSubtask }: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({ id: `column-${status}` });
  const sortableIds = tasks.map(t => t.Id);
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'done': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'inprogress': return <PlayCircle className="w-5 h-5 text-blue-600" />;
      case 'todo': return <Clock className="w-5 h-5 text-gray-600" />;
      default: return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getColumnStyles = (status: string) => {
    switch (status) {
      case 'todo':
        return {
          header: 'bg-gray-100 border-gray-200',
          content: 'bg-gray-50',
          title: 'text-gray-700'
        };
      case 'inprogress':
        return {
          header: 'bg-blue-100 border-blue-200',
          content: 'bg-blue-50',
          title: 'text-blue-700'
        };
      case 'done':
        return {
          header: 'bg-green-100 border-green-200',
          content: 'bg-green-50',
          title: 'text-green-700'
        };
      default:
        return {
          header: 'bg-gray-100 border-gray-200',
          content: 'bg-gray-50',
          title: 'text-gray-700'
        };
    }
  };

  const styles = getColumnStyles(status);

  return (
    <div className="flex flex-col h-full kanban-column">
      {/* Sticky Column Header */}
      <div className={`sticky top-0 z-10 p-4 rounded-t-xl border-b ${styles.header} shadow-sm`}>
        <div className="flex items-center justify-between">
          <h3 className={`text-lg font-bold flex items-center gap-2 ${styles.title}`}>
            {getStatusIcon(status)}
            {title}
          </h3>
          <span className="rounded-full px-3 py-1 text-sm font-bold bg-white shadow-sm border">
            {tasks.length}
          </span>
        </div>
      </div>
      
      {/* Column Content */}
      <div 
        ref={setNodeRef} 
        className={`flex-1 p-4 rounded-b-xl ${styles.content} min-h-[600px] max-h-[800px] overflow-y-auto`}
      >
        <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {tasks.map((task) => (
              <KanbanTaskCard
                key={task.Id}
                task={task}
                onClick={() => onTaskClick(task)}
              />
            ))}
            {tasks.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <div className="mb-4">
                  {status === 'todo' && <Clock className="w-12 h-12 text-gray-300 mx-auto" />}
                  {status === 'inprogress' && <PlayCircle className="w-12 h-12 text-blue-300 mx-auto" />}
                  {status === 'done' && <CheckCircle className="w-12 h-12 text-green-300 mx-auto" />}
                </div>
                <p className="text-sm font-medium text-gray-400 mb-1">
                  No {title.toLowerCase()} tasks
                </p>
                <p className="text-xs text-gray-400">
                  {status === 'todo' && 'Tasks will appear here when created'}
                  {status === 'inprogress' && 'Drag tasks here to start working'}
                  {status === 'done' && 'Completed tasks will appear here'}
                </p>
              </div>
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}







export function KanbanBoard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [tasks, setTasks] = useState<KanbanTask[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedTask, setSelectedTask] = useState<KanbanTask | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [editTask, setEditTask] = useState<KanbanTask | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [subtasks, setSubtasks] = useState<KanbanSubtask[]>([]);
  const [selectedSubtask, setSelectedSubtask] = useState<KanbanSubtask | null>(null);

  const [projectDetails, setProjectDetails] = useState<any>(null);
  const [loadingProjectDetails, setLoadingProjectDetails] = useState(false);

  useEffect(() => {
    async function fetchTasks() {
      setLoading(true);
      try {
        const data = await getTasks();
        setTasks(data);
        const subtaskData = await getSubtasks();
        setSubtasks(subtaskData);
      } catch (e) {
        // handle error (could show toast)
      } finally {
        setLoading(false);
      }
    }
    fetchTasks();
  }, []);

  useEffect(() => {
    async function fetchProjects() {
      setLoadingProjects(true);
      setMessage('');
      try {
        if (!user?.id) return;
        
        let projectsData;
        if (user?.role === 'freelancer') {
          projectsData = await getFreelancerProjects(user.id);
        } else if (user?.role === 'client') {
          projectsData = await getClientProjects(user.id);
        } else {
          return;
        }
        
        setProjects(projectsData);
        if (projectsData.length === 0) {
          setMessage(user?.role === 'freelancer' 
            ? 'No projects assigned to you yet.' 
            : 'No projects created yet.');
        }
      } catch (e) {
        setMessage('Could not fetch your projects.');
      } finally {
        setLoadingProjects(false);
      }
    }
    
    if (user?.role === 'freelancer' || user?.role === 'client') {
      fetchProjects();
    }
  }, [user]);

  // 1. Only show tasks if a project is selected
  useEffect(() => {
    if (!selectedProjectId) {
      setTasks([]);
      return;
    }
    async function fetchTasks() {
      setLoadingTasks(true);
      setMessage('');
      try {
        const res = await getTasksByProjectId(selectedProjectId!);
        setTasks(res);
        if (res.length === 0) {
          setMessage('No tasks for this project yet.');
        }
      } catch (e) {
        setMessage('Could not fetch tasks for this project.');
      } finally {
        setLoadingTasks(false);
      }
    }
    fetchTasks();
  }, [selectedProjectId]);



  // Fetch project details when project is selected
  useEffect(() => {
    if (!selectedProjectId) {
      setProjectDetails(null);
      return;
    }
    async function fetchProjectDetails() {
      setLoadingProjectDetails(true);
      try {
        const projectData = await getProjectById(selectedProjectId!);
        setProjectDetails(projectData);
      } catch (e) {
        console.error('Could not fetch project details:', e);
        setProjectDetails(null);
      } finally {
        setLoadingProjectDetails(false);
      }
    }
    fetchProjectDetails();
  }, [selectedProjectId]);

  // Get freelancers from selected project's team
  const getProjectFreelancers = (): User[] => {
    if (!selectedProjectId) return [];
    const selectedProject = projects.find(p => p.id === selectedProjectId);
    return selectedProject?.team || [];
  };

  // Validation function to check if task deadline is within project deadline
  const validateTaskDeadline = (taskDeadline: string): string => {
    if (!taskDeadline || !projectDetails?.Deadline) {
      return '';
    }
    
    const taskDeadlineDate = new Date(taskDeadline);
    const projectDeadlineDate = new Date(projectDetails.Deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check if task deadline is in the past
    if (taskDeadlineDate < today) {
      return 'Task deadline cannot be in the past';
    }
    
    // Check if task deadline exceeds project deadline
    if (taskDeadlineDate > projectDeadlineDate) {
      return `Task deadline cannot exceed project deadline (${new Date(projectDetails.Deadline).toLocaleDateString()})`;
    }
    
    return '';
  };

  // 2. After drag, add, or update, re-fetch only the selected project's tasks
  const fetchProjectTasks = async () => {
    if (!selectedProjectId) return;
    setLoadingTasks(true);
    setMessage('');
    try {
      const res = await getTasksByProjectId(selectedProjectId);
      setTasks(res);
      if (res.length === 0) {
        setMessage('No tasks for this project yet.');
      }
    } catch (e) {
      setMessage('Could not fetch tasks for this project.');
    } finally {
      setLoadingTasks(false);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    // Handle subtasks
    if (typeof active.id === 'string' && active.id.startsWith('subtask-')) {
      const subtaskId = Number(active.id.replace('subtask-', ''));
      const activeSubtask = subtasks.find(st => st.Id === subtaskId);
      if (!activeSubtask) return;
      let newStatus = activeSubtask.Status;
      // If dropped on a column, set status based on column
      if (over.id && typeof over.id === 'string' && over.id.startsWith('column-')) {
        const col = over.id.replace('column-', '');
        if (col === 'todo') newStatus = KanbanTaskStatus.ToDo;
        else if (col === 'inprogress') newStatus = KanbanTaskStatus.InProgress;
        else if (col === 'done') newStatus = KanbanTaskStatus.Done;
      } else {
        // If dropped on another subtask, use that subtask's status
        if (typeof over.id === 'string' && over.id.startsWith('subtask-')) {
          const overSubtaskId = Number(over.id.replace('subtask-', ''));
          const overSubtask = subtasks.find(st => st.Id === overSubtaskId);
          if (overSubtask && overSubtask.Status !== activeSubtask.Status) {
            newStatus = overSubtask.Status;
          }
        }
      }
      if (newStatus !== activeSubtask.Status && newStatus !== undefined) {
        try {
          setFormLoading(true);
          await updateSubtask(activeSubtask.Id, { status: newStatus });
          const subtaskData = await getSubtasks();
          setSubtasks(subtaskData);
        } catch (e) {
          // Optionally show error toast
        } finally {
          setFormLoading(false);
        }
      }
      return;
    }
    // Handle tasks (existing logic)
    const activeTask = tasks.find(t => t.Id === active.id);
    if (!activeTask) return;
    let newStatus = activeTask.Status;
    // If dropped on a column, set status based on column
    if (over.id && typeof over.id === 'string' && over.id.startsWith('column-')) {
      const col = over.id.replace('column-', '');
      if (col === 'todo') newStatus = KanbanTaskStatus.ToDo;
      else if (col === 'inprogress') newStatus = KanbanTaskStatus.InProgress;
      else if (col === 'done') newStatus = KanbanTaskStatus.Done;
    } else {
      // If dropped on a task, use that task's status
      const overTask = tasks.find(t => t.Id === over.id);
      if (overTask && overTask.Status !== activeTask.Status) {
        newStatus = overTask.Status;
      }
    }
    if (newStatus !== activeTask.Status && newStatus !== undefined) {
      try {
        setFormLoading(true);
        await updateTask(activeTask.Id, { status: newStatus });
        await fetchProjectTasks(); // Only fetch tasks for the selected project
      } catch (e) {
        // Optionally show error toast
      } finally {
        setFormLoading(false);
      }
    }
  };

  // Fix: Only one modal open at a time
  const handleTaskClick = (task: KanbanTask) => {
    setSelectedTask(task);
    setShowTaskModal(true);
    setEditTask(null);
    setShowAddTaskModal(false);
  };

  const handleEditButton = () => {
    setEditTask(selectedTask);
    setShowTaskModal(false);
    setShowAddTaskModal(false);
  };

  const handleCreateTaskButton = () => {
    setShowAddTaskModal(true);
    setShowTaskModal(false);
    setEditTask(null);
  };

  const handleAddTask = async (form: any) => {
    setFormLoading(true);
    try {
      await createTask({ ...form, ProjectId: selectedProjectId });
      await fetchProjectTasks();
      setShowAddTaskModal(false);
    } catch (e) {
      // handle error
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditTask = async (id: number, update: Partial<{
    title: string;
    description: string;
    estimatedDeadline: string;
    priority: KanbanTaskPriorityLevel;
    createdByUserId: number;
    assignedToUserId: number;
    status: KanbanTaskStatus;
  }>) => {
    setFormLoading(true);
    try {
      await updateTask(id, update);
      await fetchProjectTasks(); // Only fetch tasks for the selected project
      setEditTask(null);
      setShowTaskModal(false);
    } catch (e) {
      // handle error
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteTask = async (id: number) => {
    setDeleteLoading(true);
    try {
      await deleteTask(id);
      setTasks(tasks => tasks.filter(task => task.Id !== id));
      setShowTaskModal(false);
    } catch (e) {
      // handle error
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleEditSubtask = async (id: number, update: Partial<{
    title: string;
    description: string;
    dueDate: string;
    status: KanbanTaskStatus;
  }>) => {
    setFormLoading(true);
    try {
      await updateSubtask(id, update);
      const subtaskData = await getSubtasks();
      setSubtasks(subtaskData);
      setSelectedSubtask(null);
    } catch (e) {
      // handle error
    } finally {
      setFormLoading(false);
    }
  };

  const todoTasks = tasks.filter(t => t.Status === KanbanTaskStatus.ToDo)
    .sort((a, b) => b.Priority - a.Priority);
  const inProgressTasks = tasks.filter(t => t.Status === KanbanTaskStatus.InProgress)
    .sort((a, b) => b.Priority - a.Priority);
  const doneTasks = tasks.filter(t => t.Status === KanbanTaskStatus.Done)
    .sort((a, b) => b.Priority - a.Priority);

  // Get unique projects and freelancers from tasks
  const freelancers = useMemo(() => {
    const set = new Set(tasks.map(t => t.AssignedToUser?.FirstName + (t.AssignedToUser?.LastName ? ' ' + t.AssignedToUser.LastName : '')));
    return Array.from(set).filter(Boolean);
  }, [tasks]);

  // FILTER STATE
  const [selectedProject, setSelectedProject] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedFreelancer, setSelectedFreelancer] = useState('all');

  // Unique projects and freelancers from Kanban data
  const uniqueFreelancers = useMemo(() => {
    const set = new Set(tasks.map(t => t.AssignedToUser?.FirstName + (t.AssignedToUser?.LastName ? ' ' + t.AssignedToUser.LastName : '')));
    return Array.from(set).filter(Boolean);
  }, [tasks]);

  // FILTERED TASKS
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesProject = selectedProject === 'all'; // ProjectName does not exist on KanbanTask
      const matchesStatus = selectedStatus === 'all' ||
        (selectedStatus === 'To Do' && task.Status === KanbanTaskStatus.ToDo) ||
        (selectedStatus === 'In Progress' && task.Status === KanbanTaskStatus.InProgress) ||
        (selectedStatus === 'Done' && task.Status === KanbanTaskStatus.Done);
      const assignedName = task.AssignedToUser?.FirstName + (task.AssignedToUser?.LastName ? ' ' + task.AssignedToUser.LastName : '');
      const matchesFreelancer = selectedFreelancer === 'all' || assignedName === selectedFreelancer;
      return matchesProject && matchesStatus && matchesFreelancer;
    });
  }, [tasks, selectedProject, selectedStatus, selectedFreelancer]);

  // GROUP TASKS BY STATUS
  const tasksByStatus = useMemo(() => ({
    'To Do': filteredTasks.filter(t => t.Status === KanbanTaskStatus.ToDo),
    'In Progress': filteredTasks.filter(t => t.Status === KanbanTaskStatus.InProgress),
    'Done': filteredTasks.filter(t => t.Status === KanbanTaskStatus.Done),
  }), [filteredTasks]);

  // CLEAR FILTERS
  const clearFilters = () => {
    setSelectedProject('all');
    setSelectedStatus('all');
    setSelectedFreelancer('all');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      <style>{customStyles}</style>
      <div className="max-w-7xl mx-auto space-y-8 p-6">
        {/* Enhanced Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Project Tasks
              </h1>
              <p className="text-gray-600 mt-2 text-lg">
                {user?.role === 'freelancer' 
                  ? 'View and track project tasks' 
                  : 'Monitor and track project progress'
                }
              </p>
            </div>
            {user?.role === 'freelancer' && (
              <Button 
                icon={Plus} 
                onClick={handleCreateTaskButton} 
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                variant="primary"
              >
                Create Task
              </Button>
            )}
          </div>
        </div>

        {/* Project Selection */}
        {(user?.role === 'freelancer' || user?.role === 'client') && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <label className="block mb-3 font-semibold text-gray-700 text-lg">
              {user?.role === 'freelancer' ? 'Select Project:' : 'Select Your Project:'}
            </label>
            {loadingProjects ? (
              <div className="flex items-center space-x-2 text-gray-600">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <span>Loading projects...</span>
              </div>
            ) : projects.length === 0 ? (
              <div className="text-gray-500 bg-gray-50 rounded-lg p-4 border-2 border-dashed border-gray-200">
                {message}
              </div>
            ) : (
              <select
                className="w-full lg:w-96 border border-gray-300 rounded-xl p-3 text-gray-700 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                value={selectedProjectId ?? ''}
                onChange={e => setSelectedProjectId(Number(e.target.value) || null)}
              >
                <option value="">-- Select a project --</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.projectTitle && p.projectTitle !== 'na'
                      ? p.projectTitle
                      : (p.description && p.description !== 'na'
                          ? p.description
                          : (p.projectTitle === 'na' && p.description === 'na' ? 'na' : `Project #${p.id}`))}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}
        
        {/* Enhanced Filters Section */}
        {selectedProjectId && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Filter Tasks</h3>
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Status:</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                >
                  <option value="all">All Status</option>
                  <option value="To Do">To Do</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Done">Done</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Freelancer:</label>
                <select
                  value={selectedFreelancer}
                  onChange={(e) => setSelectedFreelancer(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                >
                  <option value="all">All Freelancers</option>
                  {uniqueFreelancers.map((freelancer) => (
                    <option key={freelancer} value={freelancer}>
                      {freelancer}
                    </option>
                  ))}
                </select>
              </div>
              
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
        
        {/* Enhanced Kanban Board */}
        {selectedProjectId ? (
          loadingTasks ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading tasks...</p>
            </div>
          ) : message ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">{message}</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                  <div className="animate-fade-in-up" style={{ animationDelay: '0ms' }}>
                    <KanbanColumn
                      title="To Do"
                      status="todo"
                      tasks={tasksByStatus['To Do']}
                      onTaskClick={handleTaskClick}
                      setShowAddTaskModal={setShowAddTaskModal}
                      subtasks={subtasks}
                      setEditSubtask={setSelectedSubtask}
                    />
                  </div>
                  <div className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                    <KanbanColumn
                      title="In Progress"
                      status="inprogress"
                      tasks={tasksByStatus['In Progress']}
                      onTaskClick={handleTaskClick}
                      setShowAddTaskModal={setShowAddTaskModal}
                      subtasks={subtasks}
                      setEditSubtask={setSelectedSubtask}
                    />
                  </div>
                  <div className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                    <KanbanColumn
                      title="Done"
                      status="done"
                      tasks={tasksByStatus['Done']}
                      onTaskClick={handleTaskClick}
                      setShowAddTaskModal={setShowAddTaskModal}
                      subtasks={subtasks}
                      setEditSubtask={setSelectedSubtask}
                    />
                  </div>
                </div>
              </DndContext>
            </div>
          )
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="mb-4">
              <Clock className="w-16 h-16 text-gray-300 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Select a Project</h3>
            <p className="text-gray-500">Please select a project to view its tasks.</p>
          </div>
        )}

        {/* Enhanced Summary Stats */}
        <Card className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-blue-50/50 border-b border-gray-200 p-6">
            <div className="font-bold text-xl text-gray-900">Task Summary</div>
            <div className="text-gray-600">Overview of all project tasks</div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                <div className="text-3xl font-bold text-gray-900 mb-2">{filteredTasks.length}</div>
                <div className="text-sm font-medium text-gray-600">Total Tasks</div>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                <div className="text-3xl font-bold text-blue-600 mb-2">{tasksByStatus['In Progress'].length}</div>
                <div className="text-sm font-medium text-blue-700">In Progress</div>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
                <div className="text-3xl font-bold text-green-600 mb-2">{tasksByStatus['Done'].length}</div>
                <div className="text-sm font-medium text-green-700">Completed</div>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl border border-yellow-200">
                <div className="text-3xl font-bold text-yellow-600 mb-2">
                  {filteredTasks.filter(t => t.Priority === KanbanTaskPriorityLevel.Urgent || t.Priority === KanbanTaskPriorityLevel.High).length}
                </div>
                <div className="text-sm font-medium text-yellow-700">High Priority</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Enhanced No tasks found */}
        {filteredTasks.length === 0 && selectedProjectId && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No tasks found</h3>
            <p className="text-gray-600">
              {user?.role === 'freelancer' 
                ? 'Tasks will appear here when you create them.' 
                : 'Tasks will appear here when freelancers create them.'
              }
            </p>
          </div>
        )}

        {/* Modals */}
        {showTaskModal && selectedTask && (
          <EditTaskModal
            isOpen={showTaskModal}
            onClose={() => setShowTaskModal(false)}
            task={selectedTask}
            onUpdate={handleEditTask}
            onDelete={handleDeleteTask}
            loading={formLoading}
            projectFreelancers={getProjectFreelancers()}
            projectDetails={projectDetails}
            validateTaskDeadline={validateTaskDeadline}
          />
        )}
        
        {showAddTaskModal && (
          <AddTaskModal
            isOpen={showAddTaskModal}
            onClose={() => setShowAddTaskModal(false)}
            onSubmit={handleAddTask}
            loading={formLoading}
            selectedProjectId={selectedProjectId}
            projectFreelancers={getProjectFreelancers()}
            projectDetails={projectDetails}
            validateTaskDeadline={validateTaskDeadline}
          />
        )}
        
        {selectedSubtask && (
          <EditSubtaskModal
            isOpen={!!selectedSubtask}
            onClose={() => setSelectedSubtask(null)}
            onSubmit={handleEditSubtask}
            loading={formLoading}
            subtask={selectedSubtask}
          />
        )}
      </div>
    </div>
  );
}