import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Rocket, Eye, EyeOff, Mail, Lock, User, CheckCircle, Phone, MessageCircle } from "lucide-react";
import { handleApiError, showSuccessToast, showErrorToast } from '../utils/errorHandler';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { Avatar } from '../components/ui/avatar';
import { Button } from '../components/ui/button';

interface AuthProps {
  mode: "login" | "signup";
}

// Password validation function
const validatePassword = (password: string) => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push("At least 8 characters");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("At least one uppercase letter");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("At least one lowercase letter");
  }
  if (!/\d/.test(password)) {
    errors.push("At least one number");
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("At least one special character");
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Email validation function
const validateEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Phone number validation function
const validatePhoneNumber = (phoneNo: string) => {
  // Remove all non-digit characters
  const digitsOnly = phoneNo.replace(/\D/g, '');
  
  // For Pakistan (+92), the total length should be 12 digits (92 + 10 local digits)
  // Or if it's just the local number without country code, it should be 10 digits
  if (digitsOnly.length === 12 && digitsOnly.startsWith('92')) {
    // Full number with country code: 92XXXXXXXXXX
    const localNumber = digitsOnly.substring(2); // Remove 92
    if (localNumber.length === 10) {
      return {
        isValid: true,
        error: ""
      };
    }
  } else if (digitsOnly.length === 10) {
    // Just local number: XXXXXXXXXX
    return {
      isValid: true,
      error: ""
    };
  }
  
  // If we reach here, the number is invalid
  if (digitsOnly.length < 10) {
    return {
      isValid: false,
      error: "Phone number must be at least 10 digits"
    };
  } else if (digitsOnly.length > 12) {
    return {
      isValid: false,
      error: "Phone number is too long"
    };
  } else {
    return {
      isValid: false,
      error: "Please enter a valid 10-digit phone number"
    };
  }
};

export function Auth({ mode }: AuthProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNo: "",
    gender: "",
    role: "freelancer" as "client" | "freelancer",
    profilePicture: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [profilePicUploading, setProfilePicUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [passwordValidation, setPasswordValidation] = useState({
    isValid: false,
    errors: [] as string[]
  });
  const [phoneValidation, setPhoneValidation] = useState({
    isValid: false,
    error: ""
  });
  const [showPasswordValidation, setShowPasswordValidation] = useState(false);


  const { login, signup, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`;
  const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  useEffect(() => {
    if (isAuthenticated && user) {
      if (mode === "signup" && user.role === "freelancer") {
        navigate("/freelancer/profile-setup");
      } else {
        navigate(`/${user.role}/dashboard`);
      }
    }
  }, [isAuthenticated, user, navigate, mode]);

  const handleNext = () => {
    if (step === 1) {
      // Step 1: Role selection - always valid
      setStep(step + 1);
    } else if (step === 2) {
      // Step 2: Basic information - validate required fields, email, and phone
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.gender) {
        showErrorToast("Please fill in all required fields");
        return;
      }
      
      if (!validateEmail(formData.email)) {
        showErrorToast("Please enter a valid email address");
        return;
      }
      
      if (!phoneValidation.isValid) {
        showErrorToast("Please enter a valid phone number");
        return;
      }
      
      setStep(step + 1);
    }
  };


  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  // Email validation function
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "login") {
      setLoading(true);
      try {
        await login(formData.email, formData.password);
        showSuccessToast("Welcome back!");
      } catch (error) {
        handleApiError(error, 'login');
      } finally {
        setLoading(false);
      }
    } else {
      // For signup, validate all fields
      const passwordValidationResult = validatePassword(formData.password);
      const phoneValidationResult = validatePhoneNumber(formData.phoneNo);
      
      if (!passwordValidationResult.isValid) {
        showErrorToast("Please fix password requirements");
        setShowPasswordValidation(true);
        return;
      }
      
      if (!phoneValidationResult.isValid) {
        showErrorToast(phoneValidationResult.error);
        return;
      }
      
      if (formData.password !== formData.confirmPassword) {
        showErrorToast('Passwords do not match');
        return;
      }
      
      setIsLoading(true);
      try {
        await signup(formData);
        showSuccessToast("Account created successfully!");
      } catch (error) {
        handleApiError(error, 'signup');
      } finally {
        setIsLoading(false);
      }
    }
  };

   const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Validate password in real-time
    if (name === 'password') {
      const validation = validatePassword(value);
      setPasswordValidation(validation);
      if (value.length > 0) {
        setShowPasswordValidation(true);
      }
    }
  };

  const handlePhoneChange = (phoneNo: string) => {
    setFormData(prev => ({ ...prev, phoneNo }));
    const validation = validatePhoneNumber(phoneNo);
    setPhoneValidation(validation);
  };

  const handleProfilePicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfilePicUploading(true);
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);
    formDataUpload.append('upload_preset', CLOUDINARY_UPLOAD_PRESET ?? 'undefined');
    try {
      const res = await fetch(CLOUDINARY_URL ?? 'undefined', {
        method: 'POST',
        body: formDataUpload,
      });
      const data = await res.json();
      if (data.secure_url) {
        setFormData((prev) => ({ ...prev, profilePicture: data.secure_url }));
        showSuccessToast('Profile picture uploaded!');
      } else {
        handleApiError(new Error('Failed to upload image'), 'signup');
      }
    } catch (err) {
      handleApiError(err, 'signup');
    } finally {
      setProfilePicUploading(false);
    }
  };

  if (mode === "login") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="max-w-sm w-full">
          {/* Logo */}
          <div className="text-center mb-6">
            <Link to="/" className="inline-flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <Rocket className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Project Launchpad
              </span>
            </Link>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Welcome Back</h1>
              <p className="text-gray-600 text-sm">Sign in to your account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                    placeholder="sarah@client.com or alex@freelancer.com"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-9 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Forgot Password */}
              <div className="text-right">
                <Link to="/forgot-password" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                  Forgot your password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-2.5 px-4 rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>

            <div className="text-center mt-6 pt-4 border-t border-gray-100">
              <p className="text-gray-600 text-sm">
                Don't have an account?{' '}
                <Link to="/signup" className="text-blue-600 hover:text-blue-700 font-medium">
                  Sign up for free
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Signup mode - show 3-step process
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-sm w-full">
        {/* Logo */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Rocket className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Project Launchpad
            </span>
          </Link>
        </div>

        {/* Signup Form */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-gray-600">Step {step} of 3</span>
              <span className="text-xs text-gray-500">{Math.round((step / 3) * 100)}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${(step / 3) * 100}%` }}
              ></div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Step 1: Role Selection */}
            {step === 1 && (
              <>
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">Join Project Launchpad</h1>
                  <p className="text-gray-600 text-sm">Choose your role to get started</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    I want to:
                  </label>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, role: 'client' })}
                      className={`w-full p-3 rounded-lg border-2 transition-all duration-200 text-left ${
                        formData.role === 'client'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <User className="w-5 h-5" />
                        <div>
                          <div className="font-semibold text-sm">Hire Freelancers</div>
                          <div className="text-xs opacity-75">I have projects that need to be done</div>
                        </div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, role: 'freelancer' })}
                      className={`w-full p-3 rounded-lg border-2 transition-all duration-200 text-left ${
                        formData.role === 'freelancer'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <User className="w-5 h-5" />
                        <div>
                          <div className="font-semibold text-sm">Work as a Freelancer</div>
                          <div className="text-xs opacity-75">I want to offer my services to clients</div>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleNext}
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-2.5 px-4 rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm"
                >
                  Continue
                </button>
              </>
            )}

            {/* Step 2: Basic Information */}
            {step === 2 && (
              <>
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">Basic Information</h1>
                  <p className="text-gray-600 text-sm">Tell us about yourself</p>
                </div>
                {/* Profile Picture Upload */}
                <div className="flex items-center justify-center mb-4">
                  <div className="flex items-center space-x-3">
                    <Avatar
                      src={formData.profilePicture}
                      alt={formData.firstName || 'Profile'}
                      size="md"
                    />
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      ref={fileInputRef}
                      onChange={handleProfilePicUpload}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={profilePicUploading}
                      className="text-xs"
                    >
                      {profilePicUploading ? 'Uploading...' : (formData.profilePicture ? 'Change Picture' : 'Add Picture')}
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      name="firstName"
                      required
                      value={formData.firstName}
                      onChange={handleChange}
                      className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                      placeholder="Enter your first name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      name="lastName"
                      required
                      value={formData.lastName}
                      onChange={handleChange}
                      className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                      placeholder="Enter your last name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full pl-9 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm ${
                        formData.email && !validateEmail(formData.email) 
                          ? 'border-red-300 focus:ring-red-500' 
                          : 'border-gray-300'
                      }`}
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                  <PhoneInput
                    country={'pk'}
                    value={formData.phoneNo}
                    onChange={handlePhoneChange}
                    enableAreaCodes={true}
                    disableCountryCode={false}
                    countryCodeEditable={false}
                    inputStyle={{
                      width: '100%',
                      paddingLeft: '40px',
                      borderRadius: '0.5rem',
                      border: phoneValidation.error ? '1px solid #EF4444' : '1px solid #D1D5DB',
                      height: '40px',
                      fontSize: '14px'
                    }}
                    buttonStyle={{
                      borderTopLeftRadius: '0.5rem',
                      borderBottomLeftRadius: '0.5rem'
                    }}
                    inputClass="focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {phoneValidation.error && (
                    <p className="text-red-500 text-xs mt-1 flex items-center">
                      <span className="mr-1">⚠</span>
                      {phoneValidation.error}
                    </p>
                  )}
                  {formData.phoneNo && phoneValidation.isValid && (
                    <p className="text-green-500 text-xs mt-1 flex items-center">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Valid phone number
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
                  <select
                    name="gender"
                    required
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                </div>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex-1 bg-gray-100 text-gray-700 py-2.5 px-4 rounded-lg font-semibold hover:bg-gray-200 transition-all duration-200 text-sm"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-2.5 px-4 rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm"
                  >
                    Continue
                  </button>
                </div>
              </>
            )}

            {/* Step 3: Password */}
            {step === 3 && (
              <>
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">Secure Your Account</h1>
                  <p className="text-gray-600 text-sm">Create a strong password</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className={`w-full pl-9 pr-10 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm ${
                        showPasswordValidation 
                          ? passwordValidation.isValid 
                            ? 'border-green-500' 
                            : 'border-red-500'
                          : 'border-gray-300'
                      }`}
                      placeholder="Create a password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  
                  {/* Password validation feedback */}
                  {showPasswordValidation && (
                    <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                      <p className="text-xs font-medium text-gray-700 mb-1">Password requirements:</p>
                      <ul className="space-y-0.5">
                        {passwordValidation.errors.map((error, index) => (
                          <li key={index} className="text-xs text-red-500 flex items-center">
                            <span className="mr-1">✗</span>
                            {error}
                          </li>
                        ))}
                        {passwordValidation.isValid && (
                          <li className="text-xs text-green-500 flex items-center">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Password meets all requirements
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="w-full pl-9 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex-1 bg-gray-100 text-gray-700 py-2.5 px-4 rounded-lg font-semibold hover:bg-gray-200 transition-all duration-200 text-sm"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-2.5 px-4 rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {isLoading ? 'Signing Up...' : 'Sign Up'}
                  </button>
                </div>
              </>
            )}
          </form>

          {/* Login Link */}
          <div className="text-center mt-6 pt-4 border-t border-gray-100">
            <p className="text-gray-600 text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
