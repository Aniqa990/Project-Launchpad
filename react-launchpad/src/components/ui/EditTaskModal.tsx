import React, { useState, useEffect } from 'react';
import { KanbanTask, KanbanTaskStatus, KanbanTaskPriorityLevel, User } from '../../types';

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: KanbanTask | null;
  onUpdate: (id: number, form: any) => void;
  onDelete: (id: number) => void;
  loading: boolean;
  projectFreelancers: User[];
  projectDetails: any;
  validateTaskDeadline: (deadline: string) => string;
}

export function EditTaskModal({ 
  isOpen, 
  onClose, 
  task, 
  onUpdate, 
  onDelete, 
  loading, 
  projectFreelancers, 
  projectDetails, 
  validateTaskDeadline 
}: EditTaskModalProps) {
  const [form, setForm] = useState<any>(task ? {
    title: task.Title,
    description: task.Description || '',
    estimatedDeadline: task.EstimatedDeadline ? task.EstimatedDeadline.split('T')[0] : '',
    priority: task.Priority,
    createdByUserId: task.CreatedByUserId,
    assignedToUserId: task.AssignedToUserId,
    status: task.Status,
  } : {});
  const [deadlineError, setDeadlineError] = useState('');
  
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
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-t-2xl p-6 border-b border-blue-200 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-900">Edit Task</h2>
          <p className="text-gray-600 mt-1">Update task details and assignments</p>
        </div>
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="edit-title">Title</label>
              <input 
                id="edit-title" 
                name="title" 
                value={form.title} 
                onChange={handleChange} 
                placeholder="Task title" 
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200" 
                required 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="edit-description">Description</label>
              <textarea 
                id="edit-description" 
                name="description" 
                value={form.description} 
                onChange={handleChange} 
                placeholder="Task description" 
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none" 
                rows={3}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="edit-estimatedDeadline">Estimated Deadline</label>
              <input 
                id="edit-estimatedDeadline" 
                name="estimatedDeadline" 
                type="date" 
                value={form.estimatedDeadline} 
                onChange={handleChange} 
                className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${deadlineError ? 'border-red-500' : 'border-gray-300'}`}
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
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="edit-priority">Priority</label>
              <select 
                id="edit-priority" 
                name="priority" 
                value={form.priority} 
                onChange={handleChange} 
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              >
                <option value={0}>Low</option>
                <option value={1}>Medium</option>
                <option value={2}>High</option>
                <option value={3}>Urgent</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="edit-createdByUserId">Created By</label>
              <select 
                id="edit-createdByUserId" 
                name="createdByUserId" 
                value={form.createdByUserId} 
                onChange={handleChange} 
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200" 
                required
              >
                <option value="">Select a freelancer</option>
                {projectFreelancers.map((freelancer) => (
                  <option key={freelancer.id} value={freelancer.id}>
                    {freelancer.firstName} {freelancer.lastName}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="edit-assignedToUserId">Assigned To</label>
              <select 
                id="edit-assignedToUserId" 
                name="assignedToUserId" 
                value={form.assignedToUserId} 
                onChange={handleChange} 
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200" 
                required
              >
                <option value="">Select a freelancer</option>
                {projectFreelancers.map((freelancer) => (
                  <option key={freelancer.id} value={freelancer.id}>
                    {freelancer.firstName} {freelancer.lastName}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="edit-status">Status</label>
              <select 
                id="edit-status" 
                name="status" 
                value={form.status} 
                onChange={handleChange} 
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              >
                <option value={0}>To Do</option>
                <option value={1}>In Progress</option>
                <option value={2}>Done</option>
              </select>
            </div>
          </form>
        </div>
        
        {/* Footer */}
        <div className="flex justify-between p-6 border-t border-gray-200 flex-shrink-0">
          <button 
            type="button" 
            onClick={() => onDelete(task.Id)} 
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium"
          >
            Delete
          </button>
          <div className="flex gap-3">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-6 py-3 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors duration-200 font-medium"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              onClick={handleSubmit}
              disabled={loading} 
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 