import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { User, Phone, Camera, Save, Briefcase, DollarSign, Clock, Edit2, Eye, EyeOff, Lock } from 'lucide-react';
import { getFreelancerById, updateFreelancerProfile } from '../../apiendpoints';
import { ProfileSetupData } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Modal } from '../../components/ui/Modal';
import { ParsedResumeData } from '@/types';
import { FreelancerProfile } from '../../types';

export function FreelancerSettings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<FreelancerProfile>({
    summary: '',
    skills: [],
    experience: [],
    projects: [],
  });
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

  const CLOUDINARY_URL = import.meta.env.VITE_CLOUDINARY_URL;
  const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;


  const formatDateRange = (startDate: string, endDate: string) => {
    if (!startDate && !endDate) return '';
    const start = startDate ? new Date(startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) : '';
    const end = endDate == 'Present' ?  'Present' : new Date(endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
    return `${start} - ${end}`;
  };

  // Fetch parsed JSON from backend (resume_db)
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
        const data = await getFreelancerById(user?.id ?? 0);
        setProfileData(data); // profile should be of type FreelancerProfile or User
      } catch (err: any) {
        setError(err.message || 'Failed to load profile');
        setProfileData({
          summary: '',
          skills: [],
          experience: [],
          projects: [],
        });
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [user]);

  // Handlers for editing profileData
  const handleProfileFieldChange = (field: string, value: any) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleSkillChange = (skills: string[]) => {
    setProfileData(prev => ({ ...prev, skills }));
  };

  const handleExperienceChange = (idx: number, field: string, value: any) => {
    setProfileData(prev => {
      const newExp = [...prev.experience];
      newExp[idx] = { ...newExp[idx], [field]: value };
      return { ...prev, experience: newExp };
    });
  };

  const handleProjectChange = (idx: number, field: string, value: any) => {
    setProfileData(prev => {
      const newProjects = [...prev.projects];
      newProjects[idx] = { ...newProjects[idx], [field]: value };
      return { ...prev, projects: newProjects };
    });
  };

