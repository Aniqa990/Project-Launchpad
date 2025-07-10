import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { 
  ArrowLeft, 
  ArrowRight, 
  Upload, 
  X, 
  Star,
  DollarSign,
  Clock,
  Send
} from 'lucide-react';
import { mockFreelancers } from '../../utils/mockData';
import toast from 'react-hot-toast';
import { createProject } from '../../apiendpoints';

export function CreateProject() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [projectData, setProjectData] = useState({
    ProjectTitle: '',
    Description: '',
    Skills: [] as string[],
    Files: [] as File[],
    Budget: '',
    Deadline: '',
    PaymentType: 'Fixed',
    CategoryOrDomain: '',
    NumberOfFreelancers: 1,
    Milestones: '',
  });
  const [skillInput, setSkillInput] = useState('');
  const [matchingFreelancers, setMatchingFreelancers] = useState(mockFreelancers);
  const [selectedFreelancers, setSelectedFreelancers] = useState<string[]>([]);
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

  const handleInputChange = (field: string, value: any) => {
    setProjectData(prev => ({ ...prev, [field]: value }));
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleInputChange('Files', [...projectData.Files, ...files]);
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = projectData.Files.filter((_, i) => i !== index);
    handleInputChange('Files', newFiles);
  };

  const handleNextStep = () => {
    if (step === 4 && budgetDivision === 'fixed') {
      setStep(6);
    } else {
      setStep(step + 1);
    }
  };

  const handlePrevStep = () => {
    if (step === 6 && budgetDivision === 'fixed') {
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
    setMilestones(prev => [...prev, milestoneInput]);
    setMilestoneInput({ title: '', description: '', amount: '', dueDate: '' });
    setMilestoneError('');
  };

  const handleRemoveMilestone = (index: number) => {
    setMilestones(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitProject = async () => {
    setSubmitted(true);
    try {
      const payload: any = {
        ProjectTitle: projectData.ProjectTitle,
        Description: projectData.Description,
        PaymentType: projectData.PaymentType,
        CategoryOrDomain: projectData.CategoryOrDomain,
        Deadline: projectData.Deadline,
        RequiredSkills: projectData.Skills.join(','),
        Budget: Number(projectData.Budget),
        NumberOfFreelancers: projectData.NumberOfFreelancers,
        Milestones: budgetDivision === 'milestone'
          ? milestones.map(m => m.title).join(',')
          : 'initial milestone',
        AttachedDocumentPath: projectData.Files[0]?.name || '',
      };
      await createProject(payload);
      toast.success('Project created successfully!');
    } catch (err) {
      toast.error('Failed to create project.');
      setSubmitted(false);
    }
  };

  const toggleFreelancerSelection = (freelancerId: string) => {
    setSelectedFreelancers(prev => 
      prev.includes(freelancerId) 
        ? prev.filter(id => id !== freelancerId)
        : [...prev, freelancerId]
    );
  };

  const stepTitles = [
    'Project Details',
    'Skills & Requirements',
    'Files & Resources',
    'Budget & Timeline',
    'Milestones',
    'Review & Submit',
  ];

  if (submitted) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card className="text-center py-12">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Send className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Project Created Successfully!</h1>
          <p className="text-gray-600 mb-8">
            We've found {matchingFreelancers.length} matching freelancers for your project.
            Review and invite the ones you'd like to work with.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {matchingFreelancers.map((freelancer) => (
              <Card key={freelancer.id} hover className="text-left">
                <div className="flex items-start space-x-4 mb-4">
                  <Avatar src={freelancer.avatar} alt={freelancer.name} size="lg" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{freelancer.name}</h3>
                    <div className="flex items-center mt-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm text-gray-600 ml-1">
                        {freelancer.rating} ({freelancer.reviews} reviews)
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      ${freelancer.hourlyRate}/hour
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {freelancer.skills?.slice(0, 3).map((skill) => (
                    <Badge key={skill} variant="info" size="sm">{skill}</Badge>
                  ))}
                </div>

                <Button 
                  className="w-full"
                  variant={selectedFreelancers.includes(freelancer.id) ? 'secondary' : 'primary'}
                  onClick={() => toggleFreelancerSelection(freelancer.id)}
                >
                  {selectedFreelancers.includes(freelancer.id) ? 'Selected' : 'Invite to Project'}
                </Button>
              </Card>
            ))}
          </div>

          <div className="flex justify-center space-x-4 mt-8">
            <Button variant="outline" onClick={() => navigate('/client/projects')}>
              View Projects
            </Button>
            <Button onClick={() => navigate('/client/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        </Card>
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
          <p className="text-gray-600">Step {step} of 6: {stepTitles[step - 1]}</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center">
          {[1, 2, 3, 4, 5, 6].map((stepNum) => (
            <div key={stepNum} className="flex items-center">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${stepNum <= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}
              `}>
                {stepNum}
              </div>
              {stepNum < 6 && (
                <div className={`
                  w-12 h-1 mx-2
                  ${stepNum < step ? 'bg-blue-600' : 'bg-gray-200'}
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
                <label htmlFor="file-upload">
                  <Button variant="outline" className="cursor-pointer">
                    Choose Files
                  </Button>
                </label>
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
                  onClick={() => setBudgetDivision('fixed')}
                >
                  Fixed
                </button>
                <button
                  type="button"
                  className={`px-4 py-2 rounded-lg border-2 ${budgetDivision === 'milestone' ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}
                  onClick={() => setBudgetDivision('milestone')}
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
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={projectData.PaymentType === 'Fixed' ? '5000' : '75'}
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {projectData.PaymentType === 'Fixed' ? 'Total project budget' : 'Hourly rate'}
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        )}

        {/* Step 5: Milestones (only if milestone-based) */}
        {step === 5 && budgetDivision === 'milestone' && (
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            {milestoneError && <div className="text-red-500 text-sm">{milestoneError}</div>}
            <Button onClick={handleAddMilestone} className="mt-2">Add Milestone</Button>
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

        {/* Step 6: Review & Submit */}
        {step === 6 && (
          <div className="space-y-6 text-center">
            <h2 className="text-xl font-bold">Review & Submit</h2>
            <p>Review your project details and submit when ready.</p>
            <Button onClick={handleSubmitProject} disabled={
              !projectData.ProjectTitle || !projectData.Description ||
              projectData.Skills.length === 0 ||
              !projectData.Budget || !projectData.Deadline ||
              (budgetDivision === 'milestone' && (milestones.length === 0 || milestones.some(m => !m.title || !m.description || !m.amount || !m.dueDate)))
            }>
              Create Project
            </Button>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t">
          <Button 
            variant="outline" 
            onClick={handlePrevStep}
            disabled={step === 1}
          >
            Previous
          </Button>
          {step < 6 ? (
            <Button 
              onClick={handleNextStep}
              icon={ArrowRight}
              iconPosition="right"
              disabled={
                (step === 1 && (!projectData.ProjectTitle || !projectData.Description)) ||
                (step === 2 && projectData.Skills.length === 0) ||
                (step === 4 && (!projectData.Budget || !projectData.Deadline))
              }
            >
              Next Step
            </Button>
          ) : null}
        </div>
      </Card>
    </div>
  );
}