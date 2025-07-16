import React, { useState, useRef, useEffect } from 'react';
import { getProfileSetupData, saveProfileSetupData } from '../../apiendpoints';
import { ParsedResumeData, Skill, ProjectItem, Experience } from '@/types';
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
  const skillId = useRef(1);
  const experienceId = useRef(1);
  const projectId = useRef(1);

  const [step, setStep] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [resumeUploaded, setResumeUploaded] = useState(false);
  const [showParseResults, setShowParseResults] = useState(false);
  const [loading, setLoading] = useState(false);

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
  //const [location, setLocation] = useState('');

  // Debug log to see user object
  console.log('User object:', user);
  console.log('User phone:', user?.phone);

  // Fetch pre-parsed data from resume_parser on component mount
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        const data = await getProfileSetupData();
        
        console.log('API Response:', data); 
        console.log('API Response Skills:', data.Skills); 
        console.log('API Response Projects:', data.Projects); 
        console.log('API Response Experience:', data.Experience);
        
        // Check if data exists and has the expected structure
        if (!data) {
          console.log('No data returned from API');
          return;
        }
        
        //IDs start from 1 and are sequential
        const skills = (data.Skills || []).map((skill, idx) => ({
          Id: idx + 1,
          SkillName: skill.SkillName,
          Source: skill.Source as 'parsed' | 'manual'
        }));
        const experience = (data.Experience || []).map((exp, idx) => ({
          Id: idx + 1,
          Title: exp.Title,
          Company: exp.Company,
          Duration: exp.Duration,
          Description: exp.Description,
          Source: exp.Source as 'parsed' | 'manual'
        }));
        const projects = (data.Projects || []).map((project, idx) => ({
          Id: idx + 1,
          Title: project.Title,
          Description: project.Description,
          Source: project.Source as 'parsed' | 'manual'
        }));

        //Set the next ID for each type
        skillId.current = skills.length + 1;
        experienceId.current = experience.length + 1;
        projectId.current = projects.length + 1;

        const transformedData: ParsedResumeData = {
          summary: data.Summary || '',
          skills,
          experience,
          projects,
        };

        console.log('Transformed Data:', transformedData); 
        
        setProfileData(transformedData);
        
        if (
          data.Summary ||
          (data.Skills && data.Skills.length > 0) ||
          (data.Experience && data.Experience.length > 0) ||
          (data.Projects && data.Projects.length > 0)
        ) {
          setResumeUploaded(true);
          setShowParseResults(true);
          toast.success('Found existing profile data!');
        } else {
          console.log('No existing profile data found - this is normal for new users');
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  // Function to upload resume to resume_parser and then fetch the parsed data
  const uploadResumeAndFetchData = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:8000/api/parse-resume/", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Resume parsing failed.");
      }

      const parsedData = await getProfileSetupData();
      
      //IDs start from 1 and are sequential
      const skills = (parsedData.Skills || []).map((skill, idx) => ({
        Id: idx + 1,
        SkillName: skill.SkillName,
        Source: skill.Source as 'parsed' | 'manual'
      }));
      const experience = (parsedData.Experience || []).map((exp, idx) => ({
        Id: idx + 1,
        Title: exp.Title,
        Company: exp.Company,
        Duration: exp.Duration,
        Description: exp.Description,
        Source: exp.Source as 'parsed' | 'manual'
      }));
      const projects = (parsedData.Projects || []).map((project, idx) => ({
        Id: idx + 1,
        Title: project.Title,
        Description: project.Description,
        Source: project.Source as 'parsed' | 'manual'
      }));

      // Set the next ID for each type
      skillId.current = skills.length + 1;
      experienceId.current = experience.length + 1;
      projectId.current = projects.length + 1;

      const transformedData: ParsedResumeData = {
        summary: parsedData.Summary || '',
        skills,
        experience,
        projects,
      };

      setProfileData(transformedData);
      setShowParseResults(true);
      toast.success('Resume parsed and data loaded successfully!');
      
    } catch (error: any) {
      toast.error(error.message || 'Failed to parse resume. Please fill manually.');
    }
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
      await uploadResumeAndFetchData(file);
    } finally {
      setParsing(false);
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
    if (skill && !profileData.skills.some(s => s.SkillName === skill)) {
      const newSkill: Skill = {
        Id: skillId.current++,
        SkillName: skill,
        Source: 'manual'
      };
      setProfileData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill]
      }));
    }
  };

  const removeSkill = (skillId: number) => {
    updateProfileField('skills', profileData.skills.filter(s => s.Id !== skillId));
  };

  const addExperience = () => {
    const newExp: Experience = {
      Id: experienceId.current++,
      Company: '',
      Title: '',
      Duration: '',
      Description: '',
      Source: 'manual'
    };
    setProfileData(prev => ({
      ...prev,
      experience: [...prev.experience, newExp]
    }));
  };

  const updateExperience = (id: number, field: string, value: any) => {
    const updated = profileData.experience.map(exp => 
      exp.Id === id ? { ...exp, [field]: value } : exp
    );
    updateProfileField('experience', updated);
  };

  const removeExperience = (id: number) => {
    updateProfileField('experience', profileData.experience.filter(exp => exp.Id !== id));
  };

  const addProject = () => {
    const newP: ProjectItem = {
      Id: projectId.current++,
      Title: '',
      Description: '',
      Source: 'manual'
    };
    setProfileData(prev => ({
      ...prev,
      projects: [...prev.projects, newP]
    }));
  };

  const updateProject = (id: number, field: string, value: any) => {
    const updated = profileData.projects.map(exp => 
      exp.Id === id ? { ...exp, [field]: value } : exp
    );
    updateProfileField('projects', updated);
  };

  const removeProject = (id: number) => {
    updateProfileField('projects', profileData.projects.filter(p => p.Id !== id));
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
      case 4: return profileData.projects.length > 0;
      default: return true;
    }
  };

  const handleSaveProfile = async () => {
    try {
      const [firstName, ...lastNameParts] = fullName.split(' ');
      const lastName = lastNameParts.join(' ') || '';
      console.log('Profile Data:', profileData);

      await saveProfileSetupData({
        firstName,
        lastName,
        phone,
        hourlyRate,
        availability,
        workingHours,
        profileData: {
          Summary: profileData.summary,
          Skills: profileData.skills,
          Experience: profileData.experience,
          Projects: profileData.projects
        }
      });

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

      {loading ? (
        <div className="text-center space-y-4">
          <Loader className="w-12 h-12 text-primary mx-auto animate-spin" />
          <p className="text-primary font-medium">Loading existing profile data...</p>
        </div>
      ) : (
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
              <p className="text-green-600 font-medium">Resume processed successfully!</p>
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
      )}

      {!resumeUploaded && !loading && (
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
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 w-4 h-4" />
            <Input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setName(e.target.value)}
              className={`pl-10 rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-400 shadow-sm ${isFieldIncomplete(fullName) ? 'border-destructive bg-destructive/5' : ''}`}
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
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 w-4 h-4" />
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`pl-10 rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-400 shadow-sm ${isFieldIncomplete(email) ? 'border-destructive bg-destructive/5' : ''}`}
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
            className="rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-400 shadow-sm"
          />
        </div>

        {/* <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 w-4 h-4" />
            <Input
              id="location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="pl-10 rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-400 shadow-sm"
              placeholder="City, State/Country"
            />
          </div>
        </div> */}
      </div>

      <div className="space-y-2">
        <Label htmlFor="summary">Professional Summary</Label>
        <Textarea
          id="summary"
          value={profileData.summary}
          onChange={(e) => updateProfileField('summary', e.target.value)}
          rows={4}
          placeholder="Brief description of your experience and expertise..."
          className="rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-400 shadow-sm"
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
            <span key={skill.Id} className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium shadow-sm border border-blue-200">
              {skill.SkillName}
              <button
                onClick={() => removeSkill(skill.Id)}
                className="ml-1 text-blue-400 hover:text-red-500"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <Input
          placeholder="Type a skill and press Enter"
          className={`rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-400 shadow-sm ${isFieldIncomplete(profileData.skills) ? 'border-destructive bg-destructive/5' : ''}`}
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
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 w-4 h-4" />
            <Input
              id="hourlyRate"
              type="number"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(parseInt(e.target.value))}
              className="pl-10 rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-400 shadow-sm"
              placeholder="75"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="availability">Availability</Label>
          <Select value={availability} onValueChange={setAvailability}>
            <SelectTrigger className="rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-400 shadow-sm">
              <SelectValue placeholder="Select availability" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="not-available">Not Available</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="workingHours">Working Hours</Label>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 w-4 h-4" />
            <Input
              id="workingHours"
              type="text"
              value={workingHours}
              onChange={(e) => setWorkingHours(e.target.value)}
              className="pl-10 rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-400 shadow-sm"
              placeholder="9am-5pm"
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
          <div key={exp.Id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="relative">
              <button
                onClick={() => removeExperience(exp.Id)}
                className="absolute top-4 right-4 text-gray-400 hover:text-red-500"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center">
                <Briefcase className="w-5 h-5 text-blue-500 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Experience {index + 1}</h3>
              </div>
            </div>
            <div className="space-y-4 mt-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Company</Label>
                  <Input
                    value={exp.Company}
                    onChange={(e) => updateExperience(exp.Id, 'Company', e.target.value)}
                    placeholder="Company name"
                    className="rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-400 shadow-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={exp.Title}
                    onChange={(e) => updateExperience(exp.Id, 'Title', e.target.value)}
                    placeholder="Job title"
                    className="rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-400 shadow-sm"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Duration</Label>
                  <Input
                    value={exp.Duration}
                    onChange={(e) => updateExperience(exp.Id, 'Duration', e.target.value)}
                    placeholder="e.g., 2020-2023"
                    className="rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-400 shadow-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={exp.Description}
                  onChange={(e) => updateExperience(exp.Id, 'Description', e.target.value)}
                  rows={3}
                  placeholder="Describe your responsibilities and achievements..."
                  className="rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-400 shadow-sm"
                />
              </div>
            </div>
          </div>
        ))}

        <Button variant="outline" onClick={addExperience} className="w-full rounded-lg border-dashed border-2 border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50 text-blue-700 shadow-sm">
          <Plus className="w-4 h-4 mr-2 text-blue-500" />
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
          <div key={p.Id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="relative">
              <button
                onClick={() => removeProject(p.Id)}
                className="absolute top-4 right-4 text-gray-400 hover:text-red-500"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center">
                <Briefcase className="w-5 h-5 text-blue-500 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Project {index + 1}</h3>
              </div>
            </div>
            <div className="space-y-4 mt-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={p.Title}
                    onChange={(e) => updateProject(p.Id, 'Title', e.target.value)}
                    placeholder="Project name"
                    className="rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-400 shadow-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={p.Description}
                  onChange={(e) => updateProject(p.Id, 'Description', e.target.value)}
                  rows={3}
                  placeholder="Describe what the project is and the outcome..."
                  className="rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-400 shadow-sm"
                />
              </div>
            </div>
          </div>
        ))}

        <Button variant="outline" onClick={addProject} className="w-full rounded-lg border-dashed border-2 border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50 text-blue-700 shadow-sm">
          <Plus className="w-4 h-4 mr-2 text-blue-500" />
          Add Project
        </Button>
      </div>
    </div>
  );

  const completionPercentage = getCompletionPercentage();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Outer Blue Card Header */}
        <div className="rounded-xl bg-blue-600 shadow-sm border border-blue-700 mb-8 p-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Complete Your Profile</h1>
          <p className="text-blue-100">Let's set up your freelancer profile to attract great projects</p>
          {/* Progress Bar */}
          <div className="mt-6 max-w-md mx-auto">
            <div className="flex justify-between text-sm text-blue-100 mb-2">
              <span>Profile Completion</span>
              <span>{completionPercentage}%</span>
            </div>
            <div className="w-full h-2 bg-blue-400/40 rounded-full overflow-hidden">
              <div
                className="h-2 bg-white rounded-full transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-8">
          {[1, 2, 3, 4].map((stepNum) => (
            <div key={stepNum} className="flex items-center">
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300
                ${stepNum <= step ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 text-gray-500'}
                ${stepNum === step ? 'ring-4 ring-blue-200' : ''}
              `}>
                {stepNum < step ? <CheckCircle className="w-5 h-5 text-white" /> : stepNum}
              </div>
              {stepNum < 4 && (
                <div className={`
                  w-16 h-1 mx-2 transition-all duration-300
                  ${stepNum < step ? 'bg-blue-500' : 'bg-gray-200'}
                  rounded-full
                `} />
              )}
            </div>
          ))}
        </div>

        {/* Step Titles */}
        <div className="grid grid-cols-4 gap-4 mb-8 text-center">
          <div className={`text-sm ${step === 1 ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>Resume Upload</div>
          <div className={`text-sm ${step === 2 ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>Basic Info</div>
          <div className={`text-sm ${step === 3 ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>Experience</div>
          <div className={`text-sm ${step === 4 ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>Projects</div>
        </div>

        {/* Step Content */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
            className="rounded-lg border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50 text-gray-700"
          >
            Previous
          </Button>
          <div className="flex space-x-4">
            {step < 4 ? (
              <Button 
                onClick={() => setStep(step + 1)}
                disabled={!canProceedToNext()}
                className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
              >
                Next Step
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button 
                onClick={handleSaveProfile}
                disabled={completionPercentage < 50}
                className="rounded-lg bg-green-600 hover:bg-green-700 text-white shadow-sm"
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