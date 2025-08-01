import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { 
  ArrowLeft, 
  ArrowRight, 
  Upload, 
  X, 
  DollarSign,
  AlertCircle,
  CheckCircle,
  Send,
  Save
} from 'lucide-react';
import { handleApiError, showSuccessToast, showErrorToast } from '@/utils/errorHandler';
import { getProjectById, updateProject, getMilestonesByProjectId } from '../../apiendpoints';
import { Project } from '@/types';

export function UpdateProject() {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [step, setStep] = useState(1);
  const [projectData, setProjectData] = useState({
    ProjectTitle: '',
    Description: '',
    Skills: [] as string[],
    Files: [] as File[],
    Budget: '',
    StartDate: '',
    Deadline: '',
    PaymentType: 'fixed',
    CategoryOrDomain: '',
    NumberOfFreelancers: 1,
    Milestones: '',
    CloudinaryUrl: '',
  });
  const [skillInput, setSkillInput] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  
  // Milestone fields
  const [milestoneInput, setMilestoneInput] = useState({
    title: '',
    description: '',
    amount: '',
    dueDate: '',
  });
  const [milestoneError, setMilestoneError] = useState('');
  const [budgetDivision, setBudgetDivision] = useState<'fixed' | 'milestone'>('fixed');
  const [milestones, setMilestones] = useState<{ title: string; description: string; amount: string; dueDate: string }[]>([]);
  const [uploading, setUploading] = useState(false);

  // Validation states
  const [dateValidation, setDateValidation] = useState({
    startDateError: '',
    deadlineError: '',
    milestoneDateError: '',
    budgetError: ''
  });
  const [budgetValidation, setBudgetValidation] = useState({
    totalMilestoneAmount: 0,
    budgetExceeded: false,
    budgetExceededAmount: 0
  });

  // Cloudinary env constants
  const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  // Validation functions
  const validateStartDate = (startDate: string) => {
    if (!startDate) return '';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const startDateObj = new Date(startDate);
    
    if (startDateObj < tomorrow) {
      return 'Start date must be at least one day after project posting to allow for admin approval';
    }
    return '';
  };

  const validateDeadline = (deadline: string) => {
    if (!deadline) return '';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const deadlineDate = new Date(deadline);
    const startDate = projectData.StartDate ? new Date(projectData.StartDate) : null;

    
    if (startDate && deadlineDate <= startDate) {
      return 'Project deadline must be after project start date';
    }
    return '';
  };

  const validateMilestoneDate = (milestoneDate: string, projectStartDate: string, projectDeadline: string) => {
    if (!milestoneDate || !projectStartDate || !projectDeadline) return '';
    
    const milestoneDateObj = new Date(milestoneDate);
    const projectStartDateObj = new Date(projectStartDate);
    const projectDeadlineObj = new Date(projectDeadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (milestoneDateObj < today) {
      return 'Milestone due date cannot be in the past';
    }
    
    if (milestoneDateObj < projectStartDateObj) {
      return 'Milestone due date cannot be before project start date';
    }
    
    if (milestoneDateObj > projectDeadlineObj) {
      return 'Milestone due date cannot exceed project deadline';
    }
    
    return '';
  };

  const validateBudget = (budget: string) => {
    if (!budget) return '';
    
    const budgetValue = parseFloat(budget);
    if (isNaN(budgetValue) || budgetValue < 0) {
      return 'Budget cannot be negative';
    }
    
    return '';
  };

  const calculateBudgetValidation = () => {
    if (budgetDivision !== 'milestone' || !projectData.Budget) {
      return;
    }
    
    const totalBudget = parseFloat(projectData.Budget);
    const totalMilestoneAmount = milestones.reduce((sum, milestone) => {
      return sum + (parseFloat(milestone.amount) || 0);
    }, 0);
    
    const budgetExceeded = totalMilestoneAmount > totalBudget;
    const budgetExceededAmount = totalMilestoneAmount - totalBudget;
    
    setBudgetValidation({
      totalMilestoneAmount,
      budgetExceeded,
      budgetExceededAmount
    });
  };

  // Update budget validation when milestones change
  useEffect(() => {
    calculateBudgetValidation();
  }, [milestones, projectData.Budget, budgetDivision]);

  // Load project data
  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId) return;
      
      try {
        setLoading(true);
        const projectData = await getProjectById(projectId);
        setProject(projectData);
        
        // Initialize form data with existing project data
        setProjectData({
          ProjectTitle: projectData.projectTitle || '',
          Description: projectData.description || '',
          Skills: projectData.requiredSkills ? projectData.requiredSkills.split(',').map((s: string) => s.trim()) : [],
          Files: [],
          Budget: projectData.budget?.toString() || '',
          StartDate: projectData.startDate ? new Date(projectData.startDate).toISOString().split('T')[0] : '',
          Deadline: projectData.deadline ? new Date(projectData.deadline).toISOString().split('T')[0] : '',
          PaymentType: projectData.paymentType || 'fixed',
          CategoryOrDomain: projectData.categoryOrDomain || '',
          NumberOfFreelancers: projectData.numberOfFreelancers || 1,
          Milestones: '',
          CloudinaryUrl: projectData.attachedDocumentPath || '',
        });
        
        // Set budget division based on payment type - CANNOT BE CHANGED
        const originalPaymentType = projectData.paymentType || 'fixed';
        setBudgetDivision(originalPaymentType === 'milestone' ? 'milestone' : 'fixed');
        
        // Load milestones if project is milestone-based
        if (originalPaymentType === 'milestone') {
          try {
            console.log('Fetching milestones for project:', projectId);
            const milestonesData = await getMilestonesByProjectId(Number(projectId));
            console.log('Milestones data received:', milestonesData);
            if (milestonesData && Array.isArray(milestonesData)) {
              const formattedMilestones = milestonesData.map((m: any) => ({
                title: m.title || '',
                description: m.description || '',
                amount: m.amount?.toString() || '',
                dueDate: m.dueDate ? new Date(m.dueDate).toISOString().split('T')[0] : ''
              }));
              console.log('Formatted milestones:', formattedMilestones);
              setMilestones(formattedMilestones);
            } else {
              console.log('No milestones data or invalid format:', milestonesData);
            }
          } catch (milestoneError) {
            console.error('Failed to fetch milestones:', milestoneError);
            // Don't show error to user as milestones might not exist yet
          }
        }
      } catch (error) {
        handleApiError(error, 'fetchProjectDetails');
        navigate('/client/projects');
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId, navigate]);

  // Cloudinary upload function
  async function uploadToCloudinary(file: File) {
    const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/raw/upload`;
    const formData = new FormData();
    formData.append('file', file);
    if (!CLOUDINARY_UPLOAD_PRESET) {
      throw new Error('Cloudinary upload preset is not set in the environment variables.');
    }
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();
    return data.secure_url;
  }

  const handleInputChange = (field: string, value: any) => {
    setProjectData(prev => ({ ...prev, [field]: value }));
    if (field === 'StartDate') {
      const startDateError = validateStartDate(value);
      setDateValidation(prev => ({ ...prev, startDateError }));
    } else if (field === 'Deadline') {
      const deadlineError = validateDeadline(value);
      setDateValidation(prev => ({ ...prev, deadlineError }));
    } else if (field === 'Budget') {
      const budgetError = validateBudget(value);
      setDateValidation(prev => ({ ...prev, budgetError }));
    }
  };

  const handleAddSkill = (skill: string) => {
    if (skill && !projectData.Skills.includes(skill)) {
      handleInputChange('Skills', [...projectData.Skills, skill]);
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    handleInputChange('Skills', projectData.Skills.filter(s => s !== skill));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setUploading(true);
      try {
        const url = await uploadToCloudinary(files[0]);
        handleInputChange('Files', files);
        handleInputChange('CloudinaryUrl', url);
        showSuccessToast('File uploaded successfully');
      } catch (error) {
        handleApiError(error, 'uploadFile');
      } finally {
        setUploading(false);
      }
    }
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = projectData.Files.filter((_, i) => i !== index);
    handleInputChange('Files', newFiles);
    handleInputChange('CloudinaryUrl', '');
  };

  const handleNextStep = () => {
    if (step === 4) {
      if (dateValidation.startDateError) {
        showErrorToast(dateValidation.startDateError);
        return;
      }
      if (dateValidation.deadlineError) {
        showErrorToast(dateValidation.deadlineError);
        return;
      }
      if (dateValidation.budgetError) {
        showErrorToast(dateValidation.budgetError);
        return;
      }
      
      if (budgetDivision === 'fixed') {
        setStep(5);
      } else {
        setStep(step + 1);
      }
    } else if (step === 5) {
      if (budgetValidation.budgetExceeded) {
        showErrorToast('Please fix the budget validation error before proceeding');
        return;
      }
      setStep(step + 1);
    } else {
      setStep(step + 1);
    }
  };

  const handlePrevStep = () => {
    if (step === 5 && budgetDivision === 'fixed') {
      setStep(4);
    } else {
      setStep(step - 1);
    }
  };

  const handleAddMilestone = () => {
    if (!milestoneInput.title || !milestoneInput.description || !milestoneInput.amount || !milestoneInput.dueDate) {
      setMilestoneError('All fields are required.');
      return;
    }
    
    // Validate milestone amount is not negative
    const milestoneAmount = parseFloat(milestoneInput.amount);
    if (isNaN(milestoneAmount) || milestoneAmount < 0) {
      setMilestoneError('Milestone amount cannot be negative.');
      return;
    }
    
    // Validate milestone due date is between project start and deadline
    const milestoneDateError = validateMilestoneDate(milestoneInput.dueDate, projectData.StartDate, projectData.Deadline);
    if (milestoneDateError) {
      setMilestoneError(milestoneDateError);
      return;
    }
    
    // Validate budget (for milestone-based projects)
    if (budgetDivision === 'milestone' && projectData.Budget) {
      const currentTotal = milestones.reduce((sum, milestone) => {
        return sum + (parseFloat(milestone.amount) || 0);
      }, 0);
      const newTotal = currentTotal + parseFloat(milestoneInput.amount);
      const totalBudget = parseFloat(projectData.Budget);
      
      if (newTotal > totalBudget) {
        setMilestoneError(`Total milestone amount ($${newTotal}) exceeds project budget ($${totalBudget}). Please reduce milestone amounts.`);
        return;
      }
    }
    
    setMilestones(prev => [...prev, milestoneInput]);
    setMilestoneInput({ title: '', description: '', amount: '', dueDate: '' });
    setMilestoneError('');
  };

  const handleRemoveMilestone = (index: number) => {
    setMilestones(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitProject = async () => {
    if (dateValidation.startDateError) {
      showErrorToast(dateValidation.startDateError);
      return;
    }
    if (dateValidation.deadlineError) {
      showErrorToast(dateValidation.deadlineError);
      return;
    }
    if (dateValidation.budgetError) {
      showErrorToast(dateValidation.budgetError);
      return;
    }
    
    if (budgetDivision === 'milestone' && budgetValidation.budgetExceeded) {
      showErrorToast('Please fix the budget validation error before submitting');
      return;
    }
    
    setSaving(true);
    try {
      const startDateISO = projectData.StartDate ? new Date(projectData.StartDate).toISOString() : '';
      const deadlineISO = projectData.Deadline ? new Date(projectData.Deadline).toISOString() : '';
      
      let milestonesToDelete: number[] = [];
      let milestonesToAdd: any[] = [];
      
      // Only handle milestones for milestone-based projects
      if (budgetDivision === 'milestone') {
        try {
          // Get existing milestones to determine which ones to delete
          const existingMilestones = await getMilestonesByProjectId(Number(projectId));
          const existingMilestoneIds = existingMilestones.map((m: any) => m.id);
          
          console.log('Existing milestones:', existingMilestones);
          console.log('Current milestones:', milestones);
          
          // Determine which milestones to delete (existing ones not in current list)
          const currentMilestoneTitles = milestones.map(m => m.title);
          milestonesToDelete = existingMilestoneIds.filter((id: number) => {
            const existingMilestone = existingMilestones.find((m: any) => m.id === id);
            return existingMilestone && !currentMilestoneTitles.includes(existingMilestone.title);
          });
          
          // Determine which milestones to add (new ones not in existing list)
          const existingMilestoneTitles = existingMilestones.map((m: any) => m.title);
          milestonesToAdd = milestones.filter(m => !existingMilestoneTitles.includes(m.title));
          
          console.log('Milestones to delete:', milestonesToDelete);
          console.log('Milestones to add:', milestonesToAdd);
        } catch (milestoneError) {
          console.error('Error fetching milestones:', milestoneError);
          // If we can't fetch milestones, assume all current milestones are new
          milestonesToAdd = milestones;
        }
      }
      
      const payload: any = {
        projectTitle: projectData.ProjectTitle,
        description: projectData.Description,
        paymentType: projectData.PaymentType.toLowerCase(),
        categoryOrDomain: projectData.CategoryOrDomain,
        startDate: startDateISO,
        deadline: deadlineISO,
        requiredSkills: projectData.Skills.join(','),
        budget: Number(projectData.Budget),
        numberOfFreelancers: projectData.NumberOfFreelancers,
        attachedDocumentPath: projectData.CloudinaryUrl || null,
        approvalStatus: 'pending',
        // Milestone operations (only for milestone-based projects)
        milestoneIdsToDelete: milestonesToDelete,
        milestonesToAdd: milestonesToAdd.map(m => ({
          title: m.title,
          description: m.description,
          amount: Number(m.amount),
          dueDate: m.dueDate
        }))
      };

      await updateProject(Number(projectId), payload);
      showSuccessToast('Project updated successfully! It will be reviewed by admin.');
      navigate('/client/projects');
    } catch (error) {
      handleApiError(error, 'updateProject');
    } finally {
      setSaving(false);
    }
  };

  const stepTitles = [
    'Project Details',
    'Skills & Requirements',
    'Files & Resources',
    'Budget & Timeline',
    ...(budgetDivision === 'milestone' ? ['Milestones'] : []),
    'Review & Submit',
  ];

  if (loading) {
    return <div className="text-center py-8">Loading project details...</div>;
  }

  if (!project) {
    return <div className="text-center py-8 text-red-600">Project not found</div>;
  }

  if (submitted) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card className="text-center py-12 mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Send className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Project Updated Successfully!</h1>
          <p className="text-gray-600 mb-8">
            Your project has been updated and is pending admin approval.
          </p>
        </Card>
        
        <div className="flex justify-center space-x-4 mt-8">
          <Button variant="outline" onClick={() => navigate('/client/projects')}>
            View Projects
          </Button>
          <Button onClick={() => navigate('/client/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
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
          <p className="text-gray-600">Step {step} of {stepTitles.length}: {stepTitles[step - 1]}</p>
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

      {/* Project Type Notice */}
      <Card className="mb-6 border-blue-200 bg-blue-50">
        <div className="p-4">
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-800">Project Type: {budgetDivision === 'milestone' ? 'Milestone-based' : 'Fixed Price'}</h3>
              <p className="text-sm text-blue-700 mt-1">
                The project type cannot be changed during updates. You can only modify the project details within the same payment structure.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center">
          {stepTitles.map((title, idx) => (
            <div key={idx} className="flex items-center">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${idx + 1 <= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}
              `}>
                {idx + 1}
              </div>
              {idx < stepTitles.length - 1 && (
                <div className={`
                  w-12 h-1 mx-2
                  ${idx + 1 < step ? 'bg-blue-600' : 'bg-gray-200'}
                `} />
              )}
            </div>
          ))}
        </div>
      </div>

      <Card>
        {/* Step 1: Project Details */}
        {step === 1 && (
          <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project Title *
            </label>
            <input
              type="text"
                value={projectData.ProjectTitle}
                onChange={(e) => handleInputChange('ProjectTitle', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., E-commerce Website Development"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project Description *
            </label>
            <textarea
                value={projectData.Description}
                onChange={(e) => handleInputChange('Description', e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe your project in detail. What are you looking to build? What are your requirements and expectations?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category or Domain *
            </label>
            <input
              type="text"
                value={projectData.CategoryOrDomain}
                onChange={(e) => handleInputChange('CategoryOrDomain', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Web Development, Mobile App, Data Science"
            />
          </div>
          </div>
        )}

        {/* Step 2: Skills */}
        {step === 2 && (
          <div className="space-y-6">
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
                {projectData.Skills.map((skill) => (
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

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Popular Skills</h3>
              <div className="flex flex-wrap gap-2">
                {['React', 'TypeScript', 'Node.js', 'Python', 'UI/UX', 'Figma', 'Mobile App', 'WordPress'].map((skill) => (
                  <button
                    key={skill}
                    onClick={() => handleAddSkill(skill)}
                    className="px-3 py-1 bg-white border border-gray-300 rounded-full text-sm hover:bg-gray-100 transition-colors"
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Files */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Files (Optional)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">Drag and drop files here, or click to browse</p>
                <input
                  type="file"
                  multiple
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
                {projectData.CloudinaryUrl && (
                  <div className="mt-2 text-green-600">
                    Uploaded: <a href={projectData.CloudinaryUrl} target="_blank" rel="noopener noreferrer">View File</a>
                  </div>
                )}
              </div>
              {projectData.Files.length > 0 && (
                <div className="mt-4 space-y-2">
                  {projectData.Files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                      <span className="text-sm text-gray-700">{file.name}</span>
                      <button
                        onClick={() => handleRemoveFile(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Budget & Timeline */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Type
              </label>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Current Type:</strong> {budgetDivision === 'milestone' ? 'Milestone-based' : 'Fixed Price'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Project type cannot be changed during updates
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Budget Amount *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="number"
                  value={projectData.Budget}
                  onChange={(e) => handleInputChange('Budget', e.target.value)}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    validateBudget(projectData.Budget) ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder={projectData.PaymentType === 'fixed' ? '5000' : '75'}
                  min="0"
                />
              </div>
              {validateBudget(projectData.Budget) && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {validateBudget(projectData.Budget)}
                </p>
              )}
              <p className="text-sm text-gray-500 mt-1">
                Total project budget
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Start Date *
              </label>
              <input
                type="date"
                value={projectData.StartDate}
                onChange={(e) => handleInputChange('StartDate', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  dateValidation.startDateError ? 'border-red-500' : 'border-gray-300'
                }`}
                min={(() => {
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  return tomorrow.toISOString().split('T')[0];
                })()}
              />
              {dateValidation.startDateError && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {dateValidation.startDateError}
                </p>
              )}
              <p className="text-sm text-gray-500 mt-1">
                Start date must be at least one day after posting to allow for admin approval
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Deadline *
              </label>
              <input
                type="date"
                value={projectData.Deadline}
                onChange={(e) => handleInputChange('Deadline', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  dateValidation.deadlineError ? 'border-red-500' : 'border-gray-300'
                }`}
                min={projectData.StartDate || new Date().toISOString().split('T')[0]}
              />
              {dateValidation.deadlineError && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {dateValidation.deadlineError}
                </p>
              )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Freelancers {budgetDivision === 'milestone' ? '*' : ''}
            </label>
            <input
              type="number"
              min={1}
                value={projectData.NumberOfFreelancers}
                onChange={(e) => handleInputChange('NumberOfFreelancers', Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="1"
                disabled={budgetDivision === 'fixed'}
              />
              {budgetDivision === 'fixed' && (
                <p className="text-xs text-gray-400 mt-1">Number of freelancers is not applicable for fixed price projects.</p>
              )}
            </div>
          </div>
        )}

        {/* Step 5: Milestones (only if milestone-based) */}
        {budgetDivision === 'milestone' && step === 5 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Project Milestones</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={milestoneInput.title}
                  onChange={e => setMilestoneInput({ ...milestoneInput, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Milestone title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
                <input
                  type="number"
                  value={milestoneInput.amount}
                  onChange={e => setMilestoneInput({ ...milestoneInput, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Amount"
                  min="0"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <textarea
                  value={milestoneInput.description}
                  onChange={e => setMilestoneInput({ ...milestoneInput, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Milestone description"
                  rows={2}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
                <input
                  type="date"
                  value={milestoneInput.dueDate}
                  onChange={e => setMilestoneInput({ ...milestoneInput, dueDate: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    validateMilestoneDate(milestoneInput.dueDate, projectData.StartDate, projectData.Deadline) !== '' ? 'border-red-500' : 'border-gray-300'
                  }`}
                  min={new Date().toISOString().split('T')[0]}
                  max={projectData.Deadline || undefined}
                />
                {milestoneInput.dueDate && validateMilestoneDate(milestoneInput.dueDate, projectData.StartDate, projectData.Deadline) !== '' && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {validateMilestoneDate(milestoneInput.dueDate, projectData.StartDate, projectData.Deadline)}
                  </p>
                )}
              </div>
            </div>
            {milestoneError && <div className="text-red-500 text-sm">{milestoneError}</div>}
            {/* Budget Summary */}
            {budgetDivision === 'milestone' && projectData.Budget && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Budget Summary</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Project Budget:</span>
                    <span className="font-medium">${projectData.Budget}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Milestone Amount:</span>
                    <span className={`font-medium ${budgetValidation.budgetExceeded ? 'text-red-600' : 'text-green-600'}`}>
                      ${budgetValidation.totalMilestoneAmount}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Remaining Budget:</span>
                    <span className={`font-medium ${budgetValidation.budgetExceeded ? 'text-red-600' : 'text-green-600'}`}>
                      ${Math.max(0, parseFloat(projectData.Budget) - budgetValidation.totalMilestoneAmount)}
                    </span>
                  </div>
                  {budgetValidation.budgetExceeded && (
                    <div className="text-red-600 text-sm flex items-center mt-2">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      Budget exceeded by ${budgetValidation.budgetExceededAmount.toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <Button 
              onClick={handleAddMilestone} 
              className="mt-2"
              disabled={budgetValidation.budgetExceeded}
            >
              Add Milestone
            </Button>
            <div className="mt-6">
              <h3 className="font-medium text-gray-800 mb-2">Milestones List</h3>
              {milestones.length === 0 && <div className="text-gray-500">No milestones added yet.</div>}
              <ul className="space-y-2">
                {milestones.map((m, idx) => (
                  <li key={idx} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <div>
                      <div className="font-semibold">{m.title}</div>
                      <div className="text-sm text-gray-600">{m.description}</div>
                      <div className="text-sm text-gray-600">Amount: ${m.amount} | Due: {m.dueDate}</div>
                    </div>
                    <Button variant="outline" onClick={() => handleRemoveMilestone(idx)} size="sm">Remove</Button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Review & Submit step */}
        {step === (budgetDivision === 'milestone' ? 6 : 5) && (
          <div className="space-y-6 text-center">
            <h2 className="text-xl font-bold">Review & Submit</h2>
            <p>Review your project details and submit when ready.</p>
            <Button 
              onClick={handleSubmitProject} 
              disabled={
                !projectData.ProjectTitle || !projectData.Description ||
                projectData.Skills.length === 0 ||
                !projectData.Budget || !projectData.StartDate || !projectData.Deadline ||
                dateValidation.budgetError !== '' ||
                (budgetDivision === 'milestone' && (milestones.length === 0 || milestones.some(m => !m.title || !m.description || !m.amount || !m.dueDate))) ||
                (budgetDivision === 'milestone' && !projectData.NumberOfFreelancers) ||
                saving
              }
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
                  Update Project
                </>
              )}
            </Button>
          </div>
        )}

        {step !== (budgetDivision === 'milestone' ? 6 : 5) && (
          <div className="flex justify-between mt-8 pt-6 border-t">
            <Button 
              variant="outline" 
              onClick={handlePrevStep}
              disabled={step === 1}
            >
              Previous
            </Button>
            {step < stepTitles.length ? (
              <Button 
                onClick={handleNextStep}
                icon={ArrowRight}
                iconPosition="right"
                disabled={
                  (step === 1 && (!projectData.ProjectTitle || !projectData.Description)) ||
                  (step === 2 && projectData.Skills.length === 0) ||
                  (step === 4 && (!projectData.Budget || !projectData.Deadline || dateValidation.deadlineError !== ''|| !projectData.StartDate || dateValidation.startDateError !== '' || dateValidation.budgetError !== '')) ||
                  (step === 5 && budgetDivision === 'milestone' && (milestones.length === 0 || budgetValidation.budgetExceeded))
                }
              >
                Next Step
              </Button>
            ) : null}
        </div>
        )}
      </Card>
    </div>
  );
} 