import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { updateClientProfile, fetchClientProfile, deleteClientProfile } from '../../apiendpoints';
import { Avatar } from '../../components/ui/avatar';
import { Modal } from '../../components/ui/Modal';
import { User } from '@/types';
import toast from 'react-hot-toast';
import { User as UserIcon, Phone, Camera, Save, Eye, EyeOff, Lock } from 'lucide-react';

export function ClientSettings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [dangerModal, setDangerModal] = useState({ open: false, type: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const CLOUDINARY_URL = import.meta.env.VITE_CLOUDINARY_URL;
  const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  useEffect(() => {
    async function fetchProfileData() {
      setLoading(true);
      setError(null);
      try {
        const backendData = await fetchClientProfile(user?.id ?? 0);
        setProfile({
          id: backendData.Id,
          firstName: backendData.FirstName ?? '',
          lastName: backendData.LastName ?? '',
          email: backendData.Email ?? '',
          phone: backendData.PhoneNo ?? '',
          profilePicture: backendData.ProfilePicture?? '',
          role: backendData.Role === 'client' || backendData.Role === 'freelancer' ? backendData.Role : undefined,
          gender: backendData.Gender ?? '',
          joinedDate: backendData.JoinedDate ?? '',
        });
      } catch (err: any) {
        setError(err.message || 'Failed to load profile');
        setProfile(null);
      } finally {
        setLoading(false);
      }
    }
    fetchProfileData();
  }, [user]);

  const handleProfileChange = (field: keyof User, value: any) => {
    setProfile((prev) => prev ? { ...prev, [field]: value } : prev);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!profile) return;
    setLoading(true);
    setError(null);
    try {
      await updateClientProfile(profile);
      setIsEditing(false);
      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

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
        setProfile((prev) => prev ? { ...prev, profilePicture: data.secure_url } : prev);
        setIsEditing(true);
        toast.success('Image uploaded!');
      } else {
        toast.error('Failed to upload image');
      }
    } catch (err) {
      toast.error('Image upload error');
    }
  };

  /*   const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (file) {
      const fileName = file.name;
      setProfile((prev) => prev ? { ...prev, profilePicture: `/assets/${fileName}` } : prev);
      setIsEditing(true);*/

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSavePassword = async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (!profile) return;
    setLoading(true);
    setError(null);
    try {
      await updateClientProfile({
        ...profile,
        password: formData.currentPassword,
        newPassword: formData.newPassword,
      });
      toast.success('Password updated successfully!');
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      const backendMsg = err?.response?.data?.message;
      toast.error(backendMsg || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleDangerAction = (type: string) => {
    setDangerModal({ open: true, type });
  };

  const confirmDangerAction = async () => {
    setDangerModal({ open: false, type: '' });
    await deleteClientProfile(profile?.id ?? 0);
    toast.success('Account deleted!');
    navigate('/');
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account information and preferences</p>
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
          <Avatar src={profile?.profilePicture} alt={profile?.firstName} size="xl" />
          <div>
            <input
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              ref={fileInputRef}
              onChange={handleImageUpload}
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
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
            <UserIcon className="w-5 h-5" />
            <span className="font-semibold">Personal Information</span>
          </div>
          <div className="space-x-2">
            {isEditing ? (
              <>
                <Button onClick={handleSave} icon={Save}>
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => window.location.reload()}>Cancel</Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                Edit Profile
              </Button>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
            <Input
              type="text"
              value={profile?.firstName || ''}
              onChange={(e) => handleProfileChange('firstName', e.target.value)}
              disabled={!isEditing}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
            <Input
              type="text"
              value={profile?.lastName || ''}
              onChange={(e) => handleProfileChange('lastName', e.target.value)}
              disabled={!isEditing}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
            <Input
              type="tel"
              value={profile?.phone || ''}
              onChange={(e) => handleProfileChange('phone', e.target.value)}
              disabled={!isEditing}
            />
          </div>
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
            <Button variant="danger" size="sm" onClick={() => handleDangerAction('delete')}>Delete</Button>
          </div>
        </div>
      </Card>

      {/* Danger Modal */}
      <Modal isOpen={dangerModal.open} onClose={() => setDangerModal({ open: false, type: '' })} title="Delete Account">
        <div className="space-y-4">
          <p>
            Are you sure you want to permanently delete your account? This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setDangerModal({ open: false, type: '' })}>Cancel</Button>
            <Button variant={'danger'} onClick={confirmDangerAction}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}