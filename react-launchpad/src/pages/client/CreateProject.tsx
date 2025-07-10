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

export function CreateProject() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [projectData, setProjectData] = useState({
    title: '',
    description: '',
    skills: [] as string[],
    files: [] as File[],
    budget: '',
    deadline: '',
    budgetType: 'fixed' as 'fixed' | 'hourly'
  });
  const [skillInput, setSkillInput] = useState('');
  const [matchingFreelancers, setMatchingFreelancers] = useState(mockFreelancers);
  const [selectedFreelancers, setSelectedFreelancers] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (field: string, value: any) => {
    setProjectData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddSkill = (skill: string) => {
    if (skill && !projectData.skills.includes(skill)) {
      handleInputChange('skills', [...projectData.skills, skill]);
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    handleInputChange('skills', projectData.skills.filter(s => s !== skill));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleInputChange('files', [...projectData.files, ...files]);
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = projectData.files.filter((_, i) => i !== index);
    handleInputChange('files', newFiles);
  };

  const handleNextStep = () => {
    if (step < 4) {
      setStep(step + 1);
    }
  };

  const handlePrevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmitProject = () => {
    setSubmitted(true);
    toast.success('Project created successfully!');
    // In a real app, this would create the project and send invites
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
    'Budget & Timeline'
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
          <p className="text-gray-600">Step {step} of 4: {stepTitles[step - 1]}</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center">
          {[1, 2, 3, 4].map((stepNum) => (
            <div key={stepNum} className="flex items-center">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${stepNum <= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}
              `}>
                {stepNum}
              </div>
              {stepNum < 4 && (
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
                value={projectData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., E-commerce Website Development"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Description *
              </label>
              <textarea
                value={projectData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
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
                {projectData.skills.map((skill) => (
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
              
              {projectData.files.length > 0 && (
                <div className="mt-4 space-y-2">
                  {projectData.files.map((file, index) => (
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
                Budget Type *
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleInputChange('budgetType', 'fixed')}
                  className={`p-4 border-2 rounded-lg text-left transition-colors ${
                    projectData.budgetType === 'fixed' 
                      ? 'border-blue-600 bg-blue-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <DollarSign className="w-6 h-6 text-blue-600 mb-2" />
                  <h3 className="font-medium text-gray-900">Fixed Price</h3>
                  <p className="text-sm text-gray-600">Pay a set amount for the entire project</p>
                </button>
                <button
                  onClick={() => handleInputChange('budgetType', 'hourly')}
                  className={`p-4 border-2 rounded-lg text-left transition-colors ${
                    projectData.budgetType === 'hourly' 
                      ? 'border-blue-600 bg-blue-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <Clock className="w-6 h-6 text-blue-600 mb-2" />
                  <h3 className="font-medium text-gray-900">Hourly Rate</h3>
                  <p className="text-sm text-gray-600">Pay based on time worked</p>
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
                  value={projectData.budget}
                  onChange={(e) => handleInputChange('budget', e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={projectData.budgetType === 'fixed' ? '5000' : '75'}
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {projectData.budgetType === 'fixed' ? 'Total project budget' : 'Hourly rate'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Deadline *
              </label>
              <input
                type="date"
                value={projectData.deadline}
                onChange={(e) => handleInputChange('deadline', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
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
          
          {step < 4 ? (
            <Button 
              onClick={handleNextStep}
              icon={ArrowRight}
              iconPosition="right"
              disabled={
                (step === 1 && (!projectData.title || !projectData.description)) ||
                (step === 2 && projectData.skills.length === 0) ||
                (step === 4 && (!projectData.budget || !projectData.deadline))
              }
            >
              Next Step
            </Button>
          ) : (
            <Button onClick={handleSubmitProject}>
              Create Project
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}