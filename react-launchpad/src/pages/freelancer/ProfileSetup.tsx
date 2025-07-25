import React, { useState, useRef } from 'react';
import {updateFreelancerProfile} from '../../apiendpoints';
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
  Clock,
  Trash2,
  Pencil
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ExperienceModal } from '@/components/ui/ExperienceModal';
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

  // UI/UX state for modals
  const [showExpModal, setShowExpModal] = useState(false);
  const [editExp, setEditExp] = useState(null);
  const [showProjModal, setShowProjModal] = useState(false);
  const [editProj, setEditProj] = useState(null);

  const openEditExperienceModal = (exp: any) => {
    setEditExp(exp);
    setShowExpModal(true);
  };
  const openAddExperienceModal = () => {
    setEditExp(null);
    setShowExpModal(true);
  };
  const openEditProjectModal = (proj: any) => {
    setEditProj(proj);
    setShowProjModal(true);
  };
  const openAddProjectModal = () => {
    setEditProj(null);
    setShowProjModal(true);
  };


  const parseResume = async (file: File): Promise<ParsedResumeData> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append('freelancer_id', String(user?.id ?? 0));
  
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
  
    // Add state for multiple resumes
    const [uploadedResumes, setUploadedResumes] = useState<{ name: string; status: 'pending' | 'parsing' | 'success' | 'error'; error?: string }[]>([]);

    // Update handleFileUpload to handle multiple files
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      for (const file of files) {
        setUploadedResumes(prev => [...prev, { name: file.name, status: 'parsing' }]);
        setUploading(true);
        try {
          await new Promise(resolve => setTimeout(resolve, 500)); // Simulate upload
          setResumeUploaded(true);
          setParsing(true);
          try {
            const parsedData = await parseResume(file);
            setProfileData(parsedData); // Optionally merge or replace, as per your logic
            setUploadedResumes(prev => prev.map(r => r.name === file.name ? { ...r, status: 'success' } : r));
            setShowParseResults(true);
            toast.success(`Resume ${file.name} parsed successfully!`);
          } catch (error: any) {
            setUploadedResumes(prev => prev.map(r => r.name === file.name ? { ...r, status: 'error', error: error.message } : r));
            toast.error(`Failed to parse ${file.name}. Please fill manually.`);
          }
          setParsing(false);
        } finally {
          setUploading(false);
        }
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
  
    // Update add/edit/remove functions for experience and projects to use camelCase fields and assign ids
    const addExperience = (exp: any) => {
      exp.id = experienceId.current++;
      updateProfileField('experience', [...profileData.experience, exp]);
    };

    const updateExperience = (id: number, newExp: any) => {
      const updated = profileData.experience.map(exp =>
        exp.id === id ? { ...newExp } : exp
      );
      updateProfileField('experience', updated);
    };
  };
  
    // Add state for multiple resumes
    const [uploadedResumes, setUploadedResumes] = useState<{ name: string; status: 'pending' | 'parsing' | 'success' | 'error'; error?: string }[]>([]);

    // Update handleFileUpload to handle multiple files
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      for (const file of files) {
        setUploadedResumes(prev => [...prev, { name: file.name, status: 'parsing' }]);
        setUploading(true);
        try {
          await new Promise(resolve => setTimeout(resolve, 500)); // Simulate upload
          setResumeUploaded(true);
          setParsing(true);
          try {
            const parsedData = await parseResume(file);
            setProfileData(parsedData); // Optionally merge or replace, as per your logic
            setUploadedResumes(prev => prev.map(r => r.name === file.name ? { ...r, status: 'success' } : r));
            setShowParseResults(true);
            toast.success(`Resume ${file.name} parsed successfully!`);
          } catch (error: any) {
            setUploadedResumes(prev => prev.map(r => r.name === file.name ? { ...r, status: 'error', error: error.message } : r));
            toast.error(`Failed to parse ${file.name}. Please fill manually.`);
          }
          setParsing(false);
        } finally {
          setUploading(false);
        }
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
  
    // Update add/edit/remove functions for experience and projects to use camelCase fields and assign ids
    const addExperience = (exp: any) => {
      exp.id = experienceId.current++;
      updateProfileField('experience', [...profileData.experience, exp]);
    };

    const updateExperience = (id: number, newExp: any) => {
      const updated = profileData.experience.map(exp =>
        exp.id === id ? { ...newExp } : exp
      );
      updateProfileField('experience', updated);
    };

    const removeExperience = (id: number) => {
      updateProfileField('experience', profileData.experience.filter(exp => exp.id !== id));
    };
    const removeExperience = (id: number) => {
      updateProfileField('experience', profileData.experience.filter(exp => exp.id !== id));
    };

    const addProject = (proj: any) => {
      proj.id = projectId.current++;
      updateProfileField('projects', [...profileData.projects, proj]);
    };

    const addProject = (proj: any) => {
      proj.id = projectId.current++;
      updateProfileField('projects', [...profileData.projects, proj]);
    };


  const updateProject = (id: number, newProj: any) => {
  const updateProject = (id: number, newProj: any) => {
    const updated = profileData.projects.map(p => 
      p.id === id ? { ...newProj } : p
      p.id === id ? { ...newProj } : p
    );
    updateProfileField('projects', updated);
  };

  const removeProject = (id: number) => {
    updateProfileField('projects', profileData.projects.filter(p => p.id !== id));
    updateProfileField('projects', profileData.projects.filter(p => p.id !== id));
  };





  const getCompletionPercentage = () => {
    let completed = 0;
    let total = 6;
    let total = 6;

    if (fullName) completed++;
    if (email) completed++;
    if (phone) completed++;
    if (hourlyRate > 0) completed++;
    if (availability) completed++;
    if (workingHours) completed++;
    if (profileData.skills.length > 0) completed++;

    return Math.round((completed / total) * 100);
  };

  const isFieldIncomplete = (value: any) => {
    if (Array.isArray(value)) return value.length === 0;
    return !value || value.toString().trim() === '';
  };

  const canProceedToNext = () => {
    switch (step) {
      case 1: return resumeUploaded || showParseResults;
      case 2: return fullName && email && phone && profileData.skills.length && hourlyRate > 0 && availability && workingHours;
      case 3: return true;
      case 4: return true;
      default: return true;
    }
  };

  function stripIds<T extends { id?: any }>(arr: T[]): Omit<T, 'id'>[] {
    return arr.map(({ id, ...rest }) => rest);
  }

  function stripIds<T extends { id?: any }>(arr: T[]): Omit<T, 'id'>[] {
    return arr.map(({ id, ...rest }) => rest);
  }

  const handleSaveProfile = async () => {
    const profilePayload = {
    Id: user?.id,
    hourlyRate,
    workingHours,
    availability,
    summary: profileData.summary,
    skills: JSON.stringify(profileData.skills),
    experience: JSON.stringify(stripIds(profileData.experience)),
    projects: JSON.stringify(stripIds(profileData.projects)),
    };
  
    console.log(JSON.stringify(profileData.skills))
    console.log(JSON.stringify(profileData.experience))
    console.log(JSON.stringify(profileData.projects))
  
    try {
    await updateFreelancerProfile(profilePayload, user?.id ?? 0);
    await fetch("http://localhost:8000/api/update-parsed-json/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        freelancer_id: user?.id,
        parsed_json: profilePayload
      })
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
        <h2 className="text-2xl font-bold text-foreground mb-2">Upload Your Resume(s)</h2>
        <p className="text-muted-foreground">We'll automatically extract your information to speed up the process. You can upload multiple resumes if you wish.</p>
        <h2 className="text-2xl font-bold text-foreground mb-2">Upload Your Resume(s)</h2>
        <p className="text-muted-foreground">We'll automatically extract your information to speed up the process. You can upload multiple resumes if you wish.</p>
      </div>
      <div
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 ${
          uploading || parsing ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
        }`}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <Upload className="w-12 h-12 text-muted-foreground mx-auto" />
        <div>
          <p className="text-muted-foreground mb-2">Drag and drop your resume(s) here, or</p>
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            Choose File(s)
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">Supports PDF and Word documents. You can upload multiple files.</p>
        <Upload className="w-12 h-12 text-muted-foreground mx-auto" />
        <div>
          <p className="text-muted-foreground mb-2">Drag and drop your resume(s) here, or</p>
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            Choose File(s)
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">Supports PDF and Word documents. You can upload multiple files.</p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={handleFileUpload}
          className="hidden"
          multiple
          multiple
        />
        {/* Show uploaded files and their status */}
        {uploadedResumes.length > 0 && (
          <div className="mt-6 text-left">
            <h4 className="font-semibold mb-2">Uploaded Files:</h4>
            <ul className="space-y-2">
              {uploadedResumes.map((file, idx) => (
                <li key={file.name + idx} className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span>{file.name}</span>
                  {file.status === 'parsing' && <Loader className="w-4 h-4 text-primary animate-spin" />}
                  {file.status === 'success' && <CheckCircle className="w-4 h-4 text-green-600" />}
                  {file.status === 'error' && <AlertCircle className="w-4 h-4 text-red-600" />}
                </li>
              ))}
            </ul>
          </div>
        )}
        {showParseResults && (
          <div className="bg-green-50 p-4 rounded-lg mt-4">
            <p className="text-green-800 font-medium">✨ Information extracted and auto-filled!</p>
            <p className="text-green-700 text-sm">Review and edit the details in the next steps</p>
          </div>
        )}
        {/* Show uploaded files and their status */}
        {uploadedResumes.length > 0 && (
          <div className="mt-6 text-left">
            <h4 className="font-semibold mb-2">Uploaded Files:</h4>
            <ul className="space-y-2">
              {uploadedResumes.map((file, idx) => (
                <li key={file.name + idx} className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span>{file.name}</span>
                  {file.status === 'parsing' && <Loader className="w-4 h-4 text-primary animate-spin" />}
                  {file.status === 'success' && <CheckCircle className="w-4 h-4 text-green-600" />}
                  {file.status === 'error' && <AlertCircle className="w-4 h-4 text-red-600" />}
                </li>
              ))}
            </ul>
          </div>
        )}
        {showParseResults && (
          <div className="bg-green-50 p-4 rounded-lg mt-4">
            <p className="text-green-800 font-medium">✨ Information extracted and auto-filled!</p>
            <p className="text-green-700 text-sm">Review and edit the details in the next steps</p>
          </div>
        )}
      </div>
      {!resumeUploaded && (
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
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setName( e.target.value)}
              className={`pl-10 ${isFieldIncomplete(fullName) ? 'border-destructive bg-destructive/5' : ''}`}
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
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`pl-10 ${isFieldIncomplete(email) ? 'border-destructive bg-destructive/5' : ''}`}
              className={`pl-10 ${isFieldIncomplete(email) ? 'border-destructive bg-destructive/5' : ''}`}
              placeholder="Enter your email"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number *</Label>
          <Input
            id="phone"
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Enter your phone number"
          />
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
            <Badge key={skill} variant="info">
              {skill}
              <button
                onClick={() => removeSkill(skill)}
                className="ml-1 text-muted-foreground hover:text-destructive"
                onClick={() => removeSkill(skill)}
                className="ml-1 text-muted-foreground hover:text-destructive"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
            </Badge>
          ))}
        </div>
        <Input
          placeholder="Type a skill and press Enter"
          className={isFieldIncomplete(profileData.skills) ? 'border-destructive bg-destructive/5' : ''}
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
          <Label htmlFor="hourlyRate">Hourly Rate (USD) *</Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              id="hourlyRate"
              type="number"
              required
              value={hourlyRate}
              onChange={(e) => setHourlyRate(parseInt(e.target.value))}
              className="pl-10"
              className="pl-10"
              placeholder="75"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="availability">Availability *</Label>
          <Select value={availability} onValueChange={setAvailability}>
            <SelectTrigger>
            <SelectTrigger>
              <SelectValue placeholder="Select availability" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Available">Available</SelectItem>
              <SelectItem value="Unavailable">Unavailable</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="hourlyRate">Working Hours *</Label>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              id="workingHours"
              type="text"
              required
              value={workingHours}
              onChange={(e) => setWorkingHours(e.target.value)}
              className="pl-10"
              placeholder="75"
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
          <Card key={exp.id} className="relative mb-4">
          <Card key={exp.id} className="relative mb-4">
            <button
              className="absolute top-4 right-12 text-gray-400 hover:text-red-600"
              onClick={() => removeExperience(exp.id)}
              onClick={() => removeExperience(exp.id)}
              title="Remove Experience"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-blue-600"
              onClick={() => openEditExperienceModal(exp)}
              title="Edit Experience"
            >
            >
              <Pencil className="w-5 h-5" />
            </button>
            <div className="mb-2 text-xl font-bold text-gray-900">{exp.title}</div>
            </button>
            <div className="mb-2 text-xl font-bold text-gray-900">{exp.title}</div>
            <div className="mb-2 text-lg font-semibold text-gray-700">
              {exp.company} | {exp.startDate} - {exp.endDate}
              {exp.company} | {exp.startDate} - {exp.endDate}
            </div>
            <div className="text-gray-700 whitespace-pre-line">{exp.description}</div>
            <div className="text-gray-700 whitespace-pre-line">{exp.description}</div>
          </Card>
        ))}
        <Button variant="outline" onClick={openAddExperienceModal} className="w-full rounded-lg border-dashed border-2 border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50 text-blue-700 shadow-sm">
          <Plus className="w-4 h-4 mr-2 text-blue-500" />
          Add Experience
        </Button>
        <ExperienceModal
          open={showExpModal}
          onClose={() => setShowExpModal(false)}
          onSave={exp => {
            if (exp.id) updateExperience(exp.id, exp);
            if (exp.id) updateExperience(exp.id, exp);
            else addExperience(exp);
            setShowExpModal(false);
          }}
          onDelete={id => { removeExperience(id); setShowExpModal(false); }}
          initialData={editExp}
        />
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
          <Card key={p.id} className="relative mb-4">
            <button
          <Card key={p.id} className="relative mb-4">
            <button
              className="absolute top-4 right-12 text-gray-400 hover:text-red-600"
              onClick={() => removeProject(p.id)}
              onClick={() => removeProject(p.id)}
              title="Remove Project"
            >
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button
            </button>
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-blue-600"
              onClick={() => openEditProjectModal(p)}
              title="Edit Project"
            >
            >
              <Pencil className="w-5 h-5" />
            </button>
            <div className="mb-2 text-xl font-bold text-gray-900">{p.title}</div>
            <div className="text-gray-700 whitespace-pre-line">{p.description}</div>
            </button>
            <div className="mb-2 text-xl font-bold text-gray-900">{p.title}</div>
            <div className="text-gray-700 whitespace-pre-line">{p.description}</div>
          </Card>
        ))}

        <Button variant="outline" onClick={openAddProjectModal} className="w-full rounded-lg border-dashed border-2 border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50 text-blue-700 shadow-sm">
          <Plus className="w-4 h-4 mr-2 text-blue-500" />
          Add Project
        </Button>
        <ProjectModal
          open={showProjModal}
          onClose={() => setShowProjModal(false)}
          onSave={proj => {
            if (proj.id) updateProject(proj.id, proj);
            if (proj.id) updateProject(proj.id, proj);
            else addProject(proj);
            setShowProjModal(false);
          }}
          onDelete={id => { removeProject(id); setShowProjModal(false); }}
          initialData={editProj}
        />
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