import React, { useState } from 'react';
import { User } from '../../types';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (form: any) => void;
  loading: boolean;
  selectedProjectId: number | null;
  projectFreelancers: User[];
  projectDetails: any;
  validateTaskDeadline: (deadline: string) => string;
}

export function AddTaskModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  loading, 
  selectedProjectId, 
  projectFreelancers, 
  projectDetails, 
  validateTaskDeadline 
}: AddTaskModalProps) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    estimatedDeadline: '',
    priority: 0,
    createdByUserId: '',
    assignedToUserId: '',
  });
  const [deadlineError, setDeadlineError] = useState('');
  
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
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-t-2xl p-6 border-b border-green-200 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-900">Create New Task</h2>
          <p className="text-gray-600 mt-1">Add a new task to the project</p>
        </div>
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="add-title">Title</label>
              <input 
                id="add-title" 
                name="title" 
                value={form.title} 
                onChange={handleChange} 
                placeholder="Task title" 
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200" 
                required 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="add-description">Description</label>
              <textarea 
                id="add-description" 
                name="description" 
                value={form.description} 
                onChange={handleChange} 
                placeholder="Task description" 
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none" 
                rows={3}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="add-estimatedDeadline">Estimated Deadline</label>
              <input 
                id="add-estimatedDeadline" 
                name="estimatedDeadline" 
                type="date" 
                value={form.estimatedDeadline} 
                onChange={handleChange} 
                className={`w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${deadlineError ? 'border-red-500' : 'border-gray-300'}`}
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
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="add-priority">Priority</label>
              <select 
                id="add-priority" 
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
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="add-createdByUserId">Created By</label>
              <select 
                id="add-createdByUserId" 
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
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="add-assignedToUserId">Assigned To</label>
              <select 
                id="add-assignedToUserId" 
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
            
            <input type="hidden" name="ProjectId" value={selectedProjectId ?? ''} />
          </form>
        </div>
        
        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 flex-shrink-0">
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
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Adding...' : 'Add Task'}
          </button>
        </div>
      </div>
    </div>
  );
} 