const handleSave = async () => {
  setLoading(true);
  setError(null);
  try {
      await fetch('http://localhost:8000/api/update-parsed-json/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          freelancer_id: user?.id,
          parsed_json: profileData
        })
    });
    await updateFreelancerProfile(profileData, user?.id ?? 0);
    setIsEditing(false);
    setSuccessMessage('Profile updated successfully!');
    setTimeout(() => setSuccessMessage(null), 3000);
  } catch (err: any) {
    setError(err.message || 'Failed to update profile');
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
    setProfileData({
      ...profileData,
      summary: parsed.summary || '',
      skills: extractedSkills,
      experience: experiences,
      projects: projects,
    });
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
      toast.error('Passwords do not match');
      return;
    }
    if (!profileData) return;
    try {
      // Only include password fields if newPassword is present
      const payload: any = {
        firstName: profileData.FirstName,
        lastName: profileData.LastName,
        phone: profileData.PhoneNo,
        hourlyRate: profileData.HourlyRate,
        availability: profileData.Availability,
        workingHours: profileData.WorkingHours,
        profileData: {
          Summary: profileData.Summary,
          Skills: profileData.Skills,
          Projects: profileData.Projects,
          Experience: profileData.Experience,
        },
      };
      if (formData.newPassword) {
        payload.password = formData.currentPassword;
        payload.newPassword = formData.newPassword;
      }
      await updateFreelancerProfile(profileData, user?.id ?? 0);
      toast.success('Password updated successfully!');
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      const backendMsg = err?.response?.data?.message;
      toast.error(backendMsg || 'Failed to update password');
    }
  };

  const handleDangerAction = () => {
    setDangerModal({ open: true });
  };

  const confirmDangerAction = async () => {
    setDangerModal({ open: false });
    await deleteFreelancerProfile(profileData?.id ?? 0);
    toast.success('Account deleted!');
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
        setProfileData((prev: any) => prev ? { ...prev, profilePicture: data.secure_url } : prev);
        setIsEditing(true);
        toast.success('Image uploaded!');
      } else {
        toast.error('Failed to upload image');
      }
    } catch (err) {
      toast.error('Image upload error');
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
            src={profileData.profilePicture || '/assets/default-profile.png'}
            alt="Profile"
            className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
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
              value={profileData.FirstName}
              onChange={e => handleProfileFieldChange('FirstName', e.target.value)}
              disabled={!isEditing}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
            <Input
              type="text"
              value={profileData.LastName}
              onChange={e => handleProfileFieldChange('LastName', e.target.value)}
              disabled={!isEditing}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <Input
                type="tel"
                value={profileData.PhoneNo}
                onChange={e => handleProfileFieldChange('PhoneNo', e.target.value)}
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
              value={profileData.Summary}
              onChange={e => handleProfileFieldChange('Summary', e.target.value)}
              disabled={!isEditing}
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Skills</label>
            <Input
              type="text"
              value={(profileData.Skills ?? []).map((s: { SkillName: string }) => s.SkillName).join(', ')}
              onChange={e => handleSkillChange(e.target.value.split(',').map((s: string) => ({ SkillName: s.trim(), Id: 0, Source: 'manual' })))}
              disabled={!isEditing}
              placeholder="e.g. Python, React, SQL"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Hourly Rate (USD)</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <Input
                type="number"
                value={profileData.HourlyRate}
                onChange={e => handleProfileFieldChange('HourlyRate', Number(e.target.value))}
                disabled={!isEditing}
                className="pl-10"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Availability</label>
            <Input
              type="text"
              value={profileData.Availability}
              onChange={e => handleProfileFieldChange('Availability', e.target.value)}
              disabled={!isEditing}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Working Hours</label>
            <div className="relative">
              <Clock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                value={profileData.WorkingHours}
                onChange={e => handleProfileFieldChange('WorkingHours', e.target.value)}
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
          {(profileData.Projects ?? []).length === 0 && <div className="text-gray-500">No projects added yet.</div>}
          {(profileData.Projects ?? []).map((p: any, idx: number) => (
            <div key={p.Id || idx} className="bg-gray-50 rounded-lg p-4 border border-gray-200 relative">
              <div className="flex items-center mb-2">
                <Briefcase className="w-4 h-4 text-blue-500 mr-2" />
                <Input
                  type="text"
                  value={p.Title}
                  onChange={e => handleProjectChange(idx, 'Title', e.target.value)}
                  disabled={!isEditing}
                  className="font-semibold text-lg bg-transparent border-none p-0 focus:ring-0"
                  placeholder="Project Title"
                />
              </div>
              <Textarea
                value={p.Description}
                onChange={e => handleProjectChange(idx, 'Description', e.target.value)}
                disabled={!isEditing}
                className="bg-transparent border-none p-0 focus:ring-0"
                rows={2}
                placeholder="Project Description"
              />
            </div>
          ))}
        </div>
      </Card>

      {/* Experience Section */}
      <Card>
        <div className="flex items-center space-x-2 mb-4">
          <Briefcase className="w-5 h-5" />
          <span className="font-semibold">Experience</span>
        </div>
        <div className="space-y-4">
          {(profileData.Experience ?? []).length === 0 && <div className="text-gray-500">No experience added yet.</div>}
          {(profileData.Experience ?? []).map((exp: any, idx: number) => (
            <div key={exp.Id || idx} className="bg-gray-50 rounded-lg p-4 border border-gray-200 relative">
              <div className="flex items-center mb-2">
                <Briefcase className="w-4 h-4 text-green-500 mr-2" />
                <Input
                  type="text"
                  value={exp.Title}
                  onChange={e => handleExperienceChange(idx, 'Title', e.target.value)}
                  disabled={!isEditing}
                  className="font-semibold text-lg bg-transparent border-none p-0 focus:ring-0"
                  placeholder="Job Title"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                <Input
                  type="text"
                  value={exp.Company}
                  onChange={e => handleExperienceChange(idx, 'Company', e.target.value)}
                  disabled={!isEditing}
                  className="bg-transparent border-none p-0 focus:ring-0"
                  placeholder="Company Name"
                />
                {isEditing ? (
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      value={exp.StartDate}
                      onChange={e => handleExperienceChange(idx, 'StartDate', e.target.value)}
                      disabled={!isEditing}
                      className="bg-transparent border-none p-0 focus:ring-0"
                      placeholder="Start Date"
                    />
                    <Input
                      type="date"
                      value={exp.EndDate}
                      onChange={e => handleExperienceChange(idx, 'EndDate', e.target.value)}
                      disabled={!isEditing}
                      className="bg-transparent border-none p-0 focus:ring-0"
                      placeholder="End Date"
                    />
                  </div>
                ) : (
                  <div className="text-sm text-gray-600">
                    {formatDateRange(exp.StartDate, exp.EndDate)}
                  </div>
                )}
              </div>
              <Textarea
                value={exp.Description}
                onChange={e => handleExperienceChange(idx, 'Description', e.target.value)}
                disabled={!isEditing}
                className="bg-transparent border-none p-0 focus:ring-0"
                rows={2}
                placeholder="Description"
              />
            </div>
          ))}
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
      
    </div>
  );
} 