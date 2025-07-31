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
  AlertCircle,
  Brain
} from 'lucide-react';
import { KanbanTask, KanbanTaskStatus, KanbanTaskPriorityLevel, KanbanSubtask, Project, User } from '../../types';
import { getTasks, updateTask, createTask, deleteTask, getSubtasks, updateSubtask, getFreelancerProjects, getClientProjects, getProjectById, getTasksByProjectId } from '../../apiendpoints';
import { useDroppable } from '@dnd-kit/core';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Avatar } from '../ui/avatar';
import { Modal } from '../ui/Modal';
import { AITaskGenerator } from '../ui/AITaskGenerator';
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
    transition: isDragging ? 'none' : transition,
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 1000 : 'auto',
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
      case 'Critical': return 'bg-red-100 text-red-700 border-red-200';
      case 'High': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Low': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };
  
  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'Critical': return '🔴';
      case 'High': return '🟠';
      case 'Medium': return '🟡';
      case 'Low': return '🟢';
      default: return '⚪';
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
      className="mb-4 cursor-grab active:cursor-grabbing"
    >
      <div 
        className={`
          group relative bg-white rounded-xl border border-gray-200 p-5 shadow-sm
          hover:shadow-lg hover:shadow-blue-100/50 hover:border-blue-200 
          transition-all duration-200 ease-in-out transform hover:scale-[1.02]
          ${isDragging ? 'shadow-2xl shadow-blue-200/50 rotate-2' : ''}
        `}
        onPointerDown={clickGuard.onPointerDown}
        onPointerUp={clickGuard.onPointerUp}
        role="button"
        tabIndex={0}
      >
        {/* Priority indicator line */}
        <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-xl ${
          priorityLabel === 'Critical' ? 'bg-red-500' :
          priorityLabel === 'High' ? 'bg-orange-500' :
          priorityLabel === 'Medium' ? 'bg-yellow-500' :
          'bg-green-500'
        }`} />
        
        <div className="space-y-4">
          {/* Header with title and priority */}
          <div className="flex items-start justify-between">
            <h4 className="font-semibold text-gray-900 text-sm leading-tight pr-2 line-clamp-2">
              {task.Title}
            </h4>
            <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${getPriorityColor(priorityLabel)} flex-shrink-0`}>
              <span className="text-xs">{getPriorityIcon(priorityLabel)}</span>
              {priorityLabel}
            </span>
          </div>
          
          {/* Description */}
          {task.Description && (
            <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
              {task.Description}
            </p>
          )}
          
          {/* Assignment info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-gray-500">Assigned to:</span>
                {assignedAvatar ? (
                  <img src={assignedAvatar} alt={assignedTo} className="w-4 h-4 rounded-full border border-gray-200" />
                ) : (
                  <div className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-xs text-blue-600 font-medium">
                      {assignedTo?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                )}
                <span className="font-medium text-blue-700">{assignedTo}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 text-xs">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              <span className="text-gray-500">Created by:</span>
              <span className="font-medium text-gray-700">{createdBy}</span>
            </div>
          </div>
          
          {/* Due date */}
          {task.EstimatedDeadline && (
            <div className="flex items-center gap-2 text-xs">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-gray-500">Due:</span>
              <span className={`font-medium ${
                new Date(task.EstimatedDeadline) < new Date() 
                  ? 'text-red-600' 
                  : 'text-gray-700'
              }`}>
                {new Date(task.EstimatedDeadline).toLocaleDateString()}
              </span>
            </div>
          )}
          
          {/* Footer with creation date */}
          <div className="pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>Created: {task.CreatedAt ? new Date(task.CreatedAt).toLocaleDateString() : 'N/A'}</span>
              <span className="bg-gray-100 px-2 py-0.5 rounded-full">#{task.Id}</span>
            </div>
          </div>
        </div>
        
        {/* Hover overlay effect */}
        <div className="absolute inset-0 bg-blue-50 opacity-0 group-hover:opacity-5 rounded-xl transition-opacity duration-200" />
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
  
  const getColumnColor = (status: string) => {
    switch (status) {
      case 'done': return 'bg-green-50 border-green-200';
      case 'inprogress': return 'bg-blue-50 border-blue-200';
      case 'todo': return 'bg-gray-50 border-gray-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };
  
  const getHeaderColor = (status: string) => {
    switch (status) {
      case 'done': return 'bg-green-100 text-green-800';
      case 'inprogress': return 'bg-blue-100 text-blue-800';
      case 'todo': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className="flex flex-col h-full">
      {/* Column Header */}
      <div className={`sticky top-0 z-10 p-4 rounded-t-xl ${getHeaderColor(status)} border-b border-gray-200 shadow-sm`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon(status)}
            <h3 className="text-lg font-bold text-gray-900">
              {title}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-white/80 backdrop-blur-sm rounded-full px-3 py-1 text-sm font-semibold text-gray-700 shadow-sm">
              {tasks.length}
            </span>
          </div>
        </div>
      </div>
      
      {/* Column Content */}
      <div 
        ref={setNodeRef} 
        className={`flex-1 p-4 ${getColumnColor(status)} rounded-b-xl min-h-[calc(100vh-300px)] max-h-[calc(100vh-200px)] overflow-y-auto`}
      >
        <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {tasks.map((task) => (
              <KanbanTaskCard
                key={task.Id}
                task={task}
                onClick={() => onTaskClick(task)}
              />
            ))}
            {tasks.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400 border-2 border-dashed border-gray-300 rounded-xl bg-white/50">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                  {getStatusIcon(status)}
                </div>
                <p className="text-sm font-medium text-gray-500">No {title.toLowerCase()} tasks</p>
                <p className="text-xs text-gray-400 mt-1">Tasks will appear here</p>
              </div>
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}

// EditTaskModal component for updating and deleting a task
function EditTaskModal({ isOpen, onClose, task, onUpdate, onDelete, loading, projectFreelancers, projectDetails, validateTaskDeadline }: {
  isOpen: boolean;
  onClose: () => void;
  task: KanbanTask | null;
  onUpdate: (id: number, form: any) => void;
  onDelete: (id: number) => void;
  loading: boolean;
  projectFreelancers: User[];
  projectDetails: any;
  validateTaskDeadline: (deadline: string) => string;
}) {
  const [form, setForm] = React.useState<any>(task ? {
    title: task.Title,
    description: task.Description || '',
    estimatedDeadline: task.EstimatedDeadline ? task.EstimatedDeadline.split('T')[0] : '',
    priority: task.Priority,
    createdByUserId: task.CreatedByUserId,
    assignedToUserId: task.AssignedToUserId,
    status: task.Status,
  } : {});
  const [deadlineError, setDeadlineError] = React.useState('');
  useEffect(() => {
    if (task) {
      setForm({
        title: task.Title,
        description: task.Description || '',
        estimatedDeadline: task.EstimatedDeadline ? task.EstimatedDeadline.split('T')[0] : '',
        priority: task.Priority,
        createdByUserId: task.CreatedByUserId,
        assignedToUserId: task.AssignedToUserId,
        status: task.Status,
      });
    }
  }, [task]);
  if (!isOpen || !task) return null;
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    
    // Validate deadline when it changes
    if (name === 'estimatedDeadline') {
      const error = validateTaskDeadline(value);
      setDeadlineError(error);
    }
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate deadline before submitting
    if (form.estimatedDeadline) {
      const error = validateTaskDeadline(form.estimatedDeadline);
      if (error) {
        setDeadlineError(error);
        return;
      }
    }
    
    onUpdate(task.Id, {
      ...form,
      priority: Number(form.priority),
      createdByUserId: Number(form.createdByUserId),
      assignedToUserId: Number(form.assignedToUserId),
      status: Number(form.status),
    });
  };
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
      <div className="bg-white p-8 rounded shadow-lg w-full max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="edit-title">Title</label>
          <input id="edit-title" name="title" value={form.title} onChange={handleChange} placeholder="Title" className="w-full border p-2 rounded" required />
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="edit-description">Description</label>
          <textarea id="edit-description" name="description" value={form.description} onChange={handleChange} placeholder="Description" className="w-full border p-2 rounded" />
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="edit-estimatedDeadline">Estimated Deadline</label>
          <input 
            id="edit-estimatedDeadline" 
            name="estimatedDeadline" 
            type="date" 
            value={form.estimatedDeadline} 
            onChange={handleChange} 
            className={`w-full border p-2 rounded ${deadlineError ? 'border-red-500' : 'border-gray-300'}`}
            min={new Date().toISOString().split('T')[0]}
            max={projectDetails?.Deadline ? new Date(projectDetails.Deadline).toISOString().split('T')[0] : undefined}
          />
          {deadlineError && (
            <p className="text-red-500 text-sm mt-1">{deadlineError}</p>
          )}
          {projectDetails?.Deadline && (
            <p className="text-gray-500 text-sm mt-1">
              Project deadline: {new Date(projectDetails.Deadline).toLocaleDateString()}
            </p>
          )}
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="edit-priority">Priority</label>
          <select id="edit-priority" name="priority" value={form.priority} onChange={handleChange} className="w-full border p-2 rounded">
            <option value={0}>Low</option>
            <option value={1}>Medium</option>
            <option value={2}>High</option>
            <option value={3}>Urgent</option>
          </select>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="edit-createdByUserId">Created By</label>
          <select id="edit-createdByUserId" name="createdByUserId" value={form.createdByUserId} onChange={handleChange} className="w-full border p-2 rounded" required>
            <option value="">Select a freelancer</option>
            {projectFreelancers.map((freelancer) => (
              <option key={freelancer.id} value={freelancer.id}>
                {freelancer.firstName} {freelancer.lastName}
              </option>
            ))}
          </select>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="edit-assignedToUserId">Assigned To</label>
          <select id="edit-assignedToUserId" name="assignedToUserId" value={form.assignedToUserId} onChange={handleChange} className="w-full border p-2 rounded" required>
            <option value="">Select a freelancer</option>
            {projectFreelancers.map((freelancer) => (
              <option key={freelancer.id} value={freelancer.id}>
                {freelancer.firstName} {freelancer.lastName}
              </option>
            ))}
          </select>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="edit-status">Status</label>
          <select id="edit-status" name="status" value={form.status} onChange={handleChange} className="w-full border p-2 rounded">
            <option value={0}>To Do</option>
            <option value={1}>In Progress</option>
            <option value={2}>Done</option>
          </select>
          <div className="flex justify-between mt-6">
            <button type="button" onClick={() => onDelete(task.Id)} className="px-4 py-2 bg-red-600 text-white rounded">Delete</button>
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-300 text-gray-800 rounded">Cancel</button>
              <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">{loading ? 'Saving...' : 'Save Changes'}</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// Subtask Edit Modal
function EditSubtaskModal({ isOpen, onClose, onSubmit, loading, subtask }: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: number, form: any) => void;
  loading: boolean;
  subtask: KanbanSubtask | null;
}) {
  const [form, setForm] = useState<any>(subtask ? {
    title: subtask.Title,
    description: subtask.Description || '',
    dueDate: subtask.DueDate ? subtask.DueDate.split('T')[0] : '',
    status: subtask.Status,
  } : {});
  useEffect(() => {
    if (subtask) {
      setForm({
        title: subtask.Title,
        description: subtask.Description || '',
        dueDate: subtask.DueDate ? subtask.DueDate.split('T')[0] : '',
        status: subtask.Status,
      });
    }
  }, [subtask]);
  if (!subtask) return null;
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(subtask.Id, {
      ...form,
      status: Number(form.status),
    });
  };
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
      <div className="bg-white p-8 rounded shadow-lg w-full max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="edit-subtask-title">Title</label>
          <input id="edit-subtask-title" name="title" value={form.title} onChange={handleChange} placeholder="Title" className="w-full border p-2 rounded" required />
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="edit-subtask-description">Description</label>
          <textarea id="edit-subtask-description" name="description" value={form.description} onChange={handleChange} placeholder="Description" className="w-full border p-2 rounded" />
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="edit-subtask-dueDate">Due Date</label>
          <input id="edit-subtask-dueDate" name="dueDate" type="date" value={form.dueDate} onChange={handleChange} className="w-full border p-2 rounded" />
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="edit-subtask-status">Status</label>
          <select id="edit-subtask-status" name="status" value={form.status} onChange={handleChange} className="w-full border p-2 rounded">
            <option value={0}>To Do</option>
            <option value={1}>In Progress</option>
            <option value={2}>Done</option>
          </select>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-300 text-gray-800 rounded">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">{loading ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// AddTaskModal component
function AddTaskModal({ isOpen, onClose, onSubmit, loading, selectedProjectId, projectFreelancers, projectDetails, validateTaskDeadline }: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSubmit: (form: any) => void; 
  loading: boolean; 
  selectedProjectId: number | null;
  projectFreelancers: User[];
  projectDetails: any;
  validateTaskDeadline: (deadline: string) => string;
}) {
  const [form, setForm] = React.useState({
    title: '',
    description: '',
    estimatedDeadline: '',
    priority: 0,
    createdByUserId: '',
    assignedToUserId: '',
  });
  const [deadlineError, setDeadlineError] = React.useState('');
  
  if (!isOpen) return null;
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    
    // Validate deadline when it changes
    if (name === 'estimatedDeadline') {
      const error = validateTaskDeadline(value);
      setDeadlineError(error);
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate deadline before submitting
    if (form.estimatedDeadline) {
      const error = validateTaskDeadline(form.estimatedDeadline);
      if (error) {
        setDeadlineError(error);
        return;
      }
    }
    
    onSubmit({
      ...form,
      priority: Number(form.priority),
      createdByUserId: Number(form.createdByUserId),
      assignedToUserId: Number(form.assignedToUserId),
      ProjectId: selectedProjectId,
    });
  };
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
      <div className="bg-white p-8 rounded shadow-lg w-full max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="add-title">Title</label>
          <input id="add-title" name="title" value={form.title} onChange={handleChange} placeholder="Title" className="w-full border p-2 rounded" required />
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="add-description">Description</label>
          <textarea id="add-description" name="description" value={form.description} onChange={handleChange} placeholder="Description" className="w-full border p-2 rounded" />
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="add-estimatedDeadline">Estimated Deadline</label>
          <input 
            id="add-estimatedDeadline" 
            name="estimatedDeadline" 
            type="date" 
            value={form.estimatedDeadline} 
            onChange={handleChange} 
            className={`w-full border p-2 rounded ${deadlineError ? 'border-red-500' : 'border-gray-300'}`}
            min={new Date().toISOString().split('T')[0]}
            max={projectDetails?.Deadline ? new Date(projectDetails.Deadline).toISOString().split('T')[0] : undefined}
          />
          {deadlineError && (
            <p className="text-red-500 text-sm mt-1">{deadlineError}</p>
          )}
          {projectDetails?.Deadline && (
            <p className="text-gray-500 text-sm mt-1">
              Project deadline: {new Date(projectDetails.Deadline).toLocaleDateString()}
            </p>
          )}
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="add-priority">Priority</label>
          <select id="add-priority" name="priority" value={form.priority} onChange={handleChange} className="w-full border p-2 rounded">
            <option value={0}>Low</option>
            <option value={1}>Medium</option>
            <option value={2}>High</option>
            <option value={3}>Urgent</option>
          </select>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="add-createdByUserId">Created By</label>
          <select id="add-createdByUserId" name="createdByUserId" value={form.createdByUserId} onChange={handleChange} className="w-full border p-2 rounded" required>
            <option value="">Select a freelancer</option>
            {projectFreelancers.map((freelancer) => (
              <option key={freelancer.id} value={freelancer.id}>
                {freelancer.firstName} {freelancer.lastName}
              </option>
            ))}
          </select>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="add-assignedToUserId">Assigned To</label>
          <select id="add-assignedToUserId" name="assignedToUserId" value={form.assignedToUserId} onChange={handleChange} className="w-full border p-2 rounded" required>
            <option value="">Select a freelancer</option>
            {projectFreelancers.map((freelancer) => (
              <option key={freelancer.id} value={freelancer.id}>
                {freelancer.firstName} {freelancer.lastName}
              </option>
            ))}
          </select>
          <input type="hidden" name="ProjectId" value={selectedProjectId ?? ''} />
          <div className="flex justify-end">
            <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">{loading ? 'Adding...' : 'Add Task'}</button>
          </div>
        </form>
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
  const [showAITaskGenerator, setShowAITaskGenerator] = useState(false);

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
        if (!selectedProjectId) return;
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
    console.log('🔄 KanbanBoard - fetchProjectTasks called for project:', selectedProjectId);
    setLoadingTasks(true);
    setMessage('');
    try {
      const res = await getTasksByProjectId(selectedProjectId);
      console.log('🔄 KanbanBoard - Fetched tasks:', res);
      console.log('🔄 KanbanBoard - Task count:', res.length);
      setTasks(res);
      if (res.length === 0) {
        setMessage('No tasks for this project yet.');
      }
    } catch (e) {
      console.error('🔄 KanbanBoard - Error fetching tasks:', e);
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Project Tasks</h1>
          <p className="text-gray-600 mt-1">
            {user?.role === 'freelancer' 
              ? 'View and track project tasks' 
              : 'Monitor and track project progress'
            }
          </p>
        </div>
        <div className="flex space-x-2">
          {user?.role === 'freelancer' && (
            <Button icon={Plus} onClick={handleCreateTaskButton} variant="primary">
              Create Task
            </Button>
          )}
          {selectedProjectId && (
            <Button 
              onClick={() => setShowAITaskGenerator(!showAITaskGenerator)}
              variant="secondary"
              className="flex items-center space-x-2"
            >
              <Brain className="w-4 h-4" />
              <span>Generate AI Task Result</span>
            </Button>
          )}
        </div>
      </div>
      {(user?.role === 'freelancer' || user?.role === 'client') && (
        <div className="mb-4">
          <label className="block mb-2 font-medium">
            {user?.role === 'freelancer' ? 'Select Project:' : 'Select Your Project:'}
          </label>
          {loadingProjects ? (
            <div>Loading projects...</div>
          ) : projects.length === 0 ? (
            <div>{message}</div>
          ) : (
            <select
              className="border rounded p-2"
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
      
      {/* Filters Section */}
      {selectedProjectId && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Status:</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="border rounded px-3 py-1 text-sm"
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
                className="border rounded px-3 py-1 text-sm"
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
              className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}
      


      {/* AI Task Generator Section */}
      {selectedProjectId && showAITaskGenerator && (
        <Card className="mb-6">
          <AITaskGenerator 
            projectId={selectedProjectId}
            onTasksGenerated={fetchProjectTasks}
          />
        </Card>
      )}

      {/* Only show Kanban board if a project is selected */}
      {selectedProjectId ? (
        loadingTasks ? (
          <div>Loading tasks...</div>
        ) : message ? (
          <div>{message}</div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <KanbanColumn
                title="To Do"
                status="todo"
                tasks={tasksByStatus['To Do']}
                onTaskClick={handleTaskClick}
                setShowAddTaskModal={setShowAddTaskModal}
                subtasks={subtasks}
                setEditSubtask={setSelectedSubtask}
              />
              <KanbanColumn
                title="In Progress"
                status="inprogress"
                tasks={tasksByStatus['In Progress']}
                onTaskClick={handleTaskClick}
                setShowAddTaskModal={setShowAddTaskModal}
                subtasks={subtasks}
                setEditSubtask={setSelectedSubtask}
              />
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
          </DndContext>
        )
      ) : (
        <div className="text-center text-gray-500 py-12">Please select a project to view its tasks.</div>
      )}
      {/* Summary Stats */}
      <Card>
        <div className="border-b p-4">
          <div className="font-semibold text-lg">Task Summary</div>
          <div className="text-gray-500 text-sm">Overview of all project tasks</div>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{filteredTasks.length}</div>
              <div className="text-sm text-gray-600">Total Tasks</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{tasksByStatus['In Progress'].length}</div>
              <div className="text-sm text-blue-700">In Progress</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{tasksByStatus['Done'].length}</div>
              <div className="text-sm text-green-700">Completed</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{filteredTasks.filter(t => t.Priority === KanbanTaskPriorityLevel.Urgent || t.Priority === KanbanTaskPriorityLevel.High).length}</div>
              <div className="text-sm text-yellow-700">High Priority</div>
            </div>
          </div>
        </div>
      </Card>
      
      {/* No tasks found */}
      {filteredTasks.length === 0 && (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
          <p className="text-gray-600">
            {user?.role === 'freelancer' 
              ? 'Tasks will appear here when you create them.' 
              : 'Tasks will appear here when freelancers create them.'
            }
          </p>
        </div>
      )}
      
      {/* Task Detail Modal */}
      {showTaskModal && selectedTask ? (
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
      ) : null}
      
      {/* Add Task Modal */}
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
      
      {/* Edit Subtask Modal */}
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