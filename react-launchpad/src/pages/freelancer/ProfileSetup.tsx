import React, { useState, useRef } from 'react';
import {addFreelancerProfile} from '../../apiendpoints';
import { ParsedResumeData } from '@/types';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  X, 
  Plus,
  User,
  Mail,
  MapPin,
  DollarSign,
  Save,
  ArrowRight,
  Loader,
  Briefcase,
  Clock
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';


export function ProfileSetup() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [resumeUploaded, setResumeUploaded] = useState(false);
  const [showParseResults, setShowParseResults] = useState(false);
  const experienceId = useRef(1);
  const projectId = useRef(1);

  const [profileData, setProfileData] = useState<ParsedResumeData>({
    summary: '',
    skills: [],
    experience: [],
    projects: [],
  });

  const [hourlyRate, setHourlyRate] = useState(75);
  const [availability, setAvailability] = useState('');
  const [workingHours, setWorkingHours] = useState('10am - 7pm');
  const [fullName, setName] = useState(`${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim());
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [location, setLocation] = useState('');



  const parseResume = async (file: File): Promise<ParsedResumeData> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("http://localhost:8000/api/parse-resume/", {
    method: "POST",
    body: formData,
  });

  const parsed = await response.json();

  if (!response.ok) {
    throw new Error(parsed.error || "Resume parsing failed.");
  }

    const rawSkillsObj: Record<string, string> = parsed.skills || {};
    const extractedSkills: string[] = Object.values(rawSkillsObj)
      .flatMap(group => group.split(',').map(skill => skill.trim()))
      .filter(skill => skill.length > 0);

    

    const experiences = (parsed.experience || []).map((exp: any) => {
      const id = experienceId.current++;
      return {
        id,
        company: exp.company ?? '',
        title: exp.title ?? '',
        startDate: exp.startDate ?? '',
        endDate: exp.endDate ?? '',
        description: exp.description ?? ''
      };
    });

    const projects = (parsed.projects || []).map((exp: any) => {
      const id = projectId.current++;
      return {
        id,
        title: exp.title ?? '',
        description: exp.description ?? '',
        tools: Array.isArray(exp.tools) ? exp.tools : [],
      };
    });

    return {
      summary: parsed.summary,
      skills: extractedSkills,
      experience: experiences,
      projects: projects,
    };
};

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.type.includes('document')) {
      toast.error('Please upload a PDF or Word document');
      return;
    }

    setUploading(true);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    setUploading(false);
    setResumeUploaded(true);
    
    // Start parsing
    setParsing(true);
    try {
      const parsedData = await parseResume(file);
      setProfileData(parsedData);
      setParsing(false);
      setShowParseResults(true);
      toast.success('Resume parsed successfully!');
    } catch (error) {
      setParsing(false);
      toast.error('Failed to parse resume. Please fill manually.');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      const fakeEvent = { target: { files: [file] } } as any;
      handleFileUpload(fakeEvent);
    }
  };

  const updateProfileField = (field: string, value: any) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const addSkill = (skill: string) => {
    if (skill && !profileData.skills.includes(skill)) {
      updateProfileField('skills', [...profileData.skills, skill]);
    }
  };

  const removeSkill = (skill: string) => {
    updateProfileField('skills', profileData.skills.filter(s => s !== skill));
  };

  const addExperience = () => {
    const newExp = {
      id: experienceId.current++,
      company: '',
      title: '',
      startDate: '',
      endDate: '',
      description: ''
    };
    updateProfileField('experience', [...profileData.experience, newExp]);
  };

  const updateExperience = (id: number, field: string, value: any) => {
    const updated = profileData.experience.map(exp => 
      exp.id === id ? { ...exp, [field]: value } : exp
    );
    updateProfileField('experience', updated);
  };

  const removeExperience = (id: number) => {
    updateProfileField('experience', profileData.experience.filter(exp => exp.id !== id));
  };

  const addProject = () => {
    const newP = {
      id: projectId.current++,
      title: '',
      description: ''
    };
    updateProfileField('projects', [...profileData.projects, newP]);
  };

  const updateProject = (id: number, field: string, value: any) => {
    const updated = profileData.projects.map(exp => 
      exp.id === id ? { ...exp, [field]: value } : exp
    );
    updateProfileField('projects', updated);
  };

  const removeProject = (id: number) => {
    updateProfileField('projects', profileData.projects.filter(p => p.id !== id));
  };

  const addToolToProject = (projectId: number, tool: string) => {
  const updatedProjects = profileData.projects.map(p => {
    if (p.id === projectId && !p.tools.includes(tool)) {
      return { ...p, tools: [...p.tools, tool] };
    }
    return p;
  });
  updateProfileField('projects', updatedProjects);
};

const removeToolFromProject = (projectId: number, tool: string) => {
  const updatedProjects = profileData.projects.map(p => {
    if (p.id === projectId) {
      return { ...p, tools: p.tools.filter(t => t !== tool) };
    }
    return p;
  });
  updateProfileField('projects', updatedProjects);
};



  const getCompletionPercentage = () => {
    let completed = 0;
    let total = 6;

    if (fullName) completed++;
    if (email) completed++;
    if (phone) completed++;
    if (profileData.summary) completed++;
    if (profileData.skills.length > 0) completed++;
    if (profileData.experience.length > 0) completed++;

    return Math.round((completed / total) * 100);
  };

  const isFieldIncomplete = (value: any) => {
    if (Array.isArray(value)) return value.length === 0;
    return !value || value.toString().trim() === '';
  };

  const canProceedToNext = () => {
    switch (step) {
      case 1: return resumeUploaded || showParseResults;
      case 2: return fullName && email && profileData.skills.length > 0;
      case 3: return profileData.experience.length > 0;
      case 4: return profileData.projects.length>0;
      default: return true;
    }
  };

  const handleSaveProfile = async () => {
  const profilePayload = {
    Id: user?.id,
    hourlyRate,
    workingHours,
    availability,
    location,
    summary: profileData.summary,
    skills: JSON.stringify(profileData.skills),
    experience: JSON.stringify(profileData.experience),
    projects: JSON.stringify(profileData.projects),
  };

  console.log(JSON.stringify(profileData.skills))
  console.log(JSON.stringify(profileData.experience))
  console.log(JSON.stringify(profileData.projects))

  try {
    await addFreelancerProfile(profilePayload);
    toast.success('Profile saved successfully!');
    navigate('/freelancer/dashboard');
  } catch (error: any) {
    toast.error(error.message || 'Failed to save profile');
  }
};

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">Upload Your Resume</h2>
        <p className="text-muted-foreground">We'll automatically extract your information to speed up the process</p>
      </div>

      <div 
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 ${
          uploading || parsing ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
        }`}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {uploading ? (
          <div className="space-y-4">
            <Loader className="w-12 h-12 text-primary mx-auto animate-spin" />
            <p className="text-primary font-medium">Uploading resume...</p>
          </div>
        ) : parsing ? (
          <div className="space-y-4">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6 text-primary animate-pulse" />
            </div>
            <p className="text-primary font-medium">Parsing resume with AI...</p>
            <Progress value={60} className="w-48 mx-auto" />
          </div>
        ) : resumeUploaded ? (
          <div className="space-y-4">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto" />
            <p className="text-green-600 font-medium">Resume uploaded successfully!</p>
            {showParseResults && (
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-green-800 font-medium">✨ Information extracted and auto-filled!</p>
                <p className="text-green-700 text-sm">Review and edit the details in the next steps</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <Upload className="w-12 h-12 text-muted-foreground mx-auto" />
            <div>
              <p className="text-muted-foreground mb-2">Drag and drop your resume here, or</p>
              <Button 
                variant="outline" 
                onClick={() => fileInputRef.current?.click()}
              >
                Choose File
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">Supports PDF and Word documents</p>
          </div>
        )}
        
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      {!resumeUploaded && (
        <div className="text-center">
          <Button variant="ghost" onClick={() => setStep(2)}>
            Skip and fill manually
          </Button>
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">Basic Information</h2>
        <p className="text-muted-foreground">Complete your profile details</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="name" className="flex items-center">
            Full Name *
            {isFieldIncomplete(fullName) && (
              <AlertCircle className="w-4 h-4 text-destructive ml-1 animate-pulse" />
            )}
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setName( e.target.value)}
              className={`pl-10 ${isFieldIncomplete(fullName) ? 'border-destructive bg-destructive/5' : ''}`}
              placeholder="Enter your full name"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="flex items-center">
            Email Address *
            {isFieldIncomplete(email) && (
              <AlertCircle className="w-4 h-4 text-destructive ml-1 animate-pulse" />
            )}
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`pl-10 ${isFieldIncomplete(email) ? 'border-destructive bg-destructive/5' : ''}`}
              placeholder="Enter your email"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Enter your phone number"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              id="location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="pl-10"
              placeholder="City, State/Country"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="summary">Professional Summary</Label>
        <Textarea
          id="summary"
          value={profileData.summary}
          onChange={(e) => updateProfileField('summary', e.target.value)}
          rows={4}
          placeholder="Brief description of your experience and expertise..."
        />
      </div>

      <div className="space-y-2">
        <Label className="flex items-center">
          Skills *
          {isFieldIncomplete(profileData.skills) && (
            <AlertCircle className="w-4 h-4 text-destructive ml-1 animate-pulse" />
          )}
        </Label>
        <div className="flex flex-wrap gap-2 mb-3">
          {profileData.skills.map(skill => (
            <Badge key={skill} variant="info">
              {skill}
              <button
                onClick={() => removeSkill(skill)}
                className="ml-1 text-muted-foreground hover:text-destructive"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
        <Input
          placeholder="Type a skill and press Enter"
          className={isFieldIncomplete(profileData.skills) ? 'border-destructive bg-destructive/5' : ''}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addSkill(e.currentTarget.value.trim());
              e.currentTarget.value = '';
            }
          }}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="hourlyRate">Hourly Rate (USD)</Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              id="hourlyRate"
              type="number"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(parseInt(e.target.value))}
              className="pl-10"
              placeholder="75"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="availability">Availability</Label>
          <Select value={availability} onValueChange={setAvailability}>
            <SelectTrigger>
              <SelectValue placeholder="Select availability" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="not-available">Not Available</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="hourlyRate">Working Hours</Label>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              id="workingHours"
              type="text"
              value={workingHours}
              onChange={(e) => setWorkingHours(e.target.value)}
              className="pl-10"
              placeholder="75"
            />
          </div>
        </div>
      </div>
    </div>
  );


  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">Work Experience</h2>
        <p className="text-muted-foreground">Add your professional experience</p>
      </div>

      <div className="space-y-6">
        {profileData.experience.map((exp, index) => (
          <Card key={exp.id}>
            <div className="relative">
              <button
                onClick={() => removeExperience(exp.id)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-destructive"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center">
                <Briefcase className="w-5 h-5 text-muted-foreground mr-2" />
                <h3 className="text-lg font-semibold text-foreground">Experience {index + 1}</h3>
              </div>
            </div>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Company</Label>
                  <Input
                    value={exp.company}
                    onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                    placeholder="Company name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={exp.title}
                    onChange={(e) => updateExperience(exp.id, 'title', e.target.value)}
                    placeholder="Job title"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="month"
                    value={exp.startDate}
                    onChange={(e) => updateExperience(exp.id, 'startDate', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="month"
                    value={exp.endDate}
                    onChange={(e) => updateExperience(exp.id, 'endDate', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={exp.description}
                  onChange={(e) => updateExperience(exp.id, 'description', e.target.value)}
                  rows={3}
                  placeholder="Describe your responsibilities and achievements..."
                />
              </div>
            </div>
          </Card>
        ))}

        <Button variant="outline" onClick={addExperience} className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Add Experience
        </Button>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">Projects</h2>
        <p className="text-muted-foreground">Add your projects</p>
      </div>

      <div className="space-y-6">
        {profileData.projects.map((p, index) => (
          <Card key={p.id}>
            <div className="relative">
              <button
                onClick={() => removeProject(p.id)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-destructive"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center">
                <Briefcase className="w-5 h-5 text-muted-foreground mr-2" />
                <h3 className="text-lg font-semibold text-foreground">Project {index + 1}</h3>
              </div>
            </div>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={p.title}
                    onChange={(e) => updateProject(p.id, 'title', e.target.value)}
                    placeholder="Project name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={p.description}
                  onChange={(e) => updateProject(p.id, 'description', e.target.value)}
                  rows={3}
                  placeholder="Describe what the project is and the outcome..."
                />
              </div>

              <div className="space-y-2">
                <Label>Tools</Label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {p.tools.map(tool => (
                    <Badge key={tool} variant="info">
                      {tool}
                      <button
                        onClick={() => removeToolFromProject(p.id, tool)}
                        className="ml-1 text-muted-foreground hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                    ))}
                  </div>
                  <Input
                    placeholder="Type a tool and press Enter"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addToolToProject(p.id, e.currentTarget.value.trim());
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                </div>

            </div>
          </Card>
        ))}

        <Button variant="outline" onClick={addProject} className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Add Project
        </Button>
      </div>
    </div>
  );

  const completionPercentage = getCompletionPercentage();

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Complete Your Profile</h1>
          <p className="text-muted-foreground">Let's set up your freelancer profile to attract great projects</p>
          
          {/* Progress Bar */}
          <div className="mt-6 max-w-md mx-auto">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Profile Completion</span>
              <span>{completionPercentage}%</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-8">
          {[1, 2, 3, 4].map((stepNum) => (
            <div key={stepNum} className="flex items-center">
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300
                ${stepNum <= step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}
                ${stepNum === step ? 'ring-4 ring-primary/20' : ''}
              `}>
                {stepNum < step ? <CheckCircle className="w-5 h-5" /> : stepNum}
              </div>
              {stepNum < 4 && (
                <div className={`
                  w-16 h-1 mx-2 transition-all duration-300
                  ${stepNum < step ? 'bg-primary' : 'bg-muted'}
                `} />
              )}
            </div>
          ))}
        </div>

        {/* Step Titles */}
        <div className="grid grid-cols-4 gap-4 mb-8 text-center">
          <div className={`text-sm ${step === 1 ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
            Resume Upload
          </div>
          <div className={`text-sm ${step === 2 ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
            Basic Info
          </div>
          <div className={`text-sm ${step === 3 ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
            Experience
          </div>
          <div className={`text-sm ${step === 4 ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
            Projects
          </div>
        </div>

        {/* Step Content */}
        <Card className="mb-8">
          <div className="p-6">
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}
          </div>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
          >
            Previous
          </Button>
          
          <div className="flex space-x-4">
            {step < 4 ? (
              <Button 
                onClick={() => setStep(step + 1)}
                disabled={!canProceedToNext()}
              >
                Next Step
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button 
                onClick={handleSaveProfile}
                disabled={completionPercentage < 50}
              >
                <Save className="w-4 h-4 mr-2" />
                Complete Profile
              </Button>
            )}
          </div>
        </div>

        {/* Completion Warning */}
        {completionPercentage < 50 && step === 4 && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
              <p className="text-yellow-800 text-sm">
                Complete at least 50% of your profile to start receiving project invitations.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}