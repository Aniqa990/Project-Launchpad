import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { User, Phone, Camera, Save, Briefcase, DollarSign, Clock, Edit2, Eye, EyeOff, Lock, X, Plus, Trash2, Pencil } from 'lucide-react';
import { getFreelancerById, updateFreelancerProfile, deleteFreelancerProfile } from '../../apiendpoints';
import { useAuth } from '../../contexts/AuthContext';
import { handleError, showSuccessToast } from '@/utils/errorHandler';
import toast from 'react-hot-toast';
import { Modal } from '../../components/ui/Modal';
import { ParsedResumeData } from '@/types';
import { FreelancerProfile } from '../../types';
import { Badge } from '../../components/ui/badge';
import { ProjectModal } from '../../components/ui/ProjectModal';
import { ExperienceModal } from '../../components/ui/ExperienceModal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';

export function FreelancerSettings() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<FreelancerProfile | null>(null);
  const [parsedJsonData, setParsedJsonData] = useState<any>(null);
  const [hasResumeData, setHasResumeData] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [dangerModal, setDangerModal] = useState({ open: false });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [resumeUploading, setResumeUploading] = useState(false);
  const resumeInputRef = useRef<HTMLInputElement>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  // State for managing skills, experiences, and projects
  const [editableSkills, setEditableSkills] = useState<string[]>([]);
  const [editableExperience, setEditableExperience] = useState<any[]>([]);
  const [editableProjects, setEditableProjects] = useState<any[]>([]);
  
  // Modal states
  const [showExpModal, setShowExpModal] = useState(false);
  const [editExp, setEditExp] = useState<any>(null);
  const [showProjModal, setShowProjModal] = useState(false);
  const [editProj, setEditProj] = useState<any>(null);
  
  // ID counters for new items
  const experienceId = useRef(1);
  const projectId = useRef(1);

  const CLOUDINARY_URL = import.meta.env.VITE_CLOUDINARY_URL;
  const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;


  const formatDateRange = (startDate: string, endDate: string) => {
    if (!startDate && !endDate) return '';
    const start = startDate ? new Date(startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) : '';
    const end = endDate == 'Present' ?  'Present' : new Date(endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
    return `${start} - ${end}`;
  };

  // Fetch profile data and check for resume data
  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      setError(null);
      if (!user?.id) {
        setError('User not authenticated');
        setLoading(false);
        return;
      }
      try {
        // 1. Fetch profile from .NET backend
        const profileData = await getFreelancerById(user?.id ?? 0);
        setProfileData(profileData);
        console.log(profileData);
        
        // 2. Try to fetch parsed JSON from resume_parser
        try {
          const response = await fetch(`http://localhost:8000/api/get-parsed-json/${user?.id}`);
          if (response.ok) {
            const parsedData = await response.json();
            setParsedJsonData(parsedData);
            setHasResumeData(true);
            
            // Initialize editable data from parsed JSON with proper IDs
            setEditableSkills(parsedData.skills || []);
            
            // Ensure experience items have proper IDs and update counter
            const experienceWithIds = (parsedData.experience || []).map((exp: any, index: number) => ({
              ...exp,
              id: exp.id || experienceId.current++
            }));
            setEditableExperience(experienceWithIds);
            // Update counter to be higher than the highest existing ID
            if (experienceWithIds.length > 0) {
              const maxId = Math.max(...experienceWithIds.map((exp: any) => exp.id));
              experienceId.current = maxId + 1;
            }
            
            // Ensure project items have proper IDs and update counter
            const projectsWithIds = (parsedData.projects || []).map((proj: any, index: number) => ({
              ...proj,
              id: proj.id || projectId.current++
            }));
            setEditableProjects(projectsWithIds);
            // Update counter to be higher than the highest existing ID
            if (projectsWithIds.length > 0) {
              const maxId = Math.max(...projectsWithIds.map((proj: any) => proj.id));
              projectId.current = maxId + 1;
            }
          } else {
            setHasResumeData(false);
            // Initialize empty editable data
            setEditableSkills([]);
            setEditableExperience([]);
            setEditableProjects([]);
          }
        } catch (resumeErr) {
          // No resume data found, use profile data only
          setHasResumeData(false);
          // Initialize empty editable data
          setEditableSkills([]);
          setEditableExperience([]);
          setEditableProjects([]);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load profile');
        setProfileData(null);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [user]);

  // Handlers for editing profileData
  const handleProfileFieldChange = (field: string, value: any) => {
    setProfileData(prev => prev ? { ...prev, [field]: value } : prev);
  };

  // Helper functions to get data from either parsed JSON or profile
  const getSkills = () => {
    if (hasResumeData && parsedJsonData?.skills) {
      return Array.isArray(parsedJsonData.skills) ? parsedJsonData.skills : [];
    }
    return [];
  };

  const getExperience = () => {
    if (hasResumeData && parsedJsonData?.experience) {
      return Array.isArray(parsedJsonData.experience) ? parsedJsonData.experience : [];
    }
    return [];
  };

  const getProjects = () => {
    if (hasResumeData && parsedJsonData?.projects) {
      return Array.isArray(parsedJsonData.projects) ? parsedJsonData.projects : [];
    }
    return [];
  };

  // Functions to manage skills
  const addSkill = (skill: string) => {
    if (skill && !editableSkills.includes(skill)) {
      setEditableSkills(prev => [...prev, skill]);
    }
  };

  const removeSkill = (skill: string) => {
    setEditableSkills(prev => prev.filter(s => s !== skill));
  };

  // Functions to manage experience
  const addExperience = (exp: any) => {
    exp.id = experienceId.current++;
    setEditableExperience(prev => [...prev, exp]);
  };

  const updateExperience = (id: number, newExp: any) => {
    setEditableExperience(prev => prev.map(exp =>
      exp.id === id ? { ...newExp } : exp
    ));
  };

  const removeExperience = (id: number) => {
    console.log('Removing experience with id:', id);
    console.log('Current experiences:', editableExperience);
    setEditableExperience(prev => {
      const filtered = prev.filter(exp => exp.id !== id);
      console.log('Filtered experiences:', filtered);
      return filtered;
    });
  };

  // Functions to manage projects
  const addProject = (proj: any) => {
    proj.id = projectId.current++;
    setEditableProjects(prev => [...prev, proj]);
  };

  const updateProject = (id: number, newProj: any) => {
    setEditableProjects(prev => prev.map(p => 
      p.id === id ? { ...newProj } : p
    ));
  };

  const removeProject = (id: number) => {
    console.log('Removing project with id:', id);
    console.log('Current projects:', editableProjects);
    setEditableProjects(prev => {
      const filtered = prev.filter(p => p.id !== id);
      console.log('Filtered projects:', filtered);
      return filtered;
    });
  };

  // Modal handlers
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

  // Function to strip IDs from arrays (like in ProfileSetup)
  function stripIds<T extends { id?: any }>(arr: T[]): Omit<T, 'id'>[] {
    return arr.map(({ id, ...rest }) => rest);
  }

const handleSave = async () => {
  if (!profileData) return;
  
  setLoading(true);
  setError(null);
  try {
    // 1. Build parsedJson for Python DB (only if we have resume data)
    if (hasResumeData) {
      const parsedJson = {
        name: `${profileData.firstName} ${profileData.lastName}`.trim(),
        email: profileData.email,
        phone: profileData.phoneNo,
        summary: profileData.summary,
        hourly_rate: profileData.hourlyRate,
        working_hours: profileData.workingHours,
        availability: profileData.availability,
        skills: editableSkills,
        projects: stripIds(editableProjects).map((p: any) => ({
          title: p.title || '',
          description: p.description || ''
        })),
        experience: stripIds(editableExperience).map((e: any) => ({
          title: e.title || '',
          company: e.company || '',
          startDate: e.startDate || '',
          endDate: e.endDate || '',
          description: e.description || ''
        })),
      };
      
      // Update Python DB
      await fetch('http://localhost:8000/api/update-parsed-json/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          freelancer_id: profileData.id,
          parsed_json: parsedJson
        })
      });
    }
    
    // 2. Build profilePayload for C# backend
    const profilePayload = {
      id: profileData.id,
      firstName: profileData.firstName,
      lastName: profileData.lastName,
      email: profileData.email,
      phoneNo: profileData.phoneNo,
      gender: profileData.gender,
      profilePicture: profileData.profilePicture,
      role: profileData.role,
      createdAt: profileData.createdAt,
      hourlyRate: profileData.hourlyRate,
      workingHours: profileData.workingHours,
      availability: profileData.availability,
      avgRating: profileData.avgRating,
      password: profileData.password,
      newPassword: profileData.newPassword,
      summary: profileData.summary,
      skills: JSON.stringify(editableSkills),
      experience: JSON.stringify(stripIds(editableExperience)),
      projects: JSON.stringify(stripIds(editableProjects)),
    };

    console.log(profileData.workingHours);
    console.log(profilePayload);
    
    // 3. Update C# backend
    await updateFreelancerProfile(profilePayload, profileData.id);
    setIsEditing(false);
    showSuccessToast('Profile updated successfully!');
  } catch (err: any) {
    handleError(err, 'updateProfile');
  } finally {
    setLoading(false);
  }
};

