import React, { useState } from 'react';
import { Button } from './button';

interface EditProjectFormProps {
  project: any;
  onSave: (data: any) => void;
  onCancel: () => void;
}

export function EditProjectForm({ project, onSave, onCancel }: EditProjectFormProps) {
  const [formData, setFormData] = useState({
    ProjectTitle: project.ProjectTitle || '',
    Description: project.Description || '',
    PaymentType: project.PaymentType || 'Fixed',
    CategoryOrDomain: project.CategoryOrDomain || '',
    Deadline: project.Deadline ? new Date(project.Deadline).toISOString().split('T')[0] : '',
    RequiredSkills: project.RequiredSkills || '',
    Budget: project.Budget || '',
    NumberOfFreelancers: project.NumberOfFreelancers || 1,
    Milestones: project.Milestones || 'initial milestone',
    AttachedDocumentPath: project.AttachedDocumentPath || '',
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      Budget: Number(formData.Budget),
      NumberOfFreelancers: Number(formData.NumberOfFreelancers),
    };
    onSave(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Project Title *</label>
          <input
            type="text"
            value={formData.ProjectTitle}
            onChange={(e) => handleInputChange('ProjectTitle', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Payment Type *</label>
          <select
            value={formData.PaymentType}
            onChange={(e) => handleInputChange('PaymentType', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="Fixed">Fixed</option>
            <option value="Hourly">Hourly</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
          <input
            type="text"
            value={formData.CategoryOrDomain}
            onChange={(e) => handleInputChange('CategoryOrDomain', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Number of Freelancers *</label>
          <input
            type="number"
            min="1"
            value={formData.NumberOfFreelancers}
            onChange={(e) => handleInputChange('NumberOfFreelancers', Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Budget *</label>
          <input
            type="number"
            value={formData.Budget}
            onChange={(e) => handleInputChange('Budget', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Deadline *</label>
          <input
            type="date"
            value={formData.Deadline}
            onChange={(e) => handleInputChange('Deadline', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
        <textarea
          value={formData.Description}
          onChange={(e) => handleInputChange('Description', e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Required Skills *</label>
        <input
          type="text"
          value={formData.RequiredSkills}
          onChange={(e) => handleInputChange('RequiredSkills', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="e.g., React, TypeScript, Node.js"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Milestones</label>
        <input
          type="text"
          value={formData.Milestones}
          onChange={(e) => handleInputChange('Milestones', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="e.g., Design, Development, Testing"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Attached Document Path</label>
        <input
          type="text"
          value={formData.AttachedDocumentPath}
          onChange={(e) => handleInputChange('AttachedDocumentPath', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      
      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          Update Project
        </Button>
      </div>
    </form>
  );
} 