import React, { useState, useEffect } from 'react';
import { KanbanSubtask, KanbanTaskStatus } from '../../types';

interface EditSubtaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: number, form: any) => void;
  loading: boolean;
  subtask: KanbanSubtask | null;
}

export function EditSubtaskModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  loading, 
  subtask 
}: EditSubtaskModalProps) {
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
  
  if (!isOpen || !subtask) return null;
  
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
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-t-2xl p-6 border-b border-purple-200 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-900">Edit Subtask</h2>
          <p className="text-gray-600 mt-1">Update subtask details</p>
        </div>
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="edit-subtask-title">Title</label>
              <input 
                id="edit-subtask-title" 
                name="title" 
                value={form.title} 
                onChange={handleChange} 
                placeholder="Subtask title" 
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200" 
                required 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="edit-subtask-description">Description</label>
              <textarea 
                id="edit-subtask-description" 
                name="description" 
                value={form.description} 
                onChange={handleChange} 
                placeholder="Subtask description" 
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none" 
                rows={3}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="edit-subtask-dueDate">Due Date</label>
              <input 
                id="edit-subtask-dueDate" 
                name="dueDate" 
                type="date" 
                value={form.dueDate} 
                onChange={handleChange} 
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="edit-subtask-status">Status</label>
              <select 
                id="edit-subtask-status" 
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
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
} 