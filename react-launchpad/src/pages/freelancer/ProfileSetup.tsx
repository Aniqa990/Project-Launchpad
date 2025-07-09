import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
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
  Briefcase,
  GraduationCap,
  Code,
  DollarSign,
  Calendar,
  Save,
  ArrowRight,
  Loader
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface ParsedResumeData {
  name: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  skills: string[];
  experience: {
    id: string;
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    description: string;
    current: boolean;
  }[];
  education: {
    id: string;
    institution: string;
    degree: string;
    field: string;
    startDate: string;
    endDate: string;
    current: boolean;
  }[];
}

export function ProfileSetup() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [step, setStep] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [resumeUploaded, setResumeUploaded] = useState(false);
  const [showParseResults, setShowParseResults] = useState(false);
  
  const [profileData, setProfileData] = useState<ParsedResumeData>({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    location: '',
    summary: '',
    skills: [],
    experience: [],
    education: []
  });

  const [hourlyRate, setHourlyRate] = useState(75);
  const [availability, setAvailability] = useState('full-time');
  const [portfolio, setPortfolio] = useState([
    { id: '1', title: '', description: '', url: '', technologies: [] }
  ]);

  // Mock resume parsing function
  const parseResume = async (file: File): Promise<ParsedResumeData> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Mock parsed data based on file name or random generation
    return {
      name: profileData.name || 'Alex Chen',
      email: profileData.email || 'alex@freelancer.com',
      phone: '+1 (555) 123-4567',
      location: 'San Francisco, CA',
      summary: 'Experienced full-stack developer with 5+ years of expertise in React, Node.js, and cloud technologies. Passionate about building scalable web applications and delivering exceptional user experiences.',
      skills: ['React', 'TypeScript', 'Node.js', 'Python', 'AWS', 'GraphQL', 'MongoDB', 'Docker'],
      experience: [
        {
          id: '1',
          company: 'TechCorp Inc.',
          position: 'Senior Full Stack Developer',
          startDate: '2021-03',
          endDate: '',
          current: true,
          description: 'Led development of microservices architecture serving 1M+ users. Built React applications with TypeScript and integrated with GraphQL APIs.'
        },
        {
          id: '2',
          company: 'StartupXYZ',
          position: 'Frontend Developer',
          startDate: '2019-06',
          endDate: '2021-02',
          current: false,
          description: 'Developed responsive web applications using React and Redux. Collaborated with design team to implement pixel-perfect UI components.'
        }
      ],
      education: [
        {
          id: '1',
          institution: 'University of California, Berkeley',
          degree: 'Bachelor of Science',
          field: 'Computer Science',
          startDate: '2015-09',
          endDate: '2019-05',
          current: false
        }
      ]
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
    
    // Simulate upload progress
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
      id: Date.now().toString(),
      company: '',
      position: '',
      startDate: '',
      endDate: '',
      current: false,
      description: ''
    };
    updateProfileField('experience', [...profileData.experience, newExp]);
  };

  const updateExperience = (id: string, field: string, value: any) => {
    const updated = profileData.experience.map(exp => 
      exp.id === id ? { ...exp, [field]: value } : exp
    );
    updateProfileField('experience', updated);
  };

  const removeExperience = (id: string) => {
    updateProfileField('experience', profileData.experience.filter(exp => exp.id !== id));
  };

  const addEducation = () => {
    const newEdu = {
      id: Date.now().toString(),
      institution: '',
      degree: '',
      field: '',
      startDate: '',
      endDate: '',
      current: false
    };
    updateProfileField('education', [...profileData.education, newEdu]);
  };

  const updateEducation = (id: string, field: string, value: any) => {
    const updated = profileData.education.map(edu => 
      edu.id === id ? { ...edu, [field]: value } : edu
    );
    updateProfileField('education', updated);
  };

  const removeEducation = (id: string) => {
    updateProfileField('education', profileData.education.filter(edu => edu.id !== id));
  };

  const addPortfolioItem = () => {
    const newItem = {
      id: Date.now().toString(),
      title: '',
      description: '',
      url: '',
      technologies: []
    };
    setPortfolio([...portfolio, newItem]);
  };

  const updatePortfolioItem = (id: string, field: string, value: any) => {
    setPortfolio(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const removePortfolioItem = (id: string) => {
    setPortfolio(prev => prev.filter(item => item.id !== id));
  };

  const getCompletionPercentage = () => {
    let completed = 0;
    let total = 8;

    if (profileData.name) completed++;
    if (profileData.email) completed++;
    if (profileData.phone) completed++;
    if (profileData.location) completed++;
    if (profileData.summary) completed++;
    if (profileData.skills.length > 0) completed++;
    if (profileData.experience.length > 0) completed++;
    if (profileData.education.length > 0) completed++;

    return Math.round((completed / total) * 100);
  };

  const isFieldIncomplete = (value: any) => {
    if (Array.isArray(value)) return value.length === 0;
    return !value || value.toString().trim() === '';
  };

  const canProceedToNext = () => {
    switch (step) {
      case 1: return resumeUploaded || showParseResults;
      case 2: return profileData.name && profileData.email && profileData.skills.length > 0;
      case 3: return profileData.experience.length > 0;
      case 4: return true; // Optional step
      default: return true;
    }
  };

  const handleSaveProfile = () => {
    toast.success('Profile saved successfully!');
    navigate('/freelancer/dashboard');
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Your Resume</h2>
        <p className="text-gray-600">We'll automatically extract your information to speed up the process</p>
      </div>

      <div 
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 ${
          uploading || parsing ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {uploading ? (
          <div className="space-y-4">
            <Loader className="w-12 h-12 text-blue-600 mx-auto animate-spin" />
            <p className="text-blue-600 font-medium">Uploading resume...</p>
          </div>
        ) : parsing ? (
          <div className="space-y-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6 text-blue-600 animate-pulse" />
            </div>
            <p className="text-blue-600 font-medium">Parsing resume with AI...</p>
            <div className="w-48 bg-gray-200 rounded-full h-2 mx-auto">
              <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
            </div>
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
            <Upload className="w-12 h-12 text-gray-400 mx-auto" />
            <div>
              <p className="text-gray-600 mb-2">Drag and drop your resume here, or</p>
              <Button 
                variant="outline" 
                onClick={() => fileInputRef.current?.click()}
              >
                Choose File
              </Button>
            </div>
            <p className="text-sm text-gray-500">Supports PDF and Word documents</p>
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Basic Information</h2>
        <p className="text-gray-600">Complete your profile details</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Name *
            {isFieldIncomplete(profileData.name) && (
              <AlertCircle className="w-4 h-4 text-red-500 inline ml-1 animate-pulse" />
            )}
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={profileData.name}
              onChange={(e) => updateProfileField('name', e.target.value)}
              className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                isFieldIncomplete(profileData.name) ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Enter your full name"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address *
            {isFieldIncomplete(profileData.email) && (
              <AlertCircle className="w-4 h-4 text-red-500 inline ml-1 animate-pulse" />
            )}
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="email"
              value={profileData.email}
              onChange={(e) => updateProfileField('email', e.target.value)}
              className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                isFieldIncomplete(profileData.email) ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Enter your email"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
          <input
            type="tel"
            value={profileData.phone}
            onChange={(e) => updateProfileField('phone', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter your phone number"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={profileData.location}
              onChange={(e) => updateProfileField('location', e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="City, State/Country"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Professional Summary</label>
        <textarea
          value={profileData.summary}
          onChange={(e) => updateProfileField('summary', e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Brief description of your experience and expertise..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Skills *
          {isFieldIncomplete(profileData.skills) && (
            <AlertCircle className="w-4 h-4 text-red-500 inline ml-1 animate-pulse" />
          )}
        </label>
        <div className="flex flex-wrap gap-2 mb-3">
          {profileData.skills.map(skill => (
            <div key={skill} className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
              {skill}
              <button
                onClick={() => removeSkill(skill)}
                className="ml-2 text-blue-600 hover:text-blue-800"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
        <input
          type="text"
          placeholder="Type a skill and press Enter"
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            isFieldIncomplete(profileData.skills) ? 'border-red-300 bg-red-50' : 'border-gray-300'
          }`}
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
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Hourly Rate (USD)</label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="number"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(parseInt(e.target.value))}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="75"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Availability</label>
          <select
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="full-time">Full-time (40+ hrs/week)</option>
            <option value="part-time">Part-time (20-40 hrs/week)</option>
            <option value="project-based">Project-based</option>
            <option value="weekends">Weekends only</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Work Experience</h2>
        <p className="text-gray-600">Add your professional experience</p>
      </div>

      <div className="space-y-6">
        {profileData.experience.map((exp, index) => (
          <Card key={exp.id} className="relative">
            <button
              onClick={() => removeExperience(exp.id)}
              className="absolute top-4 right-4 text-gray-400 hover:text-red-500"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
                <input
                  type="text"
                  value={exp.company}
                  onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Company name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
                <input
                  type="text"
                  value={exp.position}
                  onChange={(e) => updateExperience(exp.id, 'position', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Job title"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input
                  type="month"
                  value={exp.startDate}
                  onChange={(e) => updateExperience(exp.id, 'startDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input
                  type="month"
                  value={exp.endDate}
                  onChange={(e) => updateExperience(exp.id, 'endDate', e.target.value)}
                  disabled={exp.current}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={exp.current}
                    onChange={(e) => updateExperience(exp.id, 'current', e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Current position</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={exp.description}
                onChange={(e) => updateExperience(exp.id, 'description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe your responsibilities and achievements..."
              />
            </div>
          </Card>
        ))}

        <Button variant="outline" onClick={addExperience} icon={Plus} className="w-full">
          Add Experience
        </Button>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Education & Portfolio</h2>
        <p className="text-gray-600">Add your educational background and showcase your work</p>
      </div>

      {/* Education Section */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Education</h3>
        <div className="space-y-4">
          {profileData.education.map((edu) => (
            <Card key={edu.id} className="relative">
              <button
                onClick={() => removeEducation(edu.id)}
                className="absolute top-4 right-4 text-gray-400 hover:text-red-500"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Institution</label>
                  <input
                    type="text"
                    value={edu.institution}
                    onChange={(e) => updateEducation(edu.id, 'institution', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="University/School name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Degree</label>
                  <input
                    type="text"
                    value={edu.degree}
                    onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Bachelor's, Master's, etc."
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Field of Study</label>
                  <input
                    type="text"
                    value={edu.field}
                    onChange={(e) => updateEducation(edu.id, 'field', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Computer Science, etc."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                  <input
                    type="month"
                    value={edu.startDate}
                    onChange={(e) => updateEducation(edu.id, 'startDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                  <input
                    type="month"
                    value={edu.endDate}
                    onChange={(e) => updateEducation(edu.id, 'endDate', e.target.value)}
                    disabled={edu.current}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  />
                </div>
              </div>
            </Card>
          ))}

          <Button variant="outline" onClick={addEducation} icon={Plus} className="w-full">
            Add Education
          </Button>
        </div>
      </div>

      {/* Portfolio Section */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Portfolio Projects</h3>
        <div className="space-y-4">
          {portfolio.map((item) => (
            <Card key={item.id} className="relative">
              <button
                onClick={() => removePortfolioItem(item.id)}
                className="absolute top-4 right-4 text-gray-400 hover:text-red-500"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Project Title</label>
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) => updatePortfolioItem(item.id, 'title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Project name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Project URL</label>
                  <input
                    type="url"
                    value={item.url}
                    onChange={(e) => updatePortfolioItem(item.id, 'url', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={item.description}
                  onChange={(e) => updatePortfolioItem(item.id, 'description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe the project and your role..."
                />
              </div>
            </Card>
          ))}

          <Button variant="outline" onClick={addPortfolioItem} icon={Plus} className="w-full">
            Add Portfolio Project
          </Button>
        </div>
      </div>
    </div>
  );

  const completionPercentage = getCompletionPercentage();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Profile</h1>
          <p className="text-gray-600">Let's set up your freelancer profile to attract great projects</p>
          
          {/* Progress Bar */}
          <div className="mt-6 max-w-md mx-auto">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Profile Completion</span>
              <span>{completionPercentage}%</span>
            </div>
            <div className="bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
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
                ${stepNum <= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}
                ${stepNum === step ? 'ring-4 ring-blue-200' : ''}
              `}>
                {stepNum < step ? <CheckCircle className="w-5 h-5" /> : stepNum}
              </div>
              {stepNum < 4 && (
                <div className={`
                  w-16 h-1 mx-2 transition-all duration-300
                  ${stepNum < step ? 'bg-blue-600' : 'bg-gray-200'}
                `} />
              )}
            </div>
          ))}
        </div>

        {/* Step Titles */}
        <div className="grid grid-cols-4 gap-4 mb-8 text-center">
          <div className={`text-sm ${step === 1 ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
            Resume Upload
          </div>
          <div className={`text-sm ${step === 2 ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
            Basic Info
          </div>
          <div className={`text-sm ${step === 3 ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
            Experience
          </div>
          <div className={`text-sm ${step === 4 ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
            Education & Portfolio
          </div>
        </div>

        {/* Step Content */}
        <Card className="mb-8">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
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
                icon={ArrowRight}
                iconPosition="right"
              >
                Next Step
              </Button>
            ) : (
              <Button 
                onClick={handleSaveProfile}
                icon={Save}
                disabled={completionPercentage < 50}
              >
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