const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  setResumeUploading(true);
  const formData = new FormData();
  formData.append('file', file);
  formData.append('freelancer_id', String(user?.id ?? 0));
  try {
    const response = await fetch('http://localhost:8000/api/parse-resume/', {
      method: 'POST',
      body: formData,
    });
    const parsed = await response.json();
    if (!response.ok) {
      throw new Error(parsed.error || 'Resume parsing failed.');
    }
    // Extract skills, experience, projects as in ProfileSetup
    const rawSkillsObj: Record<string, string> = parsed.skills || {};
    const extractedSkills: string[] = Object.values(rawSkillsObj)
      .flatMap(group => group.split(',').map(skill => skill.trim()))
      .filter(skill => skill.length > 0);
    const experiences = (parsed.experience || []).map((exp: any, idx: number) => ({
      id: idx + 1,
      company: exp.company ?? '',
      title: exp.title ?? '',
      startDate: exp.startDate ?? '',
      endDate: exp.endDate ?? '',
      description: exp.description ?? ''
    }));
    const projects = (parsed.projects || []).map((proj: any, idx: number) => ({
      id: idx + 1,
      title: proj.title ?? '',
      description: proj.description ?? '',
      tools: Array.isArray(proj.tools) ? proj.tools : [],
    }));
    // Update parsed JSON data instead of profile data
    setParsedJsonData({
      name: `${profileData?.firstName} ${profileData?.lastName}`.trim(),
      email: profileData?.email,
      phone: profileData?.phoneNo,
      hourly_rate: profileData?.hourlyRate,
      working_hours: profileData?.workingHours,
      availability: profileData?.availability,
      summary: profileData?.summary,
      skills: extractedSkills,
      experience: experiences,
      projects: projects,
    });
    setHasResumeData(true);
    
    // Update editable data with proper IDs
    setEditableSkills(extractedSkills);
    
    // Ensure experience items have proper IDs and update counter
    const experiencesWithIds = experiences.map((exp: any) => ({
      ...exp,
      id: exp.id || experienceId.current++
    }));
    setEditableExperience(experiencesWithIds);
    // Update counter to be higher than the highest existing ID
    if (experiencesWithIds.length > 0) {
      const maxId = Math.max(...experiencesWithIds.map((exp: any) => exp.id));
      experienceId.current = maxId + 1;
    }
    
    // Ensure project items have proper IDs and update counter
    const projectsWithIds = projects.map((proj: any) => ({
      ...proj,
      id: proj.id || projectId.current++
    }));
    setEditableProjects(projectsWithIds);
    // Update counter to be higher than the highest existing ID
    if (projectsWithIds.length > 0) {
      const maxId = Math.max(...projectsWithIds.map((proj: any) => proj.id));
      projectId.current = maxId + 1;
    }
    toast.success('Resume parsed and profile updated!');
  } catch (err: any) {
    toast.error(err.message || 'Failed to parse resume.');
  } finally {
    setResumeUploading(false);
  }
};


  const handleCancel = () => {
    setIsEditing(false);
    window.location.reload();
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSavePassword = async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      handleError(new Error('Passwords do not match'), 'validation');
      return;
    }
    if (!profileData) return;
    
    // Validate that current password is provided
    if (!formData.currentPassword) {
      toast.error('Please enter your current password');
      return;
    }
    
    // Validate that new password is provided
    if (!formData.newPassword) {
      toast.error('Please enter a new password');
      return;
    }
    
    try {
      // Send payload with PascalCase field names to match the backend DTO
      const payload = {
        ...profileData,
        Password: formData.currentPassword,
        NewPassword: formData.newPassword
      } as any; // Use 'as any' to bypass TypeScript checking for this specific case
      
      console.log('Sending password update payload:', payload);
      
      await updateFreelancerProfile(payload, user?.id ?? 0);
      console.log('Password update successful, clearing form');
      toast.success('Password updated successfully!');
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      console.log('Form cleared');
    } catch (err: any) {
      handleError(err, 'updatePassword');
    }
  };

  const handleDangerAction = () => {
    setDangerModal({ open: true });
  };

  const confirmDangerAction = async () => {
    setDangerModal({ open: false });
    await deleteFreelancerProfile(profileData?.id ?? 0);
    showSuccessToast('Account deleted!');
    navigate('/');
  };

  // const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = e.target.files?.[0];
  //   if (!file) return;
  //   const filename = file.name;
  //   setProfile((prev: any) => prev ? { ...prev, ProfilePicture: filename } : prev);
  //   toast.success(`Selected file: ${filename}`);
  // };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET ?? 'undefined');

    try {
      const res = await fetch(CLOUDINARY_URL ?? 'undefined', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.secure_url) {
        console.log('Upload successful, new URL:', data.secure_url);
        setProfileData((prev: any) => {
          const updated = prev ? { ...prev, profilePicture: data.secure_url } : prev;
          console.log('Updated profileData:', updated);
          return updated;
        });
        // Update the user context with the new profile picture
        updateUser({ profilePicture: data.secure_url });
        setIsEditing(true);
        showSuccessToast('Image uploaded!');
        
        // Save the profile picture URL to the database
        if (profileData) {
          try {
            const profilePayload = {
              profilePicture: data.secure_url
            };
            
            await updateFreelancerProfile(profilePayload, profileData.id);
            console.log('Profile picture saved to database');
          } catch (err: any) {
            console.error('Failed to save profile picture to database:', err);
            toast.error('Image uploaded but failed to save to profile');
          }
        }
      } else {
        handleError(new Error('Failed to upload image'), 'uploadImage');
      }
    } catch (err) {
      handleError(err, 'uploadImage');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="text-red-600 text-lg mb-2">Error</div>
          <p className="text-gray-600">{error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-4"
            variant="outline"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!profileData) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Freelancer Settings</h1>
        <p className="text-gray-600 mt-1">Manage your freelancer profile and preferences</p>
      </div>

      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-800">{successMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Profile Picture Section */}
      <Card>
        <div className="flex items-center space-x-6">
          <img 
            src={profileData.profilePicture || user?.profilePicture || '/assets/default-profile.png'}
            alt="Profile"
            className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
            onError={(e) => {
              console.log('Profile picture failed to load in settings:', profileData.profilePicture);
              e.currentTarget.src = '/assets/default-profile.png';
            }}
          />
          <div>
            <Button onClick={() => fileInputRef.current?.click()} variant="outline" disabled={!isEditing}>
              <Camera className="w-4 h-4 mr-2" />
              Change Picture
            </Button>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleImageUpload}
            />
            <p className="text-sm text-gray-500 mt-2">JPG, PNG or GIF. Max size 5MB.</p>
            {/* Resume Upload Button */}
            <Button
              onClick={() => resumeInputRef.current?.click()}
              variant="outline"
              size="sm"
              className="mt-2"
              disabled={resumeUploading}
            >
              {resumeUploading ? 'Uploading...' : 'Upload Resume'}
            </Button>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              ref={resumeInputRef}
              style={{ display: 'none' }}
              onChange={handleResumeUpload}
            />
          </div>
        </div>
      </Card>

      {/* Personal Information */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <User className="w-5 h-5" />
            <span className="font-semibold">Personal Information</span>
          </div>
          <div className="space-x-2">
            {isEditing ? (
              <>
                <Button onClick={handleSave}>
                  <Save className="w-4 h-4 mr-2" />Save Changes
                </Button>
                <Button variant="outline" onClick={handleCancel}>Cancel</Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => {
                setIsEditing(true);
                setError(null);
                setSuccessMessage(null);
              }}>
                <Edit2 className="w-4 h-4 mr-2" />Edit Profile
              </Button>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
            <Input
              type="text"
              value={profileData?.firstName || ''}
              onChange={e => handleProfileFieldChange('firstName', e.target.value)}
              disabled={!isEditing}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
            <Input
              type="text"
              value={profileData?.lastName || ''}
              onChange={e => handleProfileFieldChange('lastName', e.target.value)}
              disabled={!isEditing}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <Input
                type="tel"
                value={profileData?.phoneNo || ''}
                onChange={e => handleProfileFieldChange('phoneNo', e.target.value)}
                disabled={!isEditing}
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Freelancer Profile Details */}
      <Card>
        <div className="flex items-center space-x-2 mb-4">
          <DollarSign className="w-5 h-5" />
          <span className="font-semibold">Freelancer Profile</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Summary</label>
            <Textarea
              value={profileData?.summary || ''}
              onChange={e => handleProfileFieldChange('summary', e.target.value)}
              disabled={!isEditing}
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Skills</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {editableSkills.map(skill => (
                <div key={skill} className="inline-flex items-center gap-1 bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-sm">
                  {skill}
                  <button
                    onClick={() => removeSkill(skill)}
                    className="ml-1 text-gray-400 hover:text-red-500"
                    disabled={!isEditing}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            {isEditing && (
              <Input
                placeholder="Type a skill and press Enter"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const skill = e.currentTarget.value.trim();
                    if (skill) {
                      addSkill(skill);
                      e.currentTarget.value = '';
                    }
                  }
                }}
              />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Hourly Rate (USD)</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <Input
                type="number"
                value={profileData?.hourlyRate || 0}
                onChange={e => handleProfileFieldChange('hourlyRate', Number(e.target.value))}
                disabled={!isEditing}
                className="pl-10"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Availability</label>
            <Select 
              value={profileData?.availability || ''} 
              onValueChange={(value) => handleProfileFieldChange('availability', value)}
              disabled={!isEditing}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select availability" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Available">Available</SelectItem>
                <SelectItem value="Unavailable">Unavailable</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Working Hours</label>
            <div className="relative">
              <Clock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                value={profileData?.workingHours || ''}
                onChange={e => handleProfileFieldChange('workingHours', e.target.value)}
                disabled={!isEditing}
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Projects Section */}
      <Card>
        <div className="flex items-center space-x-2 mb-4">
          <Briefcase className="w-5 h-5" />
          <span className="font-semibold">Projects</span>
        </div>
        <div className="space-y-4">
          {editableProjects.length === 0 && <div className="text-gray-500">No projects added yet.</div>}
          {editableProjects.map((p: any, idx: number) => (
            <div key={p.id || idx} className="bg-gray-50 rounded-lg p-4 border border-gray-200 relative">
              {isEditing && (
                <>
                  <button
                    className="absolute top-4 right-12 text-gray-400 hover:text-red-600"
                    onClick={() => removeProject(p.id)}
                    title="Remove Project"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <button
                    className="absolute top-4 right-4 text-gray-400 hover:text-blue-600"
                    onClick={() => openEditProjectModal(p)}
                    title="Edit Project"
                  >
                    <Pencil className="w-5 h-5" />
                  </button>
                </>
              )}
              <div className="flex items-center mb-2">
                <Briefcase className="w-4 h-4 text-blue-500 mr-2" />
                <div className="font-semibold text-lg">{p.title}</div>
              </div>
              <div className="text-gray-700">{p.description}</div>
            </div>
          ))}
          {isEditing && (
            <Button 
              variant="outline" 
              onClick={openAddProjectModal} 
              className="w-full rounded-lg border-dashed border-2 border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50 text-blue-700 shadow-sm"
            >
              <Plus className="w-4 h-4 mr-2 text-blue-500" />
              Add Project
            </Button>
          )}
        </div>
      </Card>

      {/* Experience Section */}
      <Card>
        <div className="flex items-center space-x-2 mb-4">
          <Briefcase className="w-5 h-5" />
          <span className="font-semibold">Experience</span>
        </div>
        <div className="space-y-4">
          {editableExperience.length === 0 && <div className="text-gray-500">No experience added yet.</div>}
          {editableExperience.map((exp: any, idx: number) => (
            <div key={exp.id || idx} className="bg-gray-50 rounded-lg p-4 border border-gray-200 relative">
              {isEditing && (
                <>
                  <button
                    className="absolute top-4 right-12 text-gray-400 hover:text-red-600"
                    onClick={() => removeExperience(exp.id)}
                    title="Remove Experience"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <button
                    className="absolute top-4 right-4 text-gray-400 hover:text-blue-600"
                    onClick={() => openEditExperienceModal(exp)}
                    title="Edit Experience"
                  >
                    <Pencil className="w-5 h-5" />
                  </button>
                </>
              )}
              <div className="flex items-center mb-2">
                <Briefcase className="w-4 h-4 text-green-500 mr-2" />
                <div className="font-semibold text-lg">{exp.title}</div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                <div className="text-gray-700">{exp.company}</div>
                <div className="text-sm text-gray-600">
                  {formatDateRange(exp.startDate, exp.endDate)}
                </div>
              </div>
              <div className="text-gray-700">{exp.description}</div>
            </div>
          ))}
          {isEditing && (
            <Button 
              variant="outline" 
              onClick={openAddExperienceModal} 
              className="w-full rounded-lg border-dashed border-2 border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50 text-blue-700 shadow-sm"
            >
              <Plus className="w-4 h-4 mr-2 text-blue-500" />
              Add Experience
            </Button>
          )}
        </div>
      </Card>
      
      {/* Account Settings Section */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Settings</h3>
        <div className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={formData.currentPassword}
                onChange={(e) => handleInputChange('currentPassword', e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
            <Input
              type="password"
              value={formData.newPassword}
              onChange={(e) => handleInputChange('newPassword', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
            <Input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
            />
          </div>
          <Button onClick={handleSavePassword} icon={Lock}>
            Update Password
          </Button>
        </div>
      </Card>

      {/* Danger Zone Section */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Danger Zone</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg">
            <div>
              <h4 className="font-medium text-red-900">Delete Account</h4>
              <p className="text-sm text-red-600">Permanently delete your account and all data</p>
            </div>
            <Button variant="danger" size="sm" onClick={() => handleDangerAction()}>Delete</Button>
          </div>
        </div>
      </Card>

      {/* Danger Modal */}
      <Modal isOpen={dangerModal.open} onClose={() => setDangerModal({ open: false })} title="Delete Account">
        <div className="space-y-4">
          <p>
            Are you sure you want to permanently delete your account? This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setDangerModal({ open: false })}>Cancel</Button>
            <Button variant={'danger'} onClick={confirmDangerAction}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* Experience Modal */}
      <ExperienceModal
        open={showExpModal}
        onClose={() => setShowExpModal(false)}
        onSave={exp => {
          if (exp.id) updateExperience(exp.id, exp);
          else addExperience(exp);
          setShowExpModal(false);
        }}
        onDelete={id => { removeExperience(id); setShowExpModal(false); }}
        initialData={editExp}
      />

      {/* Project Modal */}
      <ProjectModal
        open={showProjModal}
        onClose={() => setShowProjModal(false)}
        onSave={proj => {
          if (proj.id) updateProject(proj.id, proj);
          else addProject(proj);
          setShowProjModal(false);
        }}
        onDelete={id => { removeProject(id); setShowProjModal(false); }}
        initialData={editProj}
      />
      
    </div>
  );
} 