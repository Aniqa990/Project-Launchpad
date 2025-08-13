import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { 
  ArrowLeft, 
  ArrowRight, 
  Upload, 
  X, 
  Star,
  DollarSign,
  Clock,
  Send,
  AlertCircle,
  CheckCircle,
  Briefcase,
} from 'lucide-react';
import { handleApiError, showSuccessToast, showErrorToast } from '@/utils/errorHandler';
import toast from 'react-hot-toast';
import { createProject, addProjectToGist } from '../../apiendpoints';
import { useAuth } from '../../contexts/AuthContext';
import SignatureCanvas from 'react-signature-canvas';


export function CreateProject() {
  const navigate = useNavigate();
  const { user } = useAuth();
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
    CloudinaryUrl: '', // Add CloudinaryUrl to projectData
  });
  const [skillInput, setSkillInput] = useState('');
  const [submitted, setSubmitted] = useState(false);
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
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);
  const sigCanvasRef = useRef<any>(null);
  const [signatureError, setSignatureError] = useState('');
  const [isSigned, setIsSigned] = useState(false);
  const [uploading, setUploading] = useState(false);
  // Signature upload state
  const [signatureImage, setSignatureImage] = useState<File | null>(null);
  const [signatureImageUrl, setSignatureImageUrl] = useState<string>('');
  const [signatureUploading, setSignatureUploading] = useState(false);

  const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  // Validation states
  const [dateValidation, setDateValidation] = useState({
    startDateError: '',
    deadlineError: '',
    milestoneDateError: ''
  });
  
  const [budgetValidation, setBudgetValidation] = useState({
    budgetError: '',
    totalMilestoneAmount: 0,
    budgetExceeded: false,
    budgetExceededAmount: 0
  });

  // Validation functions
  const validateStartDate = (startDate: string) => {
    if (!startDate) return '';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1); // One day after today
    
    const startDateObj = new Date(startDate);
    
    if (startDateObj < tomorrow) {
      return 'Start date must be at least one day after project posting to allow for admin approval';
    }
    return '';
  };

  const validateDeadline = (deadline: string) => {
    if (!deadline) return '';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1); // One day after today

    const deadlineDate = new Date(deadline);
    const startDate = projectData.StartDate ? new Date(projectData.StartDate) : null;

    
    if (startDate && deadlineDate <= startDate) {
      return 'Project deadline must be after project start date';
    }
      
    return '';
  };

  const validateBudget = (budget: string) => {
    const budgetNum = parseFloat(budget);
    if (isNaN(budgetNum) || budgetNum < 0) {
      return 'Budget cannot be negative';
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
    
    setBudgetValidation(prev => ({
      ...prev,
      totalMilestoneAmount,
      budgetExceeded,
      budgetExceededAmount
    }));
  };

  // Update budget validation when milestones change
  useEffect(() => {
    calculateBudgetValidation();
  }, [milestones, projectData.Budget, budgetDivision]);

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
      setBudgetValidation(prev => ({ ...prev, budgetError }));
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
      const url = await uploadToCloudinary(files[0]);
      handleInputChange('Files', files);
      handleInputChange('CloudinaryUrl', url);
      setUploading(false);
    }
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = projectData.Files.filter((_, i) => i !== index);
    handleInputChange('Files', newFiles);
    handleInputChange('CloudinaryUrl', ''); // Clear Cloudinary URL when file is removed
  };

  const handleNextStep = () => {
    if (step === 4) {
      // Validate start date, deadline, and budget before proceeding
      if (dateValidation.startDateError) {
        toast.error('Please fix the start date validation error before proceeding');
        return;
      }
      if (dateValidation.deadlineError) {
        showErrorToast('Please fix the deadline validation error before proceeding');
        return;
      }
      if (budgetValidation.budgetError) {
        showErrorToast('Please fix the budget validation error before proceeding');
        return;
      }
      
      // Always go to next step
      setStep(step + 1);
    } else if (step === 5) {
      // Validate milestones before proceeding (only for milestone-based projects)
      if (budgetDivision === 'milestone' && budgetValidation.budgetExceeded) {
        showErrorToast('Please fix the budget validation error before proceeding');
        return;
      }
      setStep(step + 1);
    } else {
      setStep(step + 1);
    }
  };

  const handlePrevStep = () => {
      setStep(step - 1);
  };

  const handleAddMilestone = () => {
    if (!milestoneInput.title || !milestoneInput.description || !milestoneInput.amount || !milestoneInput.dueDate) {
      setMilestoneError('All fields are required.');
      return;
    }
    // Validate milestone due date does not exceed project deadline
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
      toast.error('Please fix the start date validation error before submitting');
      return;
    }
    if (dateValidation.deadlineError) {
      showErrorToast('Please fix the deadline validation error before submitting');
      return;
    }
    if (budgetValidation.budgetError) {
      showErrorToast('Please fix the budget validation error before submitting');
      return;
    }
    
    if (budgetDivision === 'milestone' && budgetValidation.budgetExceeded) {
      showErrorToast('Please fix the budget validation error before submitting');
      return;
    }
    setSubmitted(true);
    try {
      const startDateISO = projectData.StartDate ? new Date(projectData.StartDate).toISOString() : '';
      const deadlineISO = projectData.Deadline ? new Date(projectData.Deadline).toISOString() : '';
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
        milestones: budgetDivision === 'milestone'
          ? milestones.map(m => ({
              title: m.title,
              description: m.description,
              amount: Number(m.amount),
              dueDate: m.dueDate
            }))
          : [],
        attachedDocumentPath: projectData.CloudinaryUrl || null,
        clientId: user?.id ?? null,
        signatureUrl: signatureImageUrl || null, // This will be a local object URL if uploaded
      };
      const response = await createProject(payload);
      console.log('Create project response:', response);
      
      const projectId = response?.Id?.toString() ||
        response?.id?.toString() ||
        response?.projectId?.toString() ||
        null;
      
      setCreatedProjectId(projectId);
      
      // Add project to GitHub gist
      if (projectId) {
        try {
          await addProjectToGist({
            id: projectId,
            projectTitle: payload.projectTitle,
            description: payload.description
          });
          console.log('Project added to GitHub gist successfully');
        } catch (error) {
          console.error('Failed to add project to GitHub gist:', error);
        }
      }
      
      showSuccessToast('Project created successfully!');
    } catch (err) {
      handleApiError(err, 'createProject');
      setSubmitted(false);
    }
  };

  
  // Signature image upload handler
  const handleSignatureImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSignatureImage(file);
      setSignatureImageUrl(URL.createObjectURL(file));
      setIsSigned(true);
    }
  };


  const stepTitles = [
    'Project Details',
    'Skills & Requirements',
    'Files & Resources',
    'Budget & Timeline',
    ...(budgetDivision === 'milestone' ? ['Milestones'] : []),
    'Terms and Condition Agreement',
    'Review & Submit',
  ];

  if (submitted) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card className="text-center py-12 mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Send className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Project Created Successfully!</h1>
          <p className="text-gray-600 mb-8">
            Your project has been created and is pending admin approval.
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
          onClick={() => navigate('/client/dashboard')}
          className="mr-4"
        >
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create New Project</h1>
          <p className="text-gray-600">Step {step} of {stepTitles.length}: {stepTitles[step - 1]}</p>
        </div>
      </div>

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
                Budget Division *
              </label>
              <div className="flex gap-4">
                <button
                  type="button"
                  className={`px-4 py-2 rounded-lg border-2 ${budgetDivision === 'fixed' ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}
                  onClick={() => {
                    handleInputChange('PaymentType', 'fixed');
                    setBudgetDivision('fixed');
                  }}
                >
                  Fixed
                </button>
                <button
                  type="button"
                  className={`px-4 py-2 rounded-lg border-2 ${budgetDivision === 'milestone' ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}
                  onClick={() => {
                    handleInputChange('PaymentType', 'milestone');
                    setBudgetDivision('milestone');
                  }}
                >
                  Milestone-based
                </button>
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
                    budgetValidation.budgetError ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder={projectData.PaymentType === 'fixed' ? '5000' : '75'}
                />
              </div>
              {budgetValidation.budgetError && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {budgetValidation.budgetError}
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
                })()} // Minimum one day after today
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
                min={projectData.StartDate || new Date().toISOString().split('T')[0]} // Must be after start date
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
                Number of Freelancers *
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

        {/* Terms and Condition Agreement step (step 5 if not milestone, step 6 if milestone) */}
        {step === (budgetDivision === 'milestone' ? 6 : 5) && (
          <div className="space-y-6 flex flex-col items-center">
            <h2 className="text-xl font-bold mb-2">Terms and Condition Agreement</h2>
            <p className="text-gray-600 mb-4">Please sign below to agree to the terms and conditions before creating your project.</p>
            {/* Project Confidentiality & NDA Agreement Terms */}
            <div className="w-full max-w-2xl mb-6">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 shadow-sm">
                <h3 className="text-lg font-semibold mb-2">Project Confidentiality & NDA Agreement – Client</h3>
                <p className="text-sm text-gray-700 mb-2"><strong>Effective Upon Project Posting</strong></p>
                <p className="text-sm text-gray-700 mb-2">By posting a project on our platform, you agree to the following terms to ensure mutual confidentiality between you and the platform, and with any resource(s) allocated to your project:</p>
                <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1 mb-2">
                  <li><strong>Confidential Information:</strong> Any business information, technical details, documents, files, or specifications you share via this platform in connection with your project will be treated as confidential.</li>
                  <li><strong>Limited Access:</strong> Your project details will only be accessible to platform administrators and the specific freelancers or organizations you approve for allocation.</li>
                  <li><strong>Protection of data:</strong> Any intellectual property, proprietary methods, or trade secrets shared in your project brief or attached files will remain solely your property.</li>
                  <li><strong>Non-Disclosure by Platform & Resources:</strong> We ensure that any allocated freelancer or organization will be bound by a platform-enforced NDA preventing them from disclosing, copying, or using your confidential information outside the scope of your project.</li>
                  <li><strong>Retention:</strong> The platform will retain project data securely and will not disclose it to third parties unless legally required.</li>
                </ul>
              </div>
            </div>
            <SignatureCanvas
              ref={sigCanvasRef}
              penColor="black"
              canvasProps={{ width: 400, height: 200, className: "border rounded shadow" }}
              onEnd={() => {
                setIsSigned(!sigCanvasRef.current.isEmpty());
                setSignatureImage(null);
                setSignatureImageUrl('');
              }}
            />
            <div className="my-4 text-gray-500">OR</div>
            <div className="flex flex-col items-center space-y-2">
              <label className="block text-sm font-medium text-gray-700">Upload Signature Image (PNG/JPG)</label>
              <input
                id="signature-upload"
                type="file"
                accept="image/png,image/jpeg"
                onChange={handleSignatureImageUpload}
                disabled={signatureUploading}
                style={{ display: 'none' }}
              />
              <label htmlFor="signature-upload" className="mb-2">
                <span className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors">
                  Choose Signature Image
                </span>
              </label>
              {/* No uploading state needed for local preview */}
              {signatureImageUrl && (
                <img src={signatureImageUrl} alt="Signature Preview" className="mt-2 border rounded shadow max-h-32" />
              )}
            </div>
            <div className="flex space-x-2 mt-2">
              <button
                onClick={() => {
                  sigCanvasRef.current.clear();
                  setSignatureError('');
                  setIsSigned(false);
                  setSignatureImage(null);
                  setSignatureImageUrl('');
                }}
                className="px-4 py-2 bg-gray-300 rounded"
              >
                Clear
              </button>
            </div>
            {signatureError && <div className="text-red-600 text-sm mt-2">{signatureError}</div>}
            <div className="flex justify-between w-full mt-4">
              <Button
                variant="outline"
                onClick={handlePrevStep}
              >
                Previous
              </Button>
              <Button
                onClick={() => {
                  if (!isSigned && !signatureImageUrl) {
                    setSignatureError('Signature (drawn or uploaded) is required to proceed.');
                    return;
                  }
                  setSignatureError('');
                  setStep(step + 1);
                }}
                className="bg-blue-600 text-white"
                disabled={!isSigned && !signatureImageUrl}
              >
                Next Step
              </Button>
            </div>
          </div>
        )}

        {/* Review & Submit step (step 6 if not milestone, step 7 if milestone) */}
        {step === (budgetDivision === 'milestone' ? 7 : 6) && (
          <div className="space-y-6 text-center">
            <h2 className="text-xl font-bold">Review & Submit</h2>
            <p>Review your project details and submit when ready.</p>
            <Button onClick={handleSubmitProject} disabled={
              !projectData.ProjectTitle || !projectData.Description ||
              projectData.Skills.length === 0 ||
              !projectData.Budget || !projectData.StartDate || !projectData.Deadline ||
              (budgetDivision === 'milestone' && (milestones.length === 0 || milestones.some(m => !m.title || !m.description || !m.amount || !m.dueDate))) ||
              (budgetDivision === 'fixed' && !projectData.NumberOfFreelancers)
            }>
              Create Project
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
                  (step === 4 && (!projectData.Budget || !projectData.Deadline || dateValidation.deadlineError !== ''|| !projectData.StartDate || dateValidation.startDateError !== '' || budgetValidation.budgetError !== '')) ||
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