import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { 
  ArrowLeft, 
  ArrowRight, 
  Upload, 
  X, 
  Star,
  DollarSign,
  Clock,
  Send,
  Plus,
  Calendar,
  Target,
  FileText,
  Trash2
} from 'lucide-react';
import { mockFreelancers } from '../../utils/mockData';
import toast from 'react-hot-toast';

interface Milestone {
  id: string;
  title: string;
  description: string;
  amount: number;
  dueDate: string;
  deliverables: string[];
}

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
    budgetType: 'fixed' as 'fixed' | 'hourly',
    milestones: [] as Milestone[]
  });
  const [skillInput, setSkillInput] = useState('');
  const [matchingFreelancers, setMatchingFreelancers] = useState(mockFreelancers);
  const [selectedFreelancers, setSelectedFreelancers] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  // Milestone form state
  const [currentMilestone, setCurrentMilestone] = useState<Milestone>({
    id: '',
    title: '',
    description: '',
    amount: 0,
    dueDate: '',
    deliverables: []
  });
  const [deliverableInput, setDeliverableInput] = useState('');

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

  // Milestone management functions
  const handleMilestoneChange = (field: string, value: any) => {
    setCurrentMilestone(prev => ({ ...prev, [field]: value }));
  };

  const handleAddDeliverable = (deliverable: string) => {
    if (deliverable && !currentMilestone.deliverables.includes(deliverable)) {
      setCurrentMilestone(prev => ({
        ...prev,
        deliverables: [...prev.deliverables, deliverable]
      }));
      setDeliverableInput('');
    }
  };

  const handleRemoveDeliverable = (deliverable: string) => {
    setCurrentMilestone(prev => ({
      ...prev,
      deliverables: prev.deliverables.filter(d => d !== deliverable)
    }));
  };

  const handleAddMilestone = () => {
    if (!currentMilestone.title || !currentMilestone.amount || !currentMilestone.dueDate) {
      toast.error('Please fill in all required milestone fields');
      return;
    }

    const newMilestone = {
      ...currentMilestone,
      id: Date.now().toString()
    };

    handleInputChange('milestones', [...projectData.milestones, newMilestone]);
    
    // Reset form
    setCurrentMilestone({
      id: '',
      title: '',
      description: '',
      amount: 0,
      dueDate: '',
      deliverables: []
    });
    
    toast.success('Milestone added successfully!');
  };

  const handleRemoveMilestone = (milestoneId: string) => {
    handleInputChange('milestones', projectData.milestones.filter(m => m.id !== milestoneId));
    toast.success('Milestone removed');
  };

  const handleEditMilestone = (milestone: Milestone) => {
    setCurrentMilestone(milestone);
    handleRemoveMilestone(milestone.id);
  };

  const getTotalMilestoneAmount = () => {
    return projectData.milestones.reduce((sum, milestone) => sum + milestone.amount, 0);
  };

  const getRemainingBudget = () => {
    const budget = parseFloat(projectData.budget) || 0;
    return budget - getTotalMilestoneAmount();
  };

  const handleNextStep = () => {
    if (step < 6) {
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
    'Project Milestones',
    'Review & Publish'
  ];

  if (submitted) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card className="text-center py-12">
          <CardContent>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Send className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold mb-4">Project Created Successfully!</h1>
            <p className="text-muted-foreground mb-8">
              We've found {matchingFreelancers.length} matching freelancers for your project.
              Review and invite the ones you'd like to work with.
            </p>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
              {matchingFreelancers.map((freelancer) => (
                <Card key={freelancer.id} className="text-left hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start space-x-4 mb-4">
                      <Avatar src={freelancer.avatar} alt={freelancer.name} size="lg" />
                      <div className="flex-1">
                        <h3 className="font-semibold">{freelancer.name}</h3>
                        <div className="flex items-center mt-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-sm text-muted-foreground ml-1">
                            {freelancer.rating} ({freelancer.reviews} reviews)
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          ${freelancer.hourlyRate}/hour
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {freelancer.skills?.slice(0, 3).map((skill) => (
                        <Badge key={skill} variant="secondary">{skill}</Badge>
                      ))}
                    </div>

                    <Button 
                      className="w-full"
                      variant={selectedFreelancers.includes(freelancer.id) ? 'secondary' : 'default'}
                      onClick={() => toggleFreelancerSelection(freelancer.id)}
                    >
                      {selectedFreelancers.includes(freelancer.id) ? 'Selected' : 'Invite to Project'}
                    </Button>
                  </CardContent>
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
          </CardContent>
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
          <h1 className="text-3xl font-bold">Create New Project</h1>
          <p className="text-muted-foreground">Step {step} of 6: {stepTitles[step - 1]}</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center">
          {[1, 2, 3, 4, 5, 6].map((stepNum) => (
            <div key={stepNum} className="flex items-center">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${stepNum <= step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}
              `}>
                {stepNum}
              </div>
              {stepNum < 6 && (
                <div className={`
                  w-12 h-1 mx-2
                  ${stepNum < step ? 'bg-primary' : 'bg-muted'}
                `} />
              )}
            </div>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          {/* Step 1: Project Details */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Project Title *</Label>
                <Input
                  id="title"
                  value={projectData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="e.g., E-commerce Website Development"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Project Description *</Label>
                <Textarea
                  id="description"
                  value={projectData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={6}
                  placeholder="Describe your project in detail. What are you looking to build? What are your requirements and expectations?"
                />
              </div>
            </div>
          )}

          {/* Step 2: Skills */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Required Skills *</Label>
                <div className="flex space-x-2 mb-3">
                  <Input
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill(skillInput))}
                    placeholder="Type a skill and press Enter"
                    className="flex-1"
                  />
                  <Button onClick={() => handleAddSkill(skillInput)}>Add</Button>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {projectData.skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="flex items-center gap-1">
                      {skill}
                      <button
                        onClick={() => handleRemoveSkill(skill)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-medium mb-2">Popular Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {['React', 'TypeScript', 'Node.js', 'Python', 'UI/UX', 'Figma', 'Mobile App', 'WordPress'].map((skill) => (
                    <Button
                      key={skill}
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddSkill(skill)}
                    >
                      {skill}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Files */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Project Files (Optional)</Label>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-muted-foreground/50 transition-colors">
                  <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-2">Drag and drop files here, or click to browse</p>
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
                      <div key={index} className="flex items-center justify-between bg-muted p-3 rounded-lg">
                        <span className="text-sm">{file.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFile(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
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
              <div className="space-y-2">
                <Label>Budget Type *</Label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleInputChange('budgetType', 'fixed')}
                    className={`p-4 border-2 rounded-lg text-left transition-colors ${
                      projectData.budgetType === 'fixed' 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-muted-foreground'
                    }`}
                  >
                    <DollarSign className="w-6 h-6 text-primary mb-2" />
                    <h3 className="font-medium">Fixed Price</h3>
                    <p className="text-sm text-muted-foreground">Pay a set amount for the entire project</p>
                  </button>
                  <button
                    onClick={() => handleInputChange('budgetType', 'hourly')}
                    className={`p-4 border-2 rounded-lg text-left transition-colors ${
                      projectData.budgetType === 'hourly' 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-muted-foreground'
                    }`}
                  >
                    <Clock className="w-6 h-6 text-primary mb-2" />
                    <h3 className="font-medium">Hourly Rate</h3>
                    <p className="text-sm text-muted-foreground">Pay based on time worked</p>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="budget">Budget Amount *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  <Input
                    id="budget"
                    type="number"
                    value={projectData.budget}
                    onChange={(e) => handleInputChange('budget', e.target.value)}
                    className="pl-10"
                    placeholder={projectData.budgetType === 'fixed' ? '5000' : '75'}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  {projectData.budgetType === 'fixed' ? 'Total project budget' : 'Hourly rate'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deadline">Project Deadline *</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={projectData.deadline}
                  onChange={(e) => handleInputChange('deadline', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Step 5: Milestones */}
          {step === 5 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <Target className="w-12 h-12 text-primary mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Project Milestones</h2>
                <p className="text-muted-foreground">Break your project into manageable milestones with clear deliverables and payment schedules</p>
              </div>

              {/* Budget Overview */}
              <div className="bg-primary/5 p-4 rounded-lg mb-6">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Budget</p>
                    <p className="text-xl font-bold">${parseFloat(projectData.budget || '0').toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Allocated</p>
                    <p className="text-xl font-bold text-primary">${getTotalMilestoneAmount().toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Remaining</p>
                    <p className={`text-xl font-bold ${getRemainingBudget() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${getRemainingBudget().toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Existing Milestones */}
              {projectData.milestones.length > 0 && (
                <div className="space-y-4 mb-6">
                  <h3 className="text-lg font-semibold">Created Milestones</h3>
                  {projectData.milestones.map((milestone, index) => (
                    <Card key={milestone.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium text-primary">
                                {index + 1}
                              </div>
                              <h4 className="font-semibold">{milestone.title}</h4>
                              <Badge variant="secondary">${milestone.amount.toLocaleString()}</Badge>
                            </div>
                            <p className="text-muted-foreground text-sm mb-2 ml-11">{milestone.description}</p>
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground ml-11">
                              <div className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1" />
                                Due {new Date(milestone.dueDate).toLocaleDateString()}
                              </div>
                              <div className="flex items-center">
                                <FileText className="w-4 h-4 mr-1" />
                                {milestone.deliverables.length} deliverables
                              </div>
                            </div>
                            {milestone.deliverables.length > 0 && (
                              <div className="mt-2 ml-11">
                                <div className="flex flex-wrap gap-1">
                                  {milestone.deliverables.map((deliverable, idx) => (
                                    <Badge key={idx} variant="outline">{deliverable}</Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="flex space-x-2 ml-4">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleEditMilestone(milestone)}
                            >
                              Edit
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleRemoveMilestone(milestone.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Add New Milestone Form */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">
                    {currentMilestone.id ? 'Edit Milestone' : 'Add New Milestone'}
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="milestone-title">Milestone Title *</Label>
                        <Input
                          id="milestone-title"
                          value={currentMilestone.title}
                          onChange={(e) => handleMilestoneChange('title', e.target.value)}
                          placeholder="e.g., Design & Wireframes"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="milestone-amount">Payment Amount *</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                          <Input
                            id="milestone-amount"
                            type="number"
                            value={currentMilestone.amount || ''}
                            onChange={(e) => handleMilestoneChange('amount', parseFloat(e.target.value) || 0)}
                            className="pl-10"
                            placeholder="2500"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="milestone-date">Due Date *</Label>
                      <Input
                        id="milestone-date"
                        type="date"
                        value={currentMilestone.dueDate}
                        onChange={(e) => handleMilestoneChange('dueDate', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="milestone-description">Description</Label>
                      <Textarea
                        id="milestone-description"
                        value={currentMilestone.description}
                        onChange={(e) => handleMilestoneChange('description', e.target.value)}
                        rows={3}
                        placeholder="Describe what will be delivered in this milestone..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Deliverables</Label>
                      <div className="flex space-x-2 mb-3">
                        <Input
                          value={deliverableInput}
                          onChange={(e) => setDeliverableInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddDeliverable(deliverableInput))}
                          placeholder="e.g., Wireframes, Design mockups"
                          className="flex-1"
                        />
                        <Button onClick={() => handleAddDeliverable(deliverableInput)}>Add</Button>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {currentMilestone.deliverables.map((deliverable) => (
                          <Badge key={deliverable} variant="secondary" className="flex items-center gap-1">
                            {deliverable}
                            <button
                              onClick={() => handleRemoveDeliverable(deliverable)}
                              className="ml-1 hover:text-destructive"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <Button onClick={handleAddMilestone} icon={Plus} className="w-full">
                      {currentMilestone.id ? 'Update Milestone' : 'Add Milestone'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Milestone Tips */}
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h4 className="font-medium text-yellow-800 mb-2">💡 Milestone Tips</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Break large projects into 3-5 manageable milestones</li>
                  <li>• Each milestone should have clear, measurable deliverables</li>
                  <li>• Consider a 20-30% upfront payment for the first milestone</li>
                  <li>• Final milestone should be 10-20% for project completion and testing</li>
                </ul>
              </div>
            </div>
          )}

          {/* Step 6: Review */}
          {step === 6 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold mb-2">Review Your Project</h2>
                <p className="text-muted-foreground">Review all details before publishing your project</p>
              </div>

              {/* Project Summary */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Project Overview</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-muted-foreground">Title</h4>
                      <p>{projectData.title}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-muted-foreground">Description</h4>
                      <p>{projectData.description}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-muted-foreground">Skills Required</h4>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {projectData.skills.map(skill => (
                          <Badge key={skill} variant="secondary">{skill}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <h4 className="font-medium text-muted-foreground">Budget</h4>
                        <p>${parseFloat(projectData.budget || '0').toLocaleString()}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-muted-foreground">Budget Type</h4>
                        <p className="capitalize">{projectData.budgetType}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-muted-foreground">Deadline</h4>
                        <p>{new Date(projectData.deadline).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Milestones Summary */}
              {projectData.milestones.length > 0 && (
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Milestones ({projectData.milestones.length})</h3>
                    <div className="space-y-3">
                      {projectData.milestones.map((milestone, index) => (
                        <div key={milestone.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div>
                            <h4 className="font-medium">{milestone.title}</h4>
                            <p className="text-sm text-muted-foreground">Due: {new Date(milestone.dueDate).toLocaleDateString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">${milestone.amount.toLocaleString()}</p>
                            <p className="text-sm text-muted-foreground">{milestone.deliverables.length} deliverables</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Files Summary */}
              {projectData.files.length > 0 && (
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Attached Files ({projectData.files.length})</h3>
                    <div className="space-y-2">
                      {projectData.files.map((file, index) => (
                        <div key={index} className="flex items-center space-x-3 p-2 bg-muted rounded">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{file.name}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
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
                  (step === 1 && (!projectData.title || !projectData.description)) ||
                  (step === 2 && projectData.skills.length === 0) ||
                  (step === 4 && (!projectData.budget || !projectData.deadline)) ||
                  (step === 5 && getRemainingBudget() < 0)
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
        </CardContent>
      </Card>
    </div>
  );
}