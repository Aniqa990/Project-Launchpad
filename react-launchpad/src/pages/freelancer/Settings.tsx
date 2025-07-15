import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { User, Phone, Camera, Save, Briefcase, DollarSign, Clock, Edit2 } from 'lucide-react';
import { getProfileSetupData, saveProfileSetupData } from '../../apiendpoints';
import { ProfileSetupData } from '../../types';

export function Settings() {
  const [profile, setProfile] = useState<ProfileSetupData | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [hourlyRate, setHourlyRate] = useState(0);
  const [availability, setAvailability] = useState('');
  const [workingHours, setWorkingHours] = useState('');
  const [avatar, setAvatar] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      setError(null);
      try {
        const data = await getProfileSetupData();
        setProfile({
          ...data,
          Skills: data.Skills ?? [],
          Projects: data.Projects ?? [],
          Experience: data.Experience ?? [],
        });
        setFirstName(localStorage.getItem('firstName') || '');
        setLastName(localStorage.getItem('lastName') || '');
        setPhone(localStorage.getItem('phone') || '');
        setHourlyRate(Number(localStorage.getItem('hourlyRate')) || 0);
        setAvailability(localStorage.getItem('availability') || '');
        setWorkingHours(localStorage.getItem('workingHours') || '');
        setAvatar(localStorage.getItem('avatar') || '');
      } catch (err: any) {
        setError(err.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const handleSave = async () => {
    if (!profile) return;
    setLoading(true);
    setError(null);
    try {
      await saveProfileSetupData({
        firstName,
        lastName,
        phone,
        hourlyRate,
        availability,
        workingHours,
        profileData: profile,
      });
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    window.location.reload();
  };

  const handleImageUpload = () => {
    alert('Image upload functionality would be implemented here');
  };

  if (!profile) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Freelancer Settings</h1>
        <p className="text-gray-600 mt-1">Manage your freelancer profile and preferences</p>
      </div>

      {/* Profile Picture Section */}
      <Card>
        <div className="flex items-center space-x-6">
          <img 
            src={avatar} 
            alt="Profile"
            className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
          />
          <div>
            <Button onClick={handleImageUpload} variant="outline" disabled={!isEditing}>
              <Camera className="w-4 h-4 mr-2" />
              Change Picture
            </Button>
            <p className="text-sm text-gray-500 mt-2">JPG, PNG or GIF. Max size 5MB.</p>
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
              <Button variant="outline" onClick={() => setIsEditing(true)}>
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
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              disabled={!isEditing}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
            <Input
              type="text"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              disabled={!isEditing}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <Input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
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
              value={profile.Summary}
              onChange={e => setProfile({ ...profile, Summary: e.target.value })}
              disabled={!isEditing}
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Skills</label>
            <Input
              type="text"
              value={(profile.Skills ?? []).map(s => s.SkillName).join(', ')}
              onChange={e => setProfile({ ...profile, Skills: e.target.value.split(',').map(s => ({ SkillName: s.trim(), Id: 0, Source: 'manual' })) })}
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
                value={hourlyRate}
                onChange={e => setHourlyRate(Number(e.target.value))}
                disabled={!isEditing}
                className="pl-10"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Availability</label>
            <Input
              type="text"
              value={availability}
              onChange={e => setAvailability(e.target.value)}
              disabled={!isEditing}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Working Hours</label>
            <div className="relative">
              <Clock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                value={workingHours}
                onChange={e => setWorkingHours(e.target.value)}
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
          {(profile.Projects ?? []).length === 0 && <div className="text-gray-500">No projects added yet.</div>}
          {(profile.Projects ?? []).map((p, idx) => (
            <div key={p.Id || idx} className="bg-gray-50 rounded-lg p-4 border border-gray-200 relative">
              <div className="flex items-center mb-2">
                <Briefcase className="w-4 h-4 text-blue-500 mr-2" />
                <Input
                  type="text"
                  value={p.Title}
                  onChange={e => {
                    const newProjects = [...(profile.Projects ?? [])];
                    newProjects[idx].Title = e.target.value;
                    setProfile({ ...profile, Projects: newProjects });
                  }}
                  disabled={!isEditing}
                  className="font-semibold text-lg bg-transparent border-none p-0 focus:ring-0"
                  placeholder="Project Title"
                />
              </div>
              <Textarea
                value={p.Description}
                onChange={e => {
                  const newProjects = [...(profile.Projects ?? [])];
                  newProjects[idx].Description = e.target.value;
                  setProfile({ ...profile, Projects: newProjects });
                }}
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
          {(profile.Experience ?? []).length === 0 && <div className="text-gray-500">No experience added yet.</div>}
          {(profile.Experience ?? []).map((exp, idx) => (
            <div key={exp.Id || idx} className="bg-gray-50 rounded-lg p-4 border border-gray-200 relative">
              <div className="flex items-center mb-2">
                <Briefcase className="w-4 h-4 text-green-500 mr-2" />
                <Input
                  type="text"
                  value={exp.Title}
                  onChange={e => {
                    const newExp = [...(profile.Experience ?? [])];
                    newExp[idx].Title = e.target.value;
                    setProfile({ ...profile, Experience: newExp });
                  }}
                  disabled={!isEditing}
                  className="font-semibold text-lg bg-transparent border-none p-0 focus:ring-0"
                  placeholder="Job Title"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                <Input
                  type="text"
                  value={exp.Company}
                  onChange={e => {
                    const newExp = [...(profile.Experience ?? [])];
                    newExp[idx].Company = e.target.value;
                    setProfile({ ...profile, Experience: newExp });
                  }}
                  disabled={!isEditing}
                  className="bg-transparent border-none p-0 focus:ring-0"
                  placeholder="Company Name"
                />
                <Input
                  type="text"
                  value={exp.Duration}
                  onChange={e => {
                    const newExp = [...(profile.Experience ?? [])];
                    newExp[idx].Duration = e.target.value;
                    setProfile({ ...profile, Experience: newExp });
                  }}
                  disabled={!isEditing}
                  className="bg-transparent border-none p-0 focus:ring-0"
                  placeholder="Duration (e.g. 2020-2023)"
                />
              </div>
              <Textarea
                value={exp.Description}
                onChange={e => {
                  const newExp = [...(profile.Experience ?? [])];
                  newExp[idx].Description = e.target.value;
                  setProfile({ ...profile, Experience: newExp });
                }}
                disabled={!isEditing}
                className="bg-transparent border-none p-0 focus:ring-0"
                rows={2}
                placeholder="Description"
              />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
} 