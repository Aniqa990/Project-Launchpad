import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { 
  ArrowLeft, 
  Upload, 
  X, 
  AlertCircle,
  CheckCircle,
  Save
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getProjectById, updateProject } from '../../apiendpoints';
import { useAuth } from '../../contexts/AuthContext';
import { Project } from '@/types';

export function UpdateProject() {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState({
    projectTitle: '',
    description: '',
    categoryOrDomain: '',
    budget: '',
    startDate: '',
    deadline: '',
    requiredSkills: '',
    numberOfFreelancers: 1,
    attachedDocumentPath: ''
  });
  const [skillInput, setSkillInput] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId) return;
      
      try {
        setLoading(true);
        const projectData = await getProjectById(projectId);
        setProject(projectData);
        
        // Initialize form data
        setFormData({
          projectTitle: projectData.projectTitle || '',
          description: projectData.description || '',
          categoryOrDomain: projectData.categoryOrDomain || '',
          budget: projectData.budget?.toString() || '',
          startDate: projectData.startDate ? new Date(projectData.startDate).toISOString().split('T')[0] : '',
          deadline: projectData.deadline ? new Date(projectData.deadline).toISOString().split('T')[0] : '',
          requiredSkills: projectData.requiredSkills || '',
          numberOfFreelancers: projectData.numberOfFreelancers || 1,
          attachedDocumentPath: projectData.attachedDocumentPath || ''
        });
        
        // Initialize skills
        if (projectData.requiredSkills) {
          setSkills(projectData.requiredSkills.split(',').map((s: string) => s.trim()));
        }
      } catch (error) {
        toast.error('Failed to load project details');
        navigate('/client/projects');
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId, navigate]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddSkill = (skill: string) => {
    if (skill && !skills.includes(skill)) {
      setSkills(prev => [...prev, skill]);
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setSkills(prev => prev.filter(s => s !== skill));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setUploading(true);
      try {
        // Upload to Cloudinary (similar to CreateProject)
        const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
        const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
        
        const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/raw/upload`;
        const formData = new FormData();
        formData.append('file', files[0]);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        
        const response = await fetch(url, {
          method: 'POST',
          body: formData,
        });
        const data = await response.json();
        
        handleInputChange('attachedDocumentPath', data.secure_url);
        toast.success('File uploaded successfully');
      } catch (error) {
        toast.error('Failed to upload file');
      } finally {
        setUploading(false);
      }
    }
  };

  const handleSubmit = async () => {
    if (!projectId) return;
    
    // Validation
    if (!formData.projectTitle || !formData.description || skills.length === 0 || 
        !formData.budget || !formData.startDate || !formData.deadline) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    // Validate start date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const startDate = new Date(formData.startDate);
    
    if (startDate < tomorrow) {
      toast.error('Start date must be at least one day after today');
      return;
    }
    
    // Validate deadline
    const deadline = new Date(formData.deadline);
    if (deadline < startDate) {
      toast.error('Deadline must be after start date');
      return;
    }
    
    setSaving(true);
    try {
      const payload = {
        projectTitle: formData.projectTitle,
        description: formData.description,
        categoryOrDomain: formData.categoryOrDomain,
        budget: Number(formData.budget),
        startDate: new Date(formData.startDate).toISOString(),
        deadline: new Date(formData.deadline).toISOString(),
        requiredSkills: skills.join(','),
        numberOfFreelancers: formData.numberOfFreelancers,
        attachedDocumentPath: formData.attachedDocumentPath,
        approvalStatus: 'pending' // Reset to pending
      };

      await updateProject(Number(projectId), payload);
      toast.success('Project updated successfully! It will be reviewed by admin.');
      navigate('/client/projects');
    } catch (error) {
      toast.error('Failed to update project');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading project details...</div>;
  }

  if (!project) {
    return <div className="text-center py-8 text-red-600">Project not found</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center mb-8">
        <Button 
          variant="ghost" 
          icon={ArrowLeft} 
          onClick={() => navigate('/client/projects')}
          className="mr-4"
        >
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Update Project</h1>
          <p className="text-gray-600">Update your rejected project and resubmit for approval</p>
        </div>
      </div>

      {/* Rejection Notice */}
      {project.approvalStatus === 'rejected' && project.rejectionReason && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <div className="p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-red-800">Project Rejected</h3>
                <p className="text-sm text-red-700 mt-1">
                  <strong>Reason:</strong> {project.rejectionReason}
                </p>
                <p className="text-sm text-red-700 mt-2">
                  Please review and update your project details below, then resubmit for approval.
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      <Card>
        <div className="p-6 space-y-6">
          {/* Project Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project Title *
            </label>
            <input
              type="text"
              value={formData.projectTitle}
              onChange={(e) => handleInputChange('projectTitle', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., E-commerce Website Development"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describe your project in detail..."
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category or Domain *
            </label>
            <input
              type="text"
              value={formData.categoryOrDomain}
              onChange={(e) => handleInputChange('categoryOrDomain', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Web Development, Mobile App, Data Science"
            />
          </div>

          {/* Skills */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Required Skills *
            </label>
            <div className="flex space-x-2 mb-3">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill(skillInput))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Type a skill and press Enter"
              />
              <Button onClick={() => handleAddSkill(skillInput)}>Add</Button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <div key={skill} className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                  {skill}
                  <button
                    onClick={() => handleRemoveSkill(skill)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Budget and Timeline */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Budget *
              </label>
              <input
                type="number"
                value={formData.budget}
                onChange={(e) => handleInputChange('budget', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="5000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date *
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min={(() => {
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  return tomorrow.toISOString().split('T')[0];
                })()}
              />
              <p className="text-sm text-gray-500 mt-1">
                Start date must be at least one day after today
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deadline *
              </label>
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) => handleInputChange('deadline', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min={formData.startDate || new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          {/* Number of Freelancers */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Freelancers *
            </label>
            <input
              type="number"
              min={1}
              value={formData.numberOfFreelancers}
              onChange={(e) => handleInputChange('numberOfFreelancers', Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="1"
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project Files (Optional)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">Drag and drop files here, or click to browse</p>
              <input
                type="file"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="inline-block">
                <span className="px-4 py-2 border border-gray-300 rounded bg-white text-gray-700 cursor-pointer hover:bg-gray-100 transition">
                  Choose Files
                </span>
              </label>
              {uploading && <div className="mt-2 text-blue-600">Uploading...</div>}
              {formData.attachedDocumentPath && (
                <div className="mt-2 text-green-600">
                  File uploaded: <a href={formData.attachedDocumentPath} target="_blank" rel="noopener noreferrer" className="underline">View File</a>
                </div>
              )}
              {project?.attachedDocumentPath && !formData.attachedDocumentPath && (
                <div className="mt-2 text-blue-600">
                  Current file: <a href={project.attachedDocumentPath} target="_blank" rel="noopener noreferrer" className="underline">View Current File</a>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <Button 
              variant="outline" 
              onClick={() => navigate('/client/projects')}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={saving || !formData.projectTitle || !formData.description || skills.length === 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Update & Resubmit
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
